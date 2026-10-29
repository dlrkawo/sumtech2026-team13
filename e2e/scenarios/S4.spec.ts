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

test("S4 개인정보 제출 버튼 앞에서 경고를 본다", async ({ page }) => {
  await logIn(page)

  await page.getByRole("button", { name: "도움 시작하기" }).click()

  await page.getByLabel("화면 사진 올리기").setInputFiles(fixture("mock-unclear.png"))

  await page.getByLabel("질문 입력").fill("예약 마무리하고 싶어")

  await page.getByRole("button", { name: "물어보기" }).click()

  await expect(
    page.getByText("되돌리기 어려운 버튼이에요. 누르기 전에 한 번 더 확인하세요"),
  ).toBeVisible(AI_WAIT)
})
