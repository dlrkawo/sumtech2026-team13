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

export async function createGuide(
  userId: number,
  { image, question, previousInstruction }: GuideRequest,
): Promise<GuideResponse> {
  const screen = readScreenImage(image);

  const result = await createChatCompletion({
    model: MODEL,
    content: [
      { type: "image_url", image_url: { url: image } },
      { type: "text", text: buildGuidePrompt(question, screen.width, screen.height, previousInstruction) },
    ],
  });

  const cost =
    (result.promptTokens * PRICE_PER_MILLION.input + result.completionTokens * PRICE_PER_MILLION.output) / 1e6;
  console.info(`[guide] tokens in=${result.promptTokens} out=${result.completionTokens} cost≈$${cost.toFixed(4)}`);

  const answer = parseGuideAnswer(result.text, screen.width, screen.height, question);
  if (!answer) {
    // AI 응답에는 화면에서 읽은 개인정보가 섞일 수 있어 내용은 로그에 남기지 않는다
    console.error(`[guide] unparsable AI answer (length=${result.text.length})`);
    throw aiFailed();
  }

  const { riskWarning } = await getSettings(userId);
  const response = riskWarning ? answer : { ...answer, risk: null };

  // 기록 저장이 실패해도 이미 비용을 들여 받은 안내는 돌려준다 (저장 여부는 recordGuideHistory가 설정을 보고 정함)
  await recordGuideHistory(userId, question, response.instruction).catch((e) =>
    console.error("[guide] failed to record history", e),
  );
  return response;
}
