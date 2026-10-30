"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// 말로 질문하기 (브라우저 마이크는 수동 확인). 브라우저의 SpeechRecognition(ko-KR)을 쓴다.
// 지원하지 않는 브라우저(파이어폭스 등)·마이크 거부일 때는 멈추지 않고 글로 적게 안내한다 (FE_CONVENTION.md 10번)

// TS 기본 타입에 없는 브라우저도 있어 필요한 부분만 적는다
interface RecognitionResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
}
interface Recognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: RecognitionResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
}
type RecognitionCtor = new () => Recognition;

export type SpeechInputStatus = "idle" | "listening" | "unsupported" | "failed";

function getCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

//   const voice = useSpeechInput((text) => ask(text));
//   <button onClick={voice.listen}>마이크</button>
export function useSpeechInput(onText: (text: string) => void) {
  const [status, setStatus] = useState<SpeechInputStatus>("idle");
  const recRef = useRef<Recognition | null>(null);
  const onTextRef = useRef(onText);

  useEffect(() => {
    onTextRef.current = onText;
  }, [onText]);

  const listen = useCallback(() => {
    if (recRef.current) return;
    const Ctor = getCtor();
    if (!Ctor) {
      setStatus("unsupported");
      return;
    }
    const rec = new Ctor();
    rec.lang = "ko-KR";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    let heard = false;
    rec.onresult = (e) => {
      if (recRef.current !== rec) return;
      const text = Array.from(e.results)
        .map((r) => r[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (!text) return;
      heard = true;
      onTextRef.current(text);
    };
    rec.onerror = () => {
      if (recRef.current === rec) setStatus("failed");
    };
    rec.onend = () => {
      if (recRef.current !== rec) return;
      recRef.current = null;
      setStatus((prev) => (prev === "listening" ? (heard ? "idle" : "failed") : prev));
    };
    recRef.current = rec;
    setStatus("listening");
    try {
      rec.start();
    } catch {
      recRef.current = null;
      setStatus("failed");
    }
  }, []);

  // abort()가 동기 이벤트를 발생시키거나 이미 큐에 든 콜백이 늦게 실행돼도 무시한다.
  const release = useCallback(() => {
    const rec = recRef.current;
    recRef.current = null;
    if (!rec) return;
    rec.onresult = null;
    rec.onerror = null;
    rec.onend = null;
    rec.abort();
  }, []);

  const cancel = useCallback(() => {
    release();
    setStatus("idle");
  }, [release]);

  useEffect(() => release, [release]);

  return { status, isListening: status === "listening", listen, cancel };
}
