"use client";

import { useCallback, useState } from "react";
import { createPortal } from "react-dom";

import { useAuth } from "@/components/auth";
import { useHistory } from "@/components/history";
import { usePipWindow } from "@/components/pip";
import { useSettings } from "@/components/settings";
import { useSpeechInput } from "@/components/voice";

import { AuthWindow } from "./AuthWindow";
import { HistoryWindow } from "./HistoryWindow";
import { IconMode } from "./IconMode";
import { SettingsWindow } from "./SettingsWindow";
import { BUTTON_PRIMARY, FOCUS_RING } from "./styles";
import { useHelperSession } from "./useHelperSession";

// 화면 흐름 (docs/scenarios.yaml, 기획 확정)
//   접속 → 가입/로그인(설정 창 형태) → 설정 창 → [도움 시작하기] → 아이콘 모드
//   아이콘 모드의 [설정] → 설정 창 → [도움 시작하기] → 아이콘 모드
// 로그인·설정·기록·안내 요청·화면 공유·음성 인식은 여기서만 부르고, 각 창에는 값과 함수만 넘긴다.
type View = "settings" | "history" | "icon";

export function HelperApp() {
  const auth = useAuth();
  const signedIn = auth.state.status === "signedIn";
  const { settings, error: settingsError, isSaving: isSavingSettings, update } = useSettings(signedIn);
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
  // 로그인 뒤 화면을 PiP 작은 창으로 옮겨 다른 탭 위에 띄운다 (PiP 미지원 브라우저·E2E에서는 본 화면 그대로)
  const pip = usePipWindow();

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

  const screens = (
    <>
      <div hidden={view !== "icon"}>
        <IconMode
          isOn={session.isOn}
          canPlay={session.canPlay}
          isPicking={session.isPicking}
          hasScreen={session.hasScreen}
          hasPhoto={session.hasPhoto}
          source={session.source}
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
          isSaving={isSavingSettings}
          onUpdate={(patch) => void update(patch)}
          onOpenHistory={() => setView("history")}
          onStart={startHelp}
          onLogout={() => {
            pip.close();
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
          isSaving={isSavingSettings}
          onClear={history.clear}
          onBack={() => setView("settings")}
          onStart={startHelp}
        />
      )}
    </>
  );

  // 본 화면의 PiP 버튼·안내는 아이콘 모드와 같은 자리(좁으면 Landing 아래, sm부터 Landing 오른쪽)에 둔다
  if (pip.pipWindow) {
    return (
      <>
        {createPortal(screens, pip.pipWindow.document.body)}
        <div className="flex flex-col items-center gap-[16px] px-[16px] py-[24px] text-center text-[22px] sm:fixed sm:inset-y-0 sm:right-0 sm:left-[300px] sm:justify-center">
          <p className="font-bold">작은 창에서 도와드리고 있어요</p>
          <div className="w-[320px] max-w-full">
            <button type="button" onClick={pip.close} className={BUTTON_PRIMARY}>
              이 화면으로 돌아오기
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {screens}
      {view === "icon" && pip.isSupported && (
        <div className="z-30 flex flex-col items-center gap-[6px] pb-[20px] sm:fixed sm:top-[16px] sm:right-[16px] sm:items-end sm:pb-0">
          <button
            type="button"
            onClick={() => void pip.open()}
            className={`min-h-[56px] rounded-[30px] border-2 border-[#C9C6BE] bg-white px-[18px] text-[20px] font-bold text-[#16191D] shadow-[0_8px_18px_rgba(0,0,0,.14)] hover:bg-[#F0EFEB] ${FOCUS_RING}`}
          >
            작은 창으로 띄우기
          </button>
          {pip.error && (
            <p role="alert" className="text-[20px] text-[#B42318]">
              {pip.error}
            </p>
          )}
        </div>
      )}
    </>
  );
}
