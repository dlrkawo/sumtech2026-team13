import { z } from "zod";

// 화면 분석·안내 (POST /api/guides) — 담당: hyuckkim
// 이미지 형식 규칙은 API_CONVENTION 2번 「화면 이미지 보내기」

// data URL 문자열 기준 3MB (FE lib/constants.ts와 같은 값). Vercel 함수 요청 본문 한도 4.5MB 안에 여유를 둔 값.
// 1280px·JPEG 0.7이면 보통 수백 KB라 실제로 걸릴 일은 거의 없다.
export const MAX_IMAGE_DATA_URL_LENGTH = 3 * 1024 * 1024;
export const IMAGE_DATA_URL_PATTERN = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

// image는 문자열인지만 여기서 보고, 형식·크기는 service에서 IMAGE_INVALID / IMAGE_TOO_LARGE로 구분해 알린다
export const guideRequestSchema = z.object({
  image: z.string().min(1, "화면 사진이 필요해요."),
  question: z.string().trim().min(1, "하고 싶은 일을 적어 주세요.").max(200, "200자 안으로 적어 주세요."),
  // 선택. 바로 전에 받은 안내 문장. 있으면 AI가 "다음 단계"를 이어서 판단하는 데 쓴다 (없으면 화면과 질문만으로 판단)
  previousInstruction: z.string().trim().max(300).optional(),
});
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
