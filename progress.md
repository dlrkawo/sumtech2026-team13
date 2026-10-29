# 우리 팀 진행 기록

Agent가 서비스 저장소 루트의 `progress.md`로 복사해 이어 쓴다(`docs/` 아래에 두지 않는다). 필수 제출 양식을 대신하는 문서가 아니다. 비밀번호·토큰·팀 로그인 코드는 적지 않는다.

## 현재 상태 (2026-10-30 07:20 기준, #91·#90 머지 후 main)

- 서비스: **눌러보슈** — 디지털이 낯선 부모님이 막힌 화면을 보여 주면(화면 공유 또는 사진) AI가 다음에 누를 곳 한 군데를 화면 위에 짚어 주고, 되돌리기 어려운 버튼 앞에서는 경고한다.
- 실제 서비스 저장소 폴더: 학생 맥 `OneDrive-개인/dlrkawo/2026 4-2/SUMTECH/be` (원격 https://github.com/dlrkawo/sumtech2026-team13). push는 각자 터미널에서 하고, main은 PR로만 바뀐다(룰셋: PR 필수, 필수 검사 `check`·`docs`).
- 현재 단계: 1~6단계 완료, 7단계 최종 검증·마무리 정리 중. 채점 흐름 S1~S7이 로컬 docker와 CI(`scenarios`) 모두에서 통과, 단위 테스트 38개(CI `check`의 Unit test 단계)도 통과.
- 10.30 새벽 이후 머지(#74~#91): 지난 안내 목록으로 이어 묻기·retryable(#74), 탭 공유 후 눌러보슈 탭 유지(#75), 아이콘 모드 글자·설정 버튼 56px(#76·#77), 사진 모드 같은 사진 '다음' 막기·입력 출처 표시(#78), 1280×720 배치(#80), 서비스명 곁길→눌러보슈(#81), 실패 뒤 화면 바꾸면 오류 지우기(#82), 공유 끊김 알림·공유 직후 첫 장면 대기(#83), 누를 곳 크게 보기·사진 크게 보기(#84), trash/·예시 spec 삭제(#85), 오류 화면·탭 아이콘(#86), progress·README 정리(#87), 기능 명세·S3에 같은 사진 '다음' 확인·경험 사례 E1~E3(#88), vitest 단위 테스트 38개(#89), experiences 구조·표기 정리(#90), 제출 전 최종 점검 반영(#91)
- 제출 전 최종 점검(대시보드 SUBMISSION_CHECK.md, 07:15): 저장소·문서 형식·흐름·E2E·Docker·배포를 main `c855168` 기준으로 대조. 결과와 남은 일은 7단계 참고.
- 10:00 코드 머지 중단 예정. 그 뒤는 문서(problem.yaml·progress.md)만 손본다.
- 다음 행동: 아래 7단계의 남은 항목, 「아직 못 한 일」 참고.

## 1. GitHub 준비

- [x] 기존 저장소·브랜치·remote와 로그인 확인 (GitHub 계정 dlrkawo)
- [x] 학생과 저장소 이름 합의 (답을 받기 전에는 생성하지 않음) → sumtech2026-team13
- [x] 팀의 private 레포 생성 또는 기존 레포 확인 (GitHub 웹에서 README 포함 생성)
- [x] loopthon-bot 앱을 팀 레포에 설치 (https://github.com/apps/loopthon-bot/installations/new, 팀 레포만 선택)
- [x] 팀 코드로 대시보드 API 로그인(`data.teamId`), 레포 URL을 HTTP로 저장(`data.team.repoUrl`) 확인. 팀 코드로는 화면에 들어갈 수 없음
- [x] 사이트에 등록한 레포를 실제 작업 폴더로 clone, remote·기본 브랜치 확인
- [x] .gitignore / .env.example / README 준비(`.env`·`node_modules/`·`.next/`·`dist/`·`build/` 제외, 큰 데이터 파일 커밋 안 함. 파일이 너무 많으면 저장소를 읽지 못함)
- [x] 준비 파일 commit/push 확인 (fd7deb9, 학생이 맥에서 push)
- [x] 앱 설치 후 읽기 권한 확인 (5분 자동 재확인, 즉시 확인은 같은 레포 URL 다시 저장)
- 저장소 URL / 기본 브랜치 / commit SHA: https://github.com/dlrkawo/sumtech2026-team13 / main / 첫 커밋 74542f8, 준비 파일 커밋 fd7deb9
- 사이트 등록 결과 / loopthon-bot 설치·접근 상태: 팀 ID 13, PUT /api/teams/13/repo → ok:true, repoUrl 일치. 앱 설치 후 재저장 결과 check.result = ok (2026-10-29)
- 참고: Agent 클라우드 작업 공간에서 대시보드 주소는 네트워크 정책상 막혀 있어, 앱 안의 브라우저에서 HTTP 요청을 보냄

## 2. 문제정의 기록 → 문제 다지기 → 해법 찾기 → 기능 명세

- [x] 종이 기록 수령(학생이 채팅에 옮겨 적거나 사진 첨부)
- [x] problem.example.yaml을 참고해 docs/problem.yaml 작성
- [x] 원문 의도와 불명확한 내용 확인, 없는 근거는 빈칸 유지 (팀장 v1~v5 개정, #39·#45·#49·#50·#52·#54)
- [x] 2-A 문제 다지기: 캔버스(상황·고객·근본 문제·영향·대안 5개), five_whys 5단계
- [ ] 팀원 경험을 언제·어떤 장면·어떻게 대응했는지까지 experiences에 기록 — E1은 대표 유형(가족 관찰·인터뷰 취합)이라 when·workaround·quote가 있는 실제 사례 1건 이상 보강 필요
- [x] 외부 자료는 열리는 URL을 sources에 그대로 적고 원문이 주장을 직접 뒷받침하는지 확인, 출처 없는 수치 없음 — SRC1~SRC6 원문 수치 대조 완료(2026-10-30 02:40)
- [x] 문제가 '우리 기능이 없어서'가 아니라 실제 상황·행동으로 서술됐는지 확인
- [x] 2-B 해법 찾기: solution_paths(채택 1·제외 3·보류 3)와 대안별 why_ours 작성
- [x] 2-C features F1~F8 작성 (F1~F6 = 흐름 S1~S6, F8 작은 창 = S7의 expected, F7 화면 공유는 수동 확인)
- [x] YAML 문법 검사, 등록된 레포의 기본 브랜치에 docs/problem.yaml push (`scripts/check_docs.py`, CI `docs` 검사로 매 PR 확인)
- [x] 학생이 개인 로그인으로 우리 팀 → 문제 정의를 열어 캔버스 표시 확인(Agent는 화면을 열 수 없음, 약 1분 캐시)
- [x] 핵심 사용자 흐름·기능별 동작 규칙·완료 조건·제외 범위를 팀과 확인 (대표 과업을 '병원 홈페이지 진료 예약' 하나로 좁힌 v2→v3 흐름으로 확정)
- [x] 로그인 필요 여부와 역할 이름 결정 → 로그인 필요, 역할 `사용자` 하나 (시드 계정 student@example.com, 로컬 docker 전용)
- [x] 첫 화면에서 알려 줄 것 → 로그인 전 `/`에 서비스 이름 '눌러보슈'과 하는 일(Landing)
- [x] 주 사용 플랫폼 desktop, platformReason 작성 (PC 브라우저에서만 다른 앱 화면 공유 가능)
- [x] 사용자 핵심 흐름 7개(S1~S7)를 docs/scenarios.yaml에 작성, 키트 형식 검사 경고 0개 (S7 작은 창은 #63에서 추가)
- [x] 서비스의 AI 호출 필요 여부 확인 → 필요 (화면 분석·안내, 목소리 받아쓰기)
- [x] README 등 기존 문서에 확인된 구현 설계 기록 (README, docs/BE_CONVENTION.md, docs/API_CONVENTION.md, docs/FE_CONVENTION.md)
- 문제정의·구현 설계 링크: https://github.com/dlrkawo/sumtech2026-team13/blob/main/docs/problem.yaml · https://github.com/dlrkawo/sumtech2026-team13/blob/main/docs/scenarios.yaml · API 목록은 docs/API_CONVENTION.md 10번

## 3. 최소 화면 docker 실행·CI·첫 배포

- [x] 설계에 맞는 최소 화면과 서버 실행 구성 준비, Dockerfile 작성 (Next.js standalone, 빌드는 Dockerfile, 시작 명령은 `node server.js`)
- [x] docker-compose.yml: app·db, app만 ports "3000:3000", 앱은 컨테이너 안 3000에서 받음, 앱 코드에 localhost:3000 같은 절대 주소 없음
- [x] app 말고는 ports·container_name이 없고, 어느 서비스에도 env_file 없음
- [x] 환경변수 이름 그대로(RELEASE_ID·SEED_USER_*·AI_GATEWAY_API_KEY), 시드 계정 값은 `${}` 없이 직접 적음
- [x] 빈 DB에서 `docker compose up --build`만으로 앱·시드 데이터가 2분 안에 뜸 — `/__health` 응답까지 약 5초 (마이그레이션·시드는 instrumentation.ts → server/db/init.ts가 기동 때 실행)
- [x] README 설치·빌드·실행 안내와 환경변수 표(이름·용도·설정 위치)
- [x] GET /__health가 인증·리다이렉트 없이 200 응답(app/%5F%5Fhealth, `Cache-Control: no-store`), docker는 RELEASE_ID·Vercel은 VERCEL_GIT_COMMIT_SHA를 releaseId로 응답
- [x] 공개 HTTPS URL 첫 배포 (Vercel + Neon Postgres 무료 등급, Production 환경에만 DATABASE_URL·AI_GATEWAY_API_KEY)
- [x] CI 실제 검사: `ci`(lint·typecheck·build + 키트 문서 형식 `docs`), `scenarios`(docker로 앱을 띄워 e2e 실행, 문서만 바뀐 머지는 건너뜀). main 룰셋 필수 검사는 `check`·`docs`
- [x] Agent가 대시보드 배포 URL 저장, UP·배포 commit 일치 확인 — 대시보드 저장 주소는 임시 주소, 07:10 `/__health` releaseId = main `c855168`로 일치
- 배포 URL: 임시 https://sumtech2026-team13-one.vercel.app (팀원 Vercel 계정, 같은 DB, main 머지마다 자동 배포, 대시보드 저장 주소, 07:10 releaseId `c855168` = main 최신) / 원래 https://sumtech2026-team13.vercel.app (Vercel Hobby 하루 배포 한도로 06:40 이후 다시 막혀 07:10 releaseId `9fb0d9c`에 멈춤, GitHub 커밋의 Vercel 상태 'rate limited')
- CI·배포 링크: https://github.com/dlrkawo/sumtech2026-team13/actions

## 4. 서비스 AI API 설정 (필요할 때만)

- 해당 여부 / 선택한 Gateway 지원 모델: 해당. 화면 분석·안내 `anthropic/claude-sonnet-5.5`(server/guide), 목소리 받아쓰기 `google/gemini-3.5-transcribe`(server/voice-guide)
- [x] 모든 지원 모델을 자유롭게 사용하며 권장 목록은 추천용임을 확인
- [x] 팀 전체 누적 $10 한도와 현재 사용액·남은 예산·선택 모델 단가 확인 — 10.30 01:18 기준 $0.19 사용, 안내 1회 약 $0.006, e2e S1~S7 한 번 약 $0.05 (AI는 S2~S6만 부름)
- [x] 학생이 자료 → API 키에서 키를 받아 직접 복사, Agent는 키를 발급·조회하지 않음
- [x] 서버가 환경변수 AI_GATEWAY_API_KEY에서 키를 읽음, docker-compose.yml app에 `AI_GATEWAY_API_KEY: ${AI_GATEWAY_API_KEY:-}`, 키가 비어도 앱은 뜨고 AI 기능만 실패 안내
- [x] 학생이 AI_GATEWAY_API_KEY를 로컬(.env)·배포(Vercel Production)·GitHub Secrets에 직접 설정, .env.example에는 이름만 기록 (10.30 02:29 Secret 줄바꿈 제거 후 CI scenarios 통과)
- [x] 서버에서 Gateway 호출, 접근 제한·예산 부족·지연·실패 처리 (AI_UNAVAILABLE·AI_TIMEOUT 25초·AI_FAILED·AI_BUDGET_EXCEEDED, 해석 실패 시 1회 재시도, 답이 잘리면 재시도 없이 실패)
- [x] 팀 예산 안의 작은 실제 요청으로 연결 확인 (`bash scripts/smoke-guide.sh <사진> "<질문>"`)
- 결과: 시나리오에 없는 연습 화면(public/practice 메신저·설정·이체 확인)에서도 누를 곳·송금 경고를 정확히 안내(10.30 02:39)

## 5. 핵심 기능 구현

- [x] 회원가입·로그인·로그아웃 구현(scrypt 비밀번호, httpOnly 쿠키 세션), 아이디/비밀번호로 바로 로그인 가능
- [x] 로그인하지 않은 사람이 `/`를 열면 서비스 이름 '눌러보슈'과 하는 일이 보임
- [x] 핵심 입력 → 실제 처리 → 결과 → 다음 행동: 화면(공유 캡처 또는 사진)+질문 → AI 분석 → 안내 문장·누를 곳 표시·위험 경고 → '눌렀어요, 다음 알려 주세요'로 이어 묻기 / 다 되면 '다 됐어요'
- [x] features의 동작 규칙·완료 조건과 대조 (F1~F6 = S1~S6, F8 = S7 expected)
- [x] 화면 다듬기: 아이콘 모드·PiP 작은 창·설정 창·도움 기록 (FE)
- [x] docs/scenarios.yaml의 메뉴·버튼 이름이 실제 화면과 같은지 확인, 화면 이름을 바꾸면 흐름·spec도 같은 PR에서 수정 (#44에서 '눌러보슈 도우미 열기' 단계를 흐름·spec에 함께 반영)
- [x] 로그인 전에는 로그인 필요 API가 401, 없는 주소는 404(app/not-found.tsx), 개발용 미리보기(/dev/helper-preview)는 운영에서 404
- [x] 실패 처리와 의미 있는 테스트: `scripts/smoke-api.sh`(BE API 15개 통과), `scripts/smoke-guide.sh`(실제 AI), CI lint·typecheck·build
- [x] 의미 있는 변경 commit/push, CI·자동 배포 결과 확인
- 완료한 과업: 회원가입·로그인, 설정(가장자리 표시·음성·강조 방식·위험 경고·기록 저장), 화면 분석·안내(POST /api/guides), 목소리로 묻기(POST /api/voice-guides), 도움 기록 조회·삭제

## 6. 흐름 E2E

- [x] 키트 e2e/를 저장소 e2e/로 복사, platform에 맞는 desktop project만 남김
- [x] 흐름마다 e2e/scenarios/<id>.spec.ts 하나(S1~S7), 파일마다 test 하나
- [x] steps를 같은 순서의 화면 조작으로 spec 본문에 옮김(API 호출 없음), 회원가입 이메일은 실행마다 다르게 — steps와 spec 동작 1:1 대조(10.30 02:55)
- [x] page.goto는 창마다 처음 한 번만, 로그인 도우미 함수는 test보다 위에
- [x] 마지막에 expected 결과를 expect로 확인
- [x] test.skip·test.fixme·test.only·조건부 return·실패를 삼키는 try/catch 없음
- [x] page.route·route.fulfill·routeFromHAR·routeWebSocket·addInitScript·화면 글자를 바꾸는 page.evaluate 없음
- [x] 흐름에 필요한 선행 데이터는 앱 시드로, 업로드 사진은 e2e/fixtures/(mock-step1·step2·done·unclear)에 커밋, 앞 흐름이 만든 데이터에 기대지 않음 (S6은 새로 가입)
- [x] AI 기능은 실제 응답을 기다려 확인, 흐름 하나가 로컬에서 1분 안 (가장 긴 S3 약 7초)
- [x] viewport를 spec에서 바꾸지 않음
- [x] globalSetup·storageState 등 playwright.config.ts에만 있는 설정에 기대지 않음
- [x] `docker compose down -v`, `docker compose up -d --build` 뒤 `npx playwright test`로 모든 흐름 통과 — 한 번에: `bash scripts/e2e-local.sh`
- 흐름별 E2E 결과: S1~S7 모두 통과(CI `scenarios`, main `9b35a47`, 10.30 04:33). 이전 S1~S6 3회 반복 18/18 통과(53.8초, 10.30 02:39). 화면 공유 '▶'·실제 마이크는 자동 테스트로 고를 수 없어 흐름에서 빼고 F7로 수동 확인

## 7. 최종 검증

- [x] 실제 배포에서 인증·핵심 과업·대표 실패 동작과 환경변수 확인 — 임시 주소에서 /__health·로그인 필요 응답 확인, 사진 올려 묻기는 팀원이 확인
- [x] 빈 DB의 docker 앱에서 desktop 화면으로 모든 흐름 E2E 통과, spec이 steps·expected 그대로인지 다시 읽음, 프로젝트 검사, 비밀값 노출 확인(.env·키·DB 주소 커밋 없음)
- [x] 최종 기본 브랜치 push, 해당 commit의 CI 성공 확인 (자동 배포는 Vercel 한도로 임시 주소에서)
- [x] 같은 배포 URL을 다시 저장해 대시보드 UP·최종 배포 commit 일치 확인
- [x] 학생이 자료 → 제출 요건 화면에서 노란 줄이 없다고 확인
- [ ] 문제정의·구현 설계·최종 결과 링크와 미확인 사항 보고
- 검사 결과 / CI·배포 링크 / 최종 commit SHA: CI `ci`(lint·typecheck·단위 테스트 38개·build)·`scenarios`(S1~S7) 통과, https://github.com/dlrkawo/sumtech2026-team13/actions, main `c855168` (07:15, `ci` #188·`scenarios` #80)
- 흐름별 E2E 결과: S1~S7 통과(로컬 docker·CI)
- 확인 기록: 10.30 04:00 채점 커밋 `c824b54`(#63)는 사진 버튼이 아이콘만 남아(#61) spec이 누를 '사진 올리기' 글자가 없었고, S6은 Next.js가 늘 넣는 빈 알림(role=alert)까지 세어 S2~S6이 실패 → #66(버튼 글자)·#68(S6 확인 범위)로 고쳐 main `9b35a47`에서 S1~S7 통과
- 배포 URL: 대시보드에 저장된 임시 주소가 main 최신과 일치(3단계 배포 URL 참고). 원래 주소는 하루 배포 한도로 멈춰 있음
- 다음 행동 / 제한:
  - (기획) experiences E1~E3(#90에서 구조·표기 정리)에 when(언제)·feeling(그때 기분)·quote(당사자 말)를 인터뷰 기록에서 옮겨 적기
  - (기획) insight의 확인 계획(가족 2~3명 모의 예약 관찰)을 실행하고 결과를 insight.evidence에 적기 — 지금은 "확인하지 않았다"로 끝남
  - (기획) problem.yaml의 범위 문구를 scenarios와 같게 "PC 크롬·엣지 웹 예약"으로 명시하고, F4 output의 위험 경고 설정 문구를 현재 구현과 맞추기
  - (구현) 단위 테스트 38개(`npm test`, tests/unit/) + E2E S1~S7. AI 적중률은 `scripts/smoke-guide.sh`로 fixtures·practice 화면을 여러 번 돌려 표로 남길 예정
  - 원래 Vercel로 돌아오면 Neon DB 비밀번호 교체(Rotate Secrets) 후 재배포
  - 화면 공유는 PC 크롬·엣지에서만 됨(휴대폰 앱 화면은 보류). ▶ 공유·마이크는 자동 테스트 불가라 수동 확인
