import { useState } from "react";

import type { SettingsResponse, SettingsUpdateRequest } from "@/server/settings/schema";
import type { UserError } from "@/lib/errors";
import { HistoryList } from "@/components/history";
import { Switch } from "@/components/ui/Switch";

// 설정 창 (S1, S2, S5, S7, S8). 설정 값은 부모가 useSettings로 들고 있다가 내려 준다
// (창을 닫았다 열어도 저장 중인 값이 유지되도록)
interface SettingsPanelProps {
  email: string;
  settings: SettingsResponse | null;
  error: UserError | null;
  onChange: (patch: SettingsUpdateRequest) => void;
  onStart: () => void;
  onLogout: () => void;
}

export function SettingsPanel({ email, settings, error, onChange, onStart, onLogout }: SettingsPanelProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  return (
    <section aria-labelledby="settings-title" className="flex flex-col gap-6 rounded-2xl border-2 border-neutral-300 p-6">
      <h2 id="settings-title" className="text-2xl font-bold">
        설정
      </h2>
      <p className="text-neutral-600">{email}(으)로 로그인했어요.</p>

      <button type="button" onClick={onStart} className="h-16 rounded-lg bg-blue-700 text-2xl font-bold text-white">
        도움 시작하기
      </button>

      {error && (
        <p role="alert" className="font-bold text-red-700">
          {error.message}
        </p>
      )}

      {settings ? (
        <div className="flex flex-col gap-4">
          <Switch label="화면 가장자리 표시" checked={settings.edgeDisplay} onChange={(v) => onChange({ edgeDisplay: v })} />
          <Switch label="음성 인식" checked={settings.voiceInput} onChange={(v) => onChange({ voiceInput: v })} />
          <Switch label="송금·결제 위험 경고" checked={settings.riskWarning} onChange={(v) => onChange({ riskWarning: v })} />
          <Switch label="기록 남기기" checked={settings.saveHistory} onChange={(v) => onChange({ saveHistory: v })} />
        </div>
      ) : (
        !error && <p>설정을 불러오고 있어요...</p>
      )}

      <button
        type="button"
        aria-expanded={isHistoryOpen}
        onClick={() => setIsHistoryOpen((open) => !open)}
        className="h-14 rounded-lg border-2 border-neutral-400 font-bold"
      >
        도움 기록
      </button>
      {isHistoryOpen && <HistoryList />}

      <button type="button" onClick={onLogout} className="h-14 rounded-lg border-2 border-neutral-400 font-bold">
        로그아웃
      </button>
    </section>
  );
}
