"use client";

import { useCallback, useState } from "react";

import { useAuth } from "@/components/auth";
import { useSettings } from "@/components/settings";

import { AuthWindow } from "./AuthWindow";
import { HistoryWindow } from "./HistoryWindow";
import { IconMode } from "./IconMode";
import { SettingsWindow } from "./SettingsWindow";
import { useHelperSession } from "./useHelperSession";

// 화면 흐름 (docs/scenarios.yaml, 기획 확정)
//   접속 → 가입/로그인(설정 창 형태) → 설정 창 → [도움 시작하기] → 아이콘 모드
//   아이콘 모드의 [설정] → 설정 창 → [도움 시작하기] → 아이콘 모드
type View = "settings" | "history" | "icon";

export function HelperApp() {
  const auth = useAuth();
  const signedIn = auth.state.status === "signedIn";
  const { settings, error: settingsError, update } = useSettings(signedIn);
  const [view, setView] = useState<View>("settings");

  const onNeedLogin = useCallback(() => {
    setView("settings");
    auth.markSignedOut();
  }, [auth]);
  // 설정 창을 오가도 화면 공유·안내가 이어지도록 여기서 한 번만 만든다
  const session = useHelperSession({ onNeedLogin });

  if (auth.state.status === "checking") return null;
  if (auth.state.status === "guest") return <AuthWindow />;

  const startHelp = () => setView("icon");

  return (
    <>
      <div hidden={view !== "icon"}>
        <IconMode
          session={session}
          voiceEnabled={settings?.voiceInput ?? false}
          edgeEnabled={settings?.edgeDisplay ?? true}
          onOpenSettings={() => setView("settings")}
        />
      </div>
      {view === "settings" && (
        <SettingsWindow
          email={auth.state.user.email}
          settings={settings}
          error={settingsError}
          onUpdate={(patch) => void update(patch)}
          onOpenHistory={() => setView("history")}
          onStart={startHelp}
          onLogout={() => {
            session.stop();
            setView("settings");
            void auth.logout();
          }}
        />
      )}
      {view === "history" && <HistoryWindow onBack={() => setView("settings")} onStart={startHelp} />}
    </>
  );
}
