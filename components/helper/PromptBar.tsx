import type { FormEvent } from "react";

import type { SpeechInputStatus } from "@/components/voice";

import { FOCUS_RING } from "./styles";

// 아이콘 아래 입력창: 하고 싶은 일 적기 + (음성 인식 켜짐) 마이크 + 물어보기
// 음성 인식은 바깥(HelperApp)에서 돌리고, 여기는 상태와 버튼만 보여 준다
// E2E 이름: getByLabel("질문 입력"), getByRole("button", { name: "물어보기" | "마이크" })
export interface PromptBarProps {
  question: string;
  isAnswering: boolean;
  // null이면 마이크 버튼을 숨긴다 (설정에서 음성 인식 꺼짐)
  voice: { status: SpeechInputStatus; onToggle: () => void } | null;
  onQuestionChange: (question: string) => void;
  onAsk: (question: string) => void;
}

export function PromptBar({ question, isAnswering, voice, onQuestionChange, onAsk }: PromptBarProps) {
  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (question.trim()) onAsk(question);
  }

  const canAsk = question.trim().length > 0 && !isAnswering;
  const isListening = voice?.status === "listening";

  return (
    <div className="flex flex-col gap-[6px]">
      <form
        onSubmit={onSubmit}
        className="flex w-full items-center gap-[8px] rounded-[40px] border-2 border-[#8A8F96] bg-white py-[6px] pr-[6px] pl-[22px] shadow-[0_10px_24px_rgba(0,0,0,.18)] focus-within:border-[#1D4E89]"
      >
        <label htmlFor="helper-question" className="sr-only">
          질문 입력
        </label>
        <input
          id="helper-question"
          type="text"
          value={question}
          onChange={(e) => onQuestionChange(e.target.value)}
          placeholder="하고 싶은 일을 적어 주세요"
          maxLength={200}
          className="min-h-[56px] min-w-0 flex-1 bg-transparent text-[21px] text-[#16191D] outline-none placeholder:text-[#6B7178]"
        />
        {voice && (
          <button
            type="button"
            aria-label="마이크"
            aria-pressed={isListening}
            onClick={voice.onToggle}
            className={`flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-full border-2 ${isListening ? "border-[#C8102E] bg-[#FBE9EB] text-[#9B1C1C]" : "border-[#C9C6BE] bg-white text-[#16191D]"} ${FOCUS_RING}`}
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
      {voice && voice.status !== "idle" && (
        <p role="status" className="rounded-[14px] bg-white/95 px-[14px] py-[6px] text-[20px] font-bold text-[#16191D]">
          {voice.status === "listening" && "듣고 있어요. 하고 싶은 일을 말해 주세요."}
          {voice.status === "unsupported" && "이 브라우저에서는 음성 인식이 안 돼요. 글로 적어 주세요."}
          {voice.status === "failed" && "잘 듣지 못했어요. 마이크를 다시 누르거나 글로 적어 주세요."}
        </p>
      )}
    </div>
  );
}
