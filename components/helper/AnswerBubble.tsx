import type { GuideResponse, GuideStatus } from "@/server/guide/schema";

import { BubbleNotice } from "./BubbleNotice";
import { ScreenPreview } from "./ScreenPreview";
import { BUTTON_SECONDARY, FOCUS_RING } from "./styles";
import type { HelperNotice } from "./useHelperSession";

// 캐릭터 위 말풍선. 안내 문장·누를 곳 사진·위험 경고를 본 화면에 띄운다 (E2E는 본 화면에서 확인)
// 보여 줄 내용은 모두 props로 받는다. 안내 값 모양은 서버의 GuideResponse 그대로다.
//   data-testid: guide-text(안내 문장), click-highlight(누를 곳, ScreenPreview)
// v3 시나리오(S1~S6)가 그대로 찾는 글자다. 단계 번호(step)는 이 문구 옆에 작게 따로 보여 준다.
const STATUS_LABEL: Record<GuideStatus, string> = {
  IN_PROGRESS: "누를 곳을 찾았어요",
  DONE: "다 됐어요",
  NEED_INFO: "화면만으로는 알기 어려워요",
};

export interface AnswerBubbleProps {
  // 머리글 (예: 보고 있어요 / 답변 중)
  title: string;
  isLoading: boolean;
  guide: GuideResponse | null;
  // 물어볼 때 보낸 화면 사진(data URL). 이 위에 guide.target을 그린다
  image: string | null;
  // 같은 질문을 이어서 물을 때마다 +1 (v2 S2·S3)
  step: number;
  error: { message: string; canRetry: boolean } | null;
  notice: HelperNotice | null;
  // 아직 아무것도 묻지 않았을 때 보여 줄 말
  idleText: string;
  onNext: () => void;
  onRetry: () => void;
  onClose: () => void;
}

export function AnswerBubble({
  title,
  isLoading,
  guide,
  image,
  step,
  error,
  notice,
  idleText,
  onNext,
  onRetry,
  onClose,
}: AnswerBubbleProps) {
  const isRisk = !isLoading && guide?.risk != null;
  const showGuide = !isLoading && !error && guide !== null;
  // 누를 곳을 찾지 못하면(target 없음) '누를 곳을 찾았어요' 없이 안내 문장만 보인다 (problem.yaml design_decision 한계)
  const showStatusLabel = guide !== null && !(guide.status === "IN_PROGRESS" && guide.target === null);

  return (
    <section
      aria-label="곁길 답변"
      className={`flex w-full max-w-[420px] flex-col break-keep overflow-hidden rounded-[28px] border-2 bg-white shadow-[0_14px_34px_rgba(0,0,0,.22)] sm:max-w-[470px] ${isRisk ? "border-[#C8102E]" : "border-[#1D4E89]"}`}
    >
      <div className="flex items-center gap-[12px] border-b border-[#E6E3DC] py-[8px] pr-[12px] pl-[18px]">
        <p className="flex-1 text-[20px] font-bold text-[#1D4E89]" aria-live="polite">
          {title}
        </p>
        <button
          type="button"
          onClick={onClose}
          className={`min-h-[56px] shrink-0 rounded-[28px] border-2 border-[#C9C6BE] bg-white px-[16px] text-[20px] font-bold ${FOCUS_RING}`}
        >
          접기
        </button>
      </div>
      <div className="flex max-h-[44dvh] flex-col gap-[10px] [&>*]:shrink-0 overflow-y-auto px-[18px] pt-[12px] pb-[16px] text-[20px] sm:max-h-[56dvh]">
        {isLoading && (
          <div className="flex items-center gap-[12px]">
            <span
              aria-hidden="true"
              className="h-[30px] w-[30px] shrink-0 animate-spin rounded-full border-[5px] border-[#D5DEEA] border-t-[#1D4E89]"
            />
            <p className="text-[22px] font-bold">화면을 보고 답을 찾고 있어요</p>
          </div>
        )}

        {showGuide && (
          <>
            {guide.risk && (
              <p
                role="alert"
                className="flex items-start gap-[10px] rounded-[14px] border-2 border-[#C8102E] bg-[#FBE9E9] px-[14px] py-[12px] text-[22px] font-bold text-[#9B1C1C]"
              >
                <span aria-hidden="true">!</span>
                <span>{guide.risk.message}</span>
              </p>
            )}
            <p className="flex items-baseline gap-[8px] text-[20px] font-bold text-[#1D4E89]">
              {showStatusLabel && <span>{STATUS_LABEL[guide.status]}</span>}
              {guide.status === "IN_PROGRESS" && <span className="text-[14px] font-normal text-[#454B53]">{step}단계</span>}
            </p>
            <p data-testid="guide-text" className="text-[24px] leading-[1.45] font-bold">
              {guide.instruction}
            </p>
            {image && <ScreenPreview image={image} target={guide.target} />}
            {guide.status === "IN_PROGRESS" && (
              <button type="button" className={BUTTON_SECONDARY} onClick={onNext}>
                눌렀어요, 다음 알려 주세요
              </button>
            )}
            <p className="text-[20px] text-[#454B53]">누르는 건 직접 해 주세요.</p>
          </>
        )}

        {!isLoading && error && !notice && (
          <>
            <p role="alert" className="text-[22px] font-bold text-[#9B1C1C]">
              {error.message}
            </p>
            {error.canRetry && (
              <button type="button" className={BUTTON_SECONDARY} onClick={onRetry}>
                다시 시도
              </button>
            )}
          </>
        )}

        {!isLoading && notice && <BubbleNotice notice={notice} />}

        {!isLoading && !guide && !error && !notice && <p className="text-[22px] font-bold">{idleText}</p>}
      </div>
    </section>
  );
}
