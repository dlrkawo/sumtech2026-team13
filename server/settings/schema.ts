import { z } from "zod";

// 사용자 설정 (GET /api/settings 응답, PATCH /api/settings 요청)
// 시나리오 S5(화면 가장자리 표시), S8(음성 인식), 기획 F8(클릭 영역 표시 모양)·F9(위험 경고)·F10(기록 저장)
export const HIGHLIGHT_STYLES = ["BORDER", "ARROW", "DIM"] as const; // 테두리 / 화살표 / 주변 어둡게
export type HighlightStyle = (typeof HIGHLIGHT_STYLES)[number];

export interface SettingsResponse {
  edgeDisplay: boolean; // 화면 가장자리 표시 (기본 켜짐)
  voiceInput: boolean; // 음성 인식·마이크 버튼 (기본 꺼짐)
  highlightStyle: HighlightStyle; // 누를 곳 표시 모양 (기본 BORDER)
  riskWarning: boolean; // 송금·결제 위험 경고 (기본 켜짐)
  saveHistory: boolean; // 도움 기록 저장 (기본 켜짐, 화면 이미지는 어떤 경우에도 저장하지 않음)
}

export const DEFAULT_SETTINGS: SettingsResponse = {
  edgeDisplay: true,
  voiceInput: false,
  highlightStyle: "BORDER",
  riskWarning: true,
  saveHistory: true,
};

// 바꾸고 싶은 값만 보낸다. 예) { "edgeDisplay": false }
export const settingsUpdateSchema = z
  .object({
    edgeDisplay: z.boolean(),
    voiceInput: z.boolean(),
    highlightStyle: z.enum(HIGHLIGHT_STYLES),
    riskWarning: z.boolean(),
    saveHistory: z.boolean(),
  })
  .partial()
  .strict();
export type SettingsUpdateRequest = z.infer<typeof settingsUpdateSchema>;
