"use client";

import { useState, type FormEvent } from "react";

import type { AuthRequest } from "@/server/auth/schema";
import type { UserError } from "@/lib/errors";

import { BUTTON_PRIMARY, LINK_BUTTON, MUTED } from "./styles";
import { TextField } from "./TextField";
import { WindowFrame } from "./WindowFrame";

// S1 가입 / S2 로그인. 설정 창과 같은 모양의 창으로 띄운다.
// 버튼 글자('로그인' '가입하기' '가입')는 docs/scenarios.yaml과 같아야 한다 (E2E가 이 이름으로 누른다)
// 로그인·가입 요청은 바깥(HelperApp의 useAuth)에서 하고, 여기는 입력과 버튼만 그린다
export function AuthWindow({
  error,
  isSubmitting,
  onLogin,
  onSignup,
  onClearError,
}: {
  error: UserError | null;
  isSubmitting: boolean;
  onLogin: (body: AuthRequest) => void;
  onSignup: (body: AuthRequest) => void;
  onClearError: () => void;
}) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const isSignup = mode === "signup";

  function switchMode(next: "login" | "signup") {
    onClearError();
    setMode(next);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const body = { email: email.trim(), password };
    if (isSignup) onSignup(body);
    else onLogin(body);
  }

  return (
    <WindowFrame title={isSignup ? "가입하기" : "로그인"} placement="side">
      <form className="flex flex-col gap-[14px]" onSubmit={onSubmit} noValidate>
        {isSignup && <p className={MUTED}>이메일과 비밀번호만 있으면 가입할 수 있어요.</p>}
        <TextField
          label="이메일"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          placeholder="예: parent@example.com"
        />
        <TextField
          label="비밀번호"
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          value={password}
          onChange={setPassword}
          placeholder={isSignup ? "8자 이상" : "비밀번호"}
        />
        {error && (
          <p
            role="alert"
            className="rounded-[14px] bg-[#FBE9EB] px-[16px] py-[12px] text-[20px] font-bold text-[#9B1C1C]"
          >
            {error.message}
          </p>
        )}
        <button type="submit" className={BUTTON_PRIMARY} disabled={isSubmitting || !email.trim() || !password}>
          {isSignup ? "가입" : "로그인"}
        </button>
      </form>
      <p className={`${MUTED} flex items-center justify-center gap-[6px]`}>
        {isSignup ? "이미 가입하셨나요?" : "처음이세요?"}
        <button type="button" className={LINK_BUTTON} onClick={() => switchMode(isSignup ? "login" : "signup")}>
          {isSignup ? "로그인" : "가입하기"}
        </button>
      </p>
    </WindowFrame>
  );
}
