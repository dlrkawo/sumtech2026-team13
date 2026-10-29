import type { SettingsResponse, SettingsUpdateRequest } from "@/server/settings/schema";
import { request } from "@/lib/api/client";

// 내 설정 (S5·S6). 로그인 필요
export function getSettings(): Promise<SettingsResponse> {
  return request<SettingsResponse>("/api/settings");
}

// 바꿀 값만 보낸다. 예) updateSettings({ edgeDisplay: false }) → 바뀐 전체 설정
export function updateSettings(patch: SettingsUpdateRequest): Promise<SettingsResponse> {
  return request<SettingsResponse>("/api/settings", { method: "PATCH", body: JSON.stringify(patch) });
}
