import type { ScreenShareError, ScreenShareStatus } from "@/components/capture";

// 아이콘 모드 (S2, S3, S5). 겉모양은 목업이 나오면 바꾸고, 동작은 props로만 받는다
// 아이콘 버튼은 aria-label을 e2e/scenarios의 이름(▶ ■ 설정)과 같게 둔다
interface IconModeProps {
  shareStatus: ScreenShareStatus;
  shareError: ScreenShareError | null;
  onStart: () => void;
  onStop: () => void;
  onOpenSettings: () => void;
}

const STATUS_TEXT: Record<ScreenShareStatus, string> = {
  idle: "▶를 누르고 도움받을 화면을 골라 주세요.",
  starting: "보여 줄 화면을 골라 주세요.",
  sharing: "화면을 보고 있어요.",
  stopped: "멈춤",
};

export function IconMode({ shareStatus, shareError, onStart, onStop, onOpenSettings }: IconModeProps) {
  return (
    <section aria-label="도움 아이콘" className="flex flex-col items-center gap-3">
      {shareStatus === "sharing" ? (
        <button type="button" aria-label="■" onClick={onStop} className="h-20 w-20 rounded-full bg-red-700 text-3xl text-white">
          ■
        </button>
      ) : (
        <button
          type="button"
          aria-label="▶"
          onClick={onStart}
          disabled={shareStatus === "starting"}
          className="h-20 w-20 rounded-full bg-blue-700 text-3xl text-white disabled:opacity-50"
        >
          ▶
        </button>
      )}
      <p role="status" className="text-center">
        {STATUS_TEXT[shareStatus]}
      </p>
      {shareError && (
        <p role="alert" className="text-center font-bold text-red-700">
          {shareError.message}
        </p>
      )}
      <button type="button" onClick={onOpenSettings} className="h-14 rounded-lg border-2 border-neutral-400 px-6 font-bold">
        설정
      </button>
    </section>
  );
}
