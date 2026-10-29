import type { GuideRequest, GuideResponse } from "@/server/guide/schema";
import { ApiError } from "@/lib/api/types";

// BE 연동 전 개발용 목업 (NEXT_PUBLIC_USE_MOCK=true일 때만 api.ts가 사용).
// 좌표는 e2e/fixtures/mock-step1·2.png(1280×800)의 오른쪽 아래 파란 버튼 위치다.
// 주소에 ?mock=<이름>을 붙이면 그 응답만 돌려준다. 없으면 STEP1 → STEP2 → DONE 순서로 돌아간다.
//   ?mock=done | need-info | risk | no-target | ai-error | budget | image-error | network

const DELAY_MS = 1200;

const STEP1: GuideResponse = {
  instruction: "오른쪽 아래 파란색 '예약하기' 버튼을 눌러 주세요.",
  target: { x: 0.703, y: 0.85, width: 0.203, height: 0.088 },
  risk: null,
  status: "IN_PROGRESS",
};

const STEP2: GuideResponse = {
  instruction: "원하는 날짜를 고른 뒤 오른쪽 아래 '선택 완료' 버튼을 눌러 주세요.",
  target: { x: 0.703, y: 0.85, width: 0.203, height: 0.088 },
  risk: null,
  status: "IN_PROGRESS",
};

const RESPONSES: Record<string, GuideResponse> = {
  done: { instruction: "신청이 끝났어요. 화면에 '신청이 완료되었습니다'가 보여요.", target: null, risk: null, status: "DONE" },
  "need-info": { instruction: "이 화면만으로는 알기 어려워요. 화면을 직접 확인해 주세요.", target: null, risk: null, status: "NEED_INFO" },
  risk: { ...STEP1, risk: { message: "돈이 나가는 버튼이에요. 한 번 더 확인하세요" } },
  "no-target": { ...STEP1, instruction: "화면 아래쪽에 있는 '다음' 버튼을 찾아 눌러 주세요.", target: null },
};

const ERRORS: Record<string, ApiError> = {
  "ai-error": new ApiError(503, "AI_FAILED", "화면을 분석하지 못했어요. 잠시 후 다시 시도해 주세요."),
  budget: new ApiError(429, "AI_BUDGET_EXCEEDED", "지금은 사용량이 많아요. 잠시 후 다시 시도해 주세요."),
  "image-error": new ApiError(400, "IMAGE_INVALID", "화면 사진 형식이 올바르지 않아요."),
  network: new ApiError(0, "NETWORK_ERROR", "인터넷 연결을 확인해 주세요."),
};

const SEQUENCE = [STEP1, STEP2, RESPONSES.done];

// 화면 확인용 예시 응답 (app/(pages)/dev/helper-preview에서 컴포넌트에 props로 넘긴다)
export const MOCK_GUIDE_EXAMPLES: Record<string, GuideResponse> = { step1: STEP1, step2: STEP2, ...RESPONSES };
let sequenceIndex = 0;

function mockName(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("mock");
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- 실제 API와 같은 모양을 맞추려고 요청을 받는다
export async function mockCreateGuide(_body: GuideRequest): Promise<GuideResponse> {
  await new Promise((resolve) => setTimeout(resolve, DELAY_MS));

  const name = mockName();
  if (name && ERRORS[name]) throw ERRORS[name];
  if (name && RESPONSES[name]) return RESPONSES[name];

  const response = SEQUENCE[sequenceIndex % SEQUENCE.length];
  sequenceIndex += 1;
  return response;
}
