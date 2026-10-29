"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useScreenShare } from "@/components/capture";
import { useGuideRequest } from "@/components/guide";
import { toUserError, type UserError } from "@/lib/errors";
import { fileToDataUrl } from "@/lib/image";

// 아이콘 모드 한 번의 도움 흐름: ▶(화면 보기) → 질문 → 답변 중 → 안내·누를 곳 → ■(멈춤)
// 설정 창을 오가도 화면 공유가 끊기지 않도록 HelperApp에서 한 번만 만든다.

// 말풍선에 띄울 짧은 안내 (서버 응답이 아닌 것)
//   needStart: ▶를 먼저 눌러야 함 / needScreen: 화면 공유가 안 돼서 사진이 필요함
export type HelperNotice = { kind: "needStart" } | { kind: "needScreen" } | { kind: "error"; error: UserError };

export function useHelperSession({ onNeedLogin }: { onNeedLogin: () => void }) {
  const share = useScreenShare();
  const guide = useGuideRequest();
  const [isOn, setIsOn] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  // 안내를 받을 때 보낸 화면. 말풍선에서 이 사진 위에 누를 곳을 표시한다
  const [shownImage, setShownImage] = useState<string | null>(null);
  const [notice, setNotice] = useState<HelperNotice | null>(null);
  const [isBubbleOpen, setBubbleOpen] = useState(true);
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  // ■를 누른 뒤 늦게 끝난 ▶ 결과는 무시한다
  const playRun = useRef(0);

  // ▶: 도움을 켜고 화면 공유를 요청한다. 공유가 안 돼도 켜진 상태로 두고 사진 올리기로 이어 간다
  const play = useCallback(async () => {
    setIsOn(true);
    setBubbleOpen(true);
    setNotice(null);
    const run = ++playRun.current;
    const ok = await share.start();
    if (!ok && run === playRun.current) setNotice({ kind: "needScreen" });
  }, [share]);

  // ■: 화면 보기를 멈추고 이번에 본 화면은 지운다
  const stop = useCallback(() => {
    playRun.current += 1;
    share.stop();
    guide.reset();
    setIsOn(false);
    setPhoto(null);
    setShownImage(null);
    setNotice(null);
    setLastQuestion(null);
  }, [share, guide]);

  const pickPhoto = useCallback(async (file: File) => {
    setBubbleOpen(true);
    try {
      setPhoto(await fileToDataUrl(file));
      setIsOn(true);
      setNotice(null);
    } catch (e) {
      setNotice({ kind: "error", error: toUserError(e) });
    }
  }, []);

  const ask = useCallback(
    async (raw: string, options?: { next?: boolean }) => {
      const question = raw.trim();
      if (!question || guide.isLoading) return;
      setBubbleOpen(true);
      if (!isOn) return setNotice({ kind: "needStart" });

      let image: string;
      try {
        if (share.isSharing) image = share.capture();
        else if (photo) image = photo;
        else return setNotice({ kind: "needScreen" });
      } catch (e) {
        return setNotice({ kind: "error", error: toUserError(e) });
      }

      // 같은 일을 이어서 물으면 바로 전 안내를 같이 보내 다음 단계를 받는다 (API_CONVENTION.md 10번)
      const prev = guide.state.status === "success" ? guide.state.data : null;
      const isSameTask = options?.next || lastQuestion === question;
      const previousInstruction = isSameTask && prev?.status === "IN_PROGRESS" ? prev.instruction : undefined;

      setLastQuestion(question);
      setNotice(null);
      setShownImage(image);
      await guide.ask({ image, question, ...(previousInstruction ? { previousInstruction } : {}) });
    },
    [guide, isOn, share, photo, lastQuestion],
  );

  // 로그인이 풀렸으면(401 AUTH_REQUIRED) 로그인 창으로 돌린다
  const needsLogin = guide.state.status === "error" && guide.state.error.needsLogin;
  useEffect(() => {
    if (needsLogin) onNeedLogin();
  }, [needsLogin, onNeedLogin]);

  return {
    isOn,
    share,
    guide,
    photo,
    shownImage,
    notice,
    isBubbleOpen,
    lastQuestion,
    hasScreen: share.isSharing || photo !== null,
    play,
    stop,
    ask,
    pickPhoto,
    retry: guide.retry,
    setBubbleOpen,
  };
}

export type HelperSession = ReturnType<typeof useHelperSession>;
