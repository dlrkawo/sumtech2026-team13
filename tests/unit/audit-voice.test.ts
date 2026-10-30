import { createElement } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HelperApp } from "@/components/helper/HelperApp";
import { IconMode } from "@/components/helper/IconMode";
import { SettingsWindow } from "@/components/helper/SettingsWindow";
import { useSpeechInput } from "@/components/voice/useSpeechInput";

const mocks = vi.hoisted(() => ({
  stop: vi.fn(), ask: vi.fn(), logout: vi.fn(), markSignedOut: vi.fn(), close: vi.fn(),
  expired: false,
}));
vi.mock("@/components/auth", () => ({ useAuth: () => ({
  state: { status: "signedIn", user: { email: "synthetic@example.test" } },
  logout: mocks.logout, markSignedOut: mocks.markSignedOut,
}) }));
vi.mock("@/components/settings", () => ({ useSettings: () => ({
  settings: { voiceInput: true, saveHistory: true }, error: mocks.expired ? { needsLogin: true } : null,
}) }));
vi.mock("@/components/history", () => ({ useHistory: () => ({}) }));
vi.mock("@/components/pip", () => ({ usePipWindow: () => ({ close: mocks.close }) }));
vi.mock("@/components/helper/useHelperSession", () => ({ useHelperSession: () => ({ stop: mocks.stop, ask: mocks.ask }) }));
vi.mock("@/components/helper/IconMode", () => ({ IconMode: () => null }));
vi.mock("@/components/helper/SettingsWindow", () => ({ SettingsWindow: () => null }));

type Result = { results: Array<Array<{ transcript: string }> & { isFinal: boolean }> };
class Recognition {
  static instances: Recognition[] = [];
  onresult: ((event: Result) => void) | null = null;
  onerror: (() => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  abort = vi.fn();
  constructor() { Recognition.instances.push(this); }
}
const result = { results: [Object.assign([{ transcript: "late private question" }], { isFinal: true })] };
let root: ReactTestRenderer | undefined;
beforeEach(() => {
  vi.clearAllMocks();
  mocks.expired = false;
  Recognition.instances = [];
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("window", { SpeechRecognition: Recognition });
});
afterEach(async () => {
  await act(async () => { root?.unmount(); });
  root = undefined;
  vi.unstubAllGlobals();
});

describe("connected HelperApp voice cleanup", () => {
  it.each(["logout", "stop", "expiry"])("%s aborts speech and rejects already queued callbacks", async (action) => {
    await act(async () => { root = create(createElement(HelperApp)); });
    const icon = () => root!.root.findByType(IconMode);
    await act(async () => icon().props.voice.onToggle());
    const old = Recognition.instances[0];
    const queued = { result: old.onresult!, error: old.onerror!, end: old.onend! };
    await act(async () => {
      if (action === "logout") root!.root.findByType(SettingsWindow).props.onLogout();
      else if (action === "stop") icon().props.onStop();
      else { mocks.expired = true; root!.update(createElement(HelperApp)); }
    });
    expect(old.abort).toHaveBeenCalledOnce();
    expect(mocks.stop).toHaveBeenCalled();
    if (action === "logout") expect(mocks.logout).toHaveBeenCalledOnce();
    if (action === "expiry") expect(mocks.markSignedOut).toHaveBeenCalledOnce();
    await act(async () => { queued.result(result); queued.error(); queued.end(); });
    expect(icon().props.question).toBe("");
    expect(icon().props.voice.status).toBe("idle");
    expect(mocks.ask).not.toHaveBeenCalled();
  });
});

describe("speech request identity", () => {
  it("old callbacks cannot affect a new recognition and current results still work", async () => {
    let voice!: ReturnType<typeof useSpeechInput>;
    const onText = vi.fn();
    function Probe() { voice = useSpeechInput(onText); return null; }
    await act(async () => { root = create(createElement(Probe)); });
    await act(async () => voice.listen());
    const old = Recognition.instances[0];
    const queued = { result: old.onresult!, error: old.onerror!, end: old.onend! };
    await act(async () => { voice.cancel(); voice.listen(); });
    const current = Recognition.instances[1];
    await act(async () => { queued.result(result); queued.error(); queued.end(); voice.listen(); });
    expect(Recognition.instances).toHaveLength(2);
    expect(voice.status).toBe("listening");
    expect(onText).not.toHaveBeenCalled();
    await act(async () => current.onresult!(result));
    expect(onText).toHaveBeenCalledWith("late private question");
    await act(async () => current.onend!());
    expect(voice.status).toBe("idle");
  });

  it("unmount aborts speech and invalidates queued result/error/end", async () => {
    let voice!: ReturnType<typeof useSpeechInput>;
    const onText = vi.fn();
    function Probe() { voice = useSpeechInput(onText); return null; }
    await act(async () => { root = create(createElement(Probe)); });
    await act(async () => voice.listen());
    const old = Recognition.instances[0];
    const queued = { result: old.onresult!, error: old.onerror!, end: old.onend! };
    await act(async () => { root!.unmount(); root = undefined; });
    expect(old.abort).toHaveBeenCalledOnce();
    await act(async () => { queued.result(result); queued.error(); queued.end(); });
    expect(onText).not.toHaveBeenCalled();
  });
});
