import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { cookies } from "next/headers";

import { query } from "../db/client";
import { errors } from "../errors";
import type { AuthUserResponse } from "./schema";

// 로그인 유지: httpOnly 쿠키에 무작위 토큰, DB에는 토큰의 sha256 해시만 저장 (API_CONVENTION 7번)
export const SESSION_COOKIE = "sid";
const SESSION_DAYS = 7;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

// docker E2E는 http://localhost, 배포는 https. https일 때만 Secure 쿠키를 쓴다 (http에서 Secure면 로그인이 안 됨)
function isHttps(req: Request): boolean {
  const forwarded = req.headers.get("x-forwarded-proto");
  if (forwarded) return forwarded.split(",")[0]?.trim() === "https";
  return new URL(req.url).protocol === "https:";
}

export async function startSession(req: Request, userId: number): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await query("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)", [
    hashToken(token),
    userId,
    expires,
  ]);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: isHttps(req), path: "/", expires });
}

export async function getSessionUser(): Promise<AuthUserResponse | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await query<AuthUserResponse>(
    `SELECT u.id, u.email
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [hashToken(token)],
  );
  return rows[0] ?? null;
}

// 로그인이 필요한 API 맨 앞에서 호출. 없으면 401 AUTH_REQUIRED
export async function requireUser(): Promise<AuthUserResponse> {
  const user = await getSessionUser();
  if (!user) throw errors.authRequired();
  return user;
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await query("DELETE FROM sessions WHERE token_hash = $1", [hashToken(token)]);
  store.delete(SESSION_COOKIE);
}
