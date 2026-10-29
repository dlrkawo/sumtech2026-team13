// PostgreSQL 연결 (node-postgres). DATABASE_URL 하나로 docker·배포 모두 연결한다.
// 서버 시작 시 instrumentation.ts → server/db/init.ts에서도 불러오므로 `server-only`를 넣지 않는다 (DB 비밀값은 env에만 있음)
import { Pool, type QueryResultRow } from "pg";

const globalForDb = globalThis as unknown as { __pgPool?: Pool };

export class DbUnavailableError extends Error {
  constructor() {
    super("DATABASE_URL is not set");
    this.name = "DbUnavailableError";
  }
}

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new DbUnavailableError();
  // 개발 서버의 hot reload마다 연결이 늘어나지 않게 전역에 하나만 둔다
  globalForDb.__pgPool ??= new Pool({ connectionString, max: 5 });
  return globalForDb.__pgPool;
}

// 파라미터는 항상 $1, $2 … 로 넘긴다 (문자열로 SQL을 이어 붙이지 않음)
export async function query<T extends QueryResultRow>(text: string, params: unknown[] = []): Promise<T[]> {
  const result = await getPool().query<T>(text, params);
  return result.rows;
}
