import base64
import io
import json
import logging
import re

import httpx
from PIL import Image, UnidentifiedImageError

from app.core.config import settings
from app.core.exceptions import AppException
from app.domains.element_location.schemas import ElementLocationResponse

logger = logging.getLogger(__name__)

MAX_TOKENS = 300
REQUEST_TIMEOUT_SECONDS = 60
SUPPORTED_FORMATS = {"PNG": "image/png", "JPEG": "image/jpeg", "WEBP": "image/webp"}
# 100만 토큰당 USD (입력, 출력) — 팀 대시보드 기준
PRICE_PER_MILLION = {"input": 2.0, "output": 10.0}

PROMPT_TEMPLATE = """이 이미지는 웹 화면 캡처이고 크기는 {width}x{height} 픽셀이다.
질문: {question}
질문이 가리키는 UI 요소를 찾아서, 원본 이미지 픽셀 좌표 기준으로 아래 JSON만 출력해라. \
다른 텍스트는 쓰지 마라.
{{"found": true/false, "x": 중심 x, "y": 중심 y, "box": [x1, y1, x2, y2], \
"description": "요소의 위치와 생김새를 한국어로 한두 문장"}}"""


def _read_image(image: bytes) -> tuple[str, int, int]:
    try:
        with Image.open(io.BytesIO(image)) as img:
            mime_type = SUPPORTED_FORMATS.get(img.format or "")
            width, height = img.size
    except UnidentifiedImageError:
        mime_type = None
    if mime_type is None:
        raise AppException(
            status_code=400,
            code="ELEMENT_LOCATION_INVALID_IMAGE",
            message="PNG, JPEG, WEBP 이미지만 올릴 수 있습니다.",
        )
    return mime_type, width, height


def _ai_failed() -> AppException:
    return AppException(
        status_code=500,
        code="ELEMENT_LOCATION_AI_FAILED",
        message="화면 분석에 실패했습니다. 잠시 후 다시 시도해주세요.",
    )


def _parse_json(text: str) -> dict:
    match = re.search(r"\{[\s\S]*\}", text)
    try:
        result = json.loads(match.group(0)) if match else None
    except json.JSONDecodeError:
        result = None
    if not isinstance(result, dict):
        logger.error("AI response is not JSON: %s", text)
        raise _ai_failed()
    return result


async def create_element_location(image: bytes, question: str) -> ElementLocationResponse:
    mime_type, width, height = _read_image(image)
    prompt = PROMPT_TEMPLATE.format(width=width, height=height, question=question)
    image_url = f"data:{mime_type};base64,{base64.b64encode(image).decode()}"

    payload = {
        "model": settings.ai_model,
        "max_tokens": MAX_TOKENS,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": image_url}},
                    {"type": "text", "text": prompt},
                ],
            }
        ],
    }
    headers = {"Authorization": f"Bearer {settings.ai_gateway_api_key}"}

    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS) as client:
            res = await client.post(settings.ai_gateway_url, json=payload, headers=headers)
    except httpx.HTTPError as exc:
        logger.error("AI gateway request failed: %s", exc)
        raise _ai_failed() from exc

    if res.is_error:
        logger.error("AI gateway error %s: %s", res.status_code, res.text)
        raise _ai_failed()

    data = res.json()
    result = _parse_json(data["choices"][0]["message"]["content"])

    usage = data.get("usage", {})
    prompt_tokens = usage.get("prompt_tokens", 0)
    completion_tokens = usage.get("completion_tokens", 0)
    cost = (
        prompt_tokens * PRICE_PER_MILLION["input"] + completion_tokens * PRICE_PER_MILLION["output"]
    ) / 1e6
    logger.info("토큰: 입력 %s, 출력 %s → 약 $%.4f", prompt_tokens, completion_tokens, cost)

    if not result.get("found"):
        return ElementLocationResponse(is_found=False, description=result.get("description", ""))
    return ElementLocationResponse(
        is_found=True,
        x=result.get("x"),
        y=result.get("y"),
        box=result.get("box") or [],
        description=result.get("description", ""),
    )
