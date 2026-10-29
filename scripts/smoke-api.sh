#!/usr/bin/env bash
# BE API 동작 확인 (docker compose up 이후 실행). 사용: bash scripts/smoke-api.sh [기본 http://localhost:3000]
# 시드 계정(docker-compose.yml)으로 로그인 → 내 정보 → 설정 조회·변경 → 도움 기록 → 가입 → 로그아웃까지 확인한다.
set -u
BASE="${1:-http://localhost:3000}"
JAR="$(mktemp)"
NEW_EMAIL="smoke-$(date +%s)@example.com"
PASS=0
FAIL=0

check() { # 이름, 기대 상태 코드, curl 인자...
  local name="$1" expected="$2"; shift 2
  local out code
  out="$(curl -s -o /tmp/smoke-body -w '%{http_code}' -b "$JAR" -c "$JAR" "$@")"
  code="$out"
  if [ "$code" = "$expected" ]; then PASS=$((PASS + 1)); echo "✅ $name ($code)"; else FAIL=$((FAIL + 1)); echo "❌ $name: 기대 $expected, 실제 $code"; fi
  cat /tmp/smoke-body 2>/dev/null; echo; echo
}

check "헬스체크" 200 "$BASE/__health"
check "로그인 전 내 정보 → 401" 401 "$BASE/api/auth/me"
check "틀린 비밀번호 → 401" 401 -X POST -H 'Content-Type: application/json' -d '{"email":"student@example.com","password":"wrong-password"}' "$BASE/api/auth/login"
check "시드 계정 로그인" 200 -X POST -H 'Content-Type: application/json' -d '{"email":"student@example.com","password":"loopthon-2026"}' "$BASE/api/auth/login"
check "내 정보" 200 "$BASE/api/auth/me"
check "설정 조회" 200 "$BASE/api/settings"
check "설정 변경 (화면 가장자리 표시 끄기)" 200 -X PATCH -H 'Content-Type: application/json' -d '{"edgeDisplay":false}' "$BASE/api/settings"
check "잘못된 설정 값 → 400" 400 -X PATCH -H 'Content-Type: application/json' -d '{"highlightStyle":"CIRCLE"}' "$BASE/api/settings"
check "도움 기록 목록" 200 "$BASE/api/guide-history"
check "도움 기록 전체 삭제" 204 -X DELETE "$BASE/api/guide-history"
check "로그아웃" 204 -X POST "$BASE/api/auth/logout"
check "로그아웃 후 내 정보 → 401" 401 "$BASE/api/auth/me"
check "새 계정 가입" 201 -X POST -H 'Content-Type: application/json' -d "{\"email\":\"$NEW_EMAIL\",\"password\":\"test-password-1\"}" "$BASE/api/auth/signup"
check "같은 이메일 다시 가입 → 409" 409 -X POST -H 'Content-Type: application/json' -d "{\"email\":\"$NEW_EMAIL\",\"password\":\"test-password-1\"}" "$BASE/api/auth/signup"
check "가입 직후 로그인 상태" 200 "$BASE/api/auth/me"

rm -f "$JAR" /tmp/smoke-body
echo "결과: 통과 $PASS / 실패 $FAIL"
[ "$FAIL" -eq 0 ]
