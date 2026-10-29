import Image from "next/image";

import { PetSignMark } from "./PetSignMark";

// 눌러보슈 도우미 캐릭터 (v6 디자인). 바탕 그림 위에 표정·표시를 SVG로 덧그린다.
// 색만으로 뜻을 전하지 않도록 상태 글자는 옆 상태 칸과 말풍선이 따로 보여 준다.
export type PetMood = "calm" | "look" | "think" | "happy" | "sorry" | "alert";
export type PetSign = "flag" | "o" | "x" | "q" | "none";

const SKIN = "#FCDFBC";
const DARK = "#31150E";
const RED = "#FD615A";
const LIP = "#8E1C1C";
const CHEEK = "#FD9597";

type Px = [x: number, y: number, w: number, h: number, fill: string];

function face(eyes: Px[], mouth: Px[]): Px[] {
  return [[425, 535, 405, 210, SKIN], [392, 655, 78, 52, CHEEK], [784, 655, 78, 52, CHEEK], ...eyes, ...mouth];
}

const EYES: Px[] = [
  [431, 548, 78, 78, DARK],
  [745, 548, 78, 78, DARK],
];

const FACES: Record<PetMood, Px[]> = {
  calm: [],
  look: face(EYES, [[607, 670, 39, 39, LIP]]),
  think: face(
    [
      [431, 580, 78, 30, DARK],
      [745, 580, 78, 30, DARK],
    ],
    [[588, 690, 78, 22, LIP]],
  ),
  alert: face(EYES, [
    [598, 662, 58, 58, LIP],
    [612, 676, 30, 30, RED],
  ]),
  happy: face(
    [
      [412, 587, 39, 39, DARK],
      [451, 548, 39, 39, DARK],
      [490, 587, 39, 39, DARK],
      [726, 587, 39, 39, DARK],
      [765, 548, 39, 39, DARK],
      [804, 587, 39, 39, DARK],
    ],
    [
      [549, 630, 156, 30, LIP],
      [569, 660, 116, 20, LIP],
      [588, 680, 78, 50, RED],
    ],
  ),
  sorry: face(
    [
      [451, 587, 39, 39, DARK],
      [765, 587, 39, 39, DARK],
      [431, 540, 39, 20, DARK],
      [470, 520, 39, 20, DARK],
      [745, 520, 39, 20, DARK],
      [784, 540, 39, 20, DARK],
    ],
    [
      [568, 705, 39, 20, LIP],
      [607, 685, 39, 20, LIP],
      [646, 685, 39, 20, LIP],
      [685, 705, 39, 20, LIP],
    ],
  ),
};

export function PetChar({ mood, sign, size = 124 }: { mood: PetMood; sign: PetSign; size?: number }) {
  return (
    <span className="relative block shrink-0" style={{ width: size, height: size }} aria-hidden="true">
      <Image
        src="/pet/pet.png"
        alt=""
        width={size}
        height={size}
        className="absolute inset-0 [image-rendering:pixelated]"
      />
      <svg viewBox="0 0 1254 1254" className="absolute inset-0 h-full w-full overflow-visible">
        {FACES[mood].map(([x, y, w, h, fill]) => (
          <rect key={`${x}-${y}-${w}`} x={x} y={y} width={w} height={h} fill={fill} />
        ))}
        {mood === "look" && (
          <>
            <circle cx={990} cy={900} r={78} fill="rgba(255,255,255,.45)" stroke={DARK} strokeWidth={26} />
            <line x1={1045} y1={958} x2={1140} y2={1060} stroke={DARK} strokeWidth={34} />
          </>
        )}
        {mood === "alert" ? (
          <>
            <rect x={960} y={110} width={200} height={200} fill="#E8A200" stroke={DARK} strokeWidth={20} />
            <rect x={1040} y={140} width={40} height={90} fill={DARK} />
            <rect x={1040} y={250} width={40} height={36} fill={DARK} />
          </>
        ) : (
          <PetSignMark sign={sign} />
        )}
      </svg>
    </span>
  );
}
