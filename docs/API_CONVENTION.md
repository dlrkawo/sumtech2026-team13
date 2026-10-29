# FE ↔ BE API Convention — sumtech 2026 Team 13

> FE와 BE가 API를 주고받을 때 지키는 공통 약속입니다.
> 레포 루트의 `API_CONVENTION.md`에 두고, 바뀌면 이 파일을 수정한 뒤 디스코드에 공지합니다.
> **Claude 사용 시:** 이 문서 전체를 붙여넣고 "이 API 컨벤션에 맞춰서 작업해줘"라고 요청하세요.
> (FE는 API 호출 코드를, BE는 응답 코드를 이 규칙에 맞춰 작성하면 됩니다.)

---

## 0. 프로젝트 맥락

- sumtech 2026 해커톤 팀 13 (PM 1, FE 2, BE 2)
- 결과물: 웹 서비스(웹사이트). FE와 BE는 분리되어 REST API(JSON)로만 통신
- 레포: https://github.com/dlrkawo/sumtech2026-team13 (`/frontend`, `/backend`)
- BE: FastAPI. API 명세는 Swagger(`<BE 주소>/docs`)가 기준

## 1. 주소와 환경변수

| 구분 | BE 주소 |
|---|---|
| 로컬 | `http://localhost:8000` |
| 배포 | (배포 후 BE가 기입) |

- 모든 API는 `/api/v1`로 시작합니다. 예: `GET http://localhost:8000/api/v1/posts`
- FE는 BE 주소를 코드에 직접 쓰지 않고 환경변수로 관리합니다.
  - Vite: `VITE_API_BASE_URL` / Next.js: `NEXT_PUBLIC_API_BASE_URL`
- FE 로컬 포트와 배포 주소는 FE가 아래에 기입합니다. BE가 CORS 허용 목록에 추가합니다.
  - FE 로컬: (예: `http://localhost:5173`) / FE 배포: (기입)

## 2. 요청/응답 기본

- 요청·응답 본문은 JSON (`Content-Type: application/json`). 파일 업로드만 `multipart/form-data`
- **JSON 필드명은 camelCase** (예: `userId`, `createdAt`). URL 경로는 kebab-case 복수 명사 (예: `/api/v1/study-groups`)
- 쿼리 파라미터도 camelCase (예: `?sortBy=createdAt`)

## 3. 공통 응답 형식

성공:
```json
{ "success": true, "data": { }, "message": "OK" }
```

실패:
```json
{ "success": false, "data": null, "message": "사용자를 찾을 수 없습니다.", "code": "USER_NOT_FOUND" }
```

- FE는 실제 데이터를 항상 `response.data`(응답 본문의 `data` 필드)에서 꺼냅니다.
- 삭제 성공(204)은 본문이 없습니다.

## 4. 에러 처리

- FE는 **HTTP 상태 코드로 큰 분기**, **`code`로 세부 분기**를 합니다.
- `message`는 사용자에게 그대로 보여줘도 되는 한국어 문장으로 BE가 작성합니다.

| 상태 | 의미 | FE 처리 예시 |
|---|---|---|
| 400 | 잘못된 요청 (`VALIDATION_ERROR` 등) | 입력 폼에 `message` 표시 |
| 401 | 로그인 필요 / 토큰 만료 | 토큰 삭제 후 로그인 페이지 이동 |
| 403 | 권한 없음 | 안내 메시지 |
| 404 | 대상 없음 | "없는 페이지" 처리 |
| 409 | 중복 (이메일 중복 등) | `message` 표시 |
| 500 | 서버 오류 | "잠시 후 다시 시도해주세요" 공통 메시지 |

- 에러 코드 목록은 BE의 `backend/CONVENTION.md` 12번에 계속 추가됩니다.

## 5. 데이터 형식

| 항목 | 규칙 | 예시 |
|---|---|---|
| ID | 숫자(int) | `"id": 12` |
| 날짜·시간 | ISO 8601, 타임존 포함 | `"createdAt": "2026-10-29T18:00:00+09:00"` |
| 날짜만 | `YYYY-MM-DD` | `"birthDate": "2000-01-01"` |
| boolean | `is`/`has` 접두사 | `isLiked`, `hasNext` |
| enum(상태값) | UPPER_SNAKE_CASE 문자열 | `"status": "IN_PROGRESS"` |
| 빈 목록 | `null` 말고 `[]` | `"tags": []` |
| 값 없음 | 필드는 유지하고 `null` | `"profileImageUrl": null` |
| 금액·수량 | 숫자 (문자열 금지) | `"price": 15000` |

- enum 값의 종류는 API 명세에 적어두고, 화면 표시용 한글 변환은 FE가 담당합니다.

## 6. 목록 조회와 페이지네이션

요청: `GET /api/v1/posts?page=1&size=20` (page는 1부터)

응답의 `data`:
```json
{
  "items": [ ],
  "page": 1,
  "size": 20,
  "totalCount": 135,
  "hasNext": true
}
```

- 페이지네이션이 필요 없는 짧은 목록은 `data`에 배열을 바로 넣습니다. 어느 쪽인지는 API 명세에 표시합니다.

## 7. 인증 (로그인이 필요한 경우)

- 로그인 성공 시 BE가 `data.accessToken`을 반환합니다.
- FE는 토큰을 저장(해커톤에서는 localStorage 허용)하고, 인증이 필요한 요청마다 헤더에 붙입니다.
  ```
  Authorization: Bearer <accessToken>
  ```
- 토큰이 없거나 만료되면 BE는 401 + `AUTH_INVALID_TOKEN`을 반환합니다.
- 로그인 기능이 없으면 이 항목은 건너뜁니다.

## 8. 파일 업로드 (필요한 경우)

- `multipart/form-data`, 파일 필드명은 `file` (여러 개면 `files`)
- 응답 `data`에 접근 가능한 URL을 반환: `{ "url": "https://..." }`

## 9. 협업 절차

1. **명세 먼저:** BE가 Swagger에 엔드포인트와 요청·응답 스키마를 먼저 만들어 공유합니다. 구현 전이어도 됩니다.
2. **FE 병행 작업:** FE는 명세의 응답 예시로 목업 데이터를 만들어 화면을 먼저 개발합니다.
3. **변경 공지:** 필드 이름, 타입, URL이 바뀌면 BE가 디스코드에 변경 전과 후를 공지합니다. 예: `[API 변경] GET /posts : writer → author`
4. **요청 방법:** FE에 필요한 필드나 API가 있으면 디스코드에 "화면 이름 + 필요한 데이터"로 요청합니다.
5. **연동 확인:** 연동 중 문제가 생기면 요청 URL, 보낸 값, 받은 응답(또는 콘솔 에러)을 같이 공유합니다.

## 10. API 목록 (진행 현황)

| 기능 | 메서드 | URL | 담당 BE | 상태 |
|---|---|---|---|---|
| 헬스체크 | GET | `/api/v1/health` | | 명세 / 구현 / 배포 |
| (추가) | | | | |
