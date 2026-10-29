"use client";

import { useCallback, useState } from "react";

import { useAuth } from "@/components/auth";
import { useHistory } from "@/components/history";
import { useSettings } from "@/components/settings";
import { useSpeechInput } from "@/components/voice";

import { AuthWindow } from "./AuthWindow";
import { HistoryWindow } from "./HistoryWindow";
import { IconMode } from "./IconMode";
import { SettingsWindow } from "./SettingsWindow";
import { useHelperSession } from "./useHelperSession";

// 화면 흐름 (docs/scenarios.yaml, 기획 확정)
//   접속 → 가입/로그인(설정 창 형태) → 설정 창 → [도움 시작하기] → 아이콘 모드
//   아이콘 모드의 [설정] → 설정 창 → [도움 시작하기] → 아이콘 모드
// 로그인·설정·기록·안내 요청·화면 공유·음성 인식은 여기서만 부르고, 각 창에는 값과 함수만 넘긴다.
type View = "settings" | "history" | "icon";

export function HelperApp() {
  const auth = useAuth();
  const signedIn = auth.state.status === "signedIn";
  const { settings, error: settingsError, update } = useSettings(signedIn);
  const [view, setView] = useState<View>("settings");
  const history = useHistory(signedIn && view === "history");
  const [question, setQuestion] = useState("");

  const onNeedLogin = useCallback(() => {
    setView("settings");
    auth.markSignedOut();
  }, [auth]);
  // 설정 창을 오가도 화면 공유·안내가 이어지도록 여기서 한 번만 만든다
  const session = useHelperSession({ onNeedLogin });

  // 말로 들은 문장은 입력창에 적고 바로 물어본다 (S8)
  const { ask } = session;
  const onHeard = useCallback(
    (text: string) => {
      setQuestion(text);
      void ask(text);
    },
    [ask],
  );
  const voice = useSpeechInput(onHeard);

  if (auth.state.status === "checking") return null;
  if (auth.state.status === "guest") {
    return (
      <AuthWindow
        error={auth.error}
        isSubmitting={auth.isSubmitting}
        onLogin={(body) => void auth.login(body)}
        onSignup={(body) => void auth.signup(body)}
        onClearError={auth.clearError}
      />
    );
  }

  const startHelp = () => setView("icon");
  const voiceEnabled = settings?.voiceInput ?? false;

  return (
    <>
      <div hidden={view !== "icon"}>
        <IconMode
          isOn={session.isOn}
          hasScreen={session.hasScreen}
          hasPhoto={session.hasPhoto}
          isAnswering={session.isAnswering}
          guide={session.guide}
          guideImage={session.shownImage}
          step={session.step}
          error={session.guideError}
          notice={session.notice}
          showEdge={(settings?.edgeDisplay ?? true) && session.isSharing}
          isBubbleOpen={session.isBubbleOpen}
          question={question}
          voice={voiceEnabled ? { status: voice.status, onToggle: voice.isListening ? voice.cancel : voice.listen } : null}
          onStart={() => void session.play()}
          onStop={session.stop}
          onAsk={(q) => void session.ask(q)}
          onNext={session.next}
          onRetry={() => void session.retry()}
          onQuestionChange={setQuestion}
          onPickPhoto={(file) => void session.pickPhoto(file)}
          onToggleBubble={session.setBubbleOpen}
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
      {view === "history" && (
        <HistoryWindow
          items={history.items}
          error={history.error}
          isLoading={history.isLoading}
          onClear={history.clear}
          onBack={() => setView("settings")}
          onStart={startHelp}
        />
      )}
    </>
  );
}
