import { createElement, useEffect } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useHistory } from "@/components/history/useHistory";
import { useSettings } from "@/components/settings/useSettings";
import { HistoryWindow } from "@/components/helper/HistoryWindow";
import { authRequestSchema } from "@/server/auth/schema";
import { DEFAULT_SETTINGS, type SettingsResponse } from "@/server/settings/schema";
import { listHistory, deleteAllHistory, recordGuideHistory } from "@/server/history/service";
import { ApiError } from "@/lib/api/types";

const mocks = vi.hoisted(() => ({
  list: vi.fn(), clear: vi.fn(), get: vi.fn(), update: vi.fn(), query: vi.fn(), serverSettings: vi.fn(),
}));
vi.mock("@/components/history/api", () => ({ listHistory: mocks.list, clearHistory: mocks.clear }));
vi.mock("@/components/settings/api", () => ({ getSettings: mocks.get, updateSettings: mocks.update }));
vi.mock("@/server/db/client", () => ({ query: mocks.query }));
vi.mock("@/server/settings/service", () => ({ getSettings: mocks.serverSettings }));

const items = [{ id: 1, question: "synthetic question", instruction: "synthetic instruction", createdAt: "2026-10-29T00:00:00.000Z" }];
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
let renderer: ReactTestRenderer | undefined;
let history: ReturnType<typeof useHistory>;
let settings: ReturnType<typeof useSettings>;
function HistoryProbe({ enabled }: { enabled: boolean }) {
  const value = useHistory(enabled);
  useEffect(() => { history = value; }, [value]);
  return null;
}
function SettingsProbe({ enabled }: { enabled: boolean }) {
  const value = useSettings(enabled);
  useEffect(() => { settings = value; }, [value]);
  return null;
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  mocks.list.mockResolvedValue(items);
  mocks.get.mockResolvedValue(DEFAULT_SETTINGS);
});
afterEach(async () => {
  await act(async () => { renderer?.unmount(); });
  renderer = undefined;
  vi.unstubAllGlobals();
});

describe("PR96 F1 authentication input contract", () => {
  it("normalizes email before validation and accepts password boundaries", () => {
    for (const length of [8, 72]) {
      expect(authRequestSchema.parse({ email: "  USER@EXAMPLE.TEST  ", password: "x".repeat(length) }))
        .toEqual({ email: "user@example.test", password: "x".repeat(length) });
    }
  });
  it.each([7, 73])("rejects password length %i with a Korean reason", (length) => {
    const result = authRequestSchema.safeParse({ email: "user@example.test", password: "x".repeat(length) });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toMatch(/비밀번호/);
  });
  it("rejects malformed email with a Korean reason", () => {
    const result = authRequestSchema.safeParse({ email: " invalid ", password: "synthetic" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toContain("이메일 형식");
  });
});

describe("PR96 F5 history UI and query contract", () => {
  it("keeps the displayed list after an uncertain delete and refetches on reopening", async () => {
    mocks.clear.mockRejectedValueOnce(new ApiError(0, "NETWORK_ERROR", "연결을 확인해 주세요."));
    await act(async () => { renderer = create(createElement(HistoryProbe, { enabled: true })); });
    expect(history.items).toEqual(items);
    await act(async () => { await history.clear(); });
    expect(history.items).toEqual(items);
    expect(history.error).not.toBeNull();
    await act(async () => { renderer!.update(createElement(HistoryProbe, { enabled: false })); });
    mocks.list.mockResolvedValueOnce([]); // The server may have deleted despite the lost response.
    await act(async () => { renderer!.update(createElement(HistoryProbe, { enabled: true })); });
    expect(mocks.list).toHaveBeenCalledTimes(2);
    expect(history.items).toEqual([]);
    expect(history.error).toBeNull();
  });
  it("reports a list failure and clears the list on confirmed delete success", async () => {
    mocks.list.mockRejectedValueOnce(new ApiError(503, "DB_UNAVAILABLE", "다시 확인해 주세요."));
    await act(async () => { renderer = create(createElement(HistoryProbe, { enabled: true })); });
    expect(history.error?.code).toBe("DB_UNAVAILABLE");
    await act(async () => { renderer!.update(createElement(HistoryProbe, { enabled: false })); });
    await act(async () => { renderer!.update(createElement(HistoryProbe, { enabled: true })); });
    mocks.clear.mockResolvedValueOnce(undefined);
    await act(async () => { await history.clear(); });
    expect(history.items).toEqual([]);
    expect(history.error).toBeNull();
  });
  it("requires confirmation and cancel does not send a delete", async () => {
    const clear = vi.fn().mockResolvedValue(undefined);
    await act(async () => { renderer = create(createElement(HistoryWindow, {
      items, error: null, isLoading: false, isSaving: false, onClear: clear, onBack: vi.fn(), onStart: vi.fn(),
    })); });
    const click = (label: string) => renderer!.root.findAllByType("button").find((node) => node.children.join("") === label)!.props.onClick();
    await act(async () => { click("기록 모두 지우기"); });
    expect(clear).not.toHaveBeenCalled();
    await act(async () => { click("그대로 두기"); });
    expect(clear).not.toHaveBeenCalled();
    await act(async () => { click("기록 모두 지우기"); });
    await act(async () => { click("모두 지우기"); });
    expect(clear).toHaveBeenCalledOnce();
  });
  it("limits only SELECT to latest 50 and deletes all rows for only the current user", async () => {
    mocks.query.mockResolvedValueOnce([{ id: 1, question: "q", instruction: "i", created_at: new Date(items[0].createdAt) }]);
    expect(await listHistory(42)).toEqual([{ ...items[0], question: "q", instruction: "i" }]);
    expect(mocks.query).toHaveBeenNthCalledWith(1, expect.stringMatching(/WHERE user_id = \$1 ORDER BY created_at DESC, id DESC LIMIT \$2/), [42, 50]);
    await deleteAllHistory(42);
    expect(mocks.query).toHaveBeenNthCalledWith(2, "DELETE FROM guide_histories WHERE user_id = $1", [42]);
  });
});

describe("PR96 F6 save-history persistence", () => {
  it("keeps pending state until save succeeds and restores the switch on failure", async () => {
    const pending = deferred<SettingsResponse>();
    mocks.update.mockReturnValueOnce(pending.promise);
    await act(async () => { renderer = create(createElement(SettingsProbe, { enabled: true })); });
    let saving!: Promise<void>;
    await act(async () => { saving = settings.update({ saveHistory: false }); });
    expect(settings.isSaving).toBe(true);
    expect(settings.settings?.saveHistory).toBe(false);
    await act(async () => { pending.reject(new ApiError(503, "DB_UNAVAILABLE", "저장하지 못했어요.")); await saving; });
    expect(settings.isSaving).toBe(false);
    expect(settings.settings?.saveHistory).toBe(true);
    expect(settings.error).not.toBeNull();
    mocks.update.mockResolvedValueOnce({ ...DEFAULT_SETTINGS, saveHistory: false });
    await act(async () => { await settings.update({ saveHistory: false }); });
    expect(settings.settings?.saveHistory).toBe(false);
    expect(settings.error).toBeNull();
  });
  it("reads the latest setting for each new record and never removes older records when switched off", async () => {
    mocks.serverSettings.mockResolvedValueOnce({ ...DEFAULT_SETTINGS, saveHistory: true })
      .mockResolvedValueOnce({ ...DEFAULT_SETTINGS, saveHistory: false });
    await recordGuideHistory(42, "first question", "first instruction");
    await recordGuideHistory(42, "second question", "second instruction");
    expect(mocks.serverSettings).toHaveBeenCalledTimes(2);
    expect(mocks.query).toHaveBeenCalledOnce();
    expect(mocks.query).toHaveBeenCalledWith("INSERT INTO guide_histories (user_id, question, instruction) VALUES ($1, $2, $3)", [42, "first question", "first instruction"]);
  });
});
