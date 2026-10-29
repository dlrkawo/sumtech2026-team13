// 상태 칸의 그림. 답변 중에는 움직이는 점 세 개 (E2E: getByRole("img", { name: "답변 중" }))
export type HelperStatus = "stopped" | "waiting" | "watching" | "answering";

export function StatusIcon({ status }: { status: HelperStatus }) {
  if (status === "answering") {
    // E2E: getByRole("img", { name: "답변 중" })
    return (
      <span role="img" aria-label="답변 중" className="flex h-[30px] items-center gap-[5px]">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="block h-[9px] w-[9px] animate-bounce rounded-full bg-current motion-reduce:animate-none"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </span>
    );
  }
  if (status === "watching" || status === "waiting") {
    return (
      <svg
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        aria-hidden="true"
      >
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
        <circle cx="12" cy="12" r="3" fill={status === "watching" ? "currentColor" : "none"} />
      </svg>
    );
  }
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6.5" y="5" width="3.8" height="14" rx="1" fill="currentColor" />
      <rect x="13.7" y="5" width="3.8" height="14" rx="1" fill="currentColor" />
    </svg>
  );
}
