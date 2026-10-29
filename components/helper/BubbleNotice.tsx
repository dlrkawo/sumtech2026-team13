import { MUTED } from "./styles";
import type { HelperNotice } from "./useHelperSession";

// 서버 응답이 아닌 짧은 안내: 화면을 아직 안 보여 줌(▶ 또는 사진 올리기) / 보낼 화면 사진이 없을 때 사진 올리기 /
// 같은 사진으로 '다음'을 누름 / 사진 오류
export function BubbleNotice({ notice }: { notice: HelperNotice }) {
  if (notice.kind === "needStart")
    return (
      <p className="text-[22px] font-bold">먼저 ▶로 화면을 보여 주거나, ‘사진 올리기’로 지금 화면 사진을 올려 주세요.</p>
    );
  if (notice.kind === "samePhoto") {
    return <p className="text-[22px] font-bold">{"바뀐 화면을 '사진 바꾸기'로 올린 뒤 다시 눌러 주세요."}</p>;
  }
  if (notice.kind === "error") {
    return (
      <p role="alert" className="text-[22px] font-bold text-[#9B1C1C]">
        {notice.error.message}
      </p>
    );
  }
  return (
    <>
      <p className="text-[22px] font-bold">{notice.reason ?? "화면을 함께 보지 못하고 있어요."}</p>
      <p className={MUTED}>위 ‘사진 올리기’로 지금 화면 사진을 올리면 도와드릴게요.</p>
    </>
  );
}
