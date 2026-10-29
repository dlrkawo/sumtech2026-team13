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
  // 저장은 차례대로 보낸다. 저장 중에는 '도움 시작하기'를 막는다 (기록 저장 끄기가 서버에 반영되기 전에 묻지 않게, F6)
  const queue = useRef<Promise<void>>(Promise.resolve());
  const pending = useRef(0);
  const [isSaving, setIsSaving] = useState(false);

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
  // (스위치는 먼저 바꿔 둔다. E2E의 switch.uncheck()는 누른 직후 상태가 바뀌어야 통과한다)
  const update = useCallback((patch: SettingsUpdateRequest) => {
    if (!confirmed.current) return Promise.resolve();
    setSettings((prev) => (prev ? { ...prev, ...patch } : prev));
    setError(null);
    pending.current += 1;
    setIsSaving(true);

    const save = async () => {
      try {
        confirmed.current = await updateSettings(patch);
      } catch (e) {
        setError(toUserError(e));
      }
      pending.current -= 1;
      // 뒤에 저장할 값이 남아 있으면 그 값이 계속 보이게 두고, 다 끝나면 서버 값으로 맞춘다
      if (pending.current === 0) {
        setSettings(confirmed.current);
        setIsSaving(false);
      }
    };
    queue.current = queue.current.then(save);
    return queue.current;
  }, []);

  return { settings, error, isLoading: enabled && settings === null && error === null, isSaving, update };
}
