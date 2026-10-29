const { test, expect } = require('@playwright/test');

test('대상 탭을 열어 두고 서비스 탭에서 화면 공유를 누른다', async ({ context }, testInfo) => {
  const target = await context.newPage();
  await target.goto('/target.html');

  const service = await context.newPage();
  await service.goto('/');
  await service.getByRole('button', { name: '화면 공유' }).click();

  const result = service.locator('#result');
  await expect(result).not.toHaveText(/대기 중|요청 중/, { timeout: 15_000 });
  const text = await result.textContent();
  console.log(`[${testInfo.project.name}] ${text}`);
});
