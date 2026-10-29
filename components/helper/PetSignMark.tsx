import type { PetSign } from "./PetChar";

const DARK = "#31150E";

// 캐릭터 오른쪽 위 표시: 깃발(기본) · O(다 됐어요) · X(안 됐어요) · ?(알기 어려워요)
export function PetSignMark({ sign }: { sign: PetSign }) {
  if (sign === "flag") {
    return (
      <>
        <rect x={950} y={70} width={24} height={270} fill="#5A4630" />
        <path d="M974 70 h170 l-50 60 l50 60 h-170 z" fill="#C8102E" stroke={DARK} strokeWidth={14} />
      </>
    );
  }
  if (sign === "o") {
    return (
      <>
        <circle cx={1060} cy={200} r={120} fill="#E8F3EC" stroke="#1C6B3A" strokeWidth={26} />
        <circle cx={1060} cy={200} r={55} fill="none" stroke="#1C6B3A" strokeWidth={34} />
      </>
    );
  }
  if (sign === "x") {
    return (
      <>
        <circle cx={1060} cy={200} r={120} fill="#FFF1E0" stroke="#9B3D00" strokeWidth={26} />
        <path d="M1005 145 l110 110 M1115 145 l-110 110" stroke="#9B3D00" strokeWidth={38} />
      </>
    );
  }
  if (sign === "q") {
    return (
      <>
        <circle cx={1060} cy={200} r={120} fill="#FFF6DF" stroke="#7A4E00" strokeWidth={26} />
        <path
          d="M1015 165 q0 -55 50 -55 q50 0 50 45 q0 30 -35 45 q-15 8 -15 30 v12"
          stroke="#7A4E00"
          strokeWidth={34}
          fill="none"
        />
        <rect x={1048} y={272} width={34} height={30} fill="#7A4E00" />
      </>
    );
  }
  return null;
}
