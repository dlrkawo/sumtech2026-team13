import { requireUser } from "@/server/auth/session";
import { ok, parseBody, withHandler } from "@/server/response";
import { settingsUpdateSchema } from "@/server/settings/schema";
import { getSettings, updateSettings } from "@/server/settings/service";

// GET /api/settings — 내 설정 (설정 창. S6에서 '기록 저장'을 끈다)
export const GET = withHandler(async () => {
  const user = await requireUser();
  return ok(await getSettings(user.id));
});

// PATCH /api/settings — 바꿀 값만 보냄. 예) { "edgeDisplay": false }
export const PATCH = withHandler(async (req) => {
  const user = await requireUser();
  const patch = await parseBody(req, settingsUpdateSchema);
  return ok(await updateSettings(user.id, patch));
});
