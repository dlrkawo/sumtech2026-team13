import path from "node:path"
import { expect, test, type Page } from "@playwright/test"

const AI_WAIT = { timeout: 60_000 }
const fixture = (name: string) => path.join(__dirname, "../fixtures", name)

// 사용자가 실제로 보는 '사진 올리기' 버튼을 눌러 파일 선택 창에서 사진을 고른다.
// 숨은 파일 입력에 직접 넣지 않으므로, 버튼이 화면에 보이지 않으면 여기서 실패한다 (F2)
async function choosePhoto(page: Page, buttonText: "사진 올리기" | "사진 바꾸기", file: string) {
  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.getByText(buttonText, { exact: true }).click(),
  ])
  await chooser.setFiles(fixture(file))
}

test("S6 새로 가입해 기록 저장을 끄고 물어보면 기록이 남지 않는다", async ({ page }) => {
  const email = `e2e-s6-${Date.now()}@example.com`

  await page.goto("/")

  await page.getByRole("button", { name: "가입하기" }).click()

  await page.getByLabel("이메일").fill(email)
  await page.getByLabel("비밀번호").fill("loopthon-2026")
  await page.getByRole("button", { name: "가입", exact: true }).click()

  // '기록 저장' 끄기가 서버에 저장된 뒤에 물어본다 (F6: 저장 성공 이후의 새 요청부터 기록하지 않음)
  const saveHistory = page.getByRole("switch", { name: "기록 저장" })
  const [saved] = await Promise.all([
    page.waitForResponse((res) => res.url().endsWith("/api/settings") && res.request().method() === "PATCH"),
    saveHistory.uncheck(),
  ])
  expect(saved.ok()).toBe(true)
  await expect(saveHistory).not.toBeChecked()
  await expect(page.getByRole("alert")).toHaveCount(0)

  await page.getByRole("button", { name: "도움 시작하기" }).click()

  await page.getByRole("button", { name: "곁길 도우미 열기" }).click()

  await choosePhoto(page, "사진 올리기", "mock-step1.png")

  await page.getByLabel("질문 입력").fill("병원 예약하고 싶어")

  await page.getByRole("button", { name: "물어보기" }).click()
  await expect(page.getByTestId("guide-text")).not.toBeEmpty(AI_WAIT)

  await page.getByRole("button", { name: "설정" }).click()

  await page.getByRole("button", { name: "도움 기록" }).click()

  await expect(page.getByText("아직 도움 기록이 없어요")).toBeVisible()
})
