import { BUTTON_SECONDARY } from "./styles";

// 안내를 받은 뒤 다음 화면 사진을 올려 바로 이어서 분석을 요청한다 (v2 S3)
// E2E: getByLabel("다음 화면 보기").setInputFiles(...)
export function NextScreenUpload({ onPick }: { onPick: (file: File) => void }) {
  return (
    <label className={`cursor-pointer ${BUTTON_SECONDARY}`}>
      <span>다음 화면 보기</span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="다음 화면 보기"
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
