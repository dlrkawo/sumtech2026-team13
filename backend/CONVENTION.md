# Backend Convention — sumtech 2026 Team 13

> 이 문서는 BE 팀원 2명이 공통으로 따르는 규칙입니다.
> 레포의 `backend/CONVENTION.md`에 두고, 규칙이 바뀌면 이 파일을 수정한 뒤 디스코드에 공지합니다.
> **Claude 사용 시:** 작업 시작할 때 이 문서 전체를 붙여넣고 "이 컨벤션을 따라서 작업해줘"라고 요청하세요.
> (Claude Code를 쓴다면 `backend/CLAUDE.md`에 "작업 전 CONVENTION.md를 읽고 따를 것" 한 줄을 넣어두면 자동으로 참고합니다.)

---

## 0. 프로젝트 맥락

- 행사: sumtech 2026 해커톤, 팀 13 (PM 1, FE 2, BE 2)
- 결과물: 웹 서비스(웹사이트). FE/BE 분리, REST API(JSON)로 통신
- 레포: https://github.com/dlrkawo/sumtech2026-team13 (모노레포, BE는 `/backend`에서만 작업)
- 코드트리 해커톤 사이트와 연동 → 커밋 기록으로 기여도 집계 (git 이메일 = 깃허브 계정 이메일)

## 1. 기술 스택

| 구분 | 선택 |
|---|---|
| 언어 | Python 3.11+ |
| 프레임워크 | FastAPI + Uvicorn |
| 검증/스키마 | Pydantic v2 |
| ORM | SQLAlchemy 2.0 |
| 마이그레이션 | Alembic |
| DB | PostgreSQL (로컬 개발은 Docker 또는 SQLite 허용) |
| 설정 | pydantic-settings + `.env` |
| 린트/포맷 | ruff (`ruff format`, `ruff check`) |
| 패키지 | `requirements.txt` (패키지 추가 시 반드시 갱신) |

## 2. 폴더 구조 (도메인 단위)

```
backend/
├── app/
│   ├── main.py              # 앱 생성, 라우터 등록, 미들웨어(CORS)
│   ├── core/
│   │   ├── config.py        # 환경변수 (pydantic-settings)
│   │   ├── database.py      # 엔진, 세션, get_db
│   │   ├── security.py      # JWT 등 인증 (필요 시)
│   │   └── exceptions.py    # AppException + 전역 핸들러
│   ├── common/
│   │   └── response.py      # 공통 응답 스키마/헬퍼
│   └── domains/
│       └── <domain>/        # 예: user, post ...
│           ├── router.py      # 엔드포인트 (요청/응답만)
│           ├── schemas.py     # Pydantic 요청/응답 모델
│           ├── models.py      # SQLAlchemy 모델
│           ├── service.py     # 비즈니스 로직
│           └── repository.py  # DB 접근
├── alembic/
├── tests/
├── .env.example
├── requirements.txt
└── CONVENTION.md
```

- **도메인 폴더 단위로 담당자를 나눕니다** → 같은 파일 동시 수정 최소화
- 공용 파일(`main.py`, `core/`, `common/`, `requirements.txt`) 수정 시 디스코드에 먼저 알립니다.

## 3. 레이어 규칙

```
router → service → repository → DB
```

- **router**: 요청 받기, 스키마 검증, service 호출, 응답 반환. DB 직접 접근 금지
- **service**: 비즈니스 로직, 예외 발생(`AppException`). 다른 도메인 기능이 필요하면 그 도메인의 service 호출
- **repository**: DB 조회/저장만. 비즈니스 판단 금지
- DB 세션은 `Depends(get_db)`로 주입

## 4. 네이밍

| 대상 | 규칙 | 예시 |
|---|---|---|
| 파일, 함수, 변수 | snake_case | `get_user_by_id` |
| 클래스 | PascalCase | `UserService` |
| 상수 | UPPER_SNAKE_CASE | `MAX_PAGE_SIZE` |
| SQLAlchemy 모델 | 단수 PascalCase | `User` |
| 테이블 | 복수 snake_case | `users` |
| 요청 스키마 | `<대상><동작>Request` | `UserCreateRequest` |
| 응답 스키마 | `<대상>Response` | `UserResponse` |
| 함수 동사 | get / list / create / update / delete | `list_posts` |

## 5. API 규칙

- **Prefix**: `/api/v1`
- **URL**: 복수 명사, kebab-case, 동사 금지
  - ✅ `GET /api/v1/posts/{post_id}` / ❌ `GET /api/v1/getPost`
- **HTTP 메서드**: 조회 GET, 생성 POST, 일부 수정 PATCH, 삭제 DELETE
- **JSON 필드명은 camelCase** (FE 관례에 맞춤). 파이썬 코드는 snake_case로 쓰고 Pydantic alias로 변환:
  ```python
  from pydantic import BaseModel, ConfigDict
  from pydantic.alias_generators import to_camel

  class CamelModel(BaseModel):
      model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)
  ```
  모든 요청/응답 스키마는 `CamelModel`을 상속합니다.
- **페이지네이션**: `?page=1&size=20` (page는 1부터)
- **날짜/시간**: ISO 8601 문자열, 타임존 포함 (`2026-10-29T18:00:00+09:00`)
- **상태 코드**: 200 조회/수정, 201 생성, 204 삭제, 400 잘못된 요청, 401 인증 필요, 403 권한 없음, 404 없음, 409 중복, 500 서버 오류

## 6. 공통 응답 포맷

성공:
```json
{ "success": true, "data": { }, "message": "OK" }
```

실패:
```json
{ "success": false, "data": null, "message": "사용자를 찾을 수 없습니다.", "code": "USER_NOT_FOUND" }
```

- 에러 코드: `<DOMAIN>_<REASON>` UPPER_SNAKE_CASE (예: `POST_NOT_FOUND`, `AUTH_INVALID_TOKEN`)
- 서비스에서는 `raise AppException(status_code=404, code="USER_NOT_FOUND", message="...")`
- 전역 핸들러가 위 포맷으로 변환. Pydantic 검증 오류는 400 + `VALIDATION_ERROR`
- 새 에러 코드를 만들면 아래 "에러 코드 목록"에 추가

## 7. DB 규칙

- PK: `id` (int, autoincrement)
- 모든 테이블에 `created_at`, `updated_at` (timezone-aware)
- FK 컬럼: `<참조테이블 단수>_id` (예: `user_id`)
- 스키마 변경은 **Alembic 마이그레이션으로만**. 이미 머지된 마이그레이션 파일은 수정 금지
- ⚠️ 2명이 동시에 마이그레이션을 만들면 head가 갈라집니다 → **마이그레이션 생성 전 디스코드에 알리고, `dev` 최신을 pull 한 뒤 생성**

## 8. 환경변수

- 비밀값은 `.env`에만. **`.env` 커밋 금지**
- 변수를 추가하면 `.env.example`에 이름과 예시값(가짜)을 같이 추가
- 코드에서는 `core/config.py`의 `settings`로만 접근 (`os.getenv` 직접 사용 금지)

## 9. Git 규칙

- 브랜치: `feat/be-<기능>`, `fix/be-<내용>` (예: `feat/be-user-login`)
- 커밋: `feat:` 기능 / `fix:` 버그 / `refactor:` 리팩터링 / `docs:` 문서 / `chore:` 설정·패키지
  - 예) `feat: 게시글 목록 조회 API 구현`
- 작업 순서: `dev` pull → 브랜치 생성 → 작업 → `ruff format . && ruff check .` → push → `dev`로 PR
- PR은 다른 BE 팀원이 확인 후 머지 (해커톤이므로 리뷰는 10분 이내로 가볍게, 막히면 본인 머지 후 공지)
- 커밋은 작게, 자주 (기여도 집계에도 유리)

## 10. API 문서 (= FE와 공유하는 명세)

- 모든 엔드포인트에 `tags`, `summary`, `response_model`을 지정 → `/docs`(Swagger)가 곧 API 명세
- 배포 후 `<배포주소>/docs` 링크를 FE에 공유
- 명세가 바뀌면 디스코드에 변경 내용을 알림

## 11. 담당 분배

| 담당자 | 도메인 / 작업 |
|---|---|
| BE-1 (이름) | 예: 초기 세팅, 공통(core/common), user/auth, 배포 |
| BE-2 (이름) | 예: 핵심 기능 도메인, 외부 API·AI 연동 |

## 12. 에러 코드 목록

| 코드 | 상태 | 설명 |
|---|---|---|
| `VALIDATION_ERROR` | 400 | 요청 값 검증 실패 |
| `INTERNAL_SERVER_ERROR` | 500 | 알 수 없는 서버 오류 |
| (추가 시 여기에 기록) | | |
