"use client";

import { useId, useState, type FormEvent } from "react";

import { useAuth } from "./AuthProvider";

// 첫 화면의 로그인/가입 칸 (S1, S2). 버튼·라벨 글자는 e2e/scenarios와 같아야 한다
type Mode = "login" | "signup";

export function AuthPanel() {
  const { login, signup, isSubmitting, error, clearError } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const emailId = useId();
  const passwordId = useId();
  const isSignup = mode === "signup";

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;
    void (isSignup ? signup : login)({ email, password });
  }

  function handleModeChange(next: Mode) {
    clearError();
    setMode(next);
  }

  return (
    <section aria-labelledby={`${emailId}-title`} className="flex flex-col gap-5 rounded-2xl border-2 border-neutral-300 p-6">
      <h2 id={`${emailId}-title`} className="text-2xl font-bold">
        {isSignup ? "새로 가입하기" : "로그인하고 시작하기"}
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label htmlFor={emailId} className="flex flex-col gap-2">
          이메일
          <input
            id={emailId}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-14 rounded-lg border-2 border-neutral-400 px-4"
          />
        </label>
        <label htmlFor={passwordId} className="flex flex-col gap-2">
          비밀번호
          <input
            id={passwordId}
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            required
            minLength={isSignup ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-14 rounded-lg border-2 border-neutral-400 px-4"
          />
        </label>
        {isSignup && <p className="text-neutral-600">비밀번호는 8자 이상으로 적어 주세요.</p>}

        {error && (
          <p role="alert" className="font-bold text-red-700">
            {error.message}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-14 rounded-lg bg-blue-700 font-bold text-white disabled:opacity-50"
        >
          {isSignup ? "가입" : "로그인"}
        </button>
      </form>

      {isSignup ? (
        <button
          type="button"
          onClick={() => handleModeChange("login")}
          className="h-14 rounded-lg border-2 border-neutral-400 font-bold"
        >
          돌아가기
        </button>
      ) : (
        <button
          type="button"
          onClick={() => handleModeChange("signup")}
          className="h-14 rounded-lg border-2 border-neutral-400 font-bold"
        >
          가입하기
        </button>
      )}
    </section>
  );
}
