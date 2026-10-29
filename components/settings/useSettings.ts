import { useCallback, useEffect, useRef, useState } from "react";

import type { SettingsResponse, SettingsUpdateRequest } from "@/server/settings/schema";
import { toUserError, type UserError } from "@/lib/errors";

import { getSettings, updateSettings } from "./api";

// 설정 창에서 쓴다. enabled가 true(로그인 상태)일 때만 불러온다 (로그인 전에는 401이므로)
//   const { settings, update } = useSettings(auth.state.status === "signedIn");
//   update({ edgeDisplay: false });
export function useSettings(enabled: boolean) {
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [error, setError] = useState<UserError | null>(null);
  // 화면에 바로 보이는 값. 저장이 실패하면 이전 값으로 되돌린다
  const confirmed = useRef<SettingsResponse | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let ignore = false;
    getSettings()
      .then((data) => {
        if (ignore) return;
        confirmed.current = data;
        setSettings(data);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!ignore) setError(toUserError(e));
      });
    return () => {
      ignore = true;
    };
  }, [enabled]);

  // 스위치를 누르면 바로 바뀐 것처럼 보이고, 저장에 실패하면 되돌리고 error를 채운다
  const update = useCallback(async (patch: SettingsUpdateRequest) => {
    if (!confirmed.current) return;
    setSettings((prev) => (prev ? { ...prev, ...patch } : prev));
    setError(null);
    try {
      const saved = await updateSettings(patch);
      confirmed.current = saved;
      setSettings(saved);
    } catch (e) {
      setSettings(confirmed.current);
      setError(toUserError(e));
    }
  }, []);

  return { settings, error, isLoading: enabled && settings === null && error === null, update };
}
