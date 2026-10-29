# sumtech2026-team13

SUMTECH 2026 루프톤 13팀 서비스 저장소입니다.
주제: AI 에이전트와 함께 만드는 실생활 문제 해결 서비스

## 문서

- 문제정의·기능 명세: `docs/problem.yaml` (2단계에서 작성)
- 사용자 핵심 흐름: `docs/scenarios.yaml` (2단계에서 작성)
- 진행 기록: `progress.md`

## 설치·실행

3단계에서 `Dockerfile`·`docker-compose.yml`을 만든 뒤 아래에 정리합니다.

```bash
docker compose up --build
```

## 환경변수

| 이름 | 용도 | 설정 위치 |
| --- | --- | --- |
| `AI_GATEWAY_API_KEY` | 서비스의 AI 호출(필요할 때만) | `.env`(로컬), 배포 환경변수, GitHub Secrets |

값은 커밋하지 않고 `.env.example`에는 이름만 적습니다.

## 팀원 작업 방법

```bash
git clone https://github.com/dlrkawo/sumtech2026-team13.git
cd sumtech2026-team13
git switch -c <내-브랜치>
```
