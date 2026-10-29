import { useCallback, useEffect, useRef, useState } from "react";

// ▶ 화면 보기 시작 / ■ 멈춤 (S3). 시작은 반드시 버튼 클릭에서 부른다 (getDisplayMedia는 클릭 없이 실패)
//   idle: 아직 시작 안 함 / starting: 브라우저의 화면 고르기 창이 열려 있음 / sharing: 보는 중 / stopped: 멈춤
export type ScreenShareStatus = "idle" | "starting" | "sharing" | "stopped";

export interface ScreenShareError {
  code: "SHARE_DENIED" | "SHARE_UNSUPPORTED" | "SHARE_FAILED";
  message: string;
}

const UNSUPPORTED: ScreenShareError = {
  code: "SHARE_UNSUPPORTED",
  message: "이 브라우저에서는 화면 보기를 할 수 없어요. PC의 크롬이나 엣지에서 열어 주세요.",
};

function toShareError(e: unknown): ScreenShareError {
  const name = e instanceof DOMException ? e.name : "";
  // 고르기 창에서 '취소'를 누르거나 권한을 막은 경우
  if (name === "NotAllowedError") {
    return { code: "SHARE_DENIED", message: "화면 보기를 시작하지 않았어요. 다시 하려면 ▶를 눌러 주세요." };
  }
  if (name === "NotSupportedError") return UNSUPPORTED;
  console.error("[useScreenShare] 화면 보기 실패", e);
  return { code: "SHARE_FAILED", message: "화면을 가져오지 못했어요. 잠시 후 다시 ▶를 눌러 주세요." };
}

export function useScreenShare() {
  const [status, setStatus] = useState<ScreenShareStatus>("idle");
  const [error, setError] = useState<ScreenShareError | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isStartingRef = useRef(false);
  const isMountedRef = useRef(true);

  const release = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => {
      track.onended = null;
      track.stop();
    });
    streamRef.current = null;
  }, []);

  const stop = useCallback(() => {
    release();
    setStatus("stopped");
  }, [release]);

  const start = useCallback(async () => {
    if (streamRef.current || isStartingRef.current) return;
    setError(null);
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setError(UNSUPPORTED);
      return;
    }

    isStartingRef.current = true;
    setStatus("starting");
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      // 고르는 사이 화면을 떠났으면(로그아웃 등) 바로 정리한다
      if (!isMountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      // 브라우저의 '공유 중지' 버튼이나 공유하던 창을 닫은 경우
      stream.getVideoTracks().forEach((track) => {
        track.onended = stop;
      });
      setStatus("sharing");
    } catch (e) {
      if (!isMountedRef.current) return;
      setError(toShareError(e));
      setStatus("idle");
    } finally {
      isStartingRef.current = false;
    }
  }, [stop]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      release();
    };
  }, [release]);

  return { status, error, isSharing: status === "sharing", start, stop };
}
