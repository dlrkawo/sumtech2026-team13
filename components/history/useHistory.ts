import { useCallback, useEffect, useState } from "react";

import type { GuideHistoryResponse } from "@/server/history/schema";
import { toUserError, type UserError } from "@/lib/errors";

import { clearHistory, listHistory } from "./api";

// 도움 기록 화면에서 쓴다. 화면이 열릴 때마다 새로 불러온다 (방금 물어본 것도 보이도록, S7)
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
      // 창을 닫으면 비운다. 다시 열 때 지난 목록(또는 이전 계정의 목록)을 보여 주다 바꾸지 않고 불러오는 중부터 보이게
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
