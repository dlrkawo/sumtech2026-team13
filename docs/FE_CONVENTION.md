# Frontend Convention — sumtech 2026 Team 13

> FE 팀원 2명이 공통으로 따르는 규칙입니다. **해커톤 키트 요구사항(`progress.md`)이 이 문서보다 우선합니다.**
> 규칙이 바뀌면 이 파일을 수정한 뒤 디스코드에 공지합니다.
> API 통신 규칙은 `docs/API_CONVENTION.md`가 기준이며, 이 문서는 그 규칙을 FE 코드에서 어떻게 지키는지 정합니다.
> **Claude 사용 시:** 작업 시작할 때 이 문서와 `docs/API_CONVENTION.md`를 붙여넣고 "이 컨벤션을 따라서 작업해줘"라고 요청하세요.

---

## 0. 프로젝트 맥락

- 행사: sumtech 2026 해커톤(루프톤), 팀 13 (PM 1, FE 2, BE 2)
- 서비스: 부모님 화면을 AI가 보고, 눌러야 할 버튼을 빨간 테두리로 짚어주는 도우미 (`docs/problem.yaml`)
  - 화면 공유(`getDisplayMedia`) → 캡처 → `/api/...`로 전송 → 다음 단계 안내 + 버튼 좌표 수신 → 작은 떠 있는 창(Document Picture-in-Picture)에 표시
- 구조: **Next.js 풀스택 하나** (레포 루트). FE 화면과 BE API가 같은 앱, 같은 포트(3000)
  - FE 담당: `app/`의 화면, `components/`, `lib/` / BE 담당: `app/api/`, `server/`, `prisma/`
- 지원 환경: **PC 크롬·엣지 최신 버전만** (모바일 미지원) → `docs/scenarios.yaml`의 platform은 `desktop`, E2E 설정에서 mobile project는 뺌. PC 화면 크기(1440×900)에서 깨지지 않아야 함
- 레포: https://github.com/dlrkawo/sumtech2026-team13 (기본 브랜치 `main`)
- 코드트리 사이트와 연동 → 커밋 기록으로 기여도 집계 (git 이메일 = 깃허브 계정 이메일)

## 1. 기술 스택

| 구분 | 선택 |
|---|---|
| 언어 | TypeScript (strict) |
| 프레임워크 | Next.js 16 (App Router) + React 19 — BE와 같은 앱 |
| 스타일 | Tailwind CSS v4 (`tailwind.config` 없이 `app/globals.css`의 `@theme`에서 설정) |
| 라우팅 | App Router 파일 기반 (`app/(pages)/.../page.tsx`) |
| 상태 관리 | React state + Context. 전역 상태가 커지면 Zustand |
| API 호출 | `fetch` 래퍼 (`lib/api/client.ts`) |
| 요청·응답 타입 | BE의 `server/<domain>/schema.ts`에서 `import type` |
| 린트/포맷 | ESLint + Prettier |
| 패키지 | npm (`package-lock.json` 커밋) |
| 실행·배포 | 로컬 `npm run dev` / Docker(`docker compose up --build`) + 공개 HTTPS 배포(Vercel) (BE 담당). 화면 공유 API는 HTTPS 또는 localhost에서만 동작 |

## 2. 폴더 구조

```
/
├── app/
│   ├── layout.tsx            # 루트 레이아웃, 전역 Provider (FE)
│   ├── globals.css           # Tailwind 진입 (FE)
│   ├── not-found.tsx         # 404 화면 (FE, 키트 필수)
│   ├── (pages)/              # FE 화면 (조립만, 로직 최소)
│   │   ├── page.tsx          # `/` 서비스 소개 (로그인 없이 보임)
│   │   └── <route>/page.tsx  # 예: login, guide
│   ├── api/                  # BE 담당
│   └── %5F%5Fhealth/         # BE 담당 (키트)
├── components/
│   ├── ui/                   # 공용 UI (Button, Modal 등)
│   └── <feature>/            # 예: capture, pip, guide, voice
│       ├── GuideOverlay.tsx  # 이 기능 전용 컴포넌트
│       ├── useGuide.ts       # 이 기능 전용 훅
│       ├── api.ts            # 이 기능의 API 호출 함수
│       ├── types.ts          # FE에서만 쓰는 타입 (API 타입은 schema.ts에서)
│       ├── mock.ts           # BE 연동 전 목업 데이터 (개발 중에만)
│       └── index.ts          # 외부에 공개할 것만 export
├── lib/                      # FE 전용 공용 코드 (브라우저용, BE는 쓰지 않음)
│   ├── api/
│   │   ├── client.ts         # fetch 래퍼, 공통 응답 처리
│   │   └── types.ts          # ApiResponse, ApiError
│   ├── hooks/                # 공용 훅
│   ├── image.ts              # 공용 유틸 (이미지 축소 등)
│   └── constants.ts
└── server/                   # BE 담당 — FE는 `import type`만
```

- **FE 담당 폴더: `app/(pages)/`, `app/layout.tsx`, `app/not-found.tsx`, `app/globals.css`, `components/`, `lib/`**
  - `lib/`는 FE 두 명이 같이 쓰는 브라우저용 코드(API 래퍼, 이미지 유틸, 상수) 자리입니다. BE 코드는 `server/`에만 둡니다.
- **기능 폴더 단위로 담당자를 나눕니다** → 같은 파일 동시 수정 최소화
- 다른 기능 폴더 내부 파일을 직접 import하지 않고 그 기능의 `index.ts`를 통해 가져옵니다.
- import는 `@/` 경로 별칭으로 (`import { request } from "@/lib/api/client"`)
- 공용 파일(`app/layout.tsx`, `lib/`, `package.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `app/globals.css`, `Dockerfile`, `docker-compose.yml`, `.env.example`) 수정 시 디스코드에 먼저 알립니다.

## 3. 레이어 규칙

```
page.tsx → feature component → hook → api.ts → lib/api/client.ts → /api/... (BE)
```

- **page.tsx**: 컴포넌트 배치만. API 호출·브라우저 API 직접 사용 금지
- **component**: 화면 그리기와 사용자 입력 처리. 복잡한 로직은 훅으로 분리
- **hook**: 상태, 부수효과, 브라우저 API(화면 공유, PiP, 음성) 다루기
- **api.ts**: BE 호출 함수만. 응답 가공이 필요하면 여기서 FE용 타입으로 변환
- **client.ts**: 공통 헤더, 공통 응답 해제, 에러 변환. 컴포넌트에서 `fetch` 직접 호출 금지

### 서버 컴포넌트 / 클라이언트 컴포넌트

- `app/` 파일은 기본이 서버 컴포넌트. 상태·이벤트·브라우저 API를 쓰는 파일은 맨 위에 `"use client"`
  - `"use client"`는 기능의 진입 컴포넌트에 두고, page.tsx는 서버 컴포넌트로 유지
- `server/` 코드는 **`import type`으로 타입만** 가져옵니다. 값(함수·zod 스키마)을 import하면 `server-only` 때문에 빌드 실패
  ```ts
  import type { GuideRequest, GuideResponse } from "@/server/guide/schema";
  ```
- FE는 Prisma·AI Gateway를 직접 부르지 않고 항상 `/api/...`를 거칩니다.

## 4. 네이밍

| 대상 | 규칙 | 예시 |
|---|---|---|
| 컴포넌트 파일·이름 | PascalCase | `GuideOverlay.tsx` |
| 훅 | `use` + PascalCase, camelCase 파일 | `useScreenCapture.ts` |
| 그 외 파일 | camelCase | `image.ts`, `constants.ts` |
| 라우트 폴더 | kebab-case (URL이 됨) | `app/(pages)/guide-history/page.tsx` |
| 변수, 함수 | camelCase | `captureFrame` |
| 타입, 인터페이스 | PascalCase | `GuideStep` |
| Props 타입 | `<컴포넌트>Props` | `GuideOverlayProps` |
| 상수 | UPPER_SNAKE_CASE | `CAPTURE_INTERVAL_MS` |
| boolean | `is` / `has` / `can` 접두사 | `isCapturing`, `hasPermission` |
| 이벤트 핸들러 | 내부 함수 `handle*`, props `on*` | `handleStartClick`, `onStart` |
| API 함수 | get / list / create / update / delete + 대상 (BE와 동일) | `createGuide` |
| 요청·응답 타입 | BE `schema.ts`의 이름 그대로 사용 (새로 정의 금지) | `GuideRequest` |

## 5. 컴포넌트 규칙

- 함수 컴포넌트 + named export (`export function GuideOverlay()`). Next.js 규칙 파일(`page.tsx`, `layout.tsx`, `not-found.tsx`)만 default export
- Props는 타입으로 명시하고 구조 분해로 받기
- 한 파일에 컴포넌트 하나. 150줄이 넘으면 분리 검토
- 스타일은 Tailwind 클래스로. 인라인 `style`은 **좌표·크기처럼 계산된 값**에만 사용
- 조건부 클래스가 많으면 `clsx` 사용
- 페이지 이동은 `next/link`의 `<Link>`, 코드 이동은 `useRouter()` (`next/navigation`)

### E2E가 찾을 수 있게 (키트 규칙)

E2E는 `getByRole` / `getByLabel`로 화면 글자를 찾아 조작합니다.

- 버튼은 `<button>`, 이동은 `<Link>`(= `<a>`)로. `div onClick` 금지
- 입력 칸은 `<label>`과 연결 (`<label htmlFor>` 또는 `aria-label`)
- 카드·영역에 이름이 필요하면 `<section aria-label="...">`
- 버튼·메뉴 글자는 **`docs/scenarios.yaml`과 똑같이**. 바꾸면 scenarios.yaml과 `e2e/scenarios/*.spec.ts`도 같은 commit에서 수정

## 6. API 호출 (API_CONVENTION.md 준수)

- API는 **상대 경로**로 호출: `/api/guides`. BE 주소 환경변수·`localhost:3000` 같은 절대 주소 금지 (키트 규칙)
- 경로는 `/api/`로 시작하는 kebab-case 복수 명사 (예: `/api/guide-sessions/12`). `/__health`는 FE가 호출하지 않음
- JSON 필드·쿼리 파라미터는 BE와 동일하게 **camelCase 그대로** 사용 (변환 금지)
- 본문은 **모두 JSON**. 화면 이미지도 data URL(base64) 문자열로 JSON의 `image` 필드에 넣음 (API_CONVENTION.md 2번 「화면 이미지 보내기」, 아래 8번)
- 공통 응답 처리는 `client.ts`에서 한 번에:

```ts
// lib/api/types.ts — BE 공통 응답(API_CONVENTION.md 3번)과 같은 모양
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  code?: string;
}

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}
```

```ts
// lib/api/client.ts
import { ApiError, type ApiResponse } from "./types";

export async function request<T>(path: `/api/${string}`, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "인터넷 연결을 확인해 주세요.");
  }

  if (res.status === 204) return undefined as T;

  const body: ApiResponse<T> | null = await res.json().catch(() => null);
  if (!res.ok || !body?.success) {
    throw new ApiError(
      res.status,
      body?.code ?? "INTERNAL_SERVER_ERROR",
      body?.message ?? "잠시 후 다시 시도해 주세요.",
    );
  }
  return body.data;
}
```

```ts
// components/guide/api.ts
import type { GuideRequest, GuideResponse } from "@/server/guide/schema";
import { request } from "@/lib/api/client";

// body.image는 lib/image.ts가 만든 data URL ("data:image/jpeg;base64,...")
export function createGuide(body: GuideRequest) {
  return request<GuideResponse>("/api/guides", { method: "POST", body: JSON.stringify(body) });
}
```

- 컴포넌트·훅에서는 `data`만 받습니다. `success`, `message`를 다시 확인하지 않습니다.
- 에러는 **상태 코드로 큰 분기, `code`로 세부 분기** (API_CONVENTION.md 4번 표 기준)
  - 400(`IMAGE_INVALID`, `IMAGE_TOO_LARGE`): `message` 표시 + 다른 사진을 고르거나 화면을 다시 보게 안내
  - 401(`AUTH_REQUIRED`): 로그인 화면으로 이동
  - 429/503(`AI_*`): "잠시 후 다시 시도해 주세요" + **다시 시도 버튼**
  - 404: "없는 페이지" 처리
- BE `message`는 사용자에게 그대로 보여도 되는 문장이므로 그대로 표시. 500과 네트워크 오류만 FE 공통 문구 사용
- enum 값(UPPER_SNAKE_CASE)의 한글 표시 변환은 FE가 `lib/constants.ts` 또는 기능별 `types.ts`에서 관리
- 목록은 API 목록(API_CONVENTION.md 10번)에 적힌 대로 페이지네이션 객체(`items`, `hasNext` 등)인지 배열인지 구분

## 7. 인증·화면 접근 (키트 규칙)

- 로그인은 **httpOnly 쿠키 세션** (API_CONVENTION.md 7번). FE는 토큰을 저장하거나 `Authorization` 헤더를 붙이지 않음
  - 같은 주소라 `fetch`가 쿠키를 자동으로 보냄. localStorage에 로그인 정보 저장 금지
- 로그인 `POST /api/auth/login` → 성공 시 이동, 로그아웃 `POST /api/auth/logout`, 내 정보 `GET /api/auth/me`
- 로그인 안 한 사람이 `/`를 열면 **서비스 이름과 하는 일**이 보여야 함 (로그인 화면으로 보내거나 로그인 칸만 두지 않음)
- 로그인이 필요한 화면은 로그인 전에 열리지 않아야 함. 구체 방식(라우트 그룹 layout / `proxy.ts` — Next.js 16에서 middleware 이름이 proxy로 바뀜)은 BE 인증 구현에 맞춰 함께 정함
- 없는 주소는 `app/not-found.tsx`의 404 화면 (500 아님)
- 시드 계정(`student@example.com` / `loopthon-2026`)으로 화면에서 바로 로그인되는지 확인

## 8. 이 프로젝트 전용 규칙 (브라우저 기능)

> 아래는 모두 클라이언트 컴포넌트(`"use client"`) 안에서만 다룹니다.

### 화면 공유·캡처
- 화면 공유 시작은 **반드시 사용자 클릭에서** 호출 (`getDisplayMedia`는 클릭 없이 실패)
- 공유 종료 시 모든 트랙을 `track.stop()`으로 정리하고, 브라우저의 "공유 중지" 버튼(`track.onended`)도 처리
- BE 전송 이미지: 캔버스에 **가로 최대 1280px**로 그린 뒤 `canvas.toDataURL("image/jpeg", 0.7)` 결과(data URL)를 `image` 필드에 그대로 넣어 JSON으로 전송 (원본 전송 금지, 3MB 넘으면 BE가 400 `IMAGE_TOO_LARGE` — Vercel 요청 본문 한도 4.5MB 안)
- 축소·변환 함수는 `lib/image.ts` 하나로 두고 화면 공유 캡처와 "화면 사진 올리기"가 같이 씀
- AI 호출은 팀 예산(누적 $10)을 함께 씀 → 화면이 바뀌었거나 사용자가 요청했을 때만 전송, **요청 중에는 다시 보내지 않음**
- 캡처·변화 감지 간격 등 숫자는 `lib/constants.ts`에 상수로

### 좌표
- BE와 주고받는 좌표는 **이미지 기준 0~1 비율** `{ x, y, width, height }` (좌상단 기준, API_CONVENTION.md 5번). 픽셀 변환은 그리기 직전에만
- 좌표 디버그 모드(격자·좌표 표시)를 `?debug=1`로 켤 수 있게 유지

### Picture-in-Picture
- PiP 창 열기도 사용자 클릭에서만 호출
- React는 `createPortal`로 PiP 창의 `document.body`에 렌더링하고, **열 때 원래 문서의 스타일시트를 PiP 창으로 복사** (안 하면 Tailwind 미적용)
- PiP 관련 코드는 `components/pip/` 안에서만 다룸
- 기능 지원 여부를 먼저 확인 (`"documentPictureInPicture" in window`). 미지원 시 "크롬 또는 엣지에서 열어 주세요" 안내
- `window`는 서버에서 렌더링될 때 없으므로 `useEffect` 안이나 클릭 핸들러에서만 접근

### 음성
- 읽기는 `speechSynthesis` (`lang: "ko-KR"`), 입력은 `SpeechRecognition` / `webkitSpeechRecognition`
- 음성 인식이 실패해도 진행할 수 있게 **텍스트 입력과 자주 쓰는 목표 버튼을 항상 함께** 제공

### 키트 E2E 대응 (중요)

주최 측 E2E는 우리 `playwright.config.ts`를 쓰지 않고 자체 설정으로 돌며, 가짜 응답·`addInitScript` 같은 우회도 금지입니다.
→ **화면 공유(`getDisplayMedia`)·PiP·음성은 E2E에서 동작한다고 기대하지 않습니다.** 핵심 흐름이 이것들 없이도 끝까지 가야 합니다.

- **화면 사진 올리기**: 화면 공유와 별개로 `<label>` 붙은 `input type="file"`로 화면 사진을 올리는 입력을 둠. 올린 사진도 캔버스로 다시 그려 캡처와 같은 처리(축소 → data URL → 전송 → 안내 표시)를 거침. E2E는 `e2e/fixtures/`의 사진으로 이 길을 탐
- **결과는 본 화면에도 표시**: 안내 문장과 빨간 테두리를 PiP 창에만 띄우지 않고 본 화면에도 보여줌 (E2E는 본 화면에서 `expect`로 확인). PiP는 추가 기능
- **목표 입력**: E2E에서는 음성 대신 텍스트 입력·목표 버튼으로 진행
- **실패해도 멈추지 않게**: 화면 공유 거부·미지원, PiP 미지원, 음성 미지원일 때 오류로 멈추지 않고 안내 문구와 함께 "사진 올리기"·텍스트 입력으로 이어지게 함
- `docs/scenarios.yaml` steps는 이 길(사진 올리기 → 목표 입력 → 안내 확인)의 버튼·메뉴 이름으로 작성

## 9. 부모님용 UI 규칙

- 본문 글씨 **최소 20px**, 안내 문장 24px 이상
- 버튼 높이 **최소 56px**, 버튼 사이 간격 넉넉하게
- 한 화면에 안내는 **한 문장, 한 단계만**
- 용어는 쉬운 우리말로 ("세션" ✕ → "도움", "캡처" ✕ → "화면 보기")
- 색만으로 의미 전달 금지 (빨간 테두리 + 문장 + 음성 함께)
- 로딩 중에는 반드시 상태 문구 표시 ("화면을 보고 있어요..."). AI 응답 포함 흐름 하나가 1분 안에 끝나야 함 (키트 E2E)

## 10. 환경변수

- FE는 BE 주소 환경변수가 필요 없음 (상대 경로 호출)
- 비밀값은 `.env`에만, **커밋 금지**. `.env.example`에는 이름만 적음
- 브라우저에 노출되는 `NEXT_PUBLIC_` 변수에 **AI API 키 등 비밀값 절대 금지** (AI 호출은 BE `server/ai/`만)
- 새 변수를 추가하면 `.env.example`과 README 환경변수 표를 같이 갱신하고 디스코드에 공지

```
# .env.example (FE용, 개발 중에만)
NEXT_PUBLIC_USE_MOCK=
```

## 11. 목업과 병행 작업

- BE 구현 전에는 `schema.ts` 타입과 API 목록(API_CONVENTION.md 10번)의 응답 예시로 기능 폴더의 `mock.ts`에 목업을 만들고, `api.ts`에서 `NEXT_PUBLIC_USE_MOCK=true`일 때 목업을 반환
- 목업 응답도 실제와 같은 `data` 모양으로 작성 → 연동 시 플래그만 끄면 되게
- **목업은 개발 중에만.** E2E·배포는 실제 앱과 실제 AI 응답으로 돌기 때문에 `main`에서는 목업이 꺼져 있어야 함
- 필요한 데이터·API는 디스코드에 "화면 이름 + 필요한 데이터"로 BE에 요청
- 연동 중 문제는 API_CONVENTION.md 9번대로 "요청 URL, 보낸 값, 받은 응답(또는 콘솔 에러)"를 같이 공유

## 12. Git 규칙

- `main`에 push하면 CI·자동 배포가 돌기 때문에 **`main`은 항상 실행되는 상태 유지**
- 브랜치: `feat/fe-<기능>`, `fix/fe-<내용>` (예: `feat/fe-screen-capture`) → `main`으로 PR
- 커밋: `feat:` 기능 / `fix:` 버그 / `refactor:` 리팩터링 / `style:` UI·스타일 / `docs:` 문서 / `chore:` 설정·패키지
  - 예) `feat: 화면 공유 시작 버튼 구현`
- 작업 순서: `main` pull → 브랜치 생성 → 작업 → `npm run lint && npm run typecheck && npm run build` (CI와 같은 검사) → push → `main`으로 PR
- PR은 다른 FE 팀원이 확인 후 머지 (해커톤이므로 리뷰는 10분 이내로 가볍게, 막히면 본인 머지 후 공지)
- 커밋은 작게, 자주 (기여도 집계에도 유리)
- 패키지 추가 시 `package-lock.json`도 같이 커밋하고 디스코드에 공지 (BE와 같은 `package.json`을 씀)

## 13. 담당 분배

| 담당자 | 기능 / 작업 |
|---|---|
| FE-1 박형근 | 예: 초기 화면 세팅(`app/layout.tsx`, `lib/`), `components/capture` (화면 공유·캡처·변화 감지), `components/guide` (BE 통신·단계 진행), 첫 화면·404 |
| FE-2 전이현 | 예: `components/pip` (떠 있는 창, 확대 이미지 + 빨간 테두리), `components/voice` (음성 읽기·입력), 부모님용 UI |

## 14. 화면 확인 목록

배포 전 아래를 PC 크롬에서 확인합니다.

- [ ] 로그인 안 한 상태로 `/`를 열면 서비스 이름과 하는 일이 보이는지
- [ ] 로그인 전에 로그인 필요 화면이 열리지 않는지, 없는 주소가 404 화면인지
- [ ] 시드 계정으로 화면에서 로그인되는지
- [ ] 1440×900에서 화면이 깨지지 않는지
- [ ] 버튼·메뉴 글자가 `docs/scenarios.yaml`과 같은지
- [ ] 화면 공유·PiP·음성 없이 "사진 올리기 → 목표 입력 → 본 화면에 안내 표시"가 끝까지 되는지 (키트 E2E 경로)
- [ ] HTTPS 배포 주소에서 화면 공유가 시작되는지
- [ ] 전체 화면 공유 후 다른 프로그램으로 넘어가도 PiP 창이 위에 떠 있는지
- [ ] 다른 탭에 있을 때도 캡처·변화 감지가 계속 동작하는지
- [ ] 빨간 테두리 위치가 실제 버튼과 맞는지 (`?debug=1`)
- [ ] 브라우저의 "공유 중지"를 눌렀을 때 정상 종료되는지
- [ ] 음성 읽기·입력이 한국어로 동작하는지
