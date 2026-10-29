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

// 다른 흐름이 남긴 기록에 기대지 않도록 매번 새 계정으로 가입해, 이번 요청으로 생긴 기록만 확인한다
test("S5 새로 가입해 물어본 뒤 도움 기록에서 이번 질문과 안내를 다시 본다", async ({ page }) => {
  const email = `e2e-s5-${Date.now()}@example.com`

  await page.goto("/")

  await page.getByRole("button", { name: "가입하기" }).click()

  await page.getByLabel("이메일").fill(email)
  await page.getByLabel("비밀번호").fill("loopthon-2026")
  await page.getByRole("button", { name: "가입", exact: true }).click()

  await page.getByRole("button", { name: "도움 시작하기" }).click()

  await page.getByRole("button", { name: "눌러보슈 도우미 열기" }).click()

  await choosePhoto(page, "사진 올리기", "mock-step1.png")

  await page.getByLabel("질문 입력").fill("병원 예약하고 싶어")

  await page.getByRole("button", { name: "물어보기" }).click()
  const guideText = page.getByTestId("guide-text")
  await expect(guideText).not.toBeEmpty(AI_WAIT)
  const instruction = ((await guideText.textContent()) ?? "").trim()
  expect(instruction).not.toBe("")

  await page.getByRole("button", { name: "설정" }).click()

  await page.getByRole("button", { name: "도움 기록" }).click()

  // 새 계정이라 이번 요청으로 생긴 항목 하나만 있어야 한다
  const items = page.getByRole("listitem")
  await expect(items).toHaveCount(1)
  await expect(items.first()).toContainText("병원 예약하고 싶어")
  await expect(items.first()).toContainText(instruction)
})
