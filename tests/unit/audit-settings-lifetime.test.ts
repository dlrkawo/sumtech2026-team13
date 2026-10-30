import { createElement, useEffect } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSettings } from "@/components/settings/useSettings";
import { SettingsWindow } from "@/components/helper/SettingsWindow";
import { DEFAULT_SETTINGS, type SettingsResponse } from "@/server/settings/schema";
import { ApiError } from "@/lib/api/types";
const api = vi.hoisted(() => ({ get: vi.fn(), update: vi.fn() }));
vi.mock("@/components/settings/api", () => ({ getSettings: api.get, updateSettings: api.update }));
function deferred<T>() {
  let resolve!: (v: T) => void; let reject!: (e: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
let current: ReturnType<typeof useSettings>;
function Screen({ enabled, userId }: { enabled: boolean; userId: number }) {
  const settings = useSettings(enabled, userId);
  useEffect(() => { current = settings; }, [settings]);
  return createElement(SettingsWindow, {
    email: `user${userId}@example.test`, settings: settings.settings, error: settings.error,
    isSaving: settings.isSaving, logoutError: null, isLoggingOut: false,
    onUpdate: settings.update, onOpenHistory: vi.fn(), onStart: vi.fn(), onLogout: vi.fn(),
  });
}
describe("settings account lifetime and connected controls", () => {
  let root: ReactTestRenderer;
  beforeEach(async () => {
    vi.resetAllMocks(); vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    api.get.mockResolvedValue(DEFAULT_SETTINGS);
    await act(async () => { root = create(createElement(Screen, { enabled: true, userId: 1 })); });
  });
  afterEach(async () => { await act(async () => root.unmount()); vi.unstubAllGlobals(); });
  const changeAccount = async (userId: number, enabled = true) => {
    await act(async () => root.update(createElement(Screen, { enabled, userId })));
  };
  it.each(["resolve", "reject"])("ignores old %s, skips queued old PATCH and leaves new account save pending", async (outcome) => {
    const old = deferred<SettingsResponse>(); const next = deferred<SettingsResponse>();
    api.update.mockReturnValueOnce(old.promise).mockReturnValueOnce(next.promise);
    let oldSave!: Promise<void>; let queued!: Promise<void>; let newSave!: Promise<void>;
    await act(async () => {
      oldSave = current.update({ saveHistory: false });
      queued = current.update({ voiceInput: true });
    });
    expect(api.update).toHaveBeenCalledTimes(1);
    await changeAccount(1, false);
    expect(current.isSaving).toBe(false);
    await changeAccount(2);
    await act(async () => { newSave = current.update({ edgeDisplay: false }); });
    expect(api.update).toHaveBeenCalledTimes(2); // new account is not blocked by old network request
    await act(async () => {
      if (outcome === "resolve") old.resolve({ ...DEFAULT_SETTINGS, saveHistory: false });
      else old.reject(new ApiError(401, "AUTH_REQUIRED", "old session"));
      await oldSave; await queued;
    });
    expect(api.update).toHaveBeenCalledTimes(2); // queued old voiceInput PATCH never sent
    expect(current.error).toBeNull(); expect(current.isSaving).toBe(true);
    expect(current.settings?.saveHistory).toBe(true);
    const start = root.root.findAllByType("button").find(node => node.children.join("") === "도움 시작하기")!;
    expect(start.props.disabled).toBe(true);
    await act(async () => { next.resolve({ ...DEFAULT_SETTINGS, edgeDisplay: false }); await newSave; });
    expect(current.isSaving).toBe(false); expect(current.settings?.edgeDisplay).toBe(false);
  });
  it("invalidates direct signed-in A to B identity changes and late GET responses", async () => {
    const lateGet = deferred<SettingsResponse>(); const lateSave = deferred<SettingsResponse>();
    api.update.mockReturnValueOnce(lateSave.promise); let save!: Promise<void>;
    await act(async () => { save = current.update({ saveHistory: false }); });
    api.get.mockReturnValueOnce(lateGet.promise); await changeAccount(2);
    api.get.mockResolvedValueOnce({ ...DEFAULT_SETTINGS, voiceInput: true }); await changeAccount(3);
    await act(async () => { lateGet.resolve({ ...DEFAULT_SETTINGS, saveHistory: false }); lateSave.resolve({ ...DEFAULT_SETTINGS, saveHistory: false }); await save; });
    expect(current.settings).toEqual({ ...DEFAULT_SETTINGS, voiceInput: true });
    expect(current.error).toBeNull(); expect(current.isSaving).toBe(false);
  });
  it("still serializes writes in one account and ignores updates while disabled", async () => {
    const first = deferred<SettingsResponse>(); api.update.mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce({ ...DEFAULT_SETTINGS, saveHistory: false, voiceInput: true });
    let a!: Promise<void>; let b!: Promise<void>;
    await act(async () => { a = current.update({ saveHistory: false }); b = current.update({ voiceInput: true }); });
    expect(api.update).toHaveBeenCalledTimes(1);
    await act(async () => { first.resolve({ ...DEFAULT_SETTINGS, saveHistory: false }); await a; await b; });
    expect(api.update).toHaveBeenCalledTimes(2); expect(current.settings?.voiceInput).toBe(true);
    await changeAccount(1, false); await act(async () => { await current.update({ saveHistory: true }); });
    expect(api.update).toHaveBeenCalledTimes(2);
  });
});
