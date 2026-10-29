import "server-only";

import { query } from "../db/client";
import { getSettings } from "../settings/service";
import type { GuideHistoryItem } from "./schema";

const MAX_ITEMS = 50;

interface HistoryRow {
  id: number;
  question: string;
  instruction: string;
  created_at: Date;
}

// 최신순 최대 50개 (S7)
export async function listHistory(userId: number): Promise<GuideHistoryItem[]> {
  const rows = await query<HistoryRow>(
    `SELECT id, question, instruction, created_at FROM guide_histories
      WHERE user_id = $1 ORDER BY created_at DESC, id DESC LIMIT $2`,
    [userId, MAX_ITEMS],
  );
  return rows.map((r) => ({
    id: r.id,
    question: r.question,
    instruction: r.instruction,
    createdAt: r.created_at.toISOString(),
  }));
}

export async function deleteAllHistory(userId: number): Promise<void> {
  await query("DELETE FROM guide_histories WHERE user_id = $1", [userId]);
}

// POST /api/guides(hyuckkim)가 안내를 만든 뒤 호출한다. 기록 저장 설정이 꺼져 있으면 저장하지 않는다.
// 화면 이미지는 받지도 저장하지도 않는다 (질문과 안내 문장만)
export async function recordGuideHistory(userId: number, question: string, instruction: string): Promise<void> {
  const { saveHistory } = await getSettings(userId);
  if (!saveHistory) return;
  await query("INSERT INTO guide_histories (user_id, question, instruction) VALUES ($1, $2, $3)", [
    userId,
    question,
    instruction,
  ]);
}
