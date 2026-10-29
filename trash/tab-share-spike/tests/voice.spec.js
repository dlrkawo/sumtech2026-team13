const { test, expect } = require('@playwright/test');

// 키트 기본 조건과 가짜 마이크 조건만 비교한다
test.beforeEach(({}, testInfo) => {
  test.skip(!['kit-default', 'flag-fake-mic'].includes(testInfo.project.name), '음성 실험 대상 아님');
});

async function readResult(page, label, testInfo) {
  const result = page.locator('#result');
  await expect(result).not.toHaveText(/대기 중|요청 중/, { timeout: 15_000 });
  console.log(`[${testInfo.project.name}] ${label}: ${await result.textContent()}`);
}

// 0.5초짜리 440Hz 사인파 WAV를 만든다 (음성 파일 올리기용)
function makeWav(seconds = 0.5, rate = 16000) {
  const samples = Math.floor(seconds * rate);
  const buf = Buffer.alloc(44 + samples * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + samples * 2, 4);
  buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++) {
    buf.writeInt16LE(Math.round(Math.sin((2 * Math.PI * 440 * i) / rate) * 8000), 44 + i * 2);
  }
  return buf;
}

test('마이크 녹음 (권한 부여 없음)', async ({ page }, testInfo) => {
  await page.goto('/voice.html');
  await page.getByRole('button', { name: '마이크 녹음' }).click();
  await readResult(page, '마이크 녹음', testInfo);
});

test('마이크 녹음 (spec에서 마이크 권한 부여)', async ({ context, page }, testInfo) => {
  await context.grantPermissions(['microphone']);
  await page.goto('/voice.html');
  await page.getByRole('button', { name: '마이크 녹음' }).click();
  await readResult(page, '마이크 녹음+권한', testInfo);
});

test('음성 인식 (권한 부여 없음)', async ({ page }, testInfo) => {
  await page.goto('/voice.html');
  await page.getByRole('button', { name: '음성 인식' }).click();
  await readResult(page, '음성 인식', testInfo);
});

test('음성 인식 (spec에서 마이크 권한 부여)', async ({ context, page }, testInfo) => {
  await context.grantPermissions(['microphone']);
  await page.goto('/voice.html');
  await page.getByRole('button', { name: '음성 인식' }).click();
  await readResult(page, '음성 인식+권한', testInfo);
});

test('음성 파일 올리기', async ({ page }, testInfo) => {
  await page.goto('/voice.html');
  await page.getByLabel('음성 파일 올리기').setInputFiles({
    name: 'question.wav',
    mimeType: 'audio/wav',
    buffer: makeWav(),
  });
  await readResult(page, '음성 파일 올리기', testInfo);
});

test('읽어주기', async ({ page }, testInfo) => {
  await page.goto('/voice.html');
  await page.getByRole('button', { name: '읽어주기' }).click();
  await readResult(page, '읽어주기', testInfo);
});
