import { StatusIcon, type HelperStatus } from "./StatusIcon";
import { FOCUS_RING } from "./styles";

// 아이콘 모드의 알약 모양 막대: ▶ 시작 · ■ 멈추기 · 상태 칸
// 버튼의 접근성 이름은 '▶' '■' 그대로 둔다 (E2E: getByRole("button", { name: "▶" }))
// 상태 글자는 docs/scenarios.yaml과 같다: '멈춤' / '보고 있어요' / '답변 중'

const PILL_BUTTON =
  "flex min-h-[56px] w-[68px] flex-col items-center justify-center gap-[1px] rounded-[28px] text-[14px] font-bold hover:bg-[#F0EFEB] disabled:cursor-not-allowed disabled:bg-transparent disabled:text-[#A3A8AE] " +
  FOCUS_RING;

const STATUS_TEXT: Record<HelperStatus, string> = {
  stopped: "멈춤",
  waiting: "화면 대기",
  watching: "보고 있어요",
  answering: "답변 중",
};

const STATUS_COLOR: Record<HelperStatus, string> = {
  stopped: "text-[#5A6068]",
  waiting: "text-[#7A4E00]",
  watching: "text-[#1C6B3A]",
  answering: "text-[#1D4E89] bg-[#E7EEF7]",
};

export function ControlPill({
  status,
  isOn,
  onPlay,
  onStop,
}: {
  status: HelperStatus;
  isOn: boolean;
  onPlay: () => void;
  onStop: () => void;
}) {
  return (
    <div
      role="toolbar"
      aria-label="곁길 아이콘 모드"
      className="flex items-center gap-[2px] rounded-[34px] border-2 border-[#C9C6BE] bg-white p-[4px] shadow-[0_10px_24px_rgba(0,0,0,.18)]"
    >
      <button
        type="button"
        aria-label="▶"
        disabled={isOn}
        onClick={onPlay}
        className={`${PILL_BUTTON} ${isOn ? "" : "text-[#1D4E89]"}`}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 4.5v15l12.5-7.5z" fill="currentColor" />
        </svg>
        <span aria-hidden="true">시작</span>
      </button>
      <span aria-hidden="true" className="h-[32px] w-[2px] bg-[#E6E3DC]" />
      <button
        type="button"
        aria-label="■"
        disabled={!isOn}
        onClick={onStop}
        className={`${PILL_BUTTON} ${isOn ? "text-[#9B1C1C]" : ""}`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor" />
        </svg>
        <span aria-hidden="true">멈추기</span>
      </button>
      <span aria-hidden="true" className="h-[32px] w-[2px] bg-[#E6E3DC]" />
      <div
        role="status"
        className={`flex min-h-[56px] w-[80px] flex-col items-center justify-center gap-[1px] rounded-[28px] text-[14px] font-bold ${STATUS_COLOR[status]}`}
      >
        <StatusIcon status={status} />
        <span>{STATUS_TEXT[status]}</span>
      </div>
    </div>
  );
}
