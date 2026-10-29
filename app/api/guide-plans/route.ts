import { requireUser } from "@/server/auth/session";
import { createGuidePlan } from "@/server/guide-plan/service";
import { guidePlanRequestSchema } from "@/server/guide-plan/schema";
import { ok, parseBody, withHandler } from "@/server/response";

// POST /api/guide-plans — 참고용 할 일 목록 (API_CONVENTION 10번, 로그인 필요). 요청·응답 타입은 server/guide-plan/schema.ts
export const POST = withHandler(async (req) => {
  // 로그인 확인을 가장 먼저 해서, 로그인하지 않은 요청은 AI를 부르지 않는다 (팀 예산)
  const user = await requireUser();
  const body = await parseBody(req, guidePlanRequestSchema);
  return ok(await createGuidePlan(user.id, body));
});
