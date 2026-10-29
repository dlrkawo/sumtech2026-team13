# Frontend Convention — sumtech 2026 Team 13

> 이 문서는 FE 팀원 2명이 공통으로 따르는 규칙입니다.
> 레포의 `frontend/CONVENTION.md`에 두고, 규칙이 바뀌면 이 파일을 수정한 뒤 디스코드에 공지합니다.
> API 통신 규칙은 레포 루트의 `API_CONVENTION.md`가 기준이며, 이 문서는 그 규칙을 FE 코드에서 어떻게 지키는지 정합니다.
> **Claude 사용 시:** 작업 시작할 때 이 문서와 `API_CONVENTION.md`를 함께 붙여넣고 "이 컨벤션을 따라서 작업해줘"라고 요청하세요.
> (Claude Code를 쓴다면 `frontend/CLAUDE.md`에 "작업 전 CONVENTION.md와 ../API_CONVENTION.md를 읽고 따를 것" 한 줄을 넣어두면 자동으로 참고합니다.)

---

## 0. 프로젝트 맥락

- 행사: sumtech 2026 해커톤, 팀 13 (PM 1, FE 2, BE 2)
- 결과물: 웹 서비스(웹사이트). FE/BE 분리, REST API(JSON)로 통신
- 서비스: 부모님 화면을 AI가 보고, 눌러야 할 버튼을 빨간 테두리로 짚어주는 도우미
  - 화면 공유(`getDisplayMedia`) → 캡처 → BE로 전송 → 다음 단계 안내 + 버튼 좌표 수신 → 작은 떠 있는 창(Document Picture-in-Picture)에 표시
- 지원 환경: **PC 크롬·엣지 최신 버전만** (모바일·사파리·파이어폭스 미지원)
- 레포: https://github.com/dlrkawo/sumtech2026-team13 (모노레포, FE는 `/frontend`에서만 작업)
- 코드트리 해커톤 사이트와 연동 → 커밋 기록으로 기여도 집계 (git 이메일 = 깃허브 계정 이메일)

## 1. 기술 스택

| 구분 | 선택 |
|---|---|
| 언어 | TypeScript (strict) |
| 프레임워크 | React 18+ |
| 빌드 | Vite |
| 스타일 | Tailwind CSS |
| 라우팅 | React Router (페이지가 2개 이상일 때만) |
| 상태 관리 | React state + Context. 전역 상태가 커지면 Zustand |
| API 호출 | `fetch` 래퍼 (`shared/api/client.ts`) |
| 린트/포맷 | ESLint + Prettier |
| 패키지 | npm (`package-lock.json` 커밋) |
| 배포 | Vercel (HTTPS 필수 — 화면 공유 API는 HTTPS 또는 localhost에서만 동작) |

## 2. 폴더 구조 (기능 단위)

```
frontend/
├── src/
│   ├── main.tsx              # 진입점
│   ├── App.tsx               # 라우터, 전역 Provider
│   ├── pages/                # 라우트 단위 화면 (조립만, 로직 최소)
│   │   └── HomePage.tsx
│   ├── features/
│   │   └── <feature>/        # 예: capture, pip, guide, voice
│   │       ├── components/   # 이 기능 전용 컴포넌트
│   │       ├── hooks/        # 이 기능 전용 훅
│   │       ├── api.ts        # 이 기능의 API 호출 함수
│   │       ├── types.ts      # 이 기능의 타입
│   │       └── index.ts      # 외부에 공개할 것만 export
│   ├── shared/
│   │   ├── api/
│   │   │   ├── client.ts     # fetch 래퍼, 공통 응답 처리
│   │   │   └── types.ts      # ApiResponse, ApiError 등 공통 타입
│   │   ├── components/       # 공용 UI (Button, Modal 등)
│   │   ├── hooks/            # 공용 훅
│   │   ├── lib/              # 공용 유틸 (이미지 변환 등)
│   │   └── constants.ts
│   ├── mocks/                # BE 연동 전 목업 데이터
│   └── index.css             # Tailwind 진입
├── public/
├── .env.example
├── package.json
└── CONVENTION.md
```

- **기능 폴더 단위로 담당자를 나눕니다** → 같은 파일 동시 수정 최소화
- 다른 기능 폴더 내부 파일을 직접 import하지 않고 그 기능의 `index.ts`를 통해 가져옵니다.
- 공용 파일(`App.tsx`, `shared/`, `package.json`, `tailwind.config`, `vite.config`) 수정 시 디스코드에 먼저 알립니다.

## 3. 레이어 규칙

```
page → feature component → hook → api.ts → shared/api/client.ts → BE
```

- **page**: 컴포넌트 배치만. API 호출·브라우저 API 직접 사용 금지
- **component**: 화면 그리기와 사용자 입력 처리. 복잡한 로직은 훅으로 분리
- **hook**: 상태, 부수효과, 브라우저 API(화면 공유, PiP, 음성) 다루기
- **api.ts**: BE 호출 함수만. 응답 가공이 필요하면 여기서 FE용 타입으로 변환
- **client.ts**: 공통 헤더, 공통 응답 해제, 에러 변환. 컴포넌트에서 `fetch` 직접 호출 금지

## 4. 네이밍

| 대상 | 규칙 | 예시 |
|---|---|---|
| 컴포넌트 파일·이름 | PascalCase | `GuideOverlay.tsx` |
| 훅 | `use` + PascalCase, camelCase 파일 | `useScreenCapture.ts` |
| 그 외 파일 | camelCase | `imageUtils.ts` |
| 변수, 함수 | camelCase | `captureFrame` |
| 타입, 인터페이스 | PascalCase | `GuideStep` |
| Props 타입 | `<컴포넌트>Props` | `GuideOverlayProps` |
| 상수 | UPPER_SNAKE_CASE | `CAPTURE_INTERVAL_MS` |
| boolean | `is` / `has` / `can` 접두사 | `isCapturing`, `hasPermission` |
| 이벤트 핸들러 | 내부 함수 `handle*`, props `on*` | `handleStartClick`, `onStart` |
| API 함수 | get / list / create / update / delete + 대상 | `createGuide` |
| 요청·응답 타입 | `<대상><동작>Request`, `<대상>Response` (BE와 동일) | `GuideCreateRequest`, `GuideResponse` |

## 5. 컴포넌트 규칙

- 함수 컴포넌트 + named export (`export function GuideOverlay()`). `pages/`만 default export 허용
- Props는 타입으로 명시하고 구조 분해로 받기
- 한 파일에 컴포넌트 하나. 150줄이 넘으면 분리 검토
- 스타일은 Tailwind 클래스로. 인라인 `style`은 **좌표·크기처럼 계산된 값**에만 사용
- 조건부 클래스가 많으면 `clsx` 사용

## 6. API 호출 (API_CONVENTION.md 준수)

- BE 주소는 `import.meta.env.VITE_API_BASE_URL`로만 접근. 코드에 주소 직접 작성 금지
- 모든 경로는 `/api/v1`로 시작
- JSON 필드는 BE와 동일하게 **camelCase 그대로** 사용 (변환 금지)
- 공통 응답 처리는 `client.ts`에서 한 번에:

```ts
// shared/api/types.ts
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
// shared/api/client.ts
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/v1${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', '인터넷 연결을 확인해 주세요.');
  }

  if (res.status === 204) return undefined as T;

  const body: ApiResponse<T> = await res.json().catch(() => null);
  if (!res.ok || !body?.success) {
    throw new ApiError(
      res.status,
      body?.code ?? 'INTERNAL_SERVER_ERROR',
      body?.message ?? '잠시 후 다시 시도해 주세요.',
    );
  }
  return body.data;
}
```

- 컴포넌트·훅에서는 `data`만 받습니다. `success`, `message`를 다시 확인하지 않습니다.
- 에러는 **상태 코드로 큰 분기, `code`로 세부 분기** (API_CONVENTION.md 4번 표 기준)
- BE `message`는 사용자에게 그대로 보여도 되는 문장이므로 그대로 표시. 500과 네트워크 오류만 FE 공통 문구 사용
- enum 값(UPPER_SNAKE_CASE)의 한글 표시 변환은 FE가 `constants.ts` 또는 기능별 `types.ts`에서 관리

## 7. 이 프로젝트 전용 규칙 (브라우저 기능)

### 화면 공유·캡처
- 화면 공유 시작은 **반드시 사용자 클릭에서** 호출 (`getDisplayMedia`는 클릭 없이 실패)
- 공유 종료 시 모든 트랙을 `track.stop()`으로 정리하고, 브라우저의 "공유 중지" 버튼(`track.onended`)도 처리
- BE 전송 이미지: **가로 최대 1280px, JPEG 품질 0.7 내외**로 축소·압축 후 base64 전송 (원본 전송 금지 — 요청 크기 제한)
- 캡처·변화 감지 간격 등 숫자는 `shared/constants.ts`에 상수로

### 좌표
- BE와 주고받는 좌표는 **0~1 비율** (`{ x, y, w, h }`, 좌상단 기준). 픽셀 변환은 그리기 직전에만
- 좌표 디버그 모드(격자·좌표 표시)를 `?debug=1`로 켤 수 있게 유지

### Picture-in-Picture
- PiP 창 열기도 사용자 클릭에서만 호출
- React는 `createPortal`로 PiP 창의 `document.body`에 렌더링하고, **열 때 원래 문서의 스타일시트를 PiP 창으로 복사** (안 하면 Tailwind 미적용)
- PiP 관련 코드는 `features/pip/` 안에서만 다룸
- 기능 지원 여부를 먼저 확인 (`'documentPictureInPicture' in window`). 미지원 시 "크롬 또는 엣지에서 열어 주세요" 안내

### 음성
- 읽기는 `speechSynthesis` (`lang: 'ko-KR'`), 입력은 `SpeechRecognition` / `webkitSpeechRecognition`
- 음성 인식이 실패해도 진행할 수 있게 **텍스트 입력과 자주 쓰는 목표 버튼을 항상 함께** 제공

## 8. 부모님용 UI 규칙

- 본문 글씨 **최소 20px**, 안내 문장 24px 이상
- 버튼 높이 **최소 56px**, 버튼 사이 간격 넉넉하게
- 한 화면에 안내는 **한 문장, 한 단계만**
- 용어는 쉬운 우리말로 ("세션" ✕ → "도움", "캡처" ✕ → "화면 보기")
- 색만으로 의미 전달 금지 (빨간 테두리 + 문장 + 음성 함께)
- 로딩 중에는 반드시 상태 문구 표시 ("화면을 보고 있어요...")

## 9. 환경변수

- 비밀값·주소는 `.env.local`에만. **`.env.local` 커밋 금지**
- 변수를 추가하면 `.env.example`에 이름과 예시값(가짜)을 같이 추가
- 브라우저에 노출되는 `VITE_` 변수에 **AI API 키 등 비밀값 절대 금지** (AI 호출은 BE만)

```
# .env.example
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCK=false
```

## 10. 목업과 병행 작업

- BE 구현 전에는 Swagger 명세의 응답 예시로 `src/mocks/`에 목업 데이터를 만들고, `api.ts`에서 `VITE_USE_MOCK=true`일 때 목업을 반환
- 목업 응답도 실제와 같은 `data` 모양으로 작성 → 연동 시 플래그만 끄면 되게
- 연동 중 문제는 API_CONVENTION.md 9번대로 "요청 URL, 보낸 값, 받은 응답(또는 콘솔 에러)"를 같이 공유

## 11. Git 규칙

- 브랜치: `feat/fe-<기능>`, `fix/fe-<내용>` (예: `feat/fe-screen-capture`)
- 커밋: `feat:` 기능 / `fix:` 버그 / `refactor:` 리팩터링 / `style:` UI·스타일 / `docs:` 문서 / `chore:` 설정·패키지
  - 예) `feat: 화면 공유 시작 버튼 구현`
- 작업 순서: `dev` pull → 브랜치 생성 → 작업 → `npm run lint && npm run build` → push → `dev`로 PR
- PR은 다른 FE 팀원이 확인 후 머지 (해커톤이므로 리뷰는 10분 이내로 가볍게, 막히면 본인 머지 후 공지)
- 커밋은 작게, 자주 (기여도 집계에도 유리)
- 패키지 추가 시 `package-lock.json`도 같이 커밋하고 디스코드에 공지

## 12. 담당 분배

| 담당자 | 기능 / 작업 |
|---|---|
| FE-1 박형근 | 예: 초기 세팅, `shared/`, `features/capture` (화면 공유·캡처·변화 감지), `features/guide` (BE 통신·단계 진행), 배포 |
| FE-2 전이현 | 예: `features/pip` (떠 있는 창, 확대 이미지 + 빨간 테두리), `features/voice` (음성 읽기·입력), 부모님용 UI |

## 13. 브라우저 확인 목록

배포 전 아래를 PC 크롬에서 확인합니다.

- [ ] HTTPS 배포 주소에서 화면 공유가 시작되는지
- [ ] 전체 화면 공유 후 다른 프로그램으로 넘어가도 PiP 창이 위에 떠 있는지
- [ ] 다른 탭에 있을 때도 캡처·변화 감지가 계속 동작하는지
- [ ] 빨간 테두리 위치가 실제 버튼과 맞는지 (`?debug=1`)
- [ ] 브라우저의 "공유 중지"를 눌렀을 때 정상 종료되는지
- [ ] 음성 읽기·입력이 한국어로 동작하는지
