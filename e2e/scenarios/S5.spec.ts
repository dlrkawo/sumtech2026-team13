import path from "node:path"
import { expect, test, type Page } from "@playwright/test"
import { E2E_USER_EMAIL, E2E_USER_PASSWORD } from "../env"

const AI_WAIT = { timeout: 60_000 }
const fixture = (name: string) => path.join(__dirname, "../fixtures", name)

async function logIn(page: Page) {
  await page.goto("/")
  await page.getByLabel("이메일").fill(E2E_USER_EMAIL)
  await page.getByLabel("비밀번호").fill(E2E_USER_PASSWORD)
  await page.getByRole("button", { name: "로그인" }).click()
  await expect(page.getByRole("button", { name: "도움 시작하기" })).toBeVisible()
}

test("S5 지난 도움 기록을 다시 본다", async ({ page }) => {
  await logIn(page)

  await page.getByRole("button", { name: "도움 시작하기" }).click()

  await page.getByLabel("화면 사진 올리기").setInputFiles(fixture("mock-step1.png"))

  await page.getByLabel("질문 입력").fill("병원 예약하고 싶어")

  await page.getByRole("button", { name: "물어보기" }).click()
  await expect(page.getByTestId("guide-text")).not.toBeEmpty(AI_WAIT)

  await page.getByRole("button", { name: "설정" }).click()

  await page.getByRole("button", { name: "도움 기록" }).click()

  await expect(page.getByRole("listitem").filter({ hasText: "병원 예약하고 싶어" }).first()).toBeVisible()
})
