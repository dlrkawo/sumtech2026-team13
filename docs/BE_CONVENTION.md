# Backend Convention — sumtech 2026 Team 13

> BE 팀원 2명이 공통으로 따르는 규칙입니다. **해커톤 키트 요구사항(`progress.md`)이 이 문서보다 우선합니다.**
> 규칙이 바뀌면 이 파일을 수정한 뒤 디스코드에 공지합니다.
> **Claude 사용 시:** 작업 시작할 때 이 문서와 `docs/API_CONVENTION.md`를 붙여넣고 "이 컨벤션을 따라서 작업해줘"라고 요청하세요.

---

## 0. 프로젝트 맥락

- 행사: sumtech 2026 해커톤(루프톤), 팀 13 (PM 1, FE 2, BE 2)
- 서비스: 디지털 소외계층이 화면을 공유하면 AI가 현재 화면을 분석해 어디를 누를지 단계별로 안내 (`docs/problem.yaml`)
- 레포: https://github.com/dlrkawo/sumtech2026-team13 (기본 브랜치 `main`)
- 구조: **Next.js 풀스택 하나**. FE 화면과 BE API가 같은 앱, 같은 포트(3000)에서 동작
- 코드트리 사이트와 연동 → 커밋 기록으로 기여도 집계 (git 이메일 = 깃허브 계정 이메일)

## 1. 키트 필수 규칙 (어기면 제출 검사 실패)

- docker-compose는 `app`, `db` 두 서비스. `app`만 `ports: "3000:3000"`, 다른 서비스는 ports·container_name 없음, 어느 서비스에도 env_file 없음
- 앱은 컨테이너 안 3000 포트에서 받음. 코드에 `localhost:3000` 같은 절대 주소 금지 (API 호출은 `/api/...` 상대 경로)
- 빌드는 Dockerfile에서 끝내고, 시작 명령은 서버 실행만
- 빈 DB에서 `docker compose up --build` 하나로 앱과 시드 데이터가 2분 안에 떠야 함
  - 마이그레이션·시드는 **컨테이너 시작 명령에서 서버 실행 직전에** 실행(키트 허용: "서버 실행(필요하면 마이그레이션·시드 포함)"). 이미 있으면 건너뛰게 작성
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
| DB / ORM | PostgreSQL + Prisma (마이그레이션·시드 포함) |
| AI | 서버에서 AI Gateway 호출, 키는 `AI_GATEWAY_API_KEY` |
| 린트/포맷 | ESLint + Prettier |
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
│   ├── <domain>/
│   │   ├── schema.ts          # zod 요청/응답 스키마, 타입
│   │   ├── service.ts         # 비즈니스 로직
│   │   └── repository.ts      # Prisma 접근
│   ├── ai/                    # AI Gateway 호출
│   ├── db.ts                  # Prisma client
│   ├── errors.ts              # AppError
│   └── response.ts            # ok() / fail() / withHandler()
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts                # 시드 계정·데모 데이터
├── e2e/                       # 키트 E2E (흐름별 spec)
├── docs/                      # problem.yaml, scenarios.yaml, 컨벤션
├── Dockerfile
└── docker-compose.yml
```

- **BE 담당 폴더: `app/api/`, `server/`, `prisma/`, `app/%5F%5Fhealth/`**
- 공용 파일(`package.json`, `Dockerfile`, `docker-compose.yml`, `next.config.*`, `.env.example`) 수정 시 디스코드에 먼저 알립니다.
- `server/` 파일 맨 위에 `import "server-only"`를 넣어 FE에서 실수로 가져오지 못하게 합니다.
  - 예외: `server/*/schema.ts`는 FE가 `import type`으로 타입을 가져가는 파일이라 `server-only`를 넣지 않습니다(DB·키 접근 코드 금지).

## 4. 레이어 규칙

```
route.ts → service → repository → Prisma
```

- **route.ts**: 요청 파싱, zod 검증, 인증 확인, service 호출, 응답 반환. Prisma 직접 사용 금지
- **service**: 비즈니스 로직, 실패 시 `throw new AppError(...)`
- **repository**: Prisma 조회/저장만
- 모든 route는 `withHandler()`로 감싸 에러를 공통 응답 형식으로 변환

## 5. 네이밍

| 대상 | 규칙 | 예시 |
|---|---|---|
| 변수, 함수 | camelCase | `getUserById` |
| 타입, 클래스, zod 스키마 타입 | PascalCase | `GuideRequest` |
| zod 스키마 변수 | camelCase + Schema | `guideRequestSchema` |
| 상수 | UPPER_SNAKE_CASE | `MAX_IMAGE_SIZE` |
| 파일 (server/) | kebab-case | `guide-session.ts` |
| Prisma 모델 | 단수 PascalCase, 필드 camelCase | `model GuideSession { userId Int }` |
| DB 테이블 | 복수 snake_case (`@@map`) | `@@map("guide_sessions")` |
| 함수 동사 | get / list / create / update / delete | `listSessions` |

## 6. 에러 처리

- `throw new AppError(404, "SESSION_NOT_FOUND", "안내 기록을 찾을 수 없습니다.")`
- 에러 코드: `<DOMAIN>_<REASON>` UPPER_SNAKE_CASE, 메시지는 사용자에게 그대로 보여줘도 되는 한국어
- zod 검증 실패는 400 + `VALIDATION_ERROR`, 알 수 없는 오류는 500 + `INTERNAL_SERVER_ERROR` (상세 내용은 서버 로그에만)
- 새 에러 코드는 아래 12번 목록에 추가

## 7. DB 규칙

- PK: `id` (Int, autoincrement), 모든 테이블에 `createdAt`, `updatedAt`
- FK 필드: `<대상>Id` (예: `userId`)
- 스키마 변경은 **Prisma 마이그레이션으로만** (`npx prisma migrate dev --name <설명>`). 머지된 마이그레이션 파일 수정 금지
- ⚠️ 2명이 동시에 마이그레이션을 만들면 충돌 → **생성 전 디스코드에 알리고 `main` 최신을 pull 한 뒤 생성**
- E2E에 필요한 선행 데이터와 시드 계정은 `prisma/seed.ts`에서 만듦 (앞 흐름이 만든 데이터에 기대지 않음)

## 8. AI 호출 규칙

- AI 호출은 **서버(`server/ai/`)에서만**. 키를 브라우저로 보내지 않음
- 팀 전체 예산 누적 $10 → 이미지 크기 줄이기, 호출 횟수 제한, 불필요한 반복 호출 금지
- 타임아웃, 실패, 예산 부족 시 사용자에게 보여줄 메시지와 에러 코드(`AI_*`)를 반환
- E2E는 실제 AI 응답을 기다려 확인하므로, 흐름 하나가 1분 안에 끝나도록 응답 시간을 관리

## 9. 환경변수

- 비밀값은 `.env`에만, **커밋 금지**. `.env.example`에는 이름만 적음
- 서버 코드에서만 `process.env`로 읽음. `NEXT_PUBLIC_`이 붙은 변수에는 비밀값 금지
- 새 변수를 추가하면 `.env.example`과 README 환경변수 표를 같이 갱신

## 10. Git 규칙

- `main`에 push하면 CI·자동 배포가 돌기 때문에 **`main`은 항상 실행되는 상태 유지**
- 브랜치: `feat/be-<기능>`, `fix/be-<내용>` → `main`으로 PR
- 커밋: `feat:` / `fix:` / `refactor:` / `docs:` / `chore:` (예: `feat: 화면 안내 요청 API 구현`)
- 작업 순서: `main` pull → 브랜치 생성 → 작업 → `npm run lint` → push → PR → 다른 BE가 10분 안에 확인 후 머지
- 커밋은 작게, 자주

## 11. 담당 분배

| 담당자 | 작업 |
|---|---|
| BE-1 이감재 | 공통 코드(`server/response.ts`, `server/errors.ts`), Prisma·DB·시드 계정, Docker·배포·CI, 로그인·설정·도움 기록 API |
| BE-2 hyuckkim | 화면 분석·안내 API(`POST /api/guides`), AI Gateway 호출(`server/ai/`), 위험 동작 판단 |

## 12. 에러 코드 목록

| 코드 | 상태 | 설명 |
|---|---|---|
| `VALIDATION_ERROR` | 400 | 요청 값 검증 실패 |
| `AUTH_REQUIRED` | 401 | 로그인 필요 |
| `IMAGE_INVALID` | 400 | 화면 이미지가 data URL(JPEG/PNG/WEBP base64) 형식이 아님 |
| `IMAGE_TOO_LARGE` | 400 | 화면 이미지 문자열이 4MB 초과 |
| `AUTH_INVALID_CREDENTIALS` | 401 | 이메일 또는 비밀번호가 맞지 않음 |
| `AUTH_EMAIL_TAKEN` | 409 | 이미 가입한 이메일 |
| `AI_UNAVAILABLE` | 503 | AI 키가 없거나 비활성이라 분석할 수 없음 (앱은 정상 기동) |
| `AI_TIMEOUT` | 503 | AI 응답 시간 초과 |
| `AI_FAILED` | 503 | AI 응답 실패 또는 해석 불가 |
| `AI_BUDGET_EXCEEDED` | 429 | 팀 AI 예산 소진·요청 제한 |
| `INTERNAL_SERVER_ERROR` | 500 | 알 수 없는 서버 오류 |
| (추가 시 여기에 기록) | | |
