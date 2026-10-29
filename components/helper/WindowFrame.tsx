import type { ReactNode } from "react";

import { LogoMark } from "./LogoMark";

// 가입·로그인·설정·도움 기록이 모두 같은 "설정 창" 모양으로 뜬다 (scenarios.yaml 화면 흐름)
//   placement="side": 로그인 전. 첫 화면의 서비스 이름·설명을 가리지 않도록 오른쪽에 어둡게 덮지 않고 띄운다 (키트 규칙)
export function WindowFrame({
  title,
  action,
  placement = "center",
  children,
}: {
  title: string;
  action?: ReactNode;
  placement?: "center" | "side";
  children: ReactNode;
}) {
  const layer =
    placement === "side"
      ? "pointer-events-none fixed inset-0 z-40 flex items-end justify-center p-[16px] lg:items-center lg:justify-end lg:pr-[6vw] [&>*]:pointer-events-auto"
      : "fixed inset-0 z-40 flex items-center justify-center bg-[rgba(20,24,30,.35)] p-[16px]";
  return (
    <div className={layer}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[calc(100vh-32px)] w-[560px] break-keep max-w-full flex-col overflow-hidden rounded-[24px] border border-[#E6E3DC] bg-white text-[20px] leading-[1.5] text-[#16191D] shadow-[0_24px_60px_rgba(0,0,0,.3)]"
      >
        <div className="flex items-center gap-[12px] border-b border-[#E6E3DC] px-[24px] py-[18px]">
          <LogoMark />
          <h2 className="flex-1 text-[28px] font-bold">{title}</h2>
          {action}
        </div>
        <div className="flex flex-col gap-[14px] overflow-y-auto px-[24px] pt-[20px] pb-[24px]">{children}</div>
      </section>
    </div>
  );
}
