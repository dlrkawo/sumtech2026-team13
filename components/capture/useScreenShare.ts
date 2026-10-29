import { useCallback, useEffect, useRef, useState } from "react";

import { ImageError, videoFrameToDataUrl } from "@/lib/image";

// ▶ 화면 보기 시작 / ■ 멈춤 (S3). 시작은 반드시 버튼 클릭에서 부른다 (getDisplayMedia는 클릭 없이 실패)
//   idle: 아직 시작 안 함 / starting: 브라우저의 화면 고르기 창이 열려 있음 / sharing: 보는 중 / stopped: 멈춤
export type ScreenShareStatus = "idle" | "starting" | "sharing" | "stopped";

export interface ScreenShareError {
  code: "SHARE_DENIED" | "SHARE_UNSUPPORTED" | "SHARE_FAILED" | "SHARE_ENDED";
  message: string;
}

// 브라우저의 '공유 중지' 버튼을 누르거나 공유하던 창·탭을 닫아 공유가 끝난 경우.
// ■로 직접 멈춘 것과 달리 사용자가 모르고 지나칠 수 있어 말풍선에 알린다
const ENDED: ScreenShareError = {
  code: "SHARE_ENDED",
  message: "화면 보기가 끝났어요. 다시 보려면 ▶를 눌러 주세요.",
};

// 공유 직후에는 영상의 첫 장면이 아직 오지 않아 크기가 0일 수 있다. 이만큼은 기다렸다 찍는다
const FIRST_FRAME_WAIT_MS = 2000;

function waitForFirstFrame(video: HTMLVideoElement): Promise<void> {
  if (video.videoWidth && video.videoHeight) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      video.removeEventListener("loadedmetadata", done);
      video.removeEventListener("resize", done);
      resolve();
    };
    const timer = setTimeout(done, FIRST_FRAME_WAIT_MS);
    video.addEventListener("loadedmetadata", done);
    video.addEventListener("resize", done);
  });
}

const UNSUPPORTED: ScreenShareError = {
  code: "SHARE_UNSUPPORTED",
  message: "이 브라우저에서는 화면 보기를 할 수 없어요. PC의 크롬이나 엣지에서 열어 주세요.",
};

// 크롬·엣지의 CaptureController (TypeScript 기본 타입에 아직 없어 쓰는 부분만 적는다)
interface FocusCaptureController {
  setFocusBehavior(behavior: "focus-captured-surface" | "no-focus-change"): void;
}

function createCaptureController(): FocusCaptureController | undefined {
  const Ctor = (window as unknown as { CaptureController?: new () => FocusCaptureController }).CaptureController;
  return Ctor ? new Ctor() : undefined;
}

// 탭·창을 공유해도 눌러보슈 탭에 머문다 (크롬 기본은 공유한 탭으로 넘어감).
// 공유가 시작된 직후에만 부를 수 있고, 화면 전체 공유에는 해당하지 않는다
function stayOnThisTab(controller: FocusCaptureController | undefined, stream: MediaStream) {
  const surface = stream.getVideoTracks()[0]?.getSettings().displaySurface;
  if (!controller || (surface !== "browser" && surface !== "window")) return;
  try {
    controller.setFocusBehavior("no-focus-change");
  } catch (e) {
    console.error("[useScreenShare] 공유 후 탭 유지 실패", e);
  }
}

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
  // 지금 장면을 찍으려고 공유 화면을 재생해 두는 보이지 않는 video
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isStartingRef = useRef(false);
  const isMountedRef = useRef(true);
  // getDisplayMedia 자체는 취소할 수 없으므로, 중지된 요청의 결과를 버린다.
  const requestIdRef = useRef(0);

  const release = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => {
      track.onended = null;
      track.stop();
    });
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    videoRef.current = null;
  }, []);

  const stop = useCallback(() => {
    requestIdRef.current += 1;
    isStartingRef.current = false;
    release();
    setStatus("stopped");
  }, [release]);

  // 브라우저 쪽에서 공유가 끝난 경우: ■와 같이 정리하되, 끝났다는 것을 알린다
  const onTrackEnded = useCallback(() => {
    setError(ENDED);
    stop();
  }, [stop]);

  const start = useCallback(async () => {
    if (streamRef.current || isStartingRef.current) return;
    setError(null);
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setError(UNSUPPORTED);
      return;
    }

    const requestId = ++requestIdRef.current;
    isStartingRef.current = true;
    setStatus("starting");
    try {
      const controller = createCaptureController();
      const options = { video: true, audio: false, ...(controller && { controller }) } as DisplayMediaStreamOptions;
      const stream = await navigator.mediaDevices.getDisplayMedia(options);
      // 고르는 사이 중지·로그아웃·언마운트되었으면 새 공유에 연결하지 않는다.
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      stayOnThisTab(controller, stream);
      streamRef.current = stream;
      // 브라우저의 '공유 중지' 버튼이나 공유하던 창을 닫은 경우
      stream.getVideoTracks().forEach((track) => {
        track.onended = onTrackEnded;
      });
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;
      videoRef.current = video;
      // 재생이 막혀도 공유는 된 상태다. 찍을 때 준비가 안 됐으면 captureFrame이 알려 준다
      video.play().catch((e: unknown) => console.error("[useScreenShare] 화면 재생 실패", e));
      setStatus("sharing");
    } catch (e) {
      if (!isMountedRef.current || requestId !== requestIdRef.current) return;
      setError(toShareError(e));
      setStatus("idle");
    } finally {
      if (requestId === requestIdRef.current) isStartingRef.current = false;
    }
  }, [onTrackEnded]);

  // 공유 중인 화면의 지금 장면 → data URL (POST /api/guides의 image). 공유 전이면 ImageError
  // 공유 직후라 첫 장면이 아직 없으면 잠시 기다린다. 그래도 없으면 videoFrameToDataUrl이 알려 준다
  const captureFrame = useCallback(async (): Promise<string> => {
    const video = videoRef.current;
    if (!video) {
      throw new ImageError("IMAGE_INVALID", "먼저 ▶를 눌러 도움받을 화면을 골라 주세요.");
    }
    await waitForFirstFrame(video);
    // 기다리는 사이 공유가 끝났을 수 있다
    if (videoRef.current !== video) {
      throw new ImageError("IMAGE_INVALID", ENDED.message);
    }
    return videoFrameToDataUrl(video);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      requestIdRef.current += 1;
      isStartingRef.current = false;
      release();
    };
  }, [release]);

  return { status, error, isSharing: status === "sharing", start, stop, captureFrame };
}
