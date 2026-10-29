import { requireUser } from "@/server/auth/session";
import { ok, parseBody, withHandler } from "@/server/response";
import { createVoiceGuide } from "@/server/voice-guide/service";
import { voiceGuideRequestSchema } from "@/server/voice-guide/schema";

// POST /api/voice-guides — 화면 이미지 + 목소리로 묻기 (API_CONVENTION 10번, 로그인 필요). 타입은 server/voice-guide/schema.ts
export const POST = withHandler(async (req) => {
  // 로그인 확인을 가장 먼저 해서, 로그인하지 않은 요청은 AI를 부르지 않는다 (팀 예산)
  const user = await requireUser();
  const body = await parseBody(req, voiceGuideRequestSchema);
  return ok(await createVoiceGuide(user.id, body));
});
