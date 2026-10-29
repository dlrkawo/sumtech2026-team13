from typing import Annotated

from fastapi import APIRouter, File, Form, UploadFile

from app.common.response import ApiResponse, ok
from app.domains.element_location import service
from app.domains.element_location.schemas import ElementLocationResponse

router = APIRouter(prefix="/element-locations", tags=["element-location"])


@router.post(
    "",
    summary="화면 캡처에서 질문이 가리키는 UI 요소 위치 찾기",
    response_model=ApiResponse[ElementLocationResponse],
)
async def create_element_location(
    file: Annotated[UploadFile, File(description="웹 화면 캡처 이미지 (PNG/JPEG/WEBP)")],
    question: Annotated[str, Form(min_length=1, description="찾고 싶은 기능에 대한 질문")],
) -> ApiResponse[ElementLocationResponse]:
    image = await file.read()
    result = await service.create_element_location(image, question)
    return ok(result)
