import { createGuide } from "@/server/guide/service";
import { guideRequestSchema } from "@/server/guide/schema";
import { ok, parseBody, withHandler } from "@/server/response";

// POST /api/guides — 화면 분석·안내 (API_CONVENTION 10번). 요청·응답 타입은 server/guide/schema.ts
export const POST = withHandler(async (req) => {
  // TODO(이감재 server/auth): 로그인 확인 함수가 생기면 여기서 확인하고, 없으면 401 AUTH_REQUIRED
  const body = await parseBody(req, guideRequestSchema);
  return ok(await createGuide(body));
});
