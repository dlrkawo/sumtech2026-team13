// 아이콘 모드 자리표시 (S2, S5). 아이콘 모드 본 화면은 담당을 나눈 뒤 이 자리에 만든다
// 아이콘 버튼은 aria-label을 e2e/scenarios의 이름(▶ ■ 설정)과 같게 둔다
interface IconModeProps {
  onOpenSettings: () => void;
}

export function IconMode({ onOpenSettings }: IconModeProps) {
  return (
    <section aria-label="도움 아이콘" className="flex flex-col items-center gap-3">
      {/* 화면 보기 시작은 components/capture/useScreenShare를 만들 때 연결한다 */}
      <button
        type="button"
        aria-label="▶"
        disabled
        className="h-20 w-20 rounded-full bg-blue-700 text-3xl text-white disabled:opacity-50"
      >
        ▶
      </button>
      <button type="button" onClick={onOpenSettings} className="h-14 rounded-lg border-2 border-neutral-400 px-6 font-bold">
        설정
      </button>
    </section>
  );
}
