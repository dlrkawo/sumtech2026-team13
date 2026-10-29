const { test, expect } = require('@playwright/test');

// 키트 기본 조건과 새 headless 모드만 비교한다
test.beforeEach(({}, testInfo) => {
  test.skip(!['kit-default', 'new-headless-fake-ui'].includes(testInfo.project.name), 'PiP 실험 대상 아님');
});

test('작은 창(Document PiP)을 열고 안의 버튼을 누른다', async ({ page, context }, testInfo) => {
  const tag = `[${testInfo.project.name}]`;
  await page.goto('/pip.html');
  console.log(tag, 'API 있음:', await page.evaluate(() => 'documentPictureInPicture' in window));

  const pages = [];
  context.on('page', (p) => pages.push(p));
  await page.getByRole('button', { name: '작은 창으로 띄우기' }).click();

  const result = page.locator('#result');
  await expect(result).not.toHaveText(/대기 중|요청 중/, { timeout: 10_000 }).catch(() => {});
  console.log(tag, '결과:', await result.textContent());
  console.log(tag, '새 page 이벤트 수:', pages.length, '| context 안 page 수:', context.pages().length);

  // Playwright가 작은 창을 page로 잡았다면 그 안의 버튼을 눌러 본다
  const pip = pages[0] ?? context.pages().find((p) => p !== page);
  if (pip) {
    await pip.getByRole('button', { name: '작은 창 안의 설정' }).click({ timeout: 5_000 }).catch((e) => console.log(tag, 'PiP 클릭 실패:', e.message.split('\n')[0]));
    console.log(tag, '클릭 후:', await result.textContent());
  }
  // 본 창의 locator로는 작은 창 안 버튼이 보이는지
  console.log(tag, '본 창에서 찾은 개수:', await page.getByRole('button', { name: '작은 창 안의 설정' }).count());
});
