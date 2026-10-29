import { useCallback, useEffect, useState } from "react";

import type { GuideHistoryResponse } from "@/server/history/schema";
import { toUserError, type UserError } from "@/lib/errors";

import { clearHistory, listHistory } from "./api";

// 도움 기록 화면에서 쓴다. 화면이 열릴 때마다 새로 불러온다 (방금 물어본 것도 보이도록, S5·S6)
export function useHistory(enabled: boolean) {
  const [items, setItems] = useState<GuideHistoryResponse | null>(null);
  const [error, setError] = useState<UserError | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let ignore = false;
    listHistory()
      .then((data) => {
        if (ignore) return;
        setItems(data);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!ignore) setError(toUserError(e));
      });
    return () => {
      ignore = true;
    };
  }, [enabled]);

  // 기록 창을 닫거나 로그아웃·세션 만료로 enabled가 꺼지면 목록을 비운다 (다음에 열 때 새로 불러오고, 이전 사람의 기록이 남지 않는다)
  useEffect(() => {
    if (!enabled) return;
    return () => {
      setItems(null);
      setError(null);
    };
  }, [enabled]);

  const clear = useCallback(async () => {
    try {
      await clearHistory();
      setItems([]);
      setError(null);
    } catch (e) {
      setError(toUserError(e));
    }
  }, []);

  return { items, error, isLoading: enabled && items === null && error === null, clear };
}
