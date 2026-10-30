import { createElement, useEffect } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import { HelperApp } from "@/components/helper/HelperApp";
import { IconMode } from "@/components/helper/IconMode";
import { ApiError } from "@/lib/api/types";

const mocks = vi.hoisted(() => ({
  getMe: vi.fn(), login: vi.fn(), signup: vi.fn(), logout: vi.fn(),
  stop: vi.fn(), cancelVoice: vi.fn(), close: vi.fn(), ask: vi.fn(), update: vi.fn(),
  settingsError: null as { code: string; message: string; canRetry: boolean; needsLogin: boolean } | null,
}));
vi.mock("@/components/auth/api", () => mocks);
vi.mock("@/components/settings", () => ({ useSettings: () => ({
  settings: { voiceInput: false, edgeDisplay: true, saveHistory: true },
  error: mocks.settingsError, isSaving: false, update: mocks.update,
}) }));
vi.mock("@/components/history", () => ({ useHistory: () => ({ items: [], error: null }) }));
vi.mock("@/components/pip", () => ({ usePipWindow: () => ({ close: mocks.close, pipWindow: null, isSupported: false }) }));
vi.mock("@/components/voice", () => ({ useSpeechInput: () => ({ cancel: mocks.cancelVoice }) }));
vi.mock("@/components/helper/useHelperSession", () => ({ useHelperSession: () => ({ stop: mocks.stop, ask: mocks.ask }) }));
vi.mock("@/components/helper/IconMode", () => ({ IconMode: () => null }));
vi.mock("@/components/helper/AuthWindow", () => ({ AuthWindow: () => createElement("div", { "data-testid": "auth" }) }));

let auth: ReturnType<typeof useAuth>;
function Probe() {
  const value = useAuth();
  useEffect(() => { auth = value; }, [value]);
  return null;
}
function deferred() {
  let resolve!: () => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
let renderer: ReactTestRenderer;
const button = (label: string) => renderer.root.findAllByType("button").find((node) => node.children.join("") === label)!;
const alerts = () => renderer.root.findAllByProps({ role: "alert" }).map((node) => node.children.join(""));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  mocks.settingsError = null;
  mocks.getMe.mockResolvedValue({ id: 1, email: "synthetic@example.test" });
});
afterEach(async () => {
  if (renderer) await act(async () => renderer.unmount());
  vi.unstubAllGlobals();
});
async function mount() {
  await act(async () => {
    renderer = create(createElement(AuthProvider, null, createElement(Probe), createElement(HelperApp)));
  });
}

describe("logout in settings (mocked APIs only)", () => {
  it("shows pending state, keeps authentication on failure, and permits a successful retry", async () => {
    const first = deferred();
    mocks.logout.mockReturnValueOnce(first.promise).mockResolvedValueOnce(undefined);
    await mount();
    await act(async () => {
      renderer.root.findByType(IconMode).props.onQuestionChange("private question");
    });
    await act(async () => {
      const click = button("로그아웃").props.onClick;
      click();
      click(); // same render: the ref guard, not just the disabled button, must block this
    });
    expect(mocks.logout).toHaveBeenCalledTimes(1);
    expect(button("로그아웃 중…").props.disabled).toBe(true);
    expect(button("도움 시작하기").props.disabled).toBe(true);
    expect(auth.state.status).toBe("signedIn");
    expect(mocks.stop).toHaveBeenCalled();
    expect(mocks.close).toHaveBeenCalled();
    expect(renderer.root.findByType(IconMode).props.question).toBe("");

    await act(async () => first.reject(new ApiError(503, "UNAVAILABLE", "잠시 후 다시 시도해 주세요.")));
    expect(auth.state.status).toBe("signedIn");
    expect(auth.error).toBeNull();
    expect(alerts().join(" ")).toContain("로그아웃하지 못했어요");
    expect(button("로그아웃 다시 시도").props.disabled).toBe(false);
    await act(async () => button("로그아웃 다시 시도").props.onClick());
    expect(mocks.logout).toHaveBeenCalledTimes(2);
    expect(auth.state.status).toBe("guest");
    expect(auth.logoutError).toBeNull();
    expect(renderer.root.findAllByProps({ "data-testid": "auth" })).toHaveLength(1);
  });

  it("keeps settings errors visible independently and clears logout error when retry starts", async () => {
    mocks.settingsError = { code: "SETTINGS_FAILED", message: "설정을 저장하지 못했어요.", canRetry: true, needsLogin: false };
    const retry = deferred();
    mocks.logout.mockRejectedValueOnce(new ApiError(0, "NETWORK_ERROR", "연결을 확인해 주세요."))
      .mockReturnValueOnce(retry.promise);
    await mount();
    await act(async () => button("로그아웃").props.onClick());
    expect(alerts()).toHaveLength(2);
    await act(async () => button("로그아웃 다시 시도").props.onClick());
    expect(alerts()).toEqual(["설정을 저장하지 못했어요."]);
    expect(auth.logoutError).toBeNull();
    await act(async () => retry.resolve());
    expect(auth.state.status).toBe("guest");
  });

  it("preserves the existing login failure and success behavior", async () => {
    mocks.getMe.mockRejectedValueOnce(new ApiError(401, "AUTH_REQUIRED", "로그인이 필요해요."));
    mocks.login.mockRejectedValueOnce(new ApiError(401, "AUTH_INVALID_CREDENTIALS", "비밀번호를 확인해 주세요."))
      .mockResolvedValueOnce({ id: 1, email: "synthetic@example.test" });
    await mount();
    expect(auth.state.status).toBe("guest");
    await act(async () => { expect(await auth.login({ email: "synthetic@example.test", password: "synthetic-only" })).toBe(false); });
    expect(auth.error?.code).toBe("AUTH_INVALID_CREDENTIALS");
    expect(auth.logoutError).toBeNull();
    await act(async () => { expect(await auth.login({ email: "synthetic@example.test", password: "synthetic-only" })).toBe(true); });
    expect(auth.state.status).toBe("signedIn");
    expect(auth.error).toBeNull();
  });
});
