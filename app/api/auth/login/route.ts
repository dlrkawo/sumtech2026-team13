import { authRequestSchema } from "@/server/auth/schema";
import { login } from "@/server/auth/service";
import { ok, parseBody, withHandler } from "@/server/response";

// POST /api/auth/login — 이메일·비밀번호로 로그인, 성공하면 sid 쿠키 설정 (S2~S8, 시드 계정)
export const POST = withHandler(async (req) => {
  const body = await parseBody(req, authRequestSchema);
  return ok(await login(req, body));
});
