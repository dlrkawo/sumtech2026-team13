import "server-only";

import { AppError } from "../errors";
import { hashPassword, verifyPassword } from "./password";
import { createUser, findUserByEmail } from "./repository";
import type { AuthRequest, AuthUserResponse } from "./schema";
import { startSession } from "./session";

export async function signup(req: Request, { email, password }: AuthRequest): Promise<AuthUserResponse> {
  const user = await createUser(email, await hashPassword(password));
  if (!user) throw new AppError(409, "AUTH_EMAIL_TAKEN", "이미 가입한 이메일이에요. 로그인해 주세요.");
  await startSession(req, user.id);
  return user;
}

export async function login(req: Request, { email, password }: AuthRequest): Promise<AuthUserResponse> {
  const user = await findUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    throw new AppError(401, "AUTH_INVALID_CREDENTIALS", "이메일 또는 비밀번호가 맞지 않아요.");
  }
  await startSession(req, user.id);
  return { id: user.id, email: user.email };
}
