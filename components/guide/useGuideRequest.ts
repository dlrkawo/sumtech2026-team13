import { useCallback, useRef, useState } from "react";

import type { GuideRequest, GuideResponse } from "@/server/guide/schema";
import { toUserError, type UserError } from "@/lib/errors";

import { createGuide } from "./api";

export type GuideRequestState =
  | { status: "idle" }
  | { status: "loading"; request: GuideRequest }
  | { status: "success"; request: GuideRequest; data: GuideResponse }
  | { status: "error"; request: GuideRequest; error: UserError };

// 안내 요청 하나의 상태(요청 전 → 분석 중 → 결과 / 오류)를 관리한다. 화면 구성과는 상관없이 쓴다.
//   const { state, ask, retry, reset } = useGuideRequest();
//   ask({ image: await fileToDataUrl(file), question });
//   다음 단계를 이어서 물을 때는 지금까지 받은 안내 문장들을 같이 보낸다 (API_CONVENTION.md 10번)
//   ask({ image, question, previousInstructions: [...(state.request.previousInstructions ?? []), state.data.instruction] });
export function useGuideRequest() {
  const [state, setState] = useState<GuideRequestState>({ status: "idle" });
  // 분석 중에는 다시 보내지 않는다 (AI 예산 공용, FE_CONVENTION.md 8번)
  const inFlight = useRef(false);
  // reset() 뒤에 늦게 도착한 응답은 버린다
  const latestId = useRef(0);
  const lastRequest = useRef<GuideRequest | null>(null);

  const ask = useCallback(async (request: GuideRequest) => {
    if (inFlight.current) return;
    inFlight.current = true;
    lastRequest.current = request;
    const id = ++latestId.current;
    setState({ status: "loading", request });

    try {
      const data = await createGuide(request);
      if (id === latestId.current) setState({ status: "success", request, data });
    } catch (e) {
      if (id === latestId.current) setState({ status: "error", request, error: toUserError(e) });
    } finally {
      if (id === latestId.current) inFlight.current = false;
    }
  }, []);

  const retry = useCallback(() => {
    if (lastRequest.current) return ask(lastRequest.current);
  }, [ask]);

  // 실패한 뒤 물어볼 화면이 바뀌면 오류와 '다시 시도'를 지운다 ('다시 시도'는 바뀌기 전 화면을 그대로 보내므로).
  // 실패 상태일 때만 지우고, 받은 안내(success)나 답변 중(loading)은 그대로 둔다
  const clearError = useCallback(() => {
    setState((prev) => (prev.status === "error" ? { status: "idle" } : prev));
  }, []);

  const reset = useCallback(() => {
    latestId.current += 1;
    inFlight.current = false;
    lastRequest.current = null;
    setState({ status: "idle" });
  }, []);

  return { state, ask, retry, clearError, reset, isLoading: state.status === "loading" };
}
