// BE 공통 응답(API_CONVENTION.md 3번)과 같은 모양
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  code?: string;
  // 실패 응답만: 같은 요청을 다시 보내면 될 수 있는지
  retryable?: boolean;
}

// status 0은 네트워크 오류(응답을 받지 못함)
// retryable: 서버가 알려 준 '다시 시도해도 되는지' (없으면 상태 코드로 판단)
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public retryable?: boolean,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
