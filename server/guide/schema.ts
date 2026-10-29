import { z } from "zod";

// 화면 분석·안내 (POST /api/guides) — 담당: hyuckkim
// 이미지 형식 규칙은 API_CONVENTION 2번 「화면 이미지 보내기」

// data URL 문자열 기준 3MB (FE lib/constants.ts와 같은 값). Vercel 함수 요청 본문 한도 4.5MB 안에 여유를 둔 값.
// 1280px·JPEG 0.7이면 보통 수백 KB라 실제로 걸릴 일은 거의 없다.
export const MAX_IMAGE_DATA_URL_LENGTH = 3 * 1024 * 1024;
export const IMAGE_DATA_URL_PATTERN = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

// 바로 전에 받은 안내 문장 (선택). 있으면 AI가 "다음 단계"를 이어서 판단하는 데 쓴다 (없으면 화면과 질문만으로 판단)
// AI 안내 문장은 길이 제한이 없어서, 300자를 넘어도 '눌렀어요, 다음 알려 주세요'가 막히지 않게 오류 대신 앞 300자만 쓴다.
// 2000자를 넘는 비정상 요청만 400 (화면에 그대로 보이므로 영어 기본 문구 대신 한국어 문구)
export const MAX_PREVIOUS_INSTRUCTION_LENGTH = 300;
const instructionTextSchema = z
  .string({ error: "바로 전 안내를 다시 확인해 주세요." })
  .trim()
  .max(2000, "바로 전 안내가 너무 길어요. 새로 물어봐 주세요.")
  .transform((s) => s.slice(0, MAX_PREVIOUS_INSTRUCTION_LENGTH));
export const previousInstructionSchema = instructionTextSchema.optional();

// 지금까지 받은 안내 문장들 (선택, 오래된 순). 바로 전 한 줄만으로는 여러 단계짜리 일에서 AI가 앞 단계를 모르므로
// 이어 묻기 동안 받은 안내를 순서대로 보낸다. 최근 5개만 AI에 넘긴다 (비용·프롬프트 길이)
// previousInstruction(한 줄)도 계속 받는다. 둘 다 오면 이 목록을 쓴다
export const MAX_PREVIOUS_INSTRUCTIONS = 5;
export const previousInstructionsSchema = z
  .array(instructionTextSchema, { error: "지난 안내 목록을 다시 확인해 주세요." })
  .max(50, "지난 안내가 너무 많아요. 새로 물어봐 주세요.")
  .transform((list) => list.filter((text) => text.length > 0).slice(-MAX_PREVIOUS_INSTRUCTIONS))
  .optional();

// image는 문자열인지만 여기서 보고, 형식·크기는 service에서 IMAGE_INVALID / IMAGE_TOO_LARGE로 구분해 알린다
// 값이 아예 없을 때도 영어 기본 문구 대신 화면에 보여 줄 문장을 쓴다 (POST /api/voice-guides와 같음)
export const guideRequestSchema = z.object(
  {
    image: z.string({ error: "화면 사진이 필요해요." }).min(1, "화면 사진이 필요해요."),
    question: z
      .string({ error: "하고 싶은 일을 적어 주세요." })
      .trim()
      .min(1, "하고 싶은 일을 적어 주세요.")
      .max(200, "200자 안으로 적어 주세요."),
    previousInstruction: previousInstructionSchema,
    previousInstructions: previousInstructionsSchema,
  },
  // 본문이 객체가 아닐 때(null·배열 등)도 영어 기본 문구 대신 쓴다
  { error: "요청 형식이 올바르지 않아요." },
);
export type GuideRequest = z.infer<typeof guideRequestSchema>;

export const GUIDE_STATUSES = ["IN_PROGRESS", "DONE", "NEED_INFO"] as const;
export type GuideStatus = (typeof GUIDE_STATUSES)[number];

// 누를 곳. 이미지 기준 0~1 비율, 좌상단 기준 (API_CONVENTION 5번)
export interface GuideTarget {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GuideRisk {
  message: string; // 예) "돈이 나가는 버튼이에요. 한 번 더 확인하세요"
}

export interface GuideResponse {
  instruction: string; // 한 단계 안내 문장 (부모님용 쉬운 말)
  target: GuideTarget | null; // 못 찾으면 null → 문장으로만 안내
  risk: GuideRisk | null; // 송금·결제·삭제 단계이고 위험 경고 설정이 켜져 있을 때만
  status: GuideStatus; // IN_PROGRESS: 다음 행동 있음 / DONE: 완료 화면 / NEED_INFO: 화면만으로 판단 어려움
}
