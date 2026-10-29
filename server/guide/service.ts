import "server-only";

import { aiFailed, createChatCompletion } from "../ai/gateway";
import { buildGuidePrompt, parseGuideAnswer } from "./prompt";
import type { GuideRequest, GuideResponse } from "./schema";
import { readScreenImage } from "./screen-image";

// POST /api/guides — 화면 이미지 + 질문 → 한 단계 안내 (담당: hyuckkim)

const MODEL = "anthropic/claude-sonnet-5.5";
// 100만 토큰당 USD (입력, 출력) — 팀 대시보드 기준. 호출마다 비용을 로그로 남겨 예산을 확인한다
const PRICE_PER_MILLION = { input: 2.0, output: 10.0 };

export async function createGuide({ image, question, previousInstruction }: GuideRequest): Promise<GuideResponse> {
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

  const answer = parseGuideAnswer(result.text, screen.width, screen.height);
  if (!answer) {
    console.error("[guide] unparsable AI answer", result.text.slice(0, 500));
    throw aiFailed();
  }

  // TODO(이감재 server/settings): 사용자 설정 riskWarning이 꺼져 있으면 answer.risk를 null로 바꾼다 (기본 켜짐)
  // TODO(이감재 server/history): 기록 저장 설정이 켜져 있으면 question·instruction만 도움 기록에 남긴다
  return answer;
}
