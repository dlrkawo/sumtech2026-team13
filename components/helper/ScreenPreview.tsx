import type { GuideTarget } from "@/server/guide/schema";

// 물어볼 때 보낸 화면 위에 누를 곳을 빨간 테두리로 그린다.
// 화면 공유로는 다른 사이트 위에 직접 그릴 수 없어서, 본 화면(말풍선)에 사진과 함께 보여 준다 (FE_CONVENTION.md 10번)
// 좌표는 이미지 기준 0~1 비율 (API_CONVENTION.md 5번)
export function ScreenPreview({ image, target }: { image: string; target: GuideTarget | null }) {
  // 라벨은 박스 안쪽 모서리에 붙이되, 박스가 사진의 오른쪽·아래쪽에 있으면 반대쪽으로 펼쳐 사진 밖(overflow-hidden)으로 잘리지 않게 한다
  const labelX = target && target.x + target.width / 2 > 0.5 ? "right-[2px]" : "left-[2px]";
  const labelY = target && target.y + target.height / 2 > 0.5 ? "bottom-[2px]" : "top-[2px]";
  return (
    <div className="relative mx-auto w-fit max-w-full shrink-0 overflow-hidden rounded-[12px] border-2 border-[#C9C6BE] bg-white">
      {/* data URL 사진이라 next/image 최적화 대상이 아니다 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="물어볼 때 본 화면" className="block h-auto max-h-[200px] w-auto max-w-full xl:max-h-[clamp(200px,calc(100dvh_-_400px),560px)]" />
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
          <span
            aria-hidden="true"
            className={`absolute ${labelY} ${labelX} whitespace-nowrap rounded-[6px] bg-[#C8102E] px-[8px] py-[2px] text-[20px] font-bold text-white`}
          >
            여기를 누르세요
          </span>
        </div>
      )}
    </div>
  );
}
