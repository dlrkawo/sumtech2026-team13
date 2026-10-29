import { endSession } from "@/server/auth/session";
import { ok, withHandler } from "@/server/response";

// POST /api/auth/logout — 세션 삭제 후 204 (로그인 안 된 상태여도 204)
export const POST = withHandler(async () => {
  await endSession();
  return ok(null, { status: 204 });
});
