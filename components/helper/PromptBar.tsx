"use client";

import { useCallback, useState, type FormEvent } from "react";

import { useSpeechInput } from "@/components/voice";

import { FOCUS_RING } from "./styles";

// 아이콘 아래 입력창: 하고 싶은 일 적기 + (음성 인식 켜짐) 마이크 + 물어보기
// E2E 이름: getByLabel("질문 입력"), getByRole("button", { name: "물어보기" | "마이크" })
export function PromptBar({
  voiceEnabled,
  isAnswering,
  onAsk,
}: {
  voiceEnabled: boolean;
  isAnswering: boolean;
  onAsk: (question: string) => void;
}) {
  const [question, setQuestion] = useState("");

  // 말로 들은 문장은 입력창에 적고 바로 물어본다 (S8)
  const onHeard = useCallback(
    (text: string) => {
      setQuestion(text);
      onAsk(text);
    },
    [onAsk],
  );
  const voice = useSpeechInput(onHeard);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (question.trim()) onAsk(question);
  }

  const canAsk = question.trim().length > 0 && !isAnswering;

  return (
    <div className="flex flex-col gap-[6px]">
      <form
        onSubmit={onSubmit}
        className="flex w-[560px] max-w-[calc(100vw-32px)] items-center gap-[8px] rounded-[40px] border-2 border-[#8A8F96] bg-white py-[6px] pr-[6px] pl-[22px] shadow-[0_10px_24px_rgba(0,0,0,.18)] focus-within:border-[#1D4E89]"
      >
        <label htmlFor="helper-question" className="sr-only">
          질문 입력
        </label>
        <input
          id="helper-question"
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="하고 싶은 일을 적어 주세요"
          maxLength={200}
          className="min-h-[56px] min-w-0 flex-1 bg-transparent text-[21px] text-[#16191D] outline-none placeholder:text-[#6B7178]"
        />
        {voiceEnabled && (
          <button
            type="button"
            aria-label="마이크"
            aria-pressed={voice.isListening}
            onClick={voice.isListening ? voice.cancel : voice.listen}
            className={`flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-full border-2 ${voice.isListening ? "border-[#C8102E] bg-[#FBE9EB] text-[#9B1C1C]" : "border-[#C9C6BE] bg-white text-[#16191D]"} ${FOCUS_RING}`}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              aria-hidden="true"
            >
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
            </svg>
          </button>
        )}
        <button
          type="submit"
          disabled={!canAsk}
          className={`min-h-[56px] shrink-0 rounded-[30px] px-[20px] text-[20px] font-bold text-white ${canAsk ? "bg-[#1D4E89] hover:bg-[#163E6E]" : "cursor-not-allowed bg-[#8A8F96]"} ${FOCUS_RING}`}
        >
          물어보기
        </button>
      </form>
      {voiceEnabled && voice.status !== "idle" && (
        <p role="status" className="rounded-[14px] bg-white/95 px-[14px] py-[6px] text-[20px] font-bold text-[#16191D]">
          {voice.status === "listening" && "듣고 있어요. 하고 싶은 일을 말해 주세요."}
          {voice.status === "unsupported" && "이 브라우저에서는 음성 인식이 안 돼요. 글로 적어 주세요."}
          {voice.status === "failed" && "잘 듣지 못했어요. 마이크를 다시 누르거나 글로 적어 주세요."}
        </p>
      )}
    </div>
  );
}
