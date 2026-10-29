"use client";

import { useState } from "react";

import { useHistory } from "@/components/history";

import { BUTTON_PRIMARY, BUTTON_SECONDARY, LINK_BUTTON, MUTED } from "./styles";
import { WindowFrame } from "./WindowFrame";

const DATE_FORMAT = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

// 도움 기록 (S7). 열 때마다 새로 불러와 방금 물어본 것도 보인다
export function HistoryWindow({ onBack, onStart }: { onBack: () => void; onStart: () => void }) {
  const { items, error, isLoading, clear } = useHistory(true);
  // 지우기는 되돌릴 수 없어서 한 번 더 묻는다
  const [isConfirming, setConfirming] = useState(false);

  return (
    <WindowFrame
      title="도움 기록"
      action={
        <button type="button" className={LINK_BUTTON} onClick={onBack}>
          ‹ 돌아가기
        </button>
      }
    >
      {isLoading && <p className={MUTED}>기록을 불러오고 있어요…</p>}
      {error && (
        <p
          role="alert"
          className="rounded-[14px] bg-[#FBE9EB] px-[16px] py-[12px] text-[20px] font-bold text-[#9B1C1C]"
        >
          {error.message}
        </p>
      )}
      {items && items.length === 0 && <p className={MUTED}>아직 도움 기록이 없어요.</p>}
      {items && items.length > 0 && (
        <>
          <ul className="flex flex-col gap-[8px]">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-[4px] rounded-[14px] border border-[#DEDBD3] px-[16px] py-[12px]"
              >
                <span className="text-[20px] font-bold">{item.question}</span>
                <span className="text-[20px] text-[#3A3F45]">{item.instruction}</span>
                <span className="text-[20px] text-[#6B7178]">{DATE_FORMAT.format(new Date(item.createdAt))}</span>
              </li>
            ))}
          </ul>
          {isConfirming ? (
            <div className="flex flex-col gap-[8px] rounded-[14px] bg-[#FFF6DF] p-[14px]">
              <p className="text-[20px] font-bold text-[#7A4E00]">기록을 모두 지우면 되돌릴 수 없어요. 지울까요?</p>
              <div className="grid grid-cols-2 gap-[8px]">
                <button type="button" className={BUTTON_SECONDARY} onClick={() => setConfirming(false)}>
                  그대로 두기
                </button>
                <button
                  type="button"
                  className={BUTTON_SECONDARY}
                  onClick={() => void clear().then(() => setConfirming(false))}
                >
                  모두 지우기
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className={BUTTON_SECONDARY} onClick={() => setConfirming(true)}>
              기록 모두 지우기
            </button>
          )}
        </>
      )}
      <button type="button" className={BUTTON_PRIMARY} onClick={onStart}>
        도움 시작하기
      </button>
    </WindowFrame>
  );
}
