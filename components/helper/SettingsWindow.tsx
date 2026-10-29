"use client";

import type { SettingsResponse, SettingsUpdateRequest } from "@/server/settings/schema";
import type { UserError } from "@/lib/errors";

import { SettingSwitch } from "./SettingSwitch";
import { BUTTON_PRIMARY, FOCUS_RING, LINK_BUTTON, MUTED } from "./styles";
import { WindowFrame } from "./WindowFrame";

// 설정 창 (S1 결과, S5, S8). 필요한 것만 켜고 '도움 시작하기'를 누르면 아이콘 모드로 간다
export function SettingsWindow({
  email,
  settings,
  error,
  onUpdate,
  onOpenHistory,
  onStart,
  onLogout,
}: {
  email: string;
  settings: SettingsResponse | null;
  error: UserError | null;
  onUpdate: (patch: SettingsUpdateRequest) => void;
  onOpenHistory: () => void;
  onStart: () => void;
  onLogout: () => void;
}) {
  const name = email.split("@")[0];

  return (
    <WindowFrame
      title="설정"
      action={
        <button type="button" className={LINK_BUTTON} onClick={onLogout}>
          로그아웃
        </button>
      }
    >
      <p className={MUTED}>{name}님, 필요한 것만 켜고 ‘도움 시작하기’를 눌러 주세요.</p>
      <div className="flex flex-col">
        {settings ? (
          <>
            <SettingSwitch
              label="음성 인식"
              description="켜면 아래 입력창에 ‘마이크’ 버튼이 생겨요"
              checked={settings.voiceInput}
              onChange={(voiceInput) => onUpdate({ voiceInput })}
            />
            <SettingSwitch
              label="화면 가장자리 표시"
              description="보고 있을 때 화면 테두리를 파랗게 표시해요"
              checked={settings.edgeDisplay}
              onChange={(edgeDisplay) => onUpdate({ edgeDisplay })}
            />
            <SettingSwitch
              label="기록 저장"
              description="끄면 물어본 말과 안내 문장이 도움 기록에 남지 않아요"
              checked={settings.saveHistory}
              onChange={(saveHistory) => onUpdate({ saveHistory })}
            />
          </>
        ) : (
          !error && <p className={`${MUTED} py-[12px]`}>설정을 불러오고 있어요…</p>
        )}
        <button
          type="button"
          onClick={onOpenHistory}
          className={`flex min-h-[72px] items-center gap-[14px] border-b border-[#EEECE6] text-left ${FOCUS_RING}`}
        >
          <span className="flex-1 text-[20px] font-bold">도움 기록</span>
          <span aria-hidden="true" className="text-[24px] text-[#454B53]">
            ›
          </span>
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-[14px] bg-[#FBE9EB] px-[16px] py-[12px] text-[20px] font-bold text-[#9B1C1C]"
        >
          {error.message}
        </p>
      )}
      <button type="button" className={BUTTON_PRIMARY} onClick={onStart}>
        도움 시작하기
      </button>
      <p className="text-[20px] text-[#454B53]">
        보여 주신 화면은 저장하지 않아요. 물어본 말과 안내 문장만 도움 기록에 남아요.
      </p>
    </WindowFrame>
  );
}
