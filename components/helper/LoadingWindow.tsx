"use client";

import { useEffect, useState } from "react";

import { MUTED } from "./styles";
import { WindowFrame } from "./WindowFrame";

// 처음 열었을 때 로그인 여부를 확인하는 동안(/api/auth/me) 띄우는 창. 이 동안 버튼이 하나도 없어 멈춘 것처럼 보이지 않게 한다.
// 로그인 창과 같은 자리(side)에 띄운다: 로그인 여부를 모르는 동안 첫 화면의 서비스 이름·설명을 가리지 않는다 (키트 규칙)
// 배포 DB가 잠들어 있다 깨어나면 몇 초 걸릴 수 있어, 오래 걸리면 안내를 하나 더 보여 준다
const SLOW_AFTER_MS = 8_000;

export function LoadingWindow() {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsSlow(true), SLOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <WindowFrame title="잠시만 기다려 주세요" placement="side">
      <div role="status" aria-live="polite" className="flex flex-col gap-[14px]">
        <div className="flex items-center gap-[12px]">
          <span
            aria-hidden="true"
            className="h-[30px] w-[30px] shrink-0 animate-spin rounded-full border-[5px] border-[#D5DEEA] border-t-[#1D4E89] motion-reduce:animate-none"
          />
          <p className="text-[22px] font-bold">곁길을 준비하고 있어요</p>
        </div>
        {isSlow && <p className={MUTED}>조금 오래 걸리고 있어요. 창을 닫지 말고 잠시만 더 기다려 주세요.</p>}
      </div>
    </WindowFrame>
  );
}
