import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createGuide } from "@/server/guide/service";
import { AppError } from "@/server/errors";

const mocks = vi.hoisted(() => ({ completion: vi.fn(), record: vi.fn(), settings: vi.fn() }));
vi.mock("@/server/ai/gateway", () => ({
  createChatCompletion: mocks.completion,
  aiFailed: () => new AppError(503, "AI_FAILED", "안내를 만들지 못했어요."),
}));
vi.mock("@/server/history/service", () => ({ recordGuideHistory: mocks.record }));
vi.mock("@/server/settings/service", () => ({ getSettings: mocks.settings }));
const image = `data:image/png;base64,${readFileSync(new URL("../../e2e/fixtures/mock-step1.png", import.meta.url)).toString("base64")}`;
const answer = JSON.stringify({ instruction: "예약 버튼을 눌러 주세요.", status: "IN_PROGRESS", box: null, riskType: null });
const result = (text = answer, finishReason = "stop") => ({ text, finishReason, promptTokens: 1, completionTokens: 1, reasoningTokens: 0 });

beforeEach(() => {
  vi.resetAllMocks();
  mocks.settings.mockResolvedValue({ riskWarning: true });
  mocks.record.mockResolvedValue(undefined);
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe("PR96 guide service completion and history contracts (mocked gateway/DB)", () => {
  it("rejects a length-limited response even when its text is valid JSON; no retry or history write", async () => {
    mocks.completion.mockResolvedValueOnce(result(answer, "length"));
    await expect(createGuide(42, { image, question: "예약하고 싶어" })).rejects.toMatchObject({ code: "AI_FAILED" });
    expect(mocks.completion).toHaveBeenCalledOnce();
    expect(mocks.record).not.toHaveBeenCalled();
    expect(mocks.settings).not.toHaveBeenCalled();
  });
  it("retries malformed output once then returns the valid response", async () => {
    mocks.completion.mockResolvedValueOnce(result("not JSON")).mockResolvedValueOnce(result());
    const response = await createGuide(42, { image, question: "예약하고 싶어" });
    expect(response.instruction).toBe("예약 버튼을 눌러 주세요.");
    expect(mocks.completion).toHaveBeenCalledTimes(2);
    expect(mocks.record).toHaveBeenCalledWith(42, "예약하고 싶어", response.instruction);
  });
  it("does not exceed two attempts when both responses are malformed", async () => {
    mocks.completion.mockResolvedValue(result("not JSON"));
    await expect(createGuide(42, { image, question: "예약하고 싶어" })).rejects.toMatchObject({ code: "AI_FAILED" });
    expect(mocks.completion).toHaveBeenCalledTimes(2);
    expect(mocks.record).not.toHaveBeenCalled();
  });
  it("falls back from an empty history array to the legacy instruction", async () => {
    mocks.completion.mockResolvedValue(result());
    await createGuide(42, { image, question: "예약하고 싶어", previousInstructions: [], previousInstruction: "LEGACY_STEP" });
    const request = mocks.completion.mock.calls[0][0];
    expect(request.content[1].text).toContain("LEGACY_STEP");
  });
  it("prefers nonempty history and still returns guidance if recording fails", async () => {
    mocks.completion.mockResolvedValue(result());
    mocks.record.mockRejectedValueOnce(new Error("synthetic storage failure"));
    const response = await createGuide(42, { image, question: "예약하고 싶어", previousInstructions: ["CURRENT_STEP"], previousInstruction: "LEGACY_STEP" });
    const prompt = mocks.completion.mock.calls[0][0].content[1].text;
    expect(prompt).toContain("CURRENT_STEP");
    expect(prompt).not.toContain("LEGACY_STEP");
    expect(response.instruction).toBe("예약 버튼을 눌러 주세요.");
  });
});
