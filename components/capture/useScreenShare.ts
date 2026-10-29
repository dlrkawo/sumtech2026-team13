"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { videoFrameToDataUrl } from "@/lib/image";

// 화면 공유(getDisplayMedia) 상태 (FE_CONVENTION.md 9번)
//   off: 공유 안 함 / asking: 브라우저 선택 창이 떠 있음 / on: 공유 중
//   denied: 사용자가 취소했거나 막힘 / unsupported: 이 브라우저는 화면 공유가 안 됨
export type ScreenShareStatus = "off" | "asking" | "on" | "denied" | "unsupported";

// 화면 공유를 시작·종료하고, 지금 장면을 data URL로 찍는다.
//   const share = useScreenShare();
//   await share.start();          // 반드시 사용자 클릭 안에서 부른다
//   const image = share.capture(); // lib/image.ts 규칙(1280px, JPEG 0.7)
export function useScreenShare() {
  const [status, setStatus] = useState<ScreenShareStatus>("off");
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // 선택 창이 떠 있는 동안 stop()이 불리면, 늦게 도착한 공유는 바로 끊는다
  const runRef = useRef(0);

  const stop = useCallback(() => {
    runRef.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    videoRef.current = null;
    setStatus("off");
  }, []);

  const start = useCallback(async (): Promise<boolean> => {
    if (streamRef.current) return true;
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
      setStatus("unsupported");
      return false;
    }
    const run = ++runRef.current;
    setStatus("asking");
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      if (run !== runRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return false;
      }
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;
      await video.play();
      // 브라우저의 "공유 중지" 버튼으로 끝낸 경우도 같은 상태로 맞춘다
      stream.getVideoTracks()[0]?.addEventListener("ended", stop);
      streamRef.current = stream;
      videoRef.current = video;
      setStatus("on");
      return true;
    } catch {
      if (run === runRef.current) setStatus("denied");
      return false;
    }
  }, [stop]);

  // 공유 중이 아니면 ImageError를 던진다 (화면에서 toUserError로 처리)
  const capture = useCallback((): string => {
    const video = videoRef.current;
    if (!video) return videoFrameToDataUrl(document.createElement("video"));
    return videoFrameToDataUrl(video);
  }, []);

  useEffect(() => stop, [stop]);

  return { status, isSharing: status === "on", start, stop, capture };
}
