const { test, expect } = require('@playwright/test');

// 키트 기본 조건(kit-default)에서만 의미가 있으므로 다른 프로젝트는 건너뛴다
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'kit-default', '키트 기본 조건만 확인');
});

async function readResult(page, label) {
  const result = page.locator('#result');
  await expect(result).not.toHaveText(/대기 중|요청 중/, { timeout: 15_000 });
  console.log(`[${label}] ${await result.textContent()}`);
}

test('현재 탭(iframe 포함) 공유', async ({ page }) => {
  await page.goto('/iframe.html');
  await page.getByRole('button', { name: '현재 탭 공유' }).click();
  await readResult(page, 'preferCurrentTab');
});

test('iframe 안에서 화면 공유 호출', async ({ page }) => {
  await page.goto('/iframe.html');
  const inner = page.frameLocator('#inner-share');
  await inner.getByRole('button', { name: '화면 공유' }).click();
  const result = inner.locator('#result');
  await expect(result).not.toHaveText(/대기 중|요청 중/, { timeout: 15_000 });
  console.log(`[inside-iframe] ${await result.textContent()}`);
});

test('같은 출처 iframe을 DOM 캡처', async ({ page }) => {
  await page.goto('/iframe.html');
  await page.getByRole('button', { name: 'iframe 캡처' }).click();
  await readResult(page, 'html2canvas');
});

const EXTERNAL_SITES = [
  'https://www.gov.kr',
  'https://www.naver.com',
  'https://www.kakaobank.com',
  'https://www.coupang.com',
  'https://www.hira.or.kr',
  'https://www.youtube.com',
];

for (const url of EXTERNAL_SITES) {
  test(`외부 사이트 iframe 표시: ${url}`, async ({ page }) => {
    await page.goto('/iframe.html');
    const blocked = [];
    page.on('console', (m) => /frame|refused|ancestors/i.test(m.text()) && blocked.push(m.text()));
    await page.locator('#external').evaluate((el, src) => (el.src = src), url);
    await page.waitForTimeout(6000);
    const frame = page.frame({ url: (u) => u.href.startsWith(new URL(url).origin) || u.href.includes(new URL(url).hostname.replace('www.', '')) });
    const textLength = frame ? (await frame.locator('body').innerText().catch(() => '')).length : 0;
    // 부모 페이지 스크립트에서 iframe DOM에 접근 가능한지(같은 출처 정책)
    const parentCanRead = await page.evaluate(() => {
      try {
        return !!document.getElementById('external').contentDocument?.body;
      } catch {
        return false;
      }
    });
    console.log(
      `[external] ${url} → 보이는 글자 수 ${textLength}, 부모가 DOM 접근 ${parentCanRead}, 차단 로그 ${blocked.length ? blocked[0].slice(0, 120) : '없음'}`
    );
  });
}
