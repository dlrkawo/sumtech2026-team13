import type { GuideTarget } from "@/server/guide/schema";

// 물어볼 때 보낸 화면 위에 누를 곳을 빨간 테두리로 그린다.
// 화면 공유로는 다른 사이트 위에 직접 그릴 수 없어서, 본 화면(말풍선)에 사진과 함께 보여 준다 (FE_CONVENTION.md 10번)
// 좌표는 이미지 기준 0~1 비율 (API_CONVENTION.md 5번)
export function ScreenPreview({ image, target }: { image: string; target: GuideTarget | null }) {
  return (
    <div className="relative mx-auto w-fit max-w-full shrink-0 overflow-hidden rounded-[12px] border-2 border-[#C9C6BE] bg-white">
      {/* data URL 사진이라 next/image 최적화 대상이 아니다 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="물어볼 때 본 화면" className="block h-auto max-h-[200px] w-auto max-w-full" />
      {target && (
        <div
          data-testid="click-highlight"
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
          {/* 하이라이트 박스 안쪽 위에 둔다. 사진 바로 바깥(overflow-hidden)에 두면 화면 위쪽 근처일 때 가려질 수 있다 */}
          <span
            aria-hidden="true"
            className="absolute top-[2px] left-[2px] whitespace-nowrap rounded-[6px] bg-[#C8102E] px-[6px] py-[1px] text-[13px] font-bold text-white"
          >
            여기를 누르세요
          </span>
        </div>
      )}
    </div>
  );
}
