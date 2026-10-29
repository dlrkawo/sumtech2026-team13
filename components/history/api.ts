import type { GuideHistoryResponse } from "@/server/history/schema";
import { request } from "@/lib/api/client";

// 내 도움 기록, 최신순 최대 50개 (S5·S6). 로그인 필요
export function listHistory(): Promise<GuideHistoryResponse> {
  return request<GuideHistoryResponse>("/api/guide-history");
}

// 내 도움 기록 전체 삭제 (개인정보 보호)
export function clearHistory(): Promise<void> {
  return request<void>("/api/guide-history", { method: "DELETE" });
}
