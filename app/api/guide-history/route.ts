import { requireUser } from "@/server/auth/session";
import { deleteAllHistory, listHistory } from "@/server/history/service";
import { ok, withHandler } from "@/server/response";

// GET /api/guide-history — 내 도움 기록, 최신순 최대 50개 (S7)
export const GET = withHandler(async () => {
  const user = await requireUser();
  return ok(await listHistory(user.id));
});

// DELETE /api/guide-history — 내 도움 기록 전체 삭제 (개인정보 보호)
export const DELETE = withHandler(async () => {
  const user = await requireUser();
  await deleteAllHistory(user.id);
  return ok(null, { status: 204 });
});
