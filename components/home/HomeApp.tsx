"use client";

import { useEffect, useState } from "react";

import type { AuthUserResponse } from "@/server/auth/schema";
import { AuthPanel, AuthProvider, useAuth } from "@/components/auth";
import { SettingsPanel, useSettings } from "@/components/settings";

import { IconMode } from "./IconMode";

// `/` 첫 화면의 바뀌는 부분: 로그인 전 → 로그인/가입, 로그인 후 → 설정 창 ↔ 아이콘 모드
export function HomeApp() {
  return (
    <AuthProvider>
      <HomeScreen />
    </AuthProvider>
  );
}

function HomeScreen() {
  const { state } = useAuth();

  if (state.status === "checking") return <p>잠시만 기다려 주세요...</p>;
  if (state.status === "guest") return <AuthPanel />;
  return <SignedInScreen user={state.user} />;
}

// 로그아웃하면 사라지므로 다시 로그인하면 설정 창부터 시작한다
function SignedInScreen({ user }: { user: AuthUserResponse }) {
  const { logout, markSignedOut } = useAuth();
  const { settings, error, update } = useSettings(true);
  const [view, setView] = useState<"settings" | "icon">("settings");

  useEffect(() => {
    if (error?.needsLogin) markSignedOut();
  }, [error, markSignedOut]);

  if (view === "icon") return <IconMode onOpenSettings={() => setView("settings")} />;
  return (
    <SettingsPanel
      email={user.email}
      settings={settings}
      error={error}
      onChange={(patch) => void update(patch)}
      onStart={() => setView("icon")}
      onLogout={() => void logout()}
    />
  );
}
