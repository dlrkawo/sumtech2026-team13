# sumtech2026-team13

SUMTECH 2026 루프톤 13팀 서비스 저장소입니다.
주제: AI 에이전트와 함께 만드는 실생활 문제 해결 서비스

## 문서

서비스 **눌러보슈**: 디지털이 낯선 부모님이 막힌 화면을 보여 주면(화면 공유 또는 사진) AI가 다음에 누를 곳 한 군데를 화면 위에 짚어 주고, 되돌리기 어려운 버튼 앞에서는 경고합니다.

- 문제정의·기능 명세: `docs/problem.yaml` (기능 F1~F8, 출처 SRC1~SRC6)
- 사용자 핵심 흐름: `docs/scenarios.yaml` (S1~S7, 각 흐름의 자동 테스트는 `e2e/scenarios/S1~S7.spec.ts`)
- API 목록과 응답 형식: `docs/API_CONVENTION.md` 10번 / 서버 구조: `docs/BE_CONVENTION.md` / 화면 규칙: `docs/FE_CONVENTION.md`
- 진행 기록: `progress.md`

## 설치·실행

Next.js 하나(레포 루트)로 화면과 API를 함께 제공합니다. 주최 측 실행과 같은 방식인 Docker로 띄웁니다.

준비물: Docker Desktop

```bash
docker compose down -v
docker compose up -d --build
curl http://localhost:3000/__health
```

- `docker compose down -v`는 DB를 비우고 처음부터 띄웁니다(주최 측 실행과 같은 조건).
- `/__health`가 `{"releaseId":"dev"}`로 200을 주면 정상입니다. 브라우저에서 http://localhost:3000 을 열면 첫 화면이 보입니다.
- 끄기: `docker compose down`
- BE API 확인: 앱이 뜬 뒤 `bash scripts/smoke-api.sh` (시드 계정 로그인 → 내 정보 → 설정 → 도움 기록 → 가입 → 로그아웃)
- 앱이 처음 뜰 때 DB 테이블과 시드 계정(`student@example.com` / `loopthon-2026`)을 자동으로 만듭니다 (`instrumentation.ts` → `server/db/init.ts`)
- **E2E를 채점기와 같은 순서로 한 번에**: `bash scripts/e2e-local.sh` (빈 DB 기동 → `/__health` 2분 확인 → `e2e/scenarios` 실행 → 정리). 일부만: `bash scripts/e2e-local.sh S2 S3`, 앱을 켜 두려면 `KEEP=1`을 앞에 붙입니다. AI가 필요한 흐름은 `.env`에 `AI_GATEWAY_API_KEY`가 있어야 합니다(한 번에 약 $0.05).
- 화면 안내 API만 확인: `bash scripts/smoke-guide.sh e2e/fixtures/mock-step1.png "병원 예약하고 싶어"`

로컬 개발 서버(Node.js 24 필요):

```bash
npm ci
npm run dev
```

## 개발·검사

- 검사: `npm run lint`, `npm run typecheck`, `npm run build` (GitHub Actions `ci`에서도 같은 검사가 돕니다). 흐름 E2E는 위 `scripts/e2e-local.sh`.
- 화면만 보기: `npm run dev` 뒤 `http://localhost:3000/dev/helper-preview?mock=<이름>` — 로그인·화면 공유 없이 아이콘 모드의 주요 상태를 목업으로 바로 봅니다. 이름은 `step1`(누를 곳 찾음) · `step2` · `done`(다 됐어요) · `need-info`(알기 어려움) · `risk`(위험 경고) · `no-target`(표시 없음). 운영(`NODE_ENV=production`)에서는 404입니다.
- AI 없이 전체 흐름 돌리기: `.env`에 `NEXT_PUBLIC_USE_MOCK=true`를 넣으면 `/api/guides` 대신 `components/guide/mock.ts` 응답을 씁니다. main·배포에서는 비워 둡니다.
- 설계 문서: 화면 규칙 `docs/FE_CONVENTION.md`, API `docs/API_CONVENTION.md`, 서버 `docs/BE_CONVENTION.md`.

## 환경변수

| 이름 | 용도 | 설정 위치 |
| --- | --- | --- |
| `RELEASE_ID` | `/__health`가 응답하는 배포 commit SHA | CI·주최 측 실행이 자동으로 넣음, 배포 환경변수(배포 플랫폼의 commit 변수) |
| `DATABASE_URL` | PostgreSQL 접속 주소 | `docker-compose.yml`(로컬 docker), 배포 환경변수 |
| `SEED_USER_EMAIL` | E2E용 시드 계정 이메일 | `docker-compose.yml`에 값 그대로(로컬 docker 전용) |
| `SEED_USER_PASSWORD` | E2E용 시드 계정 비밀번호 | `docker-compose.yml`에 값 그대로(로컬 docker 전용, 배포 계정과 다른 값) |
| `AI_GATEWAY_API_KEY` | 서버의 AI Gateway 호출 | `.env`(로컬 개발), 배포 환경변수, GitHub Secrets. 저장소에 넣지 않음 |

값은 커밋하지 않고 `.env.example`에는 이름만 적습니다. `AI_GATEWAY_API_KEY`가 비어 있어도 앱은 뜹니다(AI 기능만 실패 안내). 키는 한 줄로 넣습니다. 앞뒤 공백·줄바꿈은 서버가 지우지만, 키 가운데에 줄바꿈이 있으면(두 줄로 저장된 Secret 등) AI 기능이 `AI_UNAVAILABLE`로 실패하고 서버 로그에 안내가 남습니다.

## 팀원 작업 방법

```bash
git clone https://github.com/dlrkawo/sumtech2026-team13.git
cd sumtech2026-team13
git switch -c <내-브랜치>
```
