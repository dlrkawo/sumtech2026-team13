import type { GuideStatus } from "@/server/guide/schema";

import { BubbleNotice } from "./BubbleNotice";
import { ScreenPreview } from "./ScreenPreview";
import { BUTTON_SECONDARY, FOCUS_RING } from "./styles";
import type { HelperSession } from "./useHelperSession";

// 캐릭터 위 말풍선. 안내 문장·누를 곳 사진·위험 경고를 본 화면에 띄운다 (E2E는 본 화면에서 확인)
//   data-testid: guide-text(안내 문장), click-highlight(누를 곳, ScreenPreview)
const STATUS_LABEL: Record<GuideStatus, string> = {
  IN_PROGRESS: "누를 곳을 찾았어요",
  DONE: "다 됐어요",
  NEED_INFO: "화면만으로는 알기 어려워요",
};

export function AnswerBubble({ session }: { session: HelperSession }) {
  const { guide, notice, isOn, hasScreen, share, shownImage } = session;
  const state = guide.state;
  const isRisk = state.status === "success" && state.data.risk !== null;

  return (
    <section
      aria-label="곁길 답변"
      className={`flex w-[470px] max-w-[calc(100vw-32px)] flex-col break-keep overflow-hidden rounded-[28px] border-2 bg-white shadow-[0_14px_34px_rgba(0,0,0,.22)] ${isRisk ? "border-[#C8102E]" : "border-[#1D4E89]"}`}
    >
      <div className="flex items-center gap-[12px] border-b border-[#E6E3DC] py-[10px] pr-[16px] pl-[18px]">
        <p className="flex-1 text-[20px] font-bold text-[#1D4E89]" aria-live="polite">
          {chipText(session)}
        </p>
        <button
          type="button"
          onClick={() => session.setBubbleOpen(false)}
          className={`min-h-[44px] shrink-0 rounded-[22px] border-2 border-[#C9C6BE] bg-white px-[12px] text-[20px] font-bold ${FOCUS_RING}`}
        >
          접기
        </button>
      </div>
      <div className="flex max-h-[calc(100vh-340px)] flex-col gap-[10px] [&>*]:shrink-0 overflow-y-auto px-[18px] pt-[12px] pb-[16px] text-[20px]">
        {state.status === "loading" && (
          <div className="flex items-center gap-[12px]">
            <span
              aria-hidden="true"
              className="h-[30px] w-[30px] shrink-0 animate-spin rounded-full border-[5px] border-[#D5DEEA] border-t-[#1D4E89]"
            />
            <p className="text-[22px] font-bold">화면을 보고 답을 찾고 있어요</p>
          </div>
        )}

        {state.status === "success" && (
          <>
            {state.data.risk && (
              <p
                role="alert"
                className="flex items-start gap-[10px] rounded-[14px] border-2 border-[#C8102E] bg-[#FBE9E9] px-[14px] py-[12px] text-[22px] font-bold text-[#9B1C1C]"
              >
                <span aria-hidden="true">!</span>
                <span>{state.data.risk.message}</span>
              </p>
            )}
            <p className="text-[20px] font-bold text-[#1D4E89]">{STATUS_LABEL[state.data.status]}</p>
            <p data-testid="guide-text" className="text-[24px] leading-[1.45] font-bold">
              {state.data.instruction}
            </p>
            {shownImage && <ScreenPreview image={shownImage} target={state.data.target} />}
            {state.data.status === "IN_PROGRESS" && (
              <button
                type="button"
                className={BUTTON_SECONDARY}
                onClick={() => session.ask(state.request.question, { next: true })}
              >
                눌렀어요, 다음 알려 주세요
              </button>
            )}
            <p className="text-[20px] text-[#454B53]">누르는 건 직접 해 주세요.</p>
          </>
        )}

        {state.status === "error" && !notice && (
          <>
            <p role="alert" className="text-[22px] font-bold text-[#9B1C1C]">
              {state.error.message}
            </p>
            {state.error.canRetry && (
              <button type="button" className={BUTTON_SECONDARY} onClick={() => void session.retry()}>
                다시 시도
              </button>
            )}
          </>
        )}

        {state.status !== "loading" && notice && (
          <BubbleNotice notice={notice} shareDenied={share.status === "unsupported" ? "unsupported" : "denied"} />
        )}

        {state.status === "idle" && !notice && (
          <p className="text-[22px] font-bold">
            {!isOn
              ? "▶를 누르면 화면 보기를 시작해요."
              : hasScreen
                ? "하고 싶은 일을 아래 칸에 적고 ‘물어보기’를 눌러 주세요."
                : "브라우저 창에서 보여 줄 화면을 골라 주세요."}
          </p>
        )}
      </div>
    </section>
  );
}

function chipText(session: HelperSession): string {
  if (session.guide.isLoading) return "답변 중";
  if (!session.isOn) return "곁길";
  return session.hasScreen ? "보고 있어요" : "화면 대기";
}
