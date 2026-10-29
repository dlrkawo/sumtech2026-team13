// 부모님용 UI 공통 크기 (FE_CONVENTION.md 8번: 글자 20px 이상, 버튼 높이 56px 이상)
// 크기는 px로 적는다. 루트 글자 크기가 20px이라 rem 단위가 기본값과 달라지기 때문이다.

export const FOCUS_RING =
  "focus-visible:outline-[4px] focus-visible:outline-offset-[3px] focus-visible:outline-[#E8A200]";

export const BUTTON_PRIMARY =
  "flex min-h-[62px] w-full items-center justify-center gap-[8px] rounded-[16px] border-2 border-[#1D4E89] bg-[#1D4E89] px-[16px] text-[22px] font-bold text-white hover:bg-[#163E6E] disabled:cursor-not-allowed disabled:border-[#C9C6BE] disabled:bg-[#E4E3DF] disabled:text-[#6B7178] " +
  FOCUS_RING;

export const BUTTON_SECONDARY =
  "flex min-h-[56px] w-full items-center justify-center gap-[8px] rounded-[16px] border-2 border-[#8A8F96] bg-white px-[16px] text-[20px] font-bold text-[#16191D] hover:bg-[#F0EFEB] disabled:cursor-not-allowed disabled:text-[#6B7178] " +
  FOCUS_RING;

export const LINK_BUTTON =
  "min-h-[56px] px-[4px] text-[20px] text-[#1D4E89] underline underline-offset-4 " + FOCUS_RING;

export const MUTED = "text-[20px] text-[#454B53]";
