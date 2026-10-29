import { defineConfig } from "@playwright/test"
import { E2E_BASE_URL } from "./env"

/**
 * 로컬·CI용 설정이다. docker compose up 뒤 `npx playwright test`로 주최 측 실행과 같은 조건을 미리 확인한다.
 * 주최 측 실행은 이 파일을 쓰지 않고 아래와 같은 값의 자체 설정으로 실행한다. 그래서 여기에만 둔 설정
 * (globalSetup·storageState·retries·route·viewport 변경 등)은 주최 측 실행에는 적용되지 않는다. 로그인·데이터 준비는 spec 안에서 한다.
 */
export default defineConfig({
  testDir: "./scenarios",
  // docs/scenarios.yaml의 id와 같은 이름(S1.spec.ts, S2.spec.ts…)만 실행한다. *.example.spec.ts는 제외된다.
  testMatch: /[\\/]S[1-9]\d*\.spec\.ts$/,
  // 흐름들이 같은 DB를 쓰므로 하나씩 순서대로 돈다.
  workers: 1,
  retries: 0,
  // 흐름 하나(AI 응답 대기 포함)가 로컬에서 1분 안에 끝나게 만든다. 주최 측 실행은 동작마다 화면을 찍어 더 오래 걸린다.
  // 주최 측 자동 실행은 테스트별 90초 제한이 있어 같은 값으로 미리 확인한다.
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: E2E_BASE_URL,
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    serviceWorkers: "block",
    trace: "retain-on-failure",
    // 화면이 아직 없을 때 버튼을 90초(test timeout)까지 기다리지 않고 빨리 실패하게 한다 (CI 대기 시간 단축).
    // 주최 측 실행은 이 파일을 쓰지 않으므로 채점에는 영향 없음
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  // docs/scenarios.yaml의 platform에 맞는 것만 남긴다(both면 둘 다). 주최 측 실행도 같은 화면 크기로 돈다.
  // 13팀: platform desktop → desktop만 남김 (mobile까지 돌면 시간이 두 배)
  projects: [{ name: "desktop", use: { viewport: { width: 1440, height: 900 } } }],
})
