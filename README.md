# sumtech2026-team13

SUMTECH 2026 루프톤 13팀 서비스 저장소입니다.
주제: AI 에이전트와 함께 만드는 실생활 문제 해결 서비스

## 문서

- 문제정의·기능 명세: `docs/problem.yaml` (2단계에서 작성)
- 사용자 핵심 흐름: `docs/scenarios.yaml` (2단계에서 작성)
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

로컬 개발 서버(Node.js 24 필요):

```bash
npm ci
npm run dev
```

검사: `npm run lint`, `npm run typecheck`, `npm run build` (GitHub Actions `ci`에서도 같은 검사가 돕니다)

## 환경변수

| 이름 | 용도 | 설정 위치 |
| --- | --- | --- |
| `RELEASE_ID` | `/__health`가 응답하는 배포 commit SHA | CI·주최 측 실행이 자동으로 넣음, 배포 환경변수(배포 플랫폼의 commit 변수) |
| `DATABASE_URL` | PostgreSQL 접속 주소 | `docker-compose.yml`(로컬 docker), 배포 환경변수 |
| `SEED_USER_EMAIL` | E2E용 시드 계정 이메일 | `docker-compose.yml`에 값 그대로(로컬 docker 전용) |
| `SEED_USER_PASSWORD` | E2E용 시드 계정 비밀번호 | `docker-compose.yml`에 값 그대로(로컬 docker 전용, 배포 계정과 다른 값) |
| `AI_GATEWAY_API_KEY` | 서버의 AI Gateway 호출 | `.env`(로컬 개발), 배포 환경변수, GitHub Secrets. 저장소에 넣지 않음 |

값은 커밋하지 않고 `.env.example`에는 이름만 적습니다. `AI_GATEWAY_API_KEY`가 비어 있어도 앱은 뜹니다(AI 기능만 실패 안내).

## 팀원 작업 방법

```bash
git clone https://github.com/dlrkawo/sumtech2026-team13.git
cd sumtech2026-team13
git switch -c <내-브랜치>
```
