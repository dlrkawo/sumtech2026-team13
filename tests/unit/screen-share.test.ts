import { createElement } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useScreenShare } from "@/components/capture/useScreenShare";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function media() {
  const tracks = [0, 1].map(() => ({ stop: vi.fn(), onended: null, getSettings: () => ({}) }));
  return { tracks, stream: { getTracks: () => tracks, getVideoTracks: () => tracks.slice(0, 1) } as unknown as MediaStream };
}

describe("screen share request lifetime", () => {
  let hook: ReturnType<typeof useScreenShare>;
  let root: ReactTestRenderer | undefined;
  const getDisplayMedia = vi.fn();
  const createVideo = vi.fn(() => ({ play: () => Promise.resolve(), srcObject: null }));
  function Harness() { hook = useScreenShare(); return null; }
  beforeEach(async () => {
    getDisplayMedia.mockReset();
    createVideo.mockClear();
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal("window", {});
    vi.stubGlobal("navigator", { mediaDevices: { getDisplayMedia } });
    vi.stubGlobal("document", { createElement: createVideo });
    await act(async () => { root = create(createElement(Harness)); });
  });
  afterEach(async () => {
    await act(async () => { root?.unmount(); });
    root = undefined;
    vi.unstubAllGlobals();
  });
  it("stops every late track after stop without attaching a video", async () => {
    const pending = deferred<MediaStream>();
    const result = media();
    getDisplayMedia.mockReturnValueOnce(pending.promise);
    let start!: Promise<void>;
    await act(async () => { start = hook.start(); });
    await act(async () => { hook.stop(); });
    await act(async () => { pending.resolve(result.stream); await start; });
    expect(hook.status).toBe("stopped");
    expect(hook.error).toBeNull();
    result.tracks.forEach((track) => expect(track.stop).toHaveBeenCalledOnce());
    expect(createVideo).not.toHaveBeenCalled();
  });
  it("ignores a cancelled request rejection", async () => {
    const pending = deferred<MediaStream>();
    getDisplayMedia.mockReturnValueOnce(pending.promise);
    let start!: Promise<void>;
    await act(async () => { start = hook.start(); hook.stop(); });
    await act(async () => { pending.reject(new DOMException("cancelled", "NotAllowedError")); await start; });
    expect(hook.status).toBe("stopped");
    expect(hook.error).toBeNull();
  });
  it.each(["resolve", "reject"] as const)("old %s cannot clear a newer pending request", async (outcome) => {
    const old = deferred<MediaStream>();
    const next = deferred<MediaStream>();
    const stale = media();
    const active = media();
    getDisplayMedia.mockReturnValueOnce(old.promise).mockReturnValueOnce(next.promise);
    let a!: Promise<void>;
    let b!: Promise<void>;
    await act(async () => { a = hook.start(); hook.stop(); b = hook.start(); });
    await act(async () => {
      if (outcome === "resolve") old.resolve(stale.stream);
      else old.reject(new DOMException("cancelled", "NotAllowedError"));
      await a;
    });
    expect(hook.status).toBe("starting");
    expect(hook.error).toBeNull();
    await act(async () => { await hook.start(); });
    expect(getDisplayMedia).toHaveBeenCalledTimes(2);
    await act(async () => { next.resolve(active.stream); await b; });
    expect(hook.isSharing).toBe(true);
    expect(createVideo).toHaveBeenCalledOnce();
    active.tracks.forEach((track) => expect(track.stop).not.toHaveBeenCalled());
    if (outcome === "resolve") stale.tracks.forEach((track) => expect(track.stop).toHaveBeenCalledOnce());
  });
  it("a late old stream cannot replace an already active newer share", async () => {
    const old = deferred<MediaStream>();
    const next = deferred<MediaStream>();
    const stale = media();
    const active = media();
    getDisplayMedia.mockReturnValueOnce(old.promise).mockReturnValueOnce(next.promise);
    let a!: Promise<void>;
    let b!: Promise<void>;
    await act(async () => { a = hook.start(); hook.stop(); b = hook.start(); });
    await act(async () => { next.resolve(active.stream); await b; });
    await act(async () => { old.resolve(stale.stream); await a; });
    expect(hook.isSharing).toBe(true);
    expect(createVideo).toHaveBeenCalledOnce();
    stale.tracks.forEach((track) => expect(track.stop).toHaveBeenCalledOnce());
    active.tracks.forEach((track) => expect(track.stop).not.toHaveBeenCalled());
    await act(async () => { hook.stop(); });
    active.tracks.forEach((track) => expect(track.stop).toHaveBeenCalledOnce());
  });
  it("stops late streams after unmount", async () => {
    const pending = deferred<MediaStream>();
    const result = media();
    getDisplayMedia.mockReturnValueOnce(pending.promise);
    let start!: Promise<void>;
    await act(async () => { start = hook.start(); });
    await act(async () => { root?.unmount(); root = undefined; });
    await act(async () => { pending.resolve(result.stream); await start; });
    result.tracks.forEach((track) => expect(track.stop).toHaveBeenCalledOnce());
    expect(createVideo).not.toHaveBeenCalled();
  });
  it("still reports current chooser cancellation and permits retry", async () => {
    getDisplayMedia.mockRejectedValueOnce(new DOMException("cancelled", "NotAllowedError"));
    await act(async () => { await hook.start(); });
    expect(hook.status).toBe("idle");
    expect(hook.error?.code).toBe("SHARE_DENIED");
    const active = media();
    getDisplayMedia.mockResolvedValueOnce(active.stream);
    await act(async () => { await hook.start(); });
    expect(hook.isSharing).toBe(true);
    expect(hook.error).toBeNull();
    await act(async () => { hook.stop(); });
    active.tracks.forEach((track) => expect(track.stop).toHaveBeenCalledOnce());
  });
});
