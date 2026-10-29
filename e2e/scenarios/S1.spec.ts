import { expect, test } from "@playwright/test"

// ※ 라벨·버튼 이름은 docs/scenarios.yaml 기준이다. 화면 문구를 바꾸면 이 spec도 같은 커밋에서 고친다.

test("S1 가입하고 설정 창에 들어간다", async ({ page }) => {
  // 같은 DB에서 여러 번 돌아도 겹치지 않도록 실행마다 다른 이메일로 가입한다
  const email = `e2e-s1-${Date.now()}@example.com`

  // 1. 사이트에 접속한다
  await page.goto("/")

  // 2. '가입하기'를 누른다
  await page.getByRole("button", { name: "가입하기" }).click()

  // 3. 이메일과 비밀번호를 입력한다
  await page.getByLabel("이메일").fill(email)
  await page.getByLabel("비밀번호").fill("loopthon-2026")

  // 4. '가입' 버튼을 누른다
  await page.getByRole("button", { name: "가입", exact: true }).click()

  // expected: 설정 창이 열리고 '도움 시작하기' 버튼이 보인다
  await expect(page.getByRole("button", { name: "도움 시작하기" })).toBeVisible()
})
