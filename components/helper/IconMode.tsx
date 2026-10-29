import type { GuideResponse } from "@/server/guide/schema";

import { AnswerBubble, type AnswerBubbleProps } from "./AnswerBubble";
import { ControlPill } from "./ControlPill";
import { EdgeFrame } from "./EdgeFrame";
import { PetChar, type PetMood, type PetSign } from "./PetChar";
import { PromptBar, type PromptBarProps } from "./PromptBar";
import type { HelperStatus } from "./StatusIcon";
import { FOCUS_RING } from "./styles";
import type { HelperNotice } from "./useHelperSession";

// 아이콘 모드 (v6): 말풍선 · ▶■상태 막대 + 캐릭터 · 입력창 + 사진 올리기 + 설정을 Landing(왼쪽 소개 영역) 오른쪽에 세로로 쌓는다.
// 미니 브라우저 창 기준: 좁을 때는 Landing 아래로 이어지는 세로형, sm부터는 오른쪽 안내·조작 영역(가로형, Landing과 같은 300px 기준)
// 보여 줄 값과 버튼 동작은 모두 props로 받는다. 화면 공유·안내 요청·음성 인식은 바깥(HelperApp)에서 한다.
// '설정' 버튼은 항상 보인다 (scenarios.yaml 화면 흐름)
export interface IconModeProps {
  isOn: boolean;
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
    error: props.error,
    notice: props.notice,
    idleText: idleText(props),
    onNext: props.onNext,
    onRetry: props.onRetry,
    onClose: () => props.onToggleBubble(false),
    hasPhoto: props.hasPhoto,
    onPickPhoto: props.onPickPhoto,
  };

  return (
    <>
      {props.showEdge && <EdgeFrame />}
      {/* 왼쪽 소개 영역(Landing)과 짝을 이루는 오른쪽 안내·조작 영역.
          처음엔 캐릭터(+설정)만 보이고, 캐릭터를 누르면 안내·시작/멈추기·입력창이 그 아래로 펼쳐진다.
          좁을 때는 Landing 아래로 이어지는 한 화면(세로형), sm부터는 Landing 폭(300px)만큼 오른쪽에 고정(가로형) */}
      <div
        className="z-30 flex w-full flex-col items-center gap-[14px] overflow-y-auto px-[16px] pt-[6px] pb-[20px]
          sm:fixed sm:inset-y-0 sm:left-[300px] sm:right-0 sm:w-auto sm:items-center sm:justify-center sm:gap-[18px] sm:px-[28px] sm:py-[24px]"
      >
        <div className="flex flex-wrap items-center justify-center gap-[14px]">
          <div className="relative shrink-0">
            <button
              type="button"
              aria-label={props.isBubbleOpen ? "곁길 도우미 닫기" : "곁길 도우미 열기"}
              aria-expanded={props.isBubbleOpen}
              onClick={() => props.onToggleBubble(!props.isBubbleOpen)}
              className={`rounded-[24px] drop-shadow-[0_8px_12px_rgba(0,0,0,.22)] ${FOCUS_RING}`}
            >
              <PetChar mood={mood} sign={sign} size={88} />
            </button>
            {/* '설정' 버튼은 항상 보인다 (scenarios.yaml 화면 흐름). 캐릭터와 같은 무게로 나란히 두지 않고
                캐릭터 모서리에 붙는 작은 배지로 둬서 평소엔 눈에 덜 띄게 한다 (밝기 아이콘처럼 안 보이게 톱니바퀴 모양 사용) */}
            <button
              type="button"
              aria-label="설정"
              onClick={props.onOpenSettings}
              className={`absolute -right-[4px] -bottom-[4px] flex h-[32px] w-[32px] items-center justify-center rounded-full border-2 border-[#C9C6BE] bg-white text-[#16191D] shadow-[0_4px_10px_rgba(0,0,0,.18)] hover:bg-[#F0EFEB] ${FOCUS_RING}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
              </svg>
            </button>
          </div>
          {props.isBubbleOpen && (
            <ControlPill status={status} isOn={props.isOn} onPlay={props.onStart} onStop={props.onStop} />
          )}
        </div>
        {props.isBubbleOpen && (
          <>
            <AnswerBubble {...bubble} />
            <div className="w-full max-w-[420px] sm:max-w-none">
              <PromptBar
                question={props.question}
                isAnswering={props.isAnswering}
                voice={props.voice}
                onQuestionChange={props.onQuestionChange}
                onAsk={props.onAsk}
              />
            </div>
          </>
        )}
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
