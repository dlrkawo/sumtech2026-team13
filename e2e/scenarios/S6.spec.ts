import path from "node:path"
import { expect, test } from "@playwright/test"

const AI_WAIT = { timeout: 60_000 }
const fixture = (name: string) => path.join(__dirname, "../fixtures", name)

test("S6 새로 가입해 기록 저장을 끄고 물어보면 기록이 남지 않는다", async ({ page }) => {
  const email = `e2e-s6-${Date.now()}@example.com`

  await page.goto("/")

  await page.getByRole("button", { name: "가입하기" }).click()

  await page.getByLabel("이메일").fill(email)
  await page.getByLabel("비밀번호").fill("loopthon-2026")
  await page.getByRole("button", { name: "가입", exact: true }).click()

  await page.getByRole("switch", { name: "기록 저장" }).uncheck()

  await page.getByRole("button", { name: "도움 시작하기" }).click()

  await page.getByLabel("화면 사진 올리기").setInputFiles(fixture("mock-step1.png"))

  await page.getByLabel("질문 입력").fill("병원 예약하고 싶어")

  await page.getByRole("button", { name: "물어보기" }).click()
  await expect(page.getByTestId("guide-text")).not.toBeEmpty(AI_WAIT)

  await page.getByRole("button", { name: "설정" }).click()

  await page.getByRole("button", { name: "도움 기록" }).click()

  await expect(page.getByText("아직 도움 기록이 없어요")).toBeVisible()
})
