import { authRequestSchema } from "@/server/auth/schema";
import { signup } from "@/server/auth/service";
import { ok, parseBody, withHandler } from "@/server/response";

// POST /api/auth/signup — 가입하고 바로 로그인 상태로 만든다 (S1)
export const POST = withHandler(async (req) => {
  const body = await parseBody(req, authRequestSchema);
  return ok(await signup(req, body), { status: 201 });
});
