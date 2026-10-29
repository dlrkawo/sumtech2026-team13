"use client";

import { useCallback, useEffect, useState } from "react";

import { useScreenShare } from "@/components/capture";
import { useGuideRequest } from "@/components/guide";
import { toUserError, type UserError } from "@/lib/errors";
import { fileToDataUrl } from "@/lib/image";

// 아이콘 모드 한 번의 도움 흐름: ▶(화면 보기) → 질문 → 답변 중 → 안내·누를 곳 → ■(멈춤)
// 설정 창을 오가도 화면 공유가 끊기지 않도록 HelperApp에서 한 번만 만든다.
// 화면 공유·안내 요청 같은 바깥 일은 여기서만 부르고, 화면 컴포넌트에는 값과 함수만 넘긴다.

// 말풍선에 띄울 짧은 안내 (서버 응답이 아닌 것)
//   needStart: ▶를 먼저 눌러야 함 / needScreen: 보낼 화면 사진이 없음 (reason: 화면 공유 실패 문구)
export type HelperNotice =
  | { kind: "needStart" }
  | { kind: "needScreen"; reason?: string }
  | { kind: "error"; error: UserError };

export function useHelperSession({ onNeedLogin }: { onNeedLogin: () => void }) {
  const share = useScreenShare();
  const guide = useGuideRequest();
  const [isOn, setIsOn] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  // 안내를 받을 때 보낸 화면. 말풍선에서 이 사진 위에 누를 곳을 표시한다
  const [shownImage, setShownImage] = useState<string | null>(null);
  const [notice, setNotice] = useState<HelperNotice | null>(null);
  // 처음엔 캐릭터만 보이고, 캐릭터를 눌러야 안내·조작부가 펼쳐진다
  const [isBubbleOpen, setBubbleOpen] = useState(false);
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  // 같은 질문을 이어서 물을 때마다 +1, 새 질문을 물으면 1로 되돌아간다 (v2 S2·S3)
  const [step, setStep] = useState(1);

  // ▶: 도움을 켜고 화면 공유를 요청한다. 공유가 안 돼도 켜진 상태로 두고 사진 올리기로 이어 간다
  const play = useCallback(async () => {
    setIsOn(true);
    setBubbleOpen(true);
    setNotice(null);
    await share.start();
  }, [share]);

  // ■: 화면 보기를 멈추고 이번에 본 화면은 지운다
  const stop = useCallback(() => {
    share.stop();
    guide.reset();
    setIsOn(false);
    setPhoto(null);
    setShownImage(null);
    setNotice(null);
    setLastQuestion(null);
    setStep(1);
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

  // 실제 분석 요청 한 번. image는 호출하는 쪽에서 이미 정해 온다 (공유 캡처 / 올린 사진 / 다음 화면 사진)
  const runGuide = useCallback(
    async (image: string, question: string, isContinuation: boolean) => {
      // 같은 일을 이어서 물으면 바로 전 안내를 같이 보내 다음 단계를 받는다 (API_CONVENTION.md 10번)
      const prev = guide.state.status === "success" ? guide.state.data : null;
      const isSameTask = isContinuation || lastQuestion === question;
      const previousInstruction = isSameTask && prev?.status === "IN_PROGRESS" ? prev.instruction : undefined;

      setLastQuestion(question);
      setStep(previousInstruction ? (s) => s + 1 : 1);
      setNotice(null);
      setShownImage(image);
      await guide.ask({ image, question, ...(previousInstruction ? { previousInstruction } : {}) });
    },
    [guide, lastQuestion],
  );

  const ask = useCallback(
    async (raw: string, options?: { next?: boolean }) => {
      const question = raw.trim();
      if (!question || guide.isLoading) return;
      setBubbleOpen(true);
      if (!isOn) return setNotice({ kind: "needStart" });
      // 공유 중이면 지금 장면을 찍어 보내고, 아니면 올린 사진으로 묻는다
      let image: string;
      if (share.isSharing) {
        try {
          image = share.captureFrame();
        } catch (e) {
          return setNotice({ kind: "error", error: toUserError(e) });
        }
      } else if (photo) {
        image = photo;
      } else {
        return setNotice({ kind: "needScreen", reason: share.error?.message });
      }

      await runGuide(image, question, Boolean(options?.next));
    },
    [guide.isLoading, isOn, share, photo, runGuide],
  );

  const next = useCallback(() => {
    if (lastQuestion) void ask(lastQuestion, { next: true });
  }, [ask, lastQuestion]);

  // 로그인이 풀렸으면(401 AUTH_REQUIRED) 로그인 창으로 돌린다
  const needsLogin = guide.state.status === "error" && guide.state.error.needsLogin;
  useEffect(() => {
    if (needsLogin) onNeedLogin();
  }, [needsLogin, onNeedLogin]);

  // 화면 공유가 안 됐고 올린 사진도 없으면, 말풍선에서 바로 사진 올리기를 안내한다
  const shareNotice: HelperNotice | null =
    isOn && share.error && !photo ? { kind: "needScreen", reason: share.error.message } : null;

  return {
    isOn,
    isSharing: share.isSharing,
    hasScreen: share.isSharing || photo !== null,
    hasPhoto: photo !== null,
    isAnswering: guide.isLoading,
    guide: guide.state.status === "success" ? guide.state.data : null,
    guideError: guide.state.status === "error" ? guide.state.error : null,
    shownImage,
    notice: notice ?? shareNotice,
    isBubbleOpen,
    step,
    play,
    stop,
    ask,
    next,
    pickPhoto,
    retry: guide.retry,
    setBubbleOpen,
  };
}

export type HelperSession = ReturnType<typeof useHelperSession>;
