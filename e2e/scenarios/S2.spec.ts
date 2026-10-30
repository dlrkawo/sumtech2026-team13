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

// 사용자가 실제로 보는 '사진 올리기'·'사진 바꾸기' 버튼을 눌러 파일 선택 창에서 사진을 고른다.
// 숨은 파일 입력에 직접 넣지 않으므로, 버튼이 화면에 보이지 않으면 여기서 실패한다 (F2)
async function choosePhoto(page: Page, buttonText: "사진 올리기" | "사진 바꾸기", file: string) {
  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.getByText(buttonText, { exact: true }).click(),
  ])
  await chooser.setFiles(fixture(file))
}

test("S2 병원 예약 화면 사진을 올려 묻고 누를 곳 안내를 받는다", async ({ page }) => {
  await logIn(page)

  await page.getByRole("button", { name: "도움 시작하기" }).click()

  await page.getByRole("button", { name: "눌러보슈 도우미 열기" }).click()

  await choosePhoto(page, "사진 올리기", "mock-step1.png")

  await page.getByLabel("질문 입력").fill("병원 예약하고 싶어")

  await page.getByRole("button", { name: "물어보기" }).click()

  await expect(page.getByText("누를 곳을 찾았어요")).toBeVisible(AI_WAIT)
  await expect(page.getByTestId("guide-text")).not.toBeEmpty()
  await expect(page.getByTestId("click-highlight")).toBeVisible()
})
