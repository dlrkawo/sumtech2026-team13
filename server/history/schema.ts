// 도움 기록 (GET /api/guide-history, DELETE /api/guide-history) — 시나리오 S7, 기획 F10·F11
// 화면 이미지는 저장하지 않고 질문과 안내 문장만 남긴다

export interface GuideHistoryItem {
  id: number;
  question: string;
  instruction: string;
  createdAt: string; // ISO 8601, 타임존 포함
}

// GET 응답의 data는 최신순 배열 (짧은 목록이라 페이지네이션 없음, 최대 50개)
export type GuideHistoryResponse = GuideHistoryItem[];
