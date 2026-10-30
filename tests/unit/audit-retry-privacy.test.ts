import { createElement } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnswerBubble } from "@/components/helper/AnswerBubble";
import { SettingsWindow } from "@/components/helper/SettingsWindow";
import { useHelperSession } from "@/components/helper/useHelperSession";
import { ApiError } from "@/lib/api/types";
import { FIXTURE_BUTTON, matchesFixtureButton } from "@/e2e/helpers/fixture-target";
const mocks = vi.hoisted(() => ({ file: vi.fn(), api: vi.fn() }));
vi.mock("@/lib/image", async original => ({ ...await original<typeof import("@/lib/image")>(), fileToDataUrl: mocks.file }));
vi.mock("@/components/guide/api", () => ({ createGuide: mocks.api }));
vi.mock("@/components/capture", () => ({ useScreenShare: () => ({ isSharing: false, status: "idle", error: null, start: vi.fn(), stop: vi.fn() }) }));
vi.mock("@/components/helper/ScreenPreview", () => ({ canZoom: () => false, ScreenPreview: () => null, TargetZoom: () => null }));
describe("audit connected photo retry and privacy", () => {
  let root: ReactTestRenderer;
  let session: ReturnType<typeof useHelperSession>;
  function Connected() {
    session = useHelperSession({ onNeedLogin: vi.fn() });
    return createElement(AnswerBubble, { title: "도움", isLoading: session.isAnswering, guide: session.guide, image: session.shownImage,
      step: session.step, error: session.guideError, notice: session.notice, idleText: "", onNext: session.next,
      onRetry: session.retry, onClose: vi.fn(), hasPhoto: session.hasPhoto, source: session.source, onPickPhoto: session.pickPhoto });
  }
  beforeEach(() => { vi.resetAllMocks(); vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); });
  afterEach(async () => { await act(async () => root?.unmount()); vi.unstubAllGlobals(); });
  it("failed replacement leaves old request retry visible, and retry sends original image/question", async () => {
    mocks.file.mockResolvedValueOnce("original-image").mockRejectedValueOnce(new Error("사진 변환 실패"));
    mocks.api.mockRejectedValueOnce(new ApiError(503, "AI_FAILED", "AI 안내 실패"))
      .mockResolvedValueOnce({ status: "DONE", instruction: "완료", target: null, risk: null });
    await act(async () => { root = create(createElement(Connected)); });
    await act(async () => session.pickPhoto({} as File));
    await act(async () => session.ask("원래 질문"));
    // 실제 AnswerBubble 파일 입력 이벤트 → 세션 변환 실패 → 두 오류와 재시도 표시.
    await act(async () => root.root.findByType("input").props.onChange({ target: { files: [{}], value: "file" } }));
    expect(session.source).toBe("photo");
    expect(root.root.findAllByProps({ role: "alert" })).toHaveLength(2);
    const retry = root.root.findAllByType("button").find(b => b.children.join("") === "다시 시도");
    expect(retry).toBeDefined();
    await act(async () => retry!.props.onClick());
    expect(mocks.api).toHaveBeenLastCalledWith({ image: "original-image", question: "원래 질문" });
  });
  it("pending opt-out makes no claim that saving has already stopped", async () => {
    await act(async () => { root = create(createElement(SettingsWindow, { email: "synthetic@example.test",
      settings: { voiceInput: false, edgeDisplay: true, saveHistory: false, highlightStyle: "BORDER", riskWarning: true },
      error: null, isSaving: true, logoutError: null, isLoggingOut: false, onUpdate: vi.fn(), onOpenHistory: vi.fn(), onStart: vi.fn(), onLogout: vi.fn() })); });
    const text = JSON.stringify(root.toJSON());
    expect(text).toContain("설정 저장이 끝난 뒤의 새 질문과 안내부터");
    expect(text).not.toContain("기록 저장이 꺼져 있어 새 질문");
  });
  it.each([true, false, null])("privacy text accurately reflects saveHistory=%s", async saveHistory => {
    const settings = saveHistory === null ? null : { voiceInput: false, edgeDisplay: true, saveHistory, highlightStyle: "BORDER" as const, riskWarning: true };
    await act(async () => { root = create(createElement(SettingsWindow, { email: "synthetic@example.test", settings, error: null, isSaving: false,
      logoutError: null, isLoggingOut: false, onUpdate: vi.fn(), onOpenHistory: vi.fn(), onStart: vi.fn(), onLogout: vi.fn() })); });
    const text = JSON.stringify(root.toJSON());
    expect(text).toContain("앱 DB에 저장하지 않지만"); expect(text).toContain("외부 AI로 보내요"); expect(text).toContain("보관·학습 정책은 아직 확인");
    expect(text).toContain(saveHistory === false ? "새 질문과 안내는 앱 DB에 남기지 않아요" : saveHistory === true ? "기록 저장이 켜져 있어 질문과 안내" : "기록 저장이 켜져 있을 때만");
  });
});

describe("fixed-fixture target oracle", () => {
  it("accepts the actual button and modest box error", () => {
    expect(matchesFixtureButton(FIXTURE_BUTTON)).toBe(true);
    expect(matchesFixtureButton({ ...FIXTURE_BUTTON, x: FIXTURE_BUTTON.x + 0.005, y: FIXTURE_BUTTON.y - 0.005 })).toBe(true);
  });
  it("rejects whole image, bottom strip, other button and tiny point", () => {
    for (const box of [{ x: 0, y: 0, width: 1, height: 1 }, { x: 0, y: .8, width: 1, height: .2 },
      { x: .03, y: .25, width: .36, height: .075 }, { x: .8, y: .89, width: .001, height: .001 }]) {
      expect(matchesFixtureButton(box)).toBe(false);
    }
  });
});
