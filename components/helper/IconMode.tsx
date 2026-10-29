import type { GuideResponse } from "@/server/guide/schema";

import { AnswerBubble, type AnswerBubbleProps } from "./AnswerBubble";
import { ControlPill } from "./ControlPill";
import { EdgeFrame } from "./EdgeFrame";
import { PetChar, type PetMood, type PetSign } from "./PetChar";
import { PhotoUpload } from "./PhotoUpload";
import { PromptBar, type PromptBarProps } from "./PromptBar";
import type { HelperStatus } from "./StatusIcon";
import { FOCUS_RING } from "./styles";
import type { HelperNotice } from "./useHelperSession";

// 아이콘 모드 (v6): 오른쪽 아래에 말풍선 · ▶■상태 막대 + 캐릭터 · 입력창 + 사진 올리기 + 설정
// 보여 줄 값과 버튼 동작은 모두 props로 받는다. 화면 공유·안내 요청·음성 인식은 바깥(HelperApp)에서 한다.
// '설정' 버튼은 항상 보인다 (scenarios.yaml 화면 흐름)
export interface IconModeProps {
  isOn: boolean;
  isSharing: boolean;
  // 공유 중인 화면이나 올린 사진이 있음
  hasScreen: boolean;
  hasPhoto: boolean;
  isAnswering: boolean;
  guide: GuideResponse | null;
  guideImage: string | null;
  // 같은 질문을 이어서 물을 때마다 +1 (v2 S2·S3)
  step: number;
  error: { message: string; canRetry: boolean } | null;
  notice: HelperNotice | null;
  showEdge: boolean;
  isBubbleOpen: boolean;
  question: string;
  voice: PromptBarProps["voice"];
  onStart: () => void;
  onStop: () => void;
  onAsk: (question: string) => void;
  onNext: () => void;
  onPickNextScreen: (file: File) => void;
  onRetry: () => void;
  onQuestionChange: (question: string) => void;
  onPickPhoto: (file: File) => void;
  onToggleBubble: (open: boolean) => void;
  onOpenSettings: () => void;
}

export function IconMode(props: IconModeProps) {
  const status = helperStatus(props);
  const [mood, sign] = petLook(props, status);

  const bubble: AnswerBubbleProps = {
    title: bubbleTitle(status),
    isLoading: props.isAnswering,
    guide: props.guide,
    image: props.guideImage,
    step: props.step,
    isSharing: props.isSharing,
    error: props.error,
    notice: props.notice,
    idleText: idleText(props),
    onNext: props.onNext,
    onPickNextScreen: props.onPickNextScreen,
    onRetry: props.onRetry,
    onClose: () => props.onToggleBubble(false),
  };

  return (
    <>
      {props.showEdge && <EdgeFrame />}
      <div className="fixed right-[16px] bottom-[16px] z-30 flex max-w-[calc(100vw-32px)] flex-col items-end gap-[10px]">
        {props.isBubbleOpen && <AnswerBubble {...bubble} />}
        <div className="flex items-end gap-[6px]">
          <ControlPill status={status} isOn={props.isOn} onPlay={props.onStart} onStop={props.onStop} />
          <button
            type="button"
            aria-label={props.isBubbleOpen ? "곁길 도우미, 답변 접기" : "곁길 도우미, 답변 펼치기"}
            aria-expanded={props.isBubbleOpen}
            onClick={() => props.onToggleBubble(!props.isBubbleOpen)}
            className={`rounded-[24px] drop-shadow-[0_8px_12px_rgba(0,0,0,.22)] ${FOCUS_RING}`}
          >
            <PetChar mood={mood} sign={sign} size={124} />
          </button>
        </div>
        <div className="flex flex-wrap items-start justify-end gap-[10px]">
          <PromptBar
            question={props.question}
            isAnswering={props.isAnswering}
            voice={props.voice}
            onQuestionChange={props.onQuestionChange}
            onAsk={props.onAsk}
          />
          <PhotoUpload hasPhoto={props.hasPhoto} onPick={props.onPickPhoto} />
          <button
            type="button"
            onClick={props.onOpenSettings}
            className={`flex min-h-[56px] items-center gap-[8px] rounded-[30px] border-2 border-[#C9C6BE] bg-white px-[18px] text-[20px] font-bold text-[#16191D] shadow-[0_8px_18px_rgba(0,0,0,.14)] hover:bg-[#F0EFEB] ${FOCUS_RING}`}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="3.2" />
              <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
            </svg>
            설정
          </button>
        </div>
      </div>
    </>
  );
}

function helperStatus(p: IconModeProps): HelperStatus {
  if (p.isAnswering) return "answering";
  if (!p.isOn) return "stopped";
  return p.hasScreen ? "watching" : "waiting";
}

function bubbleTitle(status: HelperStatus): string {
  if (status === "answering") return "답변 중";
  if (status === "stopped") return "곁길";
  return status === "watching" ? "보고 있어요" : "화면 대기";
}

function idleText(p: IconModeProps): string {
  if (!p.isOn) return "▶를 누르면 화면 보기를 시작해요.";
  if (p.hasScreen) return "하고 싶은 일을 아래 칸에 적고 ‘물어보기’를 눌러 주세요.";
  return "브라우저 창에서 보여 줄 화면을 골라 주세요.";
}

// 캐릭터 표정: 보고 있음(돋보기) · 생각 중 · 다 됐어요(O) · 위험(!) · 알기 어려움(?) · 안 됨(X)
function petLook(p: IconModeProps, status: HelperStatus): [PetMood, PetSign] {
  if (status === "answering") return ["think", "none"];
  if (p.error || p.notice?.kind === "error") return ["sorry", "x"];
  if (p.guide) {
    if (p.guide.risk) return ["alert", "none"];
    if (p.guide.status === "DONE") return ["happy", "o"];
    if (p.guide.status === "NEED_INFO") return ["sorry", "q"];
    return ["look", "none"];
  }
  if (status === "watching") return ["look", "none"];
  if (status === "waiting") return ["calm", "q"];
  return ["calm", "flag"];
}
