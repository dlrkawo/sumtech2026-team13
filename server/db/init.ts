// 서버가 시작될 때 한 번 실행: DB 연결 대기 → 마이그레이션 → 시드 계정 생성 (instrumentation.ts에서 호출)
// 키트 규칙: 빈 DB에서 docker compose up만으로 앱·시드 데이터가 2분 안에 떠야 한다.
// DB 준비가 실패해도 서버는 계속 뜬다 (/__health는 DB와 무관하게 200, DB가 필요한 API만 오류 안내).
import type { PoolClient } from "pg";

import { hashPassword } from "../auth/password";
import { getPool, hasDatabase } from "./client";
import { MIGRATIONS } from "./migrations";

const LOCK_KEY = 13013; // 여러 인스턴스가 동시에 마이그레이션하지 않도록 잡는 advisory lock 번호
const CONNECT_RETRIES = 30;

export async function initDatabase(): Promise<void> {
  if (!hasDatabase()) {
    console.warn("[db] DATABASE_URL이 없어 DB 초기화를 건너뜁니다 (로그인·설정·기록 API는 사용할 수 없음)");
    return;
  }
  try {
    await waitForDatabase();
    const client = await getPool().connect();
    try {
      await client.query("SELECT pg_advisory_lock($1)", [LOCK_KEY]);
      await migrate(client);
      await seedUsers(client);
    } finally {
      await client.query("SELECT pg_advisory_unlock($1)", [LOCK_KEY]).catch(() => undefined);
      client.release();
    }
    console.log("[db] 준비 완료");
  } catch (e) {
    console.error("[db] 초기화 실패", e);
  }
}

async function waitForDatabase(): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    try {
      await getPool().query("SELECT 1");
      return;
    } catch (e) {
      if (attempt >= CONNECT_RETRIES) throw e;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

async function migrate(client: PoolClient): Promise<void> {
  await client.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())",
  );
  const { rows } = await client.query<{ id: string }>("SELECT id FROM schema_migrations");
  const applied = new Set(rows.map((r) => r.id));

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.id)) continue;
    await client.query("BEGIN");
    try {
      await client.query(migration.sql);
      await client.query("INSERT INTO schema_migrations (id) VALUES ($1)", [migration.id]);
      await client.query("COMMIT");
      console.log(`[db] 마이그레이션 적용: ${migration.id}`);
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    }
  }
}

// docker-compose.yml의 SEED_USER_EMAIL·SEED_USER_PASSWORD로 E2E용 계정을 만든다 (이미 있으면 그대로 둠)
async function seedUsers(client: PoolClient): Promise<void> {
  const email = process.env.SEED_USER_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_USER_PASSWORD;
  if (!email || !password) return;

  const existing = await client.query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rowCount === 0) {
    const passwordHash = await hashPassword(password);
    await client.query("INSERT INTO users (email, password_hash) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING", [
      email,
      passwordHash,
    ]);
    console.log(`[db] 시드 계정 생성: ${email}`);
  }
  await client.query(
    "INSERT INTO user_settings (user_id) SELECT id FROM users WHERE email = $1 ON CONFLICT (user_id) DO NOTHING",
    [email],
  );
}
