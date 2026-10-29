import { useEffect, useRef, useState } from "react";

import type { GuideTarget } from "@/server/guide/schema";

import { FOCUS_RING } from "./styles";

// 물어볼 때 보낸 화면 위에 누를 곳을 빨간 테두리로 그린다.
// 화면 공유로는 다른 사이트 위에 직접 그릴 수 없어서, 본 화면(말풍선)에 사진과 함께 보여 준다 (FE_CONVENTION.md 10번)
// 좌표는 이미지 기준 0~1 비율 (API_CONVENTION.md 5번)
// hasRisk: 위험 경고 줄이 말풍선 위에 더 있어서 사진을 그만큼 낮게 그린다 (1280×720에서 사진 아래가 잘렸다)
// 사진을 누르면 화면 가득 크게 보여 준다 (닫기 버튼 · Esc · 바깥 누르기)
export function ScreenPreview({ image, target, hasRisk = false }: { image: string; target: GuideTarget | null; hasRisk?: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        aria-label="사진 크게 보기"
        onClick={() => dialogRef.current?.showModal()}
        className={`relative mx-auto block w-fit max-w-full shrink-0 cursor-zoom-in overflow-hidden rounded-[12px] border-2 border-[#C9C6BE] bg-white ${FOCUS_RING}`}
      >
        {/* data URL 사진이라 next/image 최적화 대상이 아니다 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="물어볼 때 본 화면" className={`block h-auto max-h-[200px] w-auto max-w-full ${hasRisk ? "xl:max-h-[clamp(120px,calc(70dvh_-_430px),560px)]" : "xl:max-h-[clamp(150px,calc(70dvh_-_340px),560px)]"}`} />
        {target && <Highlight target={target} testId="click-highlight" />}
        {/* 누를 수 있다는 표시. 사진 아래 한 줄로 두면 1280×720에서 말풍선이 넘쳐 누를 곳과 반대쪽 모서리에 얹는다 */}
        <span
          aria-hidden="true"
          className={`absolute ${zoomHintCorner(target)} flex items-center gap-[4px] rounded-[8px] border-2 border-[#C9C6BE] bg-white/95 px-[8px] text-[20px] font-bold text-[#16191D]`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <circle cx="10" cy="10" r="6" />
            <path d="M15 15l6 6M10 7v6M7 10h6" />
          </svg>
          크게 보기
        </span>
      </button>

      <dialog
        ref={dialogRef}
        aria-label="물어볼 때 본 화면 크게 보기"
        // 사진 바깥 어두운 곳을 눌러도 닫는다
        onClick={(e) => {
          if (!(e.target instanceof HTMLImageElement)) e.currentTarget.close();
        }}
        className="m-0 h-dvh max-h-none w-dvw max-w-none flex-col items-center gap-[12px] bg-[#16191D]/95 p-[16px] open:flex backdrop:bg-black/60"
      >
        <div className="flex w-full items-center justify-between gap-[12px]">
          <p className="text-[22px] font-bold text-white">물어볼 때 본 화면</p>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className={`min-h-[56px] shrink-0 rounded-[28px] border-2 border-white bg-white px-[24px] text-[22px] font-bold text-[#16191D] hover:bg-[#F0EFEB] ${FOCUS_RING}`}
          >
            닫기
          </button>
        </div>
        <div className="flex min-h-0 w-full flex-1 items-center justify-center">
          <div className="relative w-fit max-w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" className="block h-auto max-h-[calc(100dvh_-_120px)] w-auto max-w-full rounded-[8px] bg-white" />
            {target && <Highlight target={target} />}
          </div>
        </div>
      </dialog>
    </>
  );
}

// '크게 보기' 표시는 누를 곳(과 '여기를 누르세요')을 가리지 않게 반대쪽 모서리에 둔다
function zoomHintCorner(target: GuideTarget | null) {
  if (!target) return "right-[6px] bottom-[6px]";
  const x = target.x + target.width / 2 > 0.5 ? "left-[6px]" : "right-[6px]";
  const y = target.y + target.height / 2 > 0.5 ? "top-[6px]" : "bottom-[6px]";
  return `${x} ${y}`;
}

// 누를 곳 크게 보기: target 둘레를 target의 2.5배만큼 잘라 크게 보여 준다 (작은 버튼은 사진에서 잘 안 보인다)
// 잘라 낸 범위는 CSS background-size/position으로 그린다. 상자 가로세로 비율을 잘라 낸 범위와 맞춰야 늘어나지 않아서 사진 원래 크기를 읽는다
const ZOOM_PAD = 2.5;
// 사진 폭(높이)의 25%보다 좁게는 자르지 않는다 (최대 4배, 더 키우면 글자가 뭉개진다)
const ZOOM_MIN = 0.25;
// 잘라 낸 상자 가로/세로 비율 범위 (너무 길쭉하거나 좁지 않게)
const ZOOM_ASPECT_MIN = 1.3;
const ZOOM_ASPECT_MAX = 3;

// 누를 곳이 사진 대부분을 차지하면 크게 볼 것이 없다
export function canZoom(target: GuideTarget) {
  return !(target.width * ZOOM_PAD > 0.9 && target.height * ZOOM_PAD > 0.9);
}

export function TargetZoom({ image, target, hasRisk = false }: { image: string; target: GuideTarget; hasRisk?: boolean }) {
  const size = useImageSize(image);
  if (!size || !canZoom(target)) return null;
  const crop = zoomCrop(target, size.width / size.height);
  const aspect = (crop.width * size.width) / (crop.height * size.height);
  return (
    <div className="flex flex-col gap-[4px]">
      <p className="text-[20px] font-bold text-[#9B1C1C]">누를 곳 크게 보기</p>
      <div
        role="img"
        aria-label="누를 곳 크게 보기"
        // 넓은 화면에서는 옆 사진과 같은 높이까지 (세로가 짧은 화면일수록 낮게, 1280×720에서 말풍선이 넘치지 않게)
        className={`relative max-w-full overflow-hidden rounded-[12px] border-2 border-[#C9C6BE] bg-white bg-no-repeat [--zoom-h:160px] ${hasRisk ? "xl:[--zoom-h:clamp(96px,calc(70dvh_-_430px),560px)]" : "xl:[--zoom-h:clamp(150px,calc(70dvh_-_340px),560px)]"}`}
        style={{
          width: `min(100%, calc(${aspect.toFixed(3)} * var(--zoom-h)))`,
          aspectRatio: aspect.toFixed(3),
          backgroundImage: `url("${image}")`,
          backgroundSize: `${100 / crop.width}% ${100 / crop.height}%`,
          backgroundPosition: `${bgPos(crop.left, crop.width)}% ${bgPos(crop.top, crop.height)}%`,
        }}
      >
        <div
          aria-hidden="true"
          className="absolute box-border rounded-[8px] border-[4px] border-[#C8102E] shadow-[0_0_0_2px_#fff,0_0_0_6px_rgba(200,16,46,.35)]"
          style={{
            left: `${((target.x - crop.left) / crop.width) * 100}%`,
            top: `${((target.y - crop.top) / crop.height) * 100}%`,
            width: `${(target.width / crop.width) * 100}%`,
            height: `${(target.height / crop.height) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}

// 잘라 낼 범위 (사진 기준 0~1 비율). ratio = 사진 가로/세로
function zoomCrop(target: GuideTarget, ratio: number) {
  let width = Math.max(target.width * ZOOM_PAD, ZOOM_MIN);
  let height = Math.max(target.height * ZOOM_PAD, ZOOM_MIN);
  const aspect = (width * ratio) / height;
  if (aspect > ZOOM_ASPECT_MAX) height = (width * ratio) / ZOOM_ASPECT_MAX;
  if (aspect < ZOOM_ASPECT_MIN) width = (height * ZOOM_ASPECT_MIN) / ratio;
  width = Math.min(width, 1);
  height = Math.min(height, 1);
  // target 가운데를 중심으로 자르되 사진 밖으로 나가지 않게
  const left = clamp(target.x + target.width / 2 - width / 2, 0, 1 - width);
  const top = clamp(target.y + target.height / 2 - height / 2, 0, 1 - height);
  return { left, top, width, height };
}

// background-position %: 사진의 p% 지점이 상자의 p% 지점에 맞는다 → 잘라 낸 왼쪽 끝이 상자 왼쪽 끝에 오는 값
function bgPos(start: number, span: number) {
  return span >= 1 ? 0 : (start / (1 - span)) * 100;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function useImageSize(src: string) {
  const [size, setSize] = useState<{ src: string; width: number; height: number } | null>(null);
  useEffect(() => {
    const img = new Image();
    img.onload = () => setSize({ src, width: img.naturalWidth, height: img.naturalHeight });
    img.src = src;
    return () => {
      img.onload = null;
    };
  }, [src]);
  return size?.src === src && size.width > 0 && size.height > 0 ? size : null;
}

// 누를 곳 빨간 테두리 + '여기를 누르세요'. testId는 말풍선 사진에만 붙인다 (E2E가 하나만 찾는다)
function Highlight({ target, testId }: { target: GuideTarget; testId?: string }) {
  // 라벨은 박스 바깥에 붙여 누를 곳의 글자를 가리지 않게 한다.
  // 박스가 사진 위쪽 절반이면 박스 아래에, 아래쪽 절반이면 박스 위에 두고, 좌우는 사진 밖(overflow-hidden)으로 잘리지 않는 쪽 모서리에 맞춘다
  const labelX = target.x + target.width / 2 > 0.5 ? "right-[-4px]" : "left-[-4px]";
  const labelY = target.y + target.height / 2 > 0.5 ? "bottom-full mb-[6px]" : "top-full mt-[6px]";
  return (
    <div
      data-testid={testId}
      role="img"
      aria-label="누를 곳"
      className="absolute box-border rounded-[8px] border-[4px] border-[#C8102E] shadow-[0_0_0_2px_#fff,0_0_0_6px_rgba(200,16,46,.35)]"
      style={{
        left: `${target.x * 100}%`,
        top: `${target.y * 100}%`,
        width: `${target.width * 100}%`,
        height: `${target.height * 100}%`,
      }}
    >
      <span
        aria-hidden="true"
        className={`absolute ${labelY} ${labelX} whitespace-nowrap rounded-[6px] bg-[#C8102E] px-[8px] py-[2px] text-[20px] font-bold text-white`}
      >
        여기를 누르세요
      </span>
    </div>
  );
}
