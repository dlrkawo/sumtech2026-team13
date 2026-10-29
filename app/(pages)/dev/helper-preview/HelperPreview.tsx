"use client";

import { useState } from "react";

import { MOCK_GUIDE_EXAMPLES } from "@/components/guide/mock";
import { IconMode, Landing } from "@/components/helper";
import { SettingsWindow } from "@/components/helper/SettingsWindow";
import { DEFAULT_SETTINGS, type SettingsResponse } from "@/server/settings/schema";

// 가짜 값은 여기서만 만들고 IconMode에는 props로 넘긴다 (컴포넌트 안에는 가짜 데이터를 두지 않는다)
export function HelperPreview({ mock, image }: { mock: string; image: string }) {
  const [isBubbleOpen, setBubbleOpen] = useState(true);
  const [question, setQuestion] = useState("친구에게 만원 보내고 싶어");
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<SettingsResponse>(DEFAULT_SETTINGS);
  const guide = MOCK_GUIDE_EXAMPLES[mock] ?? null;
  const noop = () => {};

  if (showSettings) {
    return (
      <SettingsWindow
        email="preview@example.com"
        settings={settings}
        error={null}
        isSaving={false}
        onUpdate={(patch) => setSettings((s) => ({ ...s, ...patch }))}
        onOpenHistory={noop}
        onStart={() => setShowSettings(false)}
        onLogout={noop}
      />
    );
  }

  return (
    <>
      <Landing />
      <IconMode
        isOn
        hasScreen
        hasPhoto
        isAnswering={mock === "loading"}
        guide={guide}
        guideImage={image}
        step={1}
        error={null}
        notice={null}
        showEdge={false}
        isBubbleOpen={isBubbleOpen}
        question={question}
        voice={{ status: "idle", onToggle: noop }}
        onStart={noop}
        onStop={noop}
        onAsk={noop}
        onNext={noop}
        onRetry={noop}
        onQuestionChange={setQuestion}
        onPickPhoto={noop}
        onToggleBubble={setBubbleOpen}
        onOpenSettings={() => setShowSettings(true)}
      />
    </>
  );
}
