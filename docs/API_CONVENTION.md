# FE ↔ BE API Convention — sumtech 2026 Team 13

> FE와 BE가 API를 주고받을 때 지키는 공통 약속입니다. **해커톤 키트 요구사항(`progress.md`)이 이 문서보다 우선합니다.**
> 바뀌면 이 파일을 수정한 뒤 디스코드에 공지합니다.
> **Claude 사용 시:** 이 문서 전체를 붙여넣고 "이 API 컨벤션에 맞춰서 작업해줘"라고 요청하세요.

---

## 0. 프로젝트 맥락

- sumtech 2026 해커톤 팀 13 (PM 1, FE 2, BE 2)
- 서비스: 화면을 공유하면 AI가 현재 화면을 분석해 어디를 누를지 단계별로 안내
- 구조: **Next.js 풀스택 하나** (레포 루트). FE 화면과 BE API가 같은 앱, 같은 포트(3000)
  - FE 담당: `app/`의 화면, `components/` / BE 담당: `app/api/`, `server/`, `instrumentation.ts`
- 레포: https://github.com/dlrkawo/sumtech2026-team13

## 1. 주소

- FE는 API를 **상대 경로**로 호출합니다: `fetch("/api/guides")`
  - 같은 앱이라 BE 주소 환경변수와 CORS 설정이 필요 없음
  - `http://localhost:3000` 같은 절대 주소를 코드에 쓰지 않음 (키트 규칙)
- 모든 API는 `/api/`로 시작, 경로는 kebab-case 복수 명사 (예: `/api/guide-sessions/12`)
- 헬스체크 `GET /__health`는 키트용이며 FE가 호출하지 않음

## 2. 요청/응답 기본

- 본문은 **모두 JSON** (`Content-Type: application/json`). 화면 이미지도 JSON 안에 base64로 보냄 (아래 「화면 이미지 보내기」)
- JSON 필드와 쿼리 파라미터는 camelCase (예: `sessionId`, `?sortBy=createdAt`)
- FE에서 쓸 요청·응답 타입은 BE가 `server/<domain>/schema.ts`에 zod로 정의하고 `export type`으로 내보냄 → FE는 `import type`으로 가져와 사용 (타입만 가져오므로 서버 코드가 브라우저로 섞이지 않음)

### 화면 이미지 보내기 (base64 JSON, 팀 결정 10.29)

```json
{ "image": "data:image/jpeg;base64,/9j/4AAQ...", "question": "예약하기 버튼은 어디에 있어요?" }
```

- 필드 `image`: **data URL 문자열** (`data:image/jpeg;base64,...`). FE는 캔버스의 `toDataURL("image/jpeg", 0.7)` 결과를 그대로 넣음
- 화면 공유 캡처와 "화면 사진 올리기"(파일 선택, E2E용) 모두 **캔버스로 다시 그려서 같은 형식**으로 보냄
- FE는 보내기 전에 **가로 최대 1280px, JPEG 품질 0.7**로 줄임 (원본 전송 금지)
- 허용 형식: JPEG, PNG, WEBP / BE는 data URL 형식과 크기를 zod로 검사하고, 문자열 기준 **3MB 초과면 400 `IMAGE_TOO_LARGE`** (Vercel 함수 요청 본문 한도 4.5MB 안에 여유를 둔 값), 형식이 틀리면 400 `IMAGE_INVALID`
- 이유: AI 이미지 입력이 base64를 받으므로 BE가 변환할 필요가 없고, 다른 API처럼 JSON 하나로 zod 검증 가능. 1280px·JPEG 0.7이면 수백 KB 수준

## 3. 공통 응답 형식

성공:
```json
{ "success": true, "data": { }, "message": "OK" }
```

실패:
```json
{ "success": false, "data": null, "message": "안내 기록을 찾을 수 없습니다.", "code": "SESSION_NOT_FOUND" }
```

- FE는 실제 데이터를 항상 응답 본문의 `data`에서 꺼냅니다.
- 삭제 성공(204)은 본문이 없습니다.

## 4. 에러 처리

- FE는 **HTTP 상태 코드로 큰 분기**, **`code`로 세부 분기**
- `message`는 화면에 그대로 보여줘도 되는 한국어 문장 (BE 작성)

| 상태 | 의미 | FE 처리 예시 |
|---|---|---|
| 400 | 잘못된 요청 (`VALIDATION_ERROR` 등) | 입력 칸 근처에 `message` 표시 |
| 401 | 로그인 필요 | 로그인 화면으로 이동 |
| 403 | 권한 없음 | 안내 메시지 |
| 404 | 대상 없음 | "없는 페이지" 처리 |
| 409 | 중복 (이메일 중복 등) | `message` 표시 |
| 429/503 | AI 사용량 초과·일시 불가 (`AI_*`) | "잠시 후 다시 시도해주세요" + 다시 시도 버튼 |
| 500 | 서버 오류 | 공통 오류 메시지 |

- 에러 코드 목록: `docs/BE_CONVENTION.md` 12번

## 5. 데이터 형식

| 항목 | 규칙 | 예시 |
|---|---|---|
| ID | 숫자 | `"id": 12` |
| 날짜·시간 | ISO 8601, 타임존 포함 | `"createdAt": "2026-10-29T18:00:00+09:00"` |
| boolean | `is`/`has` 접두사 | `isDone`, `hasNext` |
| enum(상태값) | UPPER_SNAKE_CASE 문자열 | `"status": "IN_PROGRESS"` |
| 빈 목록 | `[]` (null 금지) | `"steps": []` |
| 값 없음 | 필드 유지 + `null` | `"imageUrl": null` |
| 화면 좌표 | 이미지 기준 0~1 비율 | `"box": { "x": 0.82, "y": 0.05, "width": 0.1, "height": 0.06 }` |

- 화면 좌표를 비율로 주면 FE가 화면 크기와 상관없이 강조 표시를 그릴 수 있습니다.
- enum 값의 종류는 API 목록에 적고, 화면 표시용 한글 변환은 FE가 담당합니다.

## 6. 목록 조회와 페이지네이션

요청: `GET /api/guide-sessions?page=1&size=20` (page는 1부터)

응답의 `data`:
```json
{ "items": [ ], "page": 1, "size": 20, "totalCount": 135, "hasNext": true }
```

- 짧은 목록은 `data`에 배열을 바로 넣고, 어느 쪽인지 API 목록에 표시합니다.

## 7. 인증 (로그인이 필요한 경우)

- 같은 앱이므로 **httpOnly 쿠키 세션**을 씁니다. FE는 토큰을 저장하거나 헤더에 붙이지 않음
- 로그인: `POST /api/auth/login` `{ email, password }` → 성공 시 BE가 쿠키 설정
- 로그아웃: `POST /api/auth/logout` / 내 정보: `GET /api/auth/me`
- 로그인이 필요한 API에 쿠키가 없으면 401 + `AUTH_REQUIRED`
- 시드 계정(`SEED_USER_EMAIL`/`SEED_USER_PASSWORD`)으로 바로 로그인 가능해야 함 (키트 E2E)

## 8. 화면 이름과 E2E (키트 규칙)

- E2E는 `docs/scenarios.yaml`의 메뉴·버튼 이름으로 화면을 조작합니다.
- FE는 버튼·메뉴 글자를 scenarios.yaml과 똑같이 맞추고, 바꾸면 scenarios.yaml과 spec도 같은 commit에서 수정
- E2E에 필요한 선행 데이터는 BE가 `server/db/init.ts`의 시드로 준비, 업로드용 이미지는 `e2e/fixtures/`에 커밋 (파일당 10MB 이하)
- E2E는 실제 앱과 실제 AI 응답으로 돌기 때문에 가짜 응답(목업)으로 통과시키지 않음. 목업은 개발 중에만 사용
- 주 사용 플랫폼(desktop / mobile / both)은 scenarios.yaml에서 정하고, 그 화면 크기(PC 1440×900, 모바일 390×844)에서 화면이 깨지지 않아야 함
- 로그인 전에는 로그인이 필요한 화면이 열리지 않아야 하고, 없는 주소는 404 화면

## 9. 협업 절차

1. **명세 먼저:** BE가 아래 10번에 API를 적고, `schema.ts`에 타입을 먼저 만들어 push (구현 전이어도 됨)
2. **FE 병행 작업:** FE는 타입과 응답 예시로 목업을 만들어 화면을 먼저 개발
3. **변경 공지:** 필드·타입·URL이 바뀌면 BE가 디스코드에 변경 전/후 공지. 예: `[API 변경] POST /api/guides : answer → steps`
4. **요청 방법:** FE가 필요한 데이터는 디스코드에 "화면 이름 + 필요한 데이터"로 요청
5. **연동 문제 공유:** 요청 URL, 보낸 값, 받은 응답(또는 콘솔 에러)을 같이 공유

## 10. API 목록 (진행 현황)

요청·응답 타입은 `server/<domain>/schema.ts`가 기준입니다. FE는 `import type`으로 가져다 씁니다.

| 기능 | 메서드 | URL | 요청 | 응답 `data` | 로그인 | 담당 BE | 흐름 | 상태 |
|---|---|---|---|---|---|---|---|---|
| 헬스체크 (키트) | GET | `/__health` | - | `{ releaseId }` (공통 응답 형식 아님) | 불필요 | 이감재 | - | 배포 |
| 회원가입 | POST | `/api/auth/signup` | `AuthRequest` | `AuthUserResponse` (201, 쿠키 설정) | 불필요 | 이감재 | S1 | 구현 |
| 로그인 | POST | `/api/auth/login` | `AuthRequest` | `AuthUserResponse` (쿠키 설정) | 불필요 | 이감재 | S2~S8 | 구현 |
| 로그아웃 | POST | `/api/auth/logout` | - | 204 (쿠키 삭제) | 필요 | 이감재 | - | 구현 |
| 내 정보 | GET | `/api/auth/me` | - | `AuthUserResponse` | 필요 | 이감재 | 새로고침 시 로그인 유지 | 구현 |
| 설정 조회 | GET | `/api/settings` | - | `SettingsResponse` | 필요 | 이감재 | S5, S8 | 구현 |
| 설정 저장 | PATCH | `/api/settings` | `SettingsUpdateRequest` (바꿀 값만) | `SettingsResponse` | 필요 | 이감재 | S5, S8 | 구현 |
| 화면 분석·안내 | POST | `/api/guides` | `GuideRequest` `{ image, question, previousInstruction? }` | `GuideResponse` `{ instruction, target, risk, status }` | 필요 | hyuckkim | S4, S6 | 구현 |
| 할 일 목록 | POST | `/api/guide-plans` | `GuidePlanRequest` `{ image, question }` | `GuidePlanResponse` `{ steps, status, hint }` | 필요 | hyuckkim | (미정) | 명세 |
| 도움 기록 목록 | GET | `/api/guide-history` | - | `GuideHistoryItem[]` (최신순, 최대 50개) | 필요 | 이감재 | S7 | 구현 |
| 도움 기록 전체 삭제 | DELETE | `/api/guide-history` | - | 204 | 필요 | 이감재 | 개인정보 보호 | 구현 |

- 타입 위치: `server/auth/schema.ts`, `server/settings/schema.ts`, `server/guide/schema.ts`, `server/history/schema.ts`, `server/guide-plan/schema.ts`
- 설정 기본값: 화면 가장자리 표시 켜짐, 음성 인식 꺼짐, 누를 곳 표시 `BORDER`, 위험 경고 켜짐, 기록 저장 켜짐 (`DEFAULT_SETTINGS`)
- `POST /api/guides`의 `previousInstruction`(선택)은 바로 전 안내 문장. 있으면 AI가 다음 단계를 이어서 판단한다
- `POST /api/guide-plans`는 처음에 한 번 보여 주는 참고용 할 일 목록(큰 흐름 3~6개). 몇 번째 단계인지는 추적하지 않고(사이트마다 단계 수가 다름), 화면마다 누를 곳은 `POST /api/guides`가 안내한다. 목록은 저장하지 않는다
- `POST /api/guides`는 기록 저장 설정이 켜져 있으면 질문·안내 문장만 도움 기록에 남긴다 (화면 이미지는 저장하지 않음)
- 상태: 명세(타입 확정) → 구현 → 배포
- 도움 기록 저장: hyuckkim의 `POST /api/guides`는 안내를 만든 뒤 `recordGuideHistory(userId, question, instruction)`(`server/history/service.ts`)을 호출. 위험 경고 여부는 `getSettings(userId).riskWarning`(`server/settings/service.ts`)
