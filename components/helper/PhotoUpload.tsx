import { FOCUS_RING } from "./styles";

// 화면 공유가 안 될 때·자동 테스트용 길: 화면 사진을 골라 올린다 (FE_CONVENTION.md 10번)
// E2E: getByLabel("화면 사진 올리기").setInputFiles(...)
export function PhotoUpload({ hasPhoto, onPick }: { hasPhoto: boolean; onPick: (file: File) => void }) {
  return (
    <label
      className={`flex min-h-[56px] cursor-pointer items-center gap-[8px] rounded-[30px] border-2 border-[#C9C6BE] bg-white px-[18px] text-[20px] font-bold text-[#16191D] shadow-[0_8px_18px_rgba(0,0,0,.14)] hover:bg-[#F0EFEB] focus-within:outline-[4px] focus-within:outline-offset-[3px] focus-within:outline-[#E8A200] ${FOCUS_RING}`}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="9" cy="11" r="2" />
        <path d="M21 16l-5-5-8 8" />
      </svg>
      <span>{hasPhoto ? "사진 바꾸기" : "사진 올리기"}</span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="화면 사진 올리기"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
          e.target.value = "";
        }}
      />
    </label>
  );
}
