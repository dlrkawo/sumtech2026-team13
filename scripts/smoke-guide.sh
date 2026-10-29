#!/usr/bin/env bash
# 화면 분석·안내 API(POST /api/guides) 실제 AI 호출 확인. docker compose up 이후 실행.
# 사용: bash scripts/smoke-guide.sh <이미지.png|jpg> ["질문"] [기본 http://localhost:3000]
set -u
IMG="${1:?이미지 파일 경로를 넣어주세요. 예) bash scripts/smoke-guide.sh ~/Desktop/screen.png}"
QUESTION="${2:-카카오톡으로 사진을 보내려면 어디를 눌러요?}"
BASE="${3:-http://localhost:3000}"
JAR="$(mktemp)"
BODY="$(mktemp)"

case "$IMG" in
  *.png|*.PNG) MIME="image/png" ;;
  *.jpg|*.jpeg|*.JPG|*.JPEG) MIME="image/jpeg" ;;
  *.webp) MIME="image/webp" ;;
  *) echo "png, jpg, webp만 지원해요"; exit 1 ;;
esac

# 시드 계정 로그인
code="$(curl -s -o /dev/null -w '%{http_code}' -c "$JAR" -X POST -H 'Content-Type: application/json' \
  -d '{"email":"student@example.com","password":"loopthon-2026"}' "$BASE/api/auth/login")"
[ "$code" = "200" ] || { echo "❌ 로그인 실패 ($code)"; exit 1; }

# base64 data URL을 파일로 만들어 전송 (mac, linux 둘 다 동작)
B64="$(base64 < "$IMG" | tr -d '\n')"
LEN=${#B64}
echo "이미지 data URL 길이: $LEN (제한 3145728)"
printf '{"image":"data:%s;base64,%s","question":"%s"}' "$MIME" "$B64" "$QUESTION" > "$BODY"

START=$(date +%s)
curl -s -w '\nHTTP %{http_code}\n' -b "$JAR" -X POST -H 'Content-Type: application/json' \
  --data-binary @"$BODY" "$BASE/api/guides"
echo "걸린 시간: $(( $(date +%s) - START ))초"

echo; echo "--- 도움 기록에 저장됐는지 ---"
curl -s -b "$JAR" "$BASE/api/guide-history"; echo

rm -f "$JAR" "$BODY"
