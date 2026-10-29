import { ApiError } from "./api/types";
import { ImageError } from "./image";

// API·이미지 오류를 화면에 보여 줄 형태로 바꾼다 (API_CONVENTION.md 4번)
//   message: 화면에 그대로 보여 줄 문장
//   canRetry: "다시 시도" 버튼을 보여 줄지 (같은 요청을 다시 보내면 될 수 있는 경우)
//   needsLogin: 로그인 화면으로 보내야 하는지
export interface UserError {
  code: string;
  message: string;
  canRetry: boolean;
  needsLogin: boolean;
}

const COMMON_MESSAGE = "잠시 후 다시 시도해 주세요.";

export function toUserError(e: unknown): UserError {
  // 사진 형식·크기 오류는 다시 보내도 같으니 다른 사진을 고르게 한다
  if (e instanceof ImageError) {
    return { code: e.code, message: e.message, canRetry: false, needsLogin: false };
  }

  if (e instanceof ApiError) {
    const result = fromStatus(e);
    // 서버가 다시 시도해도 되는지 알려 주면 그 값을 쓴다 (API_CONVENTION.md 3번 retryable)
    return typeof e.retryable === "boolean" ? { ...result, canRetry: e.retryable } : result;
  }

  console.error("[toUserError] 예상하지 못한 오류", e);
  return { code: "UNKNOWN_ERROR", message: COMMON_MESSAGE, canRetry: true, needsLogin: false };
}

// API 오류의 문구·로그인 여부를 상태 코드로 정한다. canRetry는 서버가 retryable을 주지 않았을 때(네트워크 오류 등)만 쓴다
function fromStatus(e: ApiError): UserError {
  if (e.status === 0) return { code: e.code, message: e.message, canRetry: true, needsLogin: false };
  // 로그인 화면으로 보내는 건 "로그인이 필요해요"일 때만. 비밀번호가 틀린 401(AUTH_INVALID_CREDENTIALS)은 문구만 보여 준다
  if (e.status === 401) {
    return { code: e.code, message: e.message, canRetry: false, needsLogin: e.code === "AUTH_REQUIRED" };
  }
  // AI 사용량 초과·일시 불가는 BE 문장 + 다시 시도
  if (e.status === 429 || e.status === 503 || e.code.startsWith("AI_")) {
    return { code: e.code, message: e.message, canRetry: true, needsLogin: false };
  }
  // 500은 BE 문장 대신 FE 공통 문구
  if (e.status >= 500) return { code: e.code, message: COMMON_MESSAGE, canRetry: true, needsLogin: false };
  return { code: e.code, message: e.message, canRetry: false, needsLogin: false };
}
