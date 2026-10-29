import "server-only";

import { aiFailed, createChatCompletion } from "../ai/gateway";
import { recordGuideHistory } from "../history/service";
import { getSettings } from "../settings/service";
import { buildGuidePrompt, parseGuideAnswer } from "./prompt";
import type { GuideRequest, GuideResponse } from "./schema";
import { readScreenImage } from "./screen-image";

// POST /api/guides — 화면 이미지 + 질문 → 한 단계 안내 (담당: hyuckkim)

const MODEL = "anthropic/claude-sonnet-5.5";
// 100만 토큰당 USD (입력, 출력) — 팀 대시보드 기준. 호출마다 비용을 로그로 남겨 예산을 확인한다
const PRICE_PER_MILLION = { input: 2.0, output: 10.0 };
// 답의 형식이 우연히 깨졌을 때만 한 번 더 묻는다. max_tokens에 걸려 잘린 답은 다시 물어도 또 잘리므로 다시 묻지 않는다
const MAX_ATTEMPTS = 2;

export async function createGuide(
  userId: number,
  { image, question, previousInstruction, previousInstructions }: GuideRequest,
): Promise<GuideResponse> {
  const screen = readScreenImage(image);
  // 지난 안내 목록이 오면 그것을, 없으면 바로 전 한 줄을 쓴다 (예전 FE 요청 그대로 동작)
  const history = previousInstructions?.length ? previousInstructions : previousInstruction ? [previousInstruction] : [];
  const content = [
    { type: "image_url" as const, image_url: { url: image } },
    { type: "text" as const, text: buildGuidePrompt(question, screen.width, screen.height, history) },
  ];

  let answer: GuideResponse | null = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const result = await createChatCompletion({ model: MODEL, content });

    const cost =
      (result.promptTokens * PRICE_PER_MILLION.input + result.completionTokens * PRICE_PER_MILLION.output) / 1e6;
    console.info(
      `[guide] attempt=${attempt} tokens in=${result.promptTokens} out=${result.completionTokens} ` +
        `reasoning=${result.reasoningTokens} finish=${result.finishReason} cost≈$${cost.toFixed(4)}`,
    );

    // 잘린 응답은 JSON 일부가 우연히 완전해 보여도 성공으로 쓰거나 다시 요청하지 않는다.
    if (result.finishReason === "length") throw aiFailed();

    answer = parseGuideAnswer(result.text, screen.width, screen.height, question);
    if (answer) break;

    // AI 응답에는 화면에서 읽은 개인정보가 섞일 수 있어 내용은 로그에 남기지 않는다
    console.error(
      `[guide] unparsable AI answer attempt=${attempt} (length=${result.text.length}, finish=${result.finishReason})`,
    );
  }
  if (!answer) throw aiFailed();

  const { riskWarning } = await getSettings(userId);
  const response = riskWarning ? answer : { ...answer, risk: null };

  // 기록 저장이 실패해도 이미 비용을 들여 받은 안내는 돌려준다 (저장 여부는 recordGuideHistory가 설정을 보고 정함)
  await recordGuideHistory(userId, question, response.instruction).catch((e) =>
    console.error("[guide] failed to record history", e),
  );
  return response;
}
