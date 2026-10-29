"use client";

import Link from "next/link";
import { useEffect } from "react";

// 화면을 그리다 예상하지 못한 오류가 났을 때 (Next.js error boundary). 흰 화면 대신 다시 시작할 길을 보여 준다.
// API 오류(로그인 만료·AI 실패 등)는 각 창이 말풍선·문구로 처리하므로 여기까지 오지 않는다.
// 글자 20px 이상·버튼 56px 이상 (FE_CONVENTION.md 8번), 모양은 app/not-found.tsx와 맞춘다.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app/error] 화면 오류", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6">
      <h1 className="text-3xl font-bold">문제가 생겨 화면을 보여 드리지 못했어요</h1>
      <p className="text-2xl text-neutral-700">잠시 후 다시 열어 주세요. 받으신 안내는 사라지지 않았어요.</p>
      <button
        type="button"
        onClick={reset}
        className="flex min-h-[56px] w-fit items-center rounded-[16px] border-2 border-[#1D4E89] bg-[#1D4E89] px-6 text-2xl font-bold text-white hover:bg-[#163E6E] focus-visible:outline-[4px] focus-visible:outline-offset-[3px] focus-visible:outline-[#E8A200]"
      >
        다시 열기
      </button>
      <Link href="/" className="text-2xl text-blue-700 underline">
        처음 화면으로 가기
      </Link>
    </main>
  );
}
