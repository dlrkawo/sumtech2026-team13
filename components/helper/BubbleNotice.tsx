import { MUTED } from "./styles";
import type { HelperSession } from "./useHelperSession";

// 서버 응답이 아닌 짧은 안내: ▶ 먼저 / 화면 공유가 안 될 때 사진 올리기 / 사진 오류
export function BubbleNotice({
  notice,
  shareDenied,
}: {
  notice: NonNullable<HelperSession["notice"]>;
  shareDenied: "denied" | "unsupported";
}) {
  if (notice.kind === "needStart")
    return <p className="text-[22px] font-bold">먼저 ▶를 눌러 화면 보기를 시작해 주세요.</p>;
  if (notice.kind === "error") {
    return (
      <p role="alert" className="text-[22px] font-bold text-[#9B1C1C]">
        {notice.error.message}
      </p>
    );
  }
  return (
    <>
      <p className="text-[22px] font-bold">
        {shareDenied === "unsupported" ? "이 브라우저에서는 화면 보기가 안 돼요." : "화면을 함께 보지 못하고 있어요."}
      </p>
      <p className={MUTED}>아래 ‘화면 사진 올리기’로 지금 화면 사진을 올리면 도와드릴게요.</p>
    </>
  );
}
