"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import type { AuthRequest, AuthUserResponse } from "@/server/auth/schema";
import { ApiError } from "@/lib/api/types";
import { toUserError, type UserError } from "@/lib/errors";

import * as authApi from "./api";

// checking: 처음 열었을 때 로그인 여부 확인 중 (이때는 로그인 화면·설정 창 둘 다 보여 주지 않는다)
export type AuthState =
  | { status: "checking" }
  | { status: "guest" }
  | { status: "signedIn"; user: AuthUserResponse };

interface AuthContextValue {
  state: AuthState;
  user: AuthUserResponse | null;
  isSubmitting: boolean;
  error: UserError | null;
  // 성공하면 true. 실패하면 error에 화면 문구가 담긴다
  login: (body: AuthRequest) => Promise<boolean>;
  signup: (body: AuthRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  // 다른 API가 401(needsLogin)을 받았을 때 불러서 로그인 화면으로 돌린다
  markSignedOut: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "checking" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<UserError | null>(null);

  // 새로고침해도 로그인 유지: 쿠키가 살아 있으면 내 정보를 받아 온다
  useEffect(() => {
    let ignore = false;
    authApi
      .getMe()
      .then((user) => {
        if (!ignore) setState({ status: "signedIn", user });
      })
      .catch((e: unknown) => {
        if (ignore) return;
        setState({ status: "guest" });
        // 로그인 안 한 것(401)은 오류가 아니다. DB 장애 같은 경우만 알린다
        if (!(e instanceof ApiError && e.status === 401)) setError(toUserError(e));
      });
    return () => {
      ignore = true;
    };
  }, []);

  const submit = useCallback(async (action: () => Promise<AuthUserResponse>) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const user = await action();
      setState({ status: "signedIn", user });
      return true;
    } catch (e) {
      setError(toUserError(e));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const login = useCallback((body: AuthRequest) => submit(() => authApi.login(body)), [submit]);
  const signup = useCallback((body: AuthRequest) => submit(() => authApi.signup(body)), [submit]);

  const logout = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await authApi.logout();
      setState({ status: "guest" });
    } catch (e) {
      setError(toUserError(e));
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const markSignedOut = useCallback(() => setState({ status: "guest" }), []);
  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      user: state.status === "signedIn" ? state.user : null,
      isSubmitting,
      error,
      login,
      signup,
      logout,
      markSignedOut,
      clearError,
    }),
    [state, isSubmitting, error, login, signup, logout, markSignedOut, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth는 <AuthProvider> 안에서만 쓸 수 있어요.");
  return value;
}
