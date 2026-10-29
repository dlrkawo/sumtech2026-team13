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

test("S2 병원 예약 화면 사진을 올려 묻고 누를 곳 안내를 받는다", async ({ page }) => {
  await logIn(page)

  await page.getByRole("button", { name: "도움 시작하기" }).click()

  await page.getByLabel("화면 사진 올리기").setInputFiles(fixture("mock-step1.png"))

  await page.getByLabel("질문 입력").fill("병원 예약하고 싶어")

  await page.getByRole("button", { name: "물어보기" }).click()

  await expect(page.getByText("누를 곳을 찾았어요")).toBeVisible(AI_WAIT)
  await expect(page.getByTestId("guide-text")).not.toBeEmpty()
  await expect(page.getByTestId("click-highlight")).toBeVisible()
})
