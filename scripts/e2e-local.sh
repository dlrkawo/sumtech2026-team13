#!/usr/bin/env bash
# 채점기와 같은 순서로 E2E를 돌린다: 빈 DB로 docker 기동 → /__health 대기(2분 제한) → e2e/scenarios 실행 → 정리
# 사용:
#   bash scripts/e2e-local.sh          S1~S6 전부
#   bash scripts/e2e-local.sh S2 S3    일부만
#   KEEP=1 bash scripts/e2e-local.sh   끝난 뒤 앱을 끄지 않음 (브라우저로 http://localhost:3000 확인용)
# 준비물: Docker Desktop, Node.js(npx), 레포 루트 .env의 AI_GATEWAY_API_KEY (AI가 필요한 흐름용, 팀 대시보드 자료 → API 키)
# 비용: 전체 한 번에 실제 AI 호출 6~8번, 약 $0.05 (팀 예산 $10)
set -u
cd "$(dirname "$0")/.." || exit 1
BASE="http://localhost:3000"
KEEP="${KEEP:-0}"

command -v docker >/dev/null 2>&1 || { echo "❌ docker가 없어요. Docker Desktop을 설치해 주세요."; exit 1; }
docker info >/dev/null 2>&1 || { echo "❌ Docker Desktop이 꺼져 있어요. 켠 뒤 다시 실행해 주세요 (맥: open -a Docker)."; exit 1; }
command -v npx >/dev/null 2>&1 || { echo "❌ Node.js(npx)가 필요해요."; exit 1; }

if ! grep -Eqs '^AI_GATEWAY_API_KEY=.+' .env; then
  echo "⚠️  .env에 AI_GATEWAY_API_KEY가 없어요. 사진을 올려 묻는 흐름(S2~S6)은 AI가 없어 실패합니다."
  echo "    키는 팀 대시보드 자료 → API 키에서 받아 .env에 넣으세요 (.env는 커밋되지 않아요)."
fi

cleanup() {
  if [ "$KEEP" = "1" ]; then
    echo "ℹ️  앱을 켜 둡니다. 끄기: docker compose down"
  else
    docker compose down >/dev/null 2>&1
  fi
}

echo "▶ 1/3 빈 DB로 앱 빌드·기동 (주최 측 실행과 같은 조건)"
docker compose down -v >/dev/null 2>&1
if curl -s -o /dev/null --max-time 2 "$BASE"; then
  echo "❌ 3000번 포트를 다른 프로그램이 쓰고 있어요 (npm run dev 등). 끈 뒤 다시 실행해 주세요."
  exit 1
fi
docker compose build || { echo "❌ 빌드 실패 (위 로그 확인)"; exit 1; }
trap cleanup EXIT

START=$(date +%s)
docker compose up -d >/dev/null 2>&1 || { echo "❌ docker compose up 실패"; docker compose logs --tail 30; exit 1; }
until curl -sf "$BASE/__health" >/dev/null; do
  if [ $(( $(date +%s) - START )) -ge 120 ]; then
    echo "❌ 2분 안에 /__health가 응답하지 않아요 (키트 제한 2분). 앱 로그:"
    docker compose logs --tail 30 app
    exit 1
  fi
  sleep 1
done
echo "✅ /__health 응답까지 $(( $(date +%s) - START ))초 (키트 제한 120초)"

echo "▶ 2/3 Playwright 준비"
cd e2e || exit 1
npm install --no-audit --no-fund --silent || { echo "❌ e2e 의존성 설치 실패"; exit 1; }
npx playwright install chromium >/dev/null || { echo "❌ 테스트 브라우저 설치 실패"; exit 1; }

# 인자로 받은 S2 S3 → scenarios/S2.spec.ts scenarios/S3.spec.ts
if [ $# -gt 0 ]; then
  set -- $(for s in "$@"; do printf 'scenarios/%s.spec.ts ' "$s"; done)
fi

echo "▶ 3/3 시나리오 실행 (AI가 필요한 확인은 최대 60초씩 기다려요)"
PLAYWRIGHT_HTML_OPEN=never npx playwright test --reporter=list,html "$@"
RESULT=$?

echo
if [ $RESULT -eq 0 ]; then
  echo "🎉 모두 통과"
else
  echo "❌ 실패한 흐름이 있어요. 실패한 순간의 화면 보기: cd e2e && npx playwright show-report"
fi
exit $RESULT
