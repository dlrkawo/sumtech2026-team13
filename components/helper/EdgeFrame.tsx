// 화면을 보고 있을 때 창 가장자리를 파랗게 두른다 (S5 '화면 가장자리 표시', 설정에서 끌 수 있음)
export function EdgeFrame() {
  return (
    <div
      aria-hidden="true"
      data-testid="edge-frame"
      className="pointer-events-none fixed inset-0 z-30 border-[6px] border-[#1D4E89] shadow-[inset_0_0_0_3px_rgba(255,255,255,.7)]"
    />
  );
}
