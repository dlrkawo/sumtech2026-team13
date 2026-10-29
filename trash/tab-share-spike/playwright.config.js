// 탭 공유(getDisplayMedia)가 Playwright에서 어떻게 동작하는지 조건별로 비교한다.
const { defineConfig } = require('@playwright/test');

const TARGET_TITLE = '모의 신청 페이지';

module.exports = defineConfig({
  testDir: './tests',
  workers: 1,
  timeout: 30_000,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4173', viewport: { width: 1440, height: 900 } },
  webServer: { command: 'node server.js', url: 'http://localhost:4173', reuseExistingServer: true },
  projects: [
    // 키트 설정과 같은 조건: 실행 옵션 없음 (주최 측 실행에 가장 가까움)
    { name: 'kit-default' },
    // 탭 제목으로 공유할 탭을 자동 선택
    {
      name: 'flag-tab-by-title',
      use: { launchOptions: { args: [`--auto-select-tab-capture-source-by-title=${TARGET_TITLE}`] } },
    },
    // 창/화면 이름으로 자동 선택
    {
      name: 'flag-desktop-source',
      use: { launchOptions: { args: [`--auto-select-desktop-capture-source=${TARGET_TITLE}`] } },
    },
    // 권한 창 자동 수락 (카메라·마이크용 옵션이 화면 공유에도 듣는지)
    {
      name: 'flag-fake-ui',
      use: { launchOptions: { args: ['--use-fake-ui-for-media-stream'] } },
    },
    // 새 headless 모드(실제 Chromium)에서 탭 제목 자동 선택
    {
      name: 'new-headless-tab-by-title',
      use: {
        channel: 'chromium',
        launchOptions: { args: [`--auto-select-tab-capture-source-by-title=${TARGET_TITLE}`] },
      },
    },
    // 새 headless 모드 + 권한 창 자동 수락
    {
      name: 'new-headless-fake-ui',
      use: { channel: 'chromium', launchOptions: { args: ['--use-fake-ui-for-media-stream'] } },
    },
    // 화면이 보이는 브라우저(headed) + 탭 제목 자동 선택
    {
      name: 'headed-tab-by-title',
      use: {
        headless: false,
        launchOptions: { args: [`--auto-select-tab-capture-source-by-title=${TARGET_TITLE}`] },
      },
    },
  ],
});
