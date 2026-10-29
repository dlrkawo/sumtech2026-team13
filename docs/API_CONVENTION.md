# FE ↔ BE API Convention — sumtech 2026 Team 13

> FE와 BE가 API를 주고받을 때 지키는 공통 약속입니다. **해커톤 키트 요구사항(`progress.md`)이 이 문서보다 우선합니다.**
> 바뀌면 이 파일을 수정한 뒤 디스코드에 공지합니다. 문서와 코드가 다르면 **코드(`server/*/schema.ts`)가 기준**이고, 이 문서를 고칩니다.
> **Claude 사용 시:** 이 문서 전체를 붙여넣고 "이 API 컨벤션에 맞춰서 작업해줘"라고 요청하세요.

---

## 0. 프로젝트 맥락

- sumtech 2026 해커톤 팀 13 (PM 1, FE 2, BE 2)
- 서비스 **눌러보슈**: 부모님이 막힌 화면을 보여 주면(화면 공유 또는 화면 사진 올리기) AI가 다음에 누를 곳 한 군데를 짚어 주고, 되돌리기 어려운 버튼 앞에서는 경고
- 구조: **Next.js 풀스택 하나** (레포 루트). FE 화면과 BE API가 같은 앱, 같은 포트(3000)
  - FE 담당: `app/(pages)/`의 화면, `components/`, `lib/` / BE 담당: `app/api/`, `server/`, `instrumentation.ts`
- 레포: https://github.com/dlrkawo/sumtech2026-team13

## 1. 주소

- FE는 API를 **상대 경로**로 호출합니다: `fetch("/api/guides")` (실제로는 `lib/api/client.ts`의 `request()`를 거침)
  - 같은 앱이라 BE 주소 환경변수와 CORS 설정이 필요 없음
  - `http://localhost:3000` 같은 절대 주소를 코드에 쓰지 않음 (키트 규칙)
- 모든 API는 `/api/`로 시작, 경로는 kebab-case 명사 (예: `/api/guide-history`, `/api/voice-guides`)
- 헬스체크 `GET /__health`는 키트용이며 FE가 호출하지 않음

## 2. 요청/응답 기본

- 본문은 **모두 JSON** (`Content-Type: application/json`). 화면 이미지도 JSON 안에 base64로 보냄 (아래 「화면 이미지 보내기」)
- JSON 필드는 camelCase (예: `previousInstructions`, `createdAt`)
- FE에서 쓸 요청·응답 타입은 BE가 `server/<domain>/schema.ts`에 정의하고 `export type`/`interface`로 내보냄 → FE는 `import type`으로 가져와 사용 (타입만 가져오므로 서버 코드가 브라우저로 섞이지 않음)

### 화면 이미지 보내기 (base64 JSON, 팀 결정 10.29)

```json
{ "image": "data:image/jpeg;base64,/9j/4AAQ...", "question": "병원 예약하고 싶어" }
```

- 필드 `image`: **data URL 문자열**. 화면 공유 캡처와 '화면 사진 올리기'(파일 선택) 모두 `lib/image.ts`에서 캔버스로 다시 그려 **같은 형식**으로 보냄
- FE는 보내기 전에 **가로 최대 1280px, JPEG 품질 0.7**로 줄임 (`lib/constants.ts`의 `MAX_IMAGE_WIDTH`, `JPEG_QUALITY`)
- 허용 형식: JPEG, PNG, WEBP
- BE 검사(`server/guide/screen-image.ts`): 문자열 기준 **3MB 초과면 400 `IMAGE_TOO_LARGE`**(Vercel 함수 요청 본문 한도 4.5MB 안에 여유를 둔 값), data URL 형식이 아니거나 이미지 머리를 읽을 수 없으면 400 `IMAGE_INVALID`. BE는 이미지의 가로·세로를 읽어 AI 좌표를 0~1 비율로 바꿈
- 화면 이미지는 **어디에도 저장하지 않음** (분석 후 버림)

## 3. 공통 응답 형식 (`server/response.ts`)

성공:
```json
{ "success": true, "data": { }, "message": "OK" }
```

실패:
```json
{ "success": false, "data": null, "message": "로그인이 필요해요.", "code": "AUTH_REQUIRED", "retryable": false }
```

- FE는 실제 데이터를 항상 응답 본문의 `data`에서 꺼냅니다.
- 실패 응답의 `retryable`은 **같은 요청을 다시 보내면 될 수 있는지**입니다. 429·5xx(AI·DB·서버 일시 오류)는 `true`, 나머지 4xx(입력·사진 형식·로그인)는 `false`. FE의 '다시 시도' 버튼은 상태 코드를 추측하지 말고 이 값을 보면 됩니다 (`server/errors.ts`의 `isRetryableStatus`, `AppError`에서 따로 지정 가능)
- 본문 없는 성공(204: 로그아웃, 도움 기록 전체 삭제)은 본문이 없습니다.
- 예외: `GET /__health`는 공통 형식이 아니라 `{ "releaseId": "..." }`만 응답합니다 (키트 형식).

## 4. 에러 처리

- FE는 **HTTP 상태 코드로 큰 분기**, **`code`로 세부 분기** (`lib/errors.ts`의 `toUserError`). '다시 시도' 버튼은 응답의 `retryable`로 정하고, 값이 없을 때(네트워크 오류 등)만 아래 표의 상태 코드로 판단
- `message`는 화면에 그대로 보여줘도 되는 한국어 문장 (BE 작성)

| 상태 | 지금 쓰는 코드 | FE 처리 |
|---|---|---|
| 400 | `VALIDATION_ERROR`, `IMAGE_INVALID`, `IMAGE_TOO_LARGE`, `AUDIO_INVALID`, `AUDIO_TOO_LARGE`, `AUDIO_NO_SPEECH` | 입력 근처에 `message` 표시 |
| 401 | `AUTH_REQUIRED`(로그인 화면으로), `AUTH_INVALID_CREDENTIALS`(문구만 표시) | `AUTH_REQUIRED`일 때만 로그인 화면으로 이동 |
| 409 | `AUTH_EMAIL_TAKEN` | `message` 표시 |
| 429 | `AI_BUDGET_EXCEEDED` | "잠시 후 다시" + 다시 시도 |
| 503 | `AI_UNAVAILABLE`, `AI_TIMEOUT`, `AI_FAILED`, `DB_UNAVAILABLE` | "잠시 후 다시" + 다시 시도 |
| 500 | `INTERNAL_SERVER_ERROR` | 공통 오류 메시지 |

- 403(권한)과 404(대상 없음)를 내는 API는 아직 없습니다. 없는 화면 주소는 Next.js가 404 화면(`app/not-found.tsx`)을 보여 줍니다.
- 에러 코드 전체 목록: `docs/BE_CONVENTION.md` 12번

## 5. 데이터 형식

| 항목 | 규칙 | 실제 예 |
|---|---|---|
| ID | 숫자 | `"id": 12` |
| 날짜·시간 | ISO 8601 UTC 문자열 (`Date.toISOString()`), 화면 표시용 한국 시간 변환은 FE | `"createdAt": "2026-10-29T13:21:37.529Z"` |
| boolean | 무엇이 켜지는지 드러나는 이름 (설정은 기능 이름 그대로) | `saveHistory`, `riskWarning`, `edgeDisplay` |
| enum(상태값) | UPPER_SNAKE_CASE 문자열 | `"status": "IN_PROGRESS"`, `"highlightStyle": "BORDER"` |
| 빈 목록 | `[]` (null 금지) | 도움 기록이 없으면 `"data": []` |
| 값 없음 | 필드 유지 + `null` | `"target": null`, `"risk": null` |
| 화면 좌표 | 이미지 기준 0~1 비율, 왼쪽 위 기준, 소수 넷째 자리 | `"target": { "x": 0.0308, "y": 0.9408, "width": 0.1026, "height": 0.0474 }` |

- 화면 좌표를 비율로 주면 FE가 화면·사진 크기와 상관없이 누를 곳을 그릴 수 있습니다.
- enum 값의 종류는 아래 10번과 `schema.ts`에 있고, 화면 표시용 한글 변환은 FE가 담당합니다.

## 6. 목록 조회

- 지금 목록 API는 `GET /api/guide-history` 하나이며, **페이지네이션 없이 `data`에 최신순 배열(최대 50개)**을 바로 넣습니다.
- 목록이 길어지는 API가 생기면 `?page=1&size=20` 요청, `{ items, page, size, totalCount, hasNext }` 응답으로 맞추고 10번에 표시합니다.

## 7. 인증

- 같은 앱이므로 **httpOnly 쿠키 세션**(`sid`, 7일)을 씁니다. FE는 토큰을 저장하거나 헤더에 붙이지 않음
  - 쿠키는 `sameSite=lax`, https일 때만 `Secure` (docker E2E는 http라서)
- 가입 `POST /api/auth/signup`과 로그인 `POST /api/auth/login`은 성공하면 바로 쿠키를 설정 (가입 직후 로그인 상태)
- 로그아웃: `POST /api/auth/logout`은 세션·쿠키를 지우며, 이미 로그아웃했거나 비로그인 상태여도 204를 반환합니다(멱등). / 내 정보: `GET /api/auth/me` (새로고침해도 로그인 유지 확인용)
- 로그인이 필요한 API에 쿠키가 없거나 만료되면 401 + `AUTH_REQUIRED`
- 시드 계정(`SEED_USER_EMAIL`/`SEED_USER_PASSWORD`, 로컬 docker 전용)으로 바로 로그인 가능 (키트 E2E)

## 8. 화면 이름과 E2E (키트 규칙)

- E2E는 `docs/scenarios.yaml`의 메뉴·버튼 이름으로 화면을 조작합니다 (`e2e/scenarios/S1~S7.spec.ts`).
- FE는 버튼·메뉴 글자를 scenarios.yaml과 똑같이 맞추고, 바꾸면 scenarios.yaml과 spec도 같은 PR에서 수정
- BE가 만드는 화면 글자도 같습니다: 위험 경고 문구(`server/guide/prompt.ts`의 `RISK_MESSAGES`)는 S4가 글자 그대로 찾으므로, 바꾸면 scenarios.yaml·spec도 함께 수정
- E2E에 필요한 선행 데이터는 BE가 `server/db/init.ts`의 시드로 준비, 업로드용 사진은 `e2e/fixtures/`에 커밋 (파일당 10MB 이하)
- E2E는 실제 앱과 실제 AI 응답으로 돌기 때문에 가짜 응답(목업)으로 통과시키지 않음. 목업은 개발 중에만 사용 (`NEXT_PUBLIC_USE_MOCK`)
- 주 사용 플랫폼은 `desktop`(scenarios.yaml), PC 화면 크기(1440×900)에서 깨지지 않아야 함
- 로그인 전에는 로그인이 필요한 화면이 열리지 않아야 하고, 없는 주소는 404 화면
- 한 번에 확인: `bash scripts/e2e-local.sh` (빈 DB 기동 → `/__health` → S1~S7)

## 9. 협업 절차

1. **명세 먼저:** BE가 아래 10번에 API를 적고, `schema.ts`에 타입을 먼저 만들어 PR (구현 전이어도 됨)
2. **FE 병행 작업:** FE는 타입과 응답 예시로 목업을 만들어 화면을 먼저 개발
3. **변경 공지:** 필드·타입·URL이 바뀌면 BE가 디스코드에 변경 전/후 공지. 예: `[API 변경] POST /api/guides : answer → instruction`
4. **요청 방법:** FE가 필요한 데이터는 디스코드에 "화면 이름 + 필요한 데이터"로 요청
5. **연동 문제 공유:** 요청 URL, 보낸 값, 받은 응답(또는 콘솔 에러)을 같이 공유

## 10. API 목록 (진행 현황)

요청·응답 타입은 `server/<domain>/schema.ts`가 기준입니다. FE는 `import type`으로 가져다 씁니다. '흐름'은 `docs/scenarios.yaml`의 S1~S7입니다.

| 기능 | 메서드 | URL | 요청 | 응답 `data` | 로그인 | 담당 BE | 흐름 | 상태 |
|---|---|---|---|---|---|---|---|---|
| 헬스체크 (키트) | GET | `/__health` | - | `{ releaseId }` (공통 응답 형식 아님) | 불필요 | 이감재 | 채점 시작 신호 | 배포 |
| 회원가입 | POST | `/api/auth/signup` | `AuthRequest` `{ email, password }` | `AuthUserResponse` `{ id, email }` (201, 쿠키 설정) | 불필요 | 이감재 | S1, S6 | 구현 |
| 로그인 | POST | `/api/auth/login` | `AuthRequest` | `AuthUserResponse` (쿠키 설정) | 불필요 | 이감재 | S2~S5, S7 (시드 계정) | 구현 |
| 로그아웃 | POST | `/api/auth/logout` | - | 204 (쿠키 삭제, 비로그인도 동일) | 불필요 | 이감재 | - | 구현 |
| 내 정보 | GET | `/api/auth/me` | - | `AuthUserResponse` | 필요 | 이감재 | 첫 화면 로그인 확인 | 구현 |
| 설정 조회 | GET | `/api/settings` | - | `SettingsResponse` | 필요 | 이감재 | 설정 창 | 구현 |
| 설정 저장 | PATCH | `/api/settings` | `SettingsUpdateRequest` (바꿀 값만) | `SettingsResponse` (바뀐 전체) | 필요 | 이감재 | S6 ('기록 저장' 끄기) | 구현 |
| 화면 분석·안내 | POST | `/api/guides` | `GuideRequest` `{ image, question, previousInstruction?, previousInstructions? }` | `GuideResponse` `{ instruction, target, risk, status }` | 필요 | hyuckkim | S2~S6 | 구현 |
| 목소리로 묻기 | POST | `/api/voice-guides` | `VoiceGuideRequest` `{ image, audio, previousInstruction?, previousInstructions? }` | `VoiceGuideResponse` `{ question, instruction, target, risk, status }` | 필요 | hyuckkim | - (FE 미연결) | 구현 |
| 도움 기록 목록 | GET | `/api/guide-history` | - | `GuideHistoryItem[]` `{ id, question, instruction, createdAt }` (최신순, 최대 50개) | 필요 | 이감재 | S5, S6 | 구현 |
| 도움 기록 전체 삭제 | DELETE | `/api/guide-history` | - | 204 | 필요 | 이감재 | 도움 기록 창 | 구현 |

- 타입 위치: `server/auth/schema.ts`, `server/settings/schema.ts`, `server/guide/schema.ts`, `server/history/schema.ts`, `server/voice-guide/schema.ts`
- 입력 제한: 비밀번호 8~72자, `question` 1~200자, `previousInstruction`·`previousInstructions`의 각 줄은 300자를 넘으면 앞 300자만 사용(2000자 초과만 400), `previousInstructions`는 50개까지(AI에는 최근 5개), 검사 오류 문구는 모두 한국어, 이미지 3MB, 목소리 1MB
- 설정 기본값 (`DEFAULT_SETTINGS`): 화면 가장자리 표시 켜짐, 음성 인식 꺼짐, 누를 곳 표시 `BORDER`, 위험 경고 켜짐, 기록 저장 켜짐
  - 설정 창에 스위치가 있는 값: `edgeDisplay`, `voiceInput`, `saveHistory`. `highlightStyle`(`BORDER`·`ARROW`·`DIM`)과 `riskWarning`은 BE만 지원하고 화면에는 아직 없음
- 상태: 명세(타입 확정) → 구현 → 배포

### 10-1. `POST /api/guides` 동작

- `previousInstruction`(선택)은 바로 전 안내 문장. 있으면 AI가 같은 일의 **다음 단계**를 이어서 판단한다
- `previousInstructions`(선택, 문자열 배열)는 **이 일에서 지금까지 받은 안내 문장들(오래된 순, 마지막이 바로 전 안내)**. 최근 5개를 AI에 순서대로 넘겨서, 여러 단계짜리 일에서도 앞 단계를 알고 다음 단계를 고른다. 각 줄은 `previousInstruction`과 같은 규칙(300자로 자름, 2000자 초과는 400), 빈 줄은 버림, 50개 초과는 400. **정리 후 비어 있지 않은 `previousInstructions`가 우선**한다. 목록이 없거나 빈 배열(`[]`, 빈 줄만 있는 목록 포함)이면 `previousInstruction`으로 되돌아가며, 둘 다 비어 있으면 이전 안내 없이 판단한다 (한 줄만 보내는 예전 요청도 그대로 동작)
  - FE는 `previousInstructions`만 보낸다: '눌렀어요, 다음 알려 주세요'를 눌렀을 때, 그리고 바로 전과 **같은 질문**으로 다시 '물어보기'했을 때, **새 화면으로 물을 때만**(공유 화면은 매번 새로 찍은 장면, 사진은 지난번과 다른 사진) 이번 일에서 받은 안내를 모두 보낸다. 바로 전 안내가 `IN_PROGRESS`일 때만 보내고, 이때 'N단계'가 하나 올라간다. 같은 사진·같은 질문으로 '물어보기'하면 새로 묻기(1단계) (`components/helper/useHelperSession.ts`)
  - 사진으로 묻는 중에 지난번과 **같은 사진**으로 '눌렀어요, 다음 알려 주세요'를 누르면 요청을 보내지 않고 말풍선에 "바뀐 화면을 '사진 바꾸기'로 올린 뒤 다시 눌러 주세요."를 보여 준다 (옛 화면을 다음 화면처럼 보내지 않도록)
  - 실패 뒤 '다시 시도'는 방금 실패한 요청(그때의 화면·질문)을 그대로 보내고, 그 위에 "방금 실패한 요청을 다시 보내요."를 보여 준다. 실패한 상태에서 물어볼 화면이 바뀌면('사진 올리기'·'사진 바꾸기'로 사진을 고름, ▶로 공유 시작·전환) 오류와 '다시 시도'를 지운다. 받은 안내는 지우지 않는다
  - 물어볼 화면은 **가장 최근에 고른 쪽**: 공유 중에 사진을 고르면 사진으로, ▶를 다시 누르면 공유 화면으로 묻는다. 말풍선 맨 위에 "화면 공유로 보고 있어요" / "올린 사진으로 물어봐요"로 표시
- AI 모델 `anthropic/claude-sonnet-5.5`(`server/guide/service.ts`), 한 번 25초 제한, 답 형식이 깨지면 한 번만 다시 묻고 답이 잘리면 바로 `AI_FAILED`
- 기록 저장 설정이 켜져 있으면 **질문과 안내 문장만** 도움 기록에 남긴다 (화면 이미지는 저장하지 않음). 저장 시점에 DB의 최신 설정을 읽는다
  - 기록 저장이 실패해도 안내는 그대로 응답한다 (실패는 서버 로그에 `[guide] failed to record history`)
- `POST /api/voice-guides`는 목소리(`audio`, data URL, webm·ogg·mp4·mp3·wav)를 `google/gemini-3.5-transcribe`로 글자로 바꿔 `question`으로 삼고, 위와 같은 안내를 만든다 (위험 경고·도움 기록도 같음). 응답의 `question`은 알아들은 문장

### 10-2. `GuideResponse` 조합 (FE가 처리할 경우)

| `status` | `target` | 뜻 | FE 표시 |
|---|---|---|---|
| `IN_PROGRESS` | 있음 | 다음에 누를 곳을 찾음 | 안내 문장 + 사진 위 누를 곳 표시, '눌렀어요, 다음 알려 주세요' |
| `IN_PROGRESS` | `null` | 다음 할 일은 있지만 누를 위치를 못 짚음 | 안내 문장, '눌렀어요, 다음 알려 주세요' ('누를 곳을 찾았어요'와 누를 곳 테두리는 표시하지 않음) |
| `NEED_INFO` | 대부분 `null` | 화면만으로 판단하기 어려움 (무엇을 확인할지 안내) | 안내 문장, 다른 화면으로 다시 묻기 |
| `DONE` | 항상 `null` | 완료 화면 (BE가 `target`을 비움) | '다 됐어요' + 안내 문장 |

- `risk`는 **상태와 상관없이** 붙을 수 있다. 위험 경고 설정이 꺼져 있으면 항상 `null`
- `risk.message`는 고정 문구 (`server/guide/prompt.ts`의 `RISK_MESSAGES`)
  - 결제·송금: `돈이 나가는 버튼이에요. 한 번 더 확인하세요`
  - 삭제: `지우면 되돌릴 수 없는 버튼이에요. 한 번 더 확인하세요`
  - 제출·신청 확정: `되돌리기 어려운 버튼이에요. 누르기 전에 한 번 더 확인하세요` (S4)
  - AI가 위험을 놓쳐도 안내 문장에 '송금·이체', '결제·구매·주문하기·충전', '삭제·탈퇴', '제출·신청하기·접수하기'가 있으면 BE가 경고를 붙인다. 질문이 돈을 보내는 내용이고 안내에 '보내기'가 있으면 송금 경고를 붙인다
