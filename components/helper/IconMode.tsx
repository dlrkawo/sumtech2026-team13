"use client";

import { AnswerBubble } from "./AnswerBubble";
import { ControlPill } from "./ControlPill";
import { EdgeFrame } from "./EdgeFrame";
import { PetChar, type PetMood, type PetSign } from "./PetChar";
import { PhotoUpload } from "./PhotoUpload";
import { PromptBar } from "./PromptBar";
import type { HelperStatus } from "./StatusIcon";
import { FOCUS_RING } from "./styles";
import type { HelperSession } from "./useHelperSession";

// 아이콘 모드 (v6): 오른쪽 아래에 말풍선 · ▶■상태 막대 + 캐릭터 · 입력창 + 사진 올리기 + 설정
// '설정' 버튼은 항상 보인다 (scenarios.yaml 화면 흐름)
export function IconMode({
  session,
  voiceEnabled,
  edgeEnabled,
  onOpenSettings,
}: {
  session: HelperSession;
  voiceEnabled: boolean;
  edgeEnabled: boolean;
  onOpenSettings: () => void;
}) {
  const status = helperStatus(session);
  const [mood, sign] = petLook(session, status);

  return (
    <>
      {edgeEnabled && session.share.isSharing && <EdgeFrame />}
      <div className="fixed right-[16px] bottom-[16px] z-30 flex max-w-[calc(100vw-32px)] flex-col items-end gap-[10px]">
        {session.isBubbleOpen && <AnswerBubble session={session} />}
        <div className="flex items-end gap-[6px]">
          <ControlPill status={status} isOn={session.isOn} onPlay={() => void session.play()} onStop={session.stop} />
          <button
            type="button"
            aria-label={session.isBubbleOpen ? "곁길 도우미, 답변 접기" : "곁길 도우미, 답변 펼치기"}
            aria-expanded={session.isBubbleOpen}
            onClick={() => session.setBubbleOpen(!session.isBubbleOpen)}
            className={`rounded-[24px] drop-shadow-[0_8px_12px_rgba(0,0,0,.22)] ${FOCUS_RING}`}
          >
            <PetChar mood={mood} sign={sign} size={124} />
          </button>
        </div>
        <div className="flex flex-wrap items-start justify-end gap-[10px]">
          <PromptBar
            voiceEnabled={voiceEnabled}
            isAnswering={session.guide.isLoading}
            onAsk={(q) => void session.ask(q)}
          />
          <PhotoUpload hasPhoto={session.photo !== null} onPick={(file) => void session.pickPhoto(file)} />
          <button
            type="button"
            onClick={onOpenSettings}
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

function helperStatus(session: HelperSession): HelperStatus {
  if (session.guide.isLoading) return "answering";
  if (!session.isOn) return "stopped";
  return session.hasScreen ? "watching" : "waiting";
}

// 캐릭터 표정: 보고 있음(돋보기) · 생각 중 · 다 됐어요(O) · 위험(!) · 알기 어려움(?) · 안 됨(X)
function petLook(session: HelperSession, status: HelperStatus): [PetMood, PetSign] {
  const state = session.guide.state;
  if (status === "answering") return ["think", "none"];
  if (state.status === "error" || session.notice?.kind === "error") return ["sorry", "x"];
  if (state.status === "success") {
    if (state.data.risk) return ["alert", "none"];
    if (state.data.status === "DONE") return ["happy", "o"];
    if (state.data.status === "NEED_INFO") return ["sorry", "q"];
    return ["look", "none"];
  }
  if (status === "watching") return ["look", "none"];
  if (status === "waiting") return ["calm", "q"];
  return ["calm", "flag"];
}
