import { z } from "zod";

// 할 일 목록 (POST /api/guide-plans) — 담당: hyuckkim
// 화면 + 하고 싶은 일 → 큰 흐름 목록. 처음에 한 번 보여 주는 참고용이고, 몇 번째 단계인지는 추적하지 않는다
// (은행·사이트마다 단계 수가 달라서). 화면마다 누를 곳 안내는 지금처럼 POST /api/guides가 한다.
// 이미지 형식 규칙은 API_CONVENTION 2번 「화면 이미지 보내기」(POST /api/guides와 같음)

// image는 문자열인지만 여기서 보고, 형식·크기는 service에서 IMAGE_INVALID / IMAGE_TOO_LARGE로 구분해 알린다
export const guidePlanRequestSchema = z.object({
  image: z.string().min(1, "화면 사진이 필요해요."),
  question: z.string().trim().min(1, "하고 싶은 일을 적어 주세요.").max(200, "200자 안으로 적어 주세요."),
});
export type GuidePlanRequest = z.infer<typeof guidePlanRequestSchema>;

// OK: 목록을 만들었음 / UNCLEAR: 질문이 모호하거나 화면과 상관없어 목록을 만들 수 없음 (steps는 [], hint에 안내)
export const GUIDE_PLAN_STATUSES = ["OK", "UNCLEAR"] as const;
export type GuidePlanStatus = (typeof GUIDE_PLAN_STATUSES)[number];

export interface GuidePlanStep {
  text: string; // 큰 흐름 한 덩어리 (예: "보낼 금액 적기"). 사이트마다 다른 세부 화면은 적지 않는다
  needsInput: boolean; // 금액·비밀번호처럼 본인이 직접 넣어야 하는 단계 (AI는 값을 묻지 않는다)
  isRisky: boolean; // 돈이 나가거나 지워지는 단계
}

export interface GuidePlanResponse {
  steps: GuidePlanStep[]; // 보통 3~6개, 개수는 보장하지 않음. UNCLEAR면 []
  status: GuidePlanStatus;
  hint: string | null; // UNCLEAR일 때 화면에 보여 줄 한 문장 (예: "무엇을 하고 싶은지 조금 더 자세히 적어 주세요."). OK면 null
}
