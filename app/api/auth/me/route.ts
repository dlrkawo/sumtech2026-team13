import { requireUser } from "@/server/auth/session";
import { ok, withHandler } from "@/server/response";

// GET /api/auth/me — 지금 로그인한 사용자. 로그인 안 했으면 401 AUTH_REQUIRED
export const GET = withHandler(async () => ok(await requireUser()));
