import { requireUser } from "@/server/auth/session";
import { createGuide } from "@/server/guide/service";
import { guideRequestSchema } from "@/server/guide/schema";
import { ok, parseBody, withHandler } from "@/server/response";

// POST /api/guides — 화면 분석·안내 (API_CONVENTION 10번, 로그인 필요). 요청·응답 타입은 server/guide/schema.ts
export const POST = withHandler(async (req) => {
  // 로그인 확인을 가장 먼저 해서, 로그인하지 않은 요청은 AI를 부르지 않는다 (팀 예산)
  const user = await requireUser();
  const body = await parseBody(req, guideRequestSchema);
  return ok(await createGuide(user.id, body));
});
