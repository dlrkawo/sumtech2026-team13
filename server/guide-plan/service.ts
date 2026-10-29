import "server-only";

import { aiFailed, createChatCompletion } from "../ai/gateway";
import { readScreenImage } from "../guide/screen-image";
import { getSettings } from "../settings/service";
import { buildPlanPrompt, parsePlanAnswer } from "./prompt";
import type { GuidePlanRequest, GuidePlanResponse } from "./schema";

// POST /api/guide-plans — 화면 이미지 + 하고 싶은 일 → 참고용 할 일 목록 (담당: hyuckkim)
// 목록은 저장하지 않는다 (도움 기록은 POST /api/guides의 안내만 남긴다)

const MODEL = "anthropic/claude-sonnet-5.5";
// 100만 토큰당 USD (입력, 출력) — 팀 대시보드 기준. 호출마다 비용을 로그로 남겨 예산을 확인한다
const PRICE_PER_MILLION = { input: 2.0, output: 10.0 };
// 답의 형식이 우연히 깨졌을 때만 한 번 더 묻는다. max_tokens에 걸려 잘린 답은 다시 물어도 또 잘리므로 다시 묻지 않는다
const MAX_ATTEMPTS = 2;

export async function createGuidePlan(userId: number, { image, question }: GuidePlanRequest): Promise<GuidePlanResponse> {
  // 형식·크기 검사 (IMAGE_INVALID / IMAGE_TOO_LARGE). 목록에는 좌표가 없어 크기는 쓰지 않는다
  readScreenImage(image);
  const content = [
    { type: "image_url" as const, image_url: { url: image } },
    { type: "text" as const, text: buildPlanPrompt(question) },
  ];

  let answer: GuidePlanResponse | null = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const result = await createChatCompletion({ model: MODEL, content });

    const cost =
      (result.promptTokens * PRICE_PER_MILLION.input + result.completionTokens * PRICE_PER_MILLION.output) / 1e6;
    console.info(
      `[guide-plan] attempt=${attempt} tokens in=${result.promptTokens} out=${result.completionTokens} ` +
        `reasoning=${result.reasoningTokens} finish=${result.finishReason} cost≈$${cost.toFixed(4)}`,
    );

    answer = parsePlanAnswer(result.text, question);
    if (answer) break;

    // AI 응답에는 화면에서 읽은 개인정보가 섞일 수 있어 내용은 로그에 남기지 않는다
    console.error(
      `[guide-plan] unparsable AI answer attempt=${attempt} (length=${result.text.length}, finish=${result.finishReason})`,
    );
    if (result.finishReason === "length") break;
  }
  if (!answer) throw aiFailed();

  // 위험 경고를 끈 사용자에게는 위험 표시도 하지 않는다 (POST /api/guides의 risk와 같은 기준)
  const { riskWarning } = await getSettings(userId);
  return riskWarning ? answer : { ...answer, steps: answer.steps.map((step) => ({ ...step, isRisky: false })) };
}
