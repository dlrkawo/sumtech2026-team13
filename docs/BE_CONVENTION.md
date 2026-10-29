# Backend Convention — sumtech 2026 Team 13

> BE 팀원 2명이 공통으로 따르는 규칙입니다. **해커톤 키트 요구사항(`progress.md`)이 이 문서보다 우선합니다.**
> 규칙이 바뀌면 이 파일을 수정한 뒤 디스코드에 공지합니다.
> **Claude 사용 시:** 작업 시작할 때 이 문서와 `docs/API_CONVENTION.md`를 붙여넣고 "이 컨벤션을 따라서 작업해줘"라고 요청하세요.

---

## 0. 프로젝트 맥락

- 행사: sumtech 2026 해커톤(루프톤), 팀 13 (PM 1, FE 2, BE 2)
- 서비스 **곁길**: 부모님이 막힌 화면을 보여 주면(화면 공유 또는 화면 사진 올리기) AI가 다음에 누를 곳 한 군데를 짚어 주고, 되돌리기 어려운 버튼 앞에서는 경고 (`docs/problem.yaml`)
- 레포: https://github.com/dlrkawo/sumtech2026-team13 (기본 브랜치 `main`)
- 구조: **Next.js 풀스택 하나**. FE 화면과 BE API가 같은 앱, 같은 포트(3000)에서 동작
- 코드트리 사이트와 연동 → 커밋 기록으로 기여도 집계 (git 이메일 = 깃허브 계정 이메일)

## 1. 키트 필수 규칙 (어기면 제출 검사 실패)

- docker-compose는 `app`, `db` 두 서비스. `app`만 `ports: "3000:3000"`, 다른 서비스는 ports·container_name 없음, 어느 서비스에도 env_file 없음
- 앱은 컨테이너 안 3000 포트에서 받음. 코드에 `localhost:3000` 같은 절대 주소 금지 (API 호출은 `/api/...` 상대 경로)
- 빌드는 Dockerfile에서 끝내고, 시작 명령은 서버 실행만
- 빈 DB에서 `docker compose up --build` 하나로 앱과 시드 데이터가 2분 안에 떠야 함
  - 마이그레이션·시드는 **서버가 시작될 때 `instrumentation.ts` → `server/db/init.ts`에서 자동 실행**(이미 적용된 것은 건너뜀). 시작 명령은 `node server.js` 그대로
  - DB 준비가 실패해도 서버는 뜬다(`/__health`는 DB와 무관하게 200). `DATABASE_URL`이 없으면 DB가 필요한 API만 503 `DB_UNAVAILABLE`, 주소는 있는데 연결이 안 되면 500 `INTERNAL_SERVER_ERROR`(로그에 원인)
- `GET /__health`는 인증·리다이렉트 없이 200, 실제 배포 commit을 releaseId로 응답 (docker 앱·배포 둘 다)
  - 파일 위치: `app/%5F%5Fhealth/route.ts` (Next.js는 `_`로 시작하는 폴더를 라우트로 쓰지 않기 때문)
- 환경변수 이름은 키트 그대로: `RELEASE_ID`, `SEED_USER_EMAIL`, `SEED_USER_PASSWORD`, `AI_GATEWAY_API_KEY`, DB 주소는 `DATABASE_URL`(키트 compose 템플릿)
  - compose의 시드 계정 값은 `${}` 없이 직접 적음. 기본값은 `e2e/env.ts`와 같게: `student@example.com` / `loopthon-2026` (역할이 더 있으면 `ta@example.com` 방식으로 추가)
  - compose `app`에 `AI_GATEWAY_API_KEY: ${AI_GATEWAY_API_KEY:-}`
- 로그인이 있으면 시드 계정(이메일/비밀번호)으로 바로 로그인 가능, 역할별 권한 검사. 역할 이름은 `docs/scenarios.yaml`의 account와 같게
- 로그인 안 한 사람이 `/`를 열면 서비스 이름과 하는 일이 보여야 함 (로그인 화면으로 보내지 않음)
- 로그인 전에는 로그인이 필요한 화면이 열리지 않음 (API는 401)
- 없는 주소는 404 (500 아님)
- AI 기능은 E2E에서 실제 응답으로 확인 (가짜 응답 금지), 흐름 하나가 1분 안에 끝나야 함
- 큰 데이터 파일 커밋 금지, `e2e/fixtures/` 파일은 10MB 이하, `progress.md`에 비밀번호·토큰 금지

## 2. 기술 스택

| 구분 | 선택 |
|---|---|
| 프레임워크 | Next.js (App Router) + TypeScript |
| API | Route Handler (`app/api/**/route.ts`) |
| 검증 | zod |
| DB | PostgreSQL + `pg`(node-postgres), SQL 직접 작성. ORM 없음 (런타임 이미지에 CLI가 필요 없어 키트 기동 조건에 유리) |
| 비밀번호 | Node 내장 `scrypt` (추가 패키지 없음) |
| AI | 서버에서 Vercel AI Gateway 호출(`server/ai/gateway.ts`), 키는 `AI_GATEWAY_API_KEY`. 안내 `anthropic/claude-sonnet-5.5`, 받아쓰기 `google/gemini-3.5-transcribe` |
| 린트 | ESLint (`eslint-config-next`), 타입 검사 `npm run typecheck`. Prettier는 쓰지 않음 |
| 패키지 | npm (`package-lock.json` 커밋) |

## 3. 폴더 구조 (레포 루트가 곧 Next.js 앱)

```
/
├── app/
│   ├── (pages)/...           # FE 화면 (FE 담당)
│   ├── api/                   # BE API (BE 담당)
│   │   └── <resource>/route.ts
│   └── %5F%5Fhealth/route.ts  # GET /__health (키트 필수)
├── components/                # FE 컴포넌트 (FE 담당)
├── server/                    # BE 로직 (BE 담당, 브라우저에서 import 금지)
│   ├── <domain>/              # auth, settings, history, guide, voice-guide
│   │   ├── schema.ts          # zod 요청 스키마, 응답 타입 (FE가 import type)
│   │   ├── service.ts         # 비즈니스 로직
│   │   └── repository.ts      # DB 접근 (SQL). 작으면 service에 합쳐도 됨 (지금은 auth만 따로 있음)
│   ├── guide/prompt.ts        # AI 프롬프트와 답 해석·위험 경고 문구
│   ├── guide/screen-image.ts  # 화면 이미지 형식·크기 검사, 가로·세로 읽기
│   ├── ai/gateway.ts          # AI Gateway 호출 (타임아웃·에러 변환)
│   ├── db/
│   │   ├── client.ts          # pg 연결 풀, query()
│   │   ├── migrations.ts      # 스키마 변경 목록 (SQL)
│   │   └── init.ts            # 서버 시작 시 마이그레이션·시드 계정
│   ├── errors.ts              # AppError
│   └── response.ts            # ok() / fail() / withHandler() / parseBody()
├── instrumentation.ts         # 서버 시작 시 server/db/init.ts 호출
├── e2e/                       # 키트 E2E (흐름별 spec S1~S7, 업로드 사진 fixtures/)
├── scripts/                   # check_docs.py, smoke-api.sh, smoke-guide.sh, e2e-local.sh
├── docs/                      # problem.yaml, scenarios.yaml, 컨벤션
├── Dockerfile
└── docker-compose.yml
```

- **BE 담당 폴더: `app/api/`, `server/`, `app/%5F%5Fhealth/`, `instrumentation.ts`**
- 공용 파일(`package.json`, `Dockerfile`, `docker-compose.yml`, `next.config.*`, `.env.example`) 수정 시 디스코드에 먼저 알립니다.
- `server/` 파일 맨 위에 `import "server-only"`를 넣어 FE에서 실수로 가져오지 못하게 합니다.
  - 예외: `server/*/schema.ts`는 FE가 `import type`으로 타입을 가져가는 파일이라 `server-only`를 넣지 않습니다(DB·키 접근 코드 금지).
  - 예외: 서버 시작 시(`instrumentation.ts`) 불러오는 `server/db/*`, `server/auth/password.ts`도 넣지 않습니다.

## 4. 레이어 규칙

```
route.ts → service → repository → DB (server/db/client.ts의 query)
```

- **route.ts**: 요청 파싱(`parseBody`), 인증 확인(`requireUser`), service 호출, 응답 반환. SQL 직접 사용 금지
- **service**: 비즈니스 로직, 실패 시 `throw new AppError(...)`
- **repository**: SQL 조회/저장만. 파라미터는 항상 `$1, $2 …`로 넘기고 문자열로 SQL을 이어 붙이지 않음
- 모든 route는 `withHandler()`로 감싸 에러를 공통 응답 형식으로 변환

## 5. 네이밍

| 대상 | 규칙 | 예시 |
|---|---|---|
| 변수, 함수 | camelCase | `getUserById` |
| 타입, 클래스, zod 스키마 타입 | PascalCase | `GuideRequest` |
| zod 스키마 변수 | camelCase + Schema | `guideRequestSchema` |
| 상수 | UPPER_SNAKE_CASE | `MAX_IMAGE_SIZE` |
| 파일 (server/) | kebab-case | `guide-session.ts` |
| DB 테이블 | 복수 snake_case | `guide_histories` |
| DB 컬럼 | snake_case, 응답에서 camelCase로 변환 | `created_at` → `createdAt` |
| 함수 동사 | get / list / create / update / delete | `listSessions` |

## 6. 에러 처리

- 예: `throw new AppError(409, "AUTH_EMAIL_TAKEN", "이미 가입한 이메일이에요. 로그인해 주세요.")` (자주 쓰는 것은 `server/errors.ts`의 `errors.validation()`, `errors.authRequired()`)
- 에러 코드: `<DOMAIN>_<REASON>` UPPER_SNAKE_CASE, 메시지는 사용자에게 그대로 보여줘도 되는 한국어
- zod 검증 실패는 400 + `VALIDATION_ERROR`, 알 수 없는 오류는 500 + `INTERNAL_SERVER_ERROR` (상세 내용은 서버 로그에만)
- 새 에러 코드는 아래 12번 목록에 추가

## 7. DB 규칙

- PK: `id SERIAL` (사용자별 한 줄인 `user_settings`는 `user_id`가 PK), 모든 테이블에 `created_at TIMESTAMPTZ`
- FK 컬럼: `<대상 단수>_id` (예: `user_id`), 사용자 데이터는 `ON DELETE CASCADE`
- 스키마 변경은 **`server/db/migrations.ts`에 새 항목을 추가해서만**. 이미 머지된 항목은 수정 금지 (새 id로 추가)
- ⚠️ 2명이 동시에 마이그레이션을 추가하면 번호 충돌 → **추가 전 디스코드에 알리고 `main` 최신을 pull 한 뒤 추가**
- E2E에 필요한 선행 데이터와 시드 계정은 `server/db/init.ts`의 시드에서 만듦 (앞 흐름이 만든 데이터에 기대지 않음)
- 현재 테이블: `users`, `sessions`, `user_settings`, `guide_histories` (화면 이미지는 어떤 테이블에도 저장하지 않음)

## 8. AI 호출 규칙

- AI 호출은 **서버(`server/ai/`)에서만**. 키를 브라우저로 보내지 않음
- 팀 전체 예산 누적 $10 → 이미지는 FE가 1280px·JPEG 0.7로 줄여 보냄, 답 길이 `max_tokens` 1200, 불필요한 반복 호출 금지
  - 호출마다 토큰·비용을 로그로 남김 (`[guide] attempt=… cost≈$…`). 안내 1회 약 $0.006
  - 사용자별 호출 횟수 제한은 **아직 없음** (배포 사이트에서 반복 호출하면 예산이 줄어듦)
- 타임아웃(안내 25초, 받아쓰기 20초), 실패, 예산 부족 시 사용자에게 보여줄 메시지와 에러 코드(`AI_*`)를 반환
- 답 형식이 깨지면 한 번만 다시 묻고, 답이 잘리면(`finish_reason=length`) 다시 묻지 않음
- E2E는 실제 AI 응답을 기다려 확인하므로, 흐름 하나가 1분 안에 끝나도록 응답 시간을 관리 (지금 가장 긴 S3 약 7초)

## 9. 환경변수

- 비밀값은 `.env`에만, **커밋 금지**. `.env.example`에는 이름만 적음
- 서버 코드에서만 `process.env`로 읽음. `NEXT_PUBLIC_`이 붙은 변수에는 비밀값 금지
- 새 변수를 추가하면 `.env.example`과 README 환경변수 표를 같이 갱신

## 10. Git 규칙

- `main`은 **PR로만** 바뀜 (룰셋: 직접 push·강제 push 금지, 필수 검사 `check`·`docs` 통과 후 머지). 머지되면 CI `scenarios`와 Vercel 배포가 돎 → **`main`은 항상 실행되는 상태 유지**
  - Vercel은 `main`만 배포하고 PR·다른 브랜치 미리보기 배포는 하지 않음 (`vercel.json`의 `git.deploymentEnabled`, Hobby 하루 배포 100번 한도 때문)
- 브랜치: `feat/be-<기능>`, `fix/be-<내용>` → `main`으로 PR
- 커밋: `feat:` / `fix:` / `refactor:` / `docs:` / `chore:` (예: `feat: 화면 안내 요청 API 구현`)
- 작업 순서: `main` pull → 브랜치 생성 → 작업 → `npm run lint`·`npm run typecheck` → (API·화면 흐름을 바꿨으면) `bash scripts/e2e-local.sh` → push → PR → 다른 BE가 확인 후 머지
- 커밋은 작게, 자주

## 11. 담당 분배

| 담당자 | 작업 |
|---|---|
| BE-1 이감재 | 공통 코드(`server/response.ts`, `server/errors.ts`), DB·마이그레이션·시드 계정, Docker·배포·CI, 로그인·설정·도움 기록 API |
| BE-2 hyuckkim | 화면 분석·안내 API(`POST /api/guides`), 목소리로 묻기 API(`POST /api/voice-guides`), AI Gateway 호출(`server/ai/`), 프롬프트·위험 동작 판단(`server/guide/prompt.ts`) |

## 12. 에러 코드 목록

| 코드 | 상태 | 설명 |
|---|---|---|
| `VALIDATION_ERROR` | 400 | 요청 값 검증 실패 |
| `AUTH_REQUIRED` | 401 | 로그인 필요 |
| `IMAGE_INVALID` | 400 | 화면 이미지가 data URL(JPEG/PNG/WEBP base64) 형식이 아님 |
| `IMAGE_TOO_LARGE` | 400 | 화면 이미지 data URL 문자열이 3MB 초과 |
| `AUDIO_INVALID` | 400 | 목소리 녹음이 data URL(webm·ogg·mp4·mp3·wav base64) 형식이 아님 |
| `AUDIO_TOO_LARGE` | 400 | 목소리 녹음 data URL 문자열이 1MB 초과 |
| `AUDIO_NO_SPEECH` | 400 | 녹음에서 알아들은 말이 없음 |
| `AUTH_INVALID_CREDENTIALS` | 401 | 이메일 또는 비밀번호가 맞지 않음 |
| `AUTH_EMAIL_TAKEN` | 409 | 이미 가입한 이메일 |
| `AI_UNAVAILABLE` | 503 | AI 키가 없거나 비활성이라 분석할 수 없음 (앱은 정상 기동) |
| `AI_TIMEOUT` | 503 | AI 응답 시간 초과 |
| `AI_FAILED` | 503 | AI 응답 실패 또는 해석 불가 |
| `AI_BUDGET_EXCEEDED` | 429 | 팀 AI 예산 소진·요청 제한 |
| `DB_UNAVAILABLE` | 503 | DB 연결 정보(`DATABASE_URL`)가 없음 (예: DB를 연결하지 않은 배포 환경) |
| `INTERNAL_SERVER_ERROR` | 500 | 알 수 없는 서버 오류 |
| (추가 시 여기에 기록) | | |
