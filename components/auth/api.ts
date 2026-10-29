import type { AuthRequest, AuthUserResponse } from "@/server/auth/schema";
import { request } from "@/lib/api/client";

// 로그인은 httpOnly 쿠키(sid)로 유지된다. FE는 토큰을 저장하지 않는다 (API_CONVENTION.md 7번)

// 가입하면 바로 로그인 상태가 된다 (S1)
export function signup(body: AuthRequest): Promise<AuthUserResponse> {
  return request<AuthUserResponse>("/api/auth/signup", { method: "POST", body: JSON.stringify(body) });
}

export function login(body: AuthRequest): Promise<AuthUserResponse> {
  return request<AuthUserResponse>("/api/auth/login", { method: "POST", body: JSON.stringify(body) });
}

export function logout(): Promise<void> {
  return request<void>("/api/auth/logout", { method: "POST" });
}

// 로그인 안 했으면 401 AUTH_REQUIRED
export function getMe(): Promise<AuthUserResponse> {
  return request<AuthUserResponse>("/api/auth/me");
}
