import { ApiError, type ApiResponse } from "./types";

// 모든 API 호출이 거치는 곳. 성공하면 응답의 data만 돌려주고, 실패하면 ApiError를 던진다.
// 경로는 상대 경로 /api/... 만 받는다 (키트 규칙: 절대 주소 금지)
export async function request<T>(path: `/api/${string}`, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "인터넷 연결을 확인해 주세요.");
  }

  if (res.status === 204) return undefined as T;

  const body: ApiResponse<T> | null = await res.json().catch(() => null);
  if (!res.ok || !body?.success) {
    throw new ApiError(
      res.status,
      body?.code ?? "INTERNAL_SERVER_ERROR",
      body?.message ?? "잠시 후 다시 시도해 주세요.",
    );
  }
  return body.data;
}
