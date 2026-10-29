import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/types";
import { toUserError } from "@/lib/errors";
import { ImageError } from "@/lib/image";

// API·이미지 오류를 화면용(UserError)으로 바꾸는 규칙 (API_CONVENTION.md 3·4번)
describe("toUserError", () => {
  it("사진 오류는 문구 그대로, 다시 시도 없음", () => {
    const e = toUserError(new ImageError("IMAGE_TOO_LARGE", "사진이 너무 커요."));
    expect(e).toEqual({ code: "IMAGE_TOO_LARGE", message: "사진이 너무 커요.", canRetry: false, needsLogin: false });
  });

  it("네트워크 오류(status 0)는 다시 시도 가능", () => {
    const e = toUserError(new ApiError(0, "NETWORK_ERROR", "연결이 끊겼어요."));
    expect(e.canRetry).toBe(true);
    expect(e.needsLogin).toBe(false);
    expect(e.message).toBe("연결이 끊겼어요.");
  });

  it("401 AUTH_REQUIRED만 로그인 화면으로 보낸다", () => {
    expect(toUserError(new ApiError(401, "AUTH_REQUIRED", "로그인이 필요해요.")).needsLogin).toBe(true);
    expect(toUserError(new ApiError(401, "AUTH_INVALID_CREDENTIALS", "비밀번호가 달라요.")).needsLogin).toBe(false);
  });

  it("AI 예산 초과(429)·일시 불가(503)·AI_ 코드는 서버 문구 + 다시 시도", () => {
    for (const [status, code] of [
      [429, "AI_BUDGET_EXCEEDED"],
      [503, "SERVICE_UNAVAILABLE"],
      [500, "AI_TIMEOUT"],
    ] as const) {
      const e = toUserError(new ApiError(status, code, "잠시 뒤에 다시 해 주세요."));
      expect(e.canRetry, code).toBe(true);
      expect(e.message, code).toBe("잠시 뒤에 다시 해 주세요.");
    }
  });

  it("500대는 서버 문구를 숨기고 공통 문구를 쓴다", () => {
    const e = toUserError(new ApiError(500, "INTERNAL_ERROR", "TypeError: x is undefined"));
    expect(e.message).toBe("잠시 후 다시 시도해 주세요.");
    expect(e.canRetry).toBe(true);
  });

  it("400 검증 오류는 서버 문구, 다시 시도 없음", () => {
    const e = toUserError(new ApiError(400, "VALIDATION_ERROR", "200자 안으로 적어 주세요."));
    expect(e).toMatchObject({ message: "200자 안으로 적어 주세요.", canRetry: false, needsLogin: false });
  });

  it("서버가 retryable을 주면 상태 코드보다 그 값을 따른다", () => {
    expect(toUserError(new ApiError(400, "AI_FAILED", "답을 읽지 못했어요.", true)).canRetry).toBe(true);
    expect(toUserError(new ApiError(503, "AI_UNAVAILABLE", "AI를 쓸 수 없어요.", false)).canRetry).toBe(false);
  });

  it("알 수 없는 예외는 공통 문구 + 다시 시도", () => {
    const e = toUserError(new RangeError("boom"));
    expect(e).toEqual({ code: "UNKNOWN_ERROR", message: "잠시 후 다시 시도해 주세요.", canRetry: true, needsLogin: false });
  });
});
