import { expect, test } from "@playwright/test"

test("S1 가입하고 설정 창에 들어간다", async ({ page }) => {
  const email = `e2e-s1-${Date.now()}@example.com`

  await page.goto("/")

  await page.getByRole("button", { name: "가입하기" }).click()

  await page.getByLabel("이메일").fill(email)
  await page.getByLabel("비밀번호").fill("loopthon-2026")

  await page.getByRole("button", { name: "가입", exact: true }).click()

  await expect(page.getByRole("button", { name: "도움 시작하기" })).toBeVisible()
})
