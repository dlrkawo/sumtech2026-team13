import { useEffect } from "react";

import { useAuth } from "@/components/auth";

import { useHistory } from "./useHistory";

// 설정 창의 '도움 기록' 목록 (S7). 열릴 때마다 새로 불러온다
export function HistoryList() {
  const { items, error, isLoading } = useHistory(true);
  const { markSignedOut } = useAuth();

  useEffect(() => {
    if (error?.needsLogin) markSignedOut();
  }, [error, markSignedOut]);

  if (isLoading) return <p>도움 기록을 불러오고 있어요...</p>;
  if (error) {
    return (
      <p role="alert" className="font-bold text-red-700">
        {error.message}
      </p>
    );
  }
  if (!items || items.length === 0) return <p>아직 도움 기록이 없어요.</p>;

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.id} className="rounded-lg border-2 border-neutral-300 p-4">
          <p className="font-bold">{item.question}</p>
          <p>{item.instruction}</p>
          <time dateTime={item.createdAt} className="text-neutral-600">
            {new Date(item.createdAt).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" })}
          </time>
        </li>
      ))}
    </ul>
  );
}
