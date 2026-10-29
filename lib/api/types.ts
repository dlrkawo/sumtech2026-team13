// BE 공통 응답(API_CONVENTION.md 3번)과 같은 모양
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  code?: string;
}

// status 0은 네트워크 오류(응답을 받지 못함)
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
