import "server-only";

import { query } from "../db/client";

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const rows = await query<UserRow>("SELECT id, email, password_hash FROM users WHERE email = $1", [email]);
  return rows[0] ?? null;
}

// 새 사용자와 기본 설정을 함께 만든다. 이메일이 이미 있으면 null
export async function createUser(email: string, passwordHash: string): Promise<{ id: number; email: string } | null> {
  const rows = await query<{ id: number; email: string }>(
    `WITH inserted AS (
       INSERT INTO users (email, password_hash) VALUES ($1, $2)
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email
     ), settings AS (
       INSERT INTO user_settings (user_id) SELECT id FROM inserted
     )
     SELECT id, email FROM inserted`,
    [email, passwordHash],
  );
  return rows[0] ?? null;
}
