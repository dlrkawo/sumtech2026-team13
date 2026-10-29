import "server-only";

// 서비스·라우트에서 실패를 알릴 때 던지는 에러. withHandler()가 공통 응답 형식으로 바꾼다.
// code는 <DOMAIN>_<REASON> 형식, message는 화면에 그대로 보여 줘도 되는 한국어 문장 (BE_CONVENTION 6번)
// retryable: 같은 요청을 다시 보내면 될 수 있는지. 비워 두면 상태 코드로 정한다(isRetryableStatus)
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly retryable?: boolean,
  ) {
    super(message);
    this.name = "AppError";
  }
}

// 429(요청 많음)·5xx(AI·DB·서버 일시 오류)는 잠시 뒤 같은 요청으로 될 수 있고,
// 나머지 4xx(입력·사진 형식·로그인)는 같은 요청을 다시 보내도 결과가 같다
export function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

// 자주 쓰는 에러를 한곳에 모아 둔다 (코드 목록: BE_CONVENTION 12번)
export const errors = {
  validation: (message = "입력한 값을 다시 확인해 주세요.") => new AppError(400, "VALIDATION_ERROR", message),
  authRequired: () => new AppError(401, "AUTH_REQUIRED", "로그인이 필요해요."),
};
