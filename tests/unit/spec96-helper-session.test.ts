import { createElement } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useHelperSession } from "@/components/helper/useHelperSession";
import { ApiError } from "@/lib/api/types";
const mocks = vi.hoisted(() => ({ file: vi.fn(), api: vi.fn(), capture: vi.fn(), start: vi.fn(), stop: vi.fn(), sharing: false }));
vi.mock("@/lib/image", async (original) => ({ ...await original<typeof import("@/lib/image")>(), fileToDataUrl: mocks.file }));
vi.mock("@/components/guide/api", () => ({ createGuide: mocks.api }));
vi.mock("@/components/capture", () => ({ useScreenShare: () => ({ isSharing: mocks.sharing, status: mocks.sharing ? "sharing" : "idle", error: null, captureFrame: mocks.capture, start: mocks.start, stop: mocks.stop }) }));
function deferred<T>() { let resolve!: (v:T)=>void; let reject!: (v:unknown)=>void; const promise = new Promise<T>((a,b)=>{resolve=a;reject=b;}); return {promise,resolve,reject}; }
const answer = { status: "IN_PROGRESS", instruction: "다음 버튼", target: null, risk: null };
describe("PR96 F2/F3/F7 helper session", () => {
 let h: ReturnType<typeof useHelperSession>; let root: ReactTestRenderer;
 function Probe() { h = useHelperSession({onNeedLogin: vi.fn()}); return null; }
 beforeEach(async () => { vi.clearAllMocks(); mocks.sharing=false; mocks.api.mockResolvedValue(answer); vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT",true); await act(async()=>{root=create(createElement(Probe));}); });
 afterEach(async()=>{ await act(async()=>root.unmount()); vi.unstubAllGlobals(); });
 async function photo(data="A") { mocks.file.mockResolvedValueOnce(data); await act(async()=>{await h.pickPhoto({} as File);}); }
 it.each(["resolve","reject"])("stop ignores late photo %s",async outcome=>{
  const d=deferred<string>(); mocks.file.mockReturnValueOnce(d.promise); let pending!:Promise<void>;
  await act(async()=>{pending=h.pickPhoto({} as File);}); await act(async()=>h.stop());
  await act(async()=>{if(outcome==="resolve") d.resolve("late"); else d.reject(new Error("invalid")); await pending;});
  expect(h.isOn).toBe(false); expect(h.hasPhoto).toBe(false); expect(h.notice).toBeNull(); expect(mocks.api).not.toHaveBeenCalled();
 });
 it("latest selected photo wins when decoding finishes out of order",async()=>{
  const a=deferred<string>(); const b=deferred<string>(); mocks.file.mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise); let pa!:Promise<void>;let pb!:Promise<void>;
  await act(async()=>{pa=h.pickPhoto({} as File);pb=h.pickPhoto({} as File);});
  await act(async()=>{b.resolve("B");await pb;}); await act(async()=>{a.resolve("A");await pa;});
  await act(async()=>h.ask("q")); expect(mocks.api).toHaveBeenLastCalledWith({image:"B",question:"q"});
 });
 it("a newer play choice stays active when an earlier photo finishes decoding",async()=>{
  const d=deferred<string>();mocks.file.mockReturnValueOnce(d.promise);let p!:Promise<void>;
  await act(async()=>{p=h.pickPhoto({} as File);});mocks.sharing=true;await act(async()=>h.play());
  await act(async()=>{d.resolve("photo");await p;});expect(h.source).toBe("share");expect(h.hasPhoto).toBe(true);
 });
 it.each(["resolve","reject"])("stop ignores late capture %s and does not restore notice",async outcome=>{
  mocks.sharing=true; await act(async()=>h.play()); const d=deferred<string>();mocks.capture.mockReturnValueOnce(d.promise);let p!:Promise<void>;
  await act(async()=>{p=h.ask("q");});await act(async()=>h.stop());
  await act(async()=>{if(outcome==="resolve")d.resolve("frame");else d.reject(new Error("ended"));await p;});
  expect(mocks.api).not.toHaveBeenCalled();expect(h.shownImage).toBeNull();expect(h.notice).toBeNull();expect(h.isOn).toBe(false);
 });
 it("failed photo conversion preserves previous photo/source and retry; successful selection clears error",async()=>{
  await photo();mocks.api.mockRejectedValueOnce(new ApiError(503,"AI_FAILED","실패"));await act(async()=>h.ask("q"));expect(h.guideError).not.toBeNull();
  mocks.file.mockRejectedValueOnce(new Error("invalid"));await act(async()=>h.pickPhoto({} as File));expect(h.source).toBe("photo");expect(h.hasPhoto).toBe(true);expect(h.guideError).not.toBeNull();
  await act(async()=>h.retry());expect(mocks.api).toHaveBeenLastCalledWith({image:"A",question:"q"});
  mocks.api.mockRejectedValueOnce(new ApiError(503,"AI_FAILED","실패"));await act(async()=>h.ask("q"));await photo("B");expect(h.guideError).toBeNull();expect(mocks.api).toHaveBeenCalledTimes(3);
 });
 it("same photo next is blocked; different image continues, same image asks restart",async()=>{
  await photo();await act(async()=>h.ask(" q "));await act(async()=>h.next());expect(mocks.api).toHaveBeenCalledTimes(1);expect(h.notice?.kind).toBe("samePhoto");
  await photo("B");await act(async()=>h.ask("q"));expect(mocks.api).toHaveBeenLastCalledWith({image:"B",question:"q",previousInstructions:["다음 버튼"]});expect(h.step).toBe(2);
  await act(async()=>h.ask("q"));expect(mocks.api).toHaveBeenLastCalledWith({image:"B",question:"q"});expect(h.step).toBe(1);
 });
 it("same shared data is not continuation and browser stop preserves photo and guidance",async()=>{
  await photo();mocks.sharing=true;await act(async()=>h.play());mocks.capture.mockResolvedValue("frame");await act(async()=>h.ask("q"));await act(async()=>h.ask("q"));expect(h.step).toBe(1);expect(mocks.api).toHaveBeenLastCalledWith({image:"frame",question:"q"});
  mocks.sharing=false;await act(async()=>root.update(createElement(Probe)));expect(h.source).toBe("photo");expect(h.guide).toEqual(answer);expect(h.hasPhoto).toBe(true);
 });
 it("stop discards late guide response and resets photo, image, step and retry",async()=>{
  await photo();const d=deferred<typeof answer>();mocks.api.mockReturnValueOnce(d.promise);let p!:Promise<void>;await act(async()=>{p=h.ask("q");});await act(async()=>h.stop());await act(async()=>{d.resolve(answer);await p;});expect(h.guide).toBeNull();expect(h.shownImage).toBeNull();expect(h.hasPhoto).toBe(false);expect(h.step).toBe(1);await act(async()=>h.retry());expect(mocks.api).toHaveBeenCalledTimes(1);
 });
});
