// DB 스키마 변경 목록. 서버가 뜰 때 init.ts가 아직 적용하지 않은 것만 순서대로 적용한다.
// 규칙 (BE_CONVENTION 7번)
// - 이미 main에 머지된 항목은 절대 고치지 않는다. 바꿀 게 있으면 새 id로 항목을 추가한다.
// - id는 "번호_설명" 형식, 번호는 이어서 붙인다 (002_..., 003_...)
// - 추가하기 전에 디스코드에 알리고 main을 pull 한다 (두 사람이 같은 번호를 쓰지 않게)
// - 테이블은 복수 snake_case, PK는 id, 모든 테이블에 created_at
export const MIGRATIONS: ReadonlyArray<{ id: string; sql: string }> = [
  {
    id: "001_init",
    sql: `
      CREATE TABLE users (
        id            SERIAL PRIMARY KEY,
        email         TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      -- 로그인 쿠키. 토큰 원문은 저장하지 않고 sha256 해시만 저장
      CREATE TABLE sessions (
        id         SERIAL PRIMARY KEY,
        token_hash TEXT NOT NULL UNIQUE,
        user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX sessions_user_id_idx ON sessions(user_id);

      -- 사용자 설정 (server/settings/schema.ts의 DEFAULT_SETTINGS와 기본값을 같게 유지)
      CREATE TABLE user_settings (
        user_id         INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        edge_display    BOOLEAN NOT NULL DEFAULT true,
        voice_input     BOOLEAN NOT NULL DEFAULT false,
        highlight_style TEXT    NOT NULL DEFAULT 'BORDER' CHECK (highlight_style IN ('BORDER', 'ARROW', 'DIM')),
        risk_warning    BOOLEAN NOT NULL DEFAULT true,
        save_history    BOOLEAN NOT NULL DEFAULT true,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      -- 도움 기록. 화면 이미지는 저장하지 않고 질문과 안내 문장만 남긴다
      CREATE TABLE guide_histories (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        question    TEXT NOT NULL,
        instruction TEXT NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX guide_histories_user_created_idx ON guide_histories(user_id, created_at DESC);
    `,
  },
];
