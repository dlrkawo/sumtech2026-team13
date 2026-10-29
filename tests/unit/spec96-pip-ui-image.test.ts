import { createElement } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePipWindow } from "@/components/pip/usePipWindow";
import { AnswerBubble } from "@/components/helper/AnswerBubble";
import { fileToDataUrl } from "@/lib/image";
import { MAX_IMAGE_DATA_URL_LENGTH } from "@/lib/constants";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function mockWindow() {
  const listeners = new Map<string, () => void>();
  const win = {
    document: { documentElement: {}, body: {}, head: { append: vi.fn() }, createElement: () => ({}) },
    close: vi.fn(),
    addEventListener: (name: string, cb: () => void) => listeners.set(name, cb),
  };
  return { win: win as unknown as Window, close: win.close, hide: () => listeners.get("pagehide")?.() };
}
let root: ReactTestRenderer | undefined;
beforeEach(() => vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true));
afterEach(async () => {
  await act(async () => { root?.unmount(); });
  root = undefined;
  vi.unstubAllGlobals();
});
describe("F8 PiP lifetime", () => {
  let hook: ReturnType<typeof usePipWindow>;
  const requestWindow = vi.fn();
  function Harness() { hook = usePipWindow(); return null; }
  beforeEach(async () => {
    requestWindow.mockReset();
    vi.stubGlobal("window", { documentPictureInPicture: { requestWindow } });
    vi.stubGlobal("document", { styleSheets: [], documentElement: { lang: "ko" }, body: { className: "app" } });
    await act(async () => { root = create(createElement(Harness)); });
  });
  it.each(["close", "unmount"] as const)("closes a late window after %s", async (action) => {
    const pending = deferred<Window>();
    const popup = mockWindow();
    requestWindow.mockReturnValueOnce(pending.promise);
    let opening!: Promise<void>;
    await act(async () => { opening = hook.open(); });
    await act(async () => { if (action === "close") hook.close(); else { root?.unmount(); root = undefined; } });
    await act(async () => { pending.resolve(popup.win); await opening; });
    expect(popup.close).toHaveBeenCalledOnce();
    expect(hook.pipWindow).toBeNull();
  });
  it("stale rejection cannot unlock or error a newer pending open", async () => {
    const old = deferred<Window>();
    const next = deferred<Window>();
    requestWindow.mockReturnValueOnce(old.promise).mockReturnValueOnce(next.promise);
    let a!: Promise<void>; let b!: Promise<void>;
    await act(async () => { a = hook.open(); hook.close(); b = hook.open(); });
    await act(async () => { old.reject(new Error("old")); await a; await hook.open(); });
    expect(requestWindow).toHaveBeenCalledTimes(2);
    expect(hook.error).toBeNull();
    const popup = mockWindow();
    await act(async () => { next.resolve(popup.win); await b; });
    expect(hook.pipWindow).toBe(popup.win);
    await act(async () => { popup.hide(); });
    expect(hook.pipWindow).toBeNull();
  });
  it("reports open failure and allows normal open/close retry", async () => {
    requestWindow.mockRejectedValueOnce(new Error("denied"));
    await act(async () => { await hook.open(); });
    expect(hook.error).toBe("작은 창을 열지 못했어요.");
    const popup = mockWindow();
    requestWindow.mockResolvedValueOnce(popup.win);
    await act(async () => { await hook.open(); });
    expect(hook.error).toBeNull();
    expect(popup.win.document.documentElement.lang).toBe("ko");
    await act(async () => { hook.close(); });
    expect(popup.close).toHaveBeenCalledOnce();
    expect(hook.pipWindow).toBeNull();
  });
});
describe("F2/F4 result combinations", () => {
  it.each(["IN_PROGRESS", "NEED_INFO", "DONE"] as const)("shows target-independent risk for %s and only appropriate next action", async (status) => {
    await act(async () => { root = create(createElement(AnswerBubble, {
      title: "안내", isLoading: false, guide: { status, target: null, instruction: "안내 문장", risk: { message: "위험 경고" } },
      image: null, step: 2, error: null, notice: null, idleText: "", onNext: vi.fn(), onRetry: vi.fn(), onClose: vi.fn(), hasPhoto: true, source: "photo", onPickPhoto: vi.fn(),
    })); });
    const text = JSON.stringify(root!.toJSON());
    expect(text).toContain("위험 경고");
    expect(text).toContain("누르는 건 직접 해 주세요.");
    expect(text).not.toContain("누를 곳을 찾았어요");
    expect(text.includes("눌렀어요, 다음 알려 주세요")).toBe(status === "IN_PROGRESS");
    expect(text).not.toContain("click-highlight");
  });
});
describe("F2 converted photo limits", () => {
  it("scales to 1280 and JPEG .7, checks converted data not source file size, closes bitmap", async () => {
    const bitmap = { width: 2560, height: 1440, close: vi.fn() };
    const context = { fillRect: vi.fn(), drawImage: vi.fn() };
    const canvas = { width: 0, height: 0, getContext: () => context, toDataURL: vi.fn(() => "data:image/jpeg;base64,ok") };
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue(bitmap));
    vi.stubGlobal("document", { createElement: () => canvas });
    const file = new File([new Uint8Array(MAX_IMAGE_DATA_URL_LENGTH + 1)], "large.png", { type: "image/png" });
    await expect(fileToDataUrl(file)).resolves.toBe("data:image/jpeg;base64,ok");
    expect(canvas.width).toBe(1280); expect(canvas.height).toBe(720);
    expect(canvas.toDataURL).toHaveBeenCalledWith("image/jpeg", 0.7);
    expect(bitmap.close).toHaveBeenCalledOnce();
    canvas.toDataURL.mockReturnValue("x".repeat(MAX_IMAGE_DATA_URL_LENGTH + 1));
    await expect(fileToDataUrl(file)).rejects.toMatchObject({ code: "IMAGE_TOO_LARGE" });
    expect(bitmap.close).toHaveBeenCalledTimes(2);
  });
});
