// 눌러보슈 표시 (갈림길 선 + 빨간 점)
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
      <path d="M6 26 C 10 18, 14 14, 26 6" stroke="#1D4E89" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <circle cx="26" cy="6" r="4" fill="#C8102E" />
    </svg>
  );
}
