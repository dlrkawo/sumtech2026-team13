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

test("S4 개인정보 제출 버튼 앞에서 경고를 본다", async ({ page }) => {
  await logIn(page)

  await page.getByRole("button", { name: "도움 시작하기" }).click()

  await page.getByRole("button", { name: "곁길 도우미 열기" }).click()

  await choosePhoto(page, "사진 올리기", "mock-unclear.png")

  await page.getByLabel("질문 입력").fill("예약 마무리하고 싶어")

  await page.getByRole("button", { name: "물어보기" }).click()

  await expect(
    page.getByText("되돌리기 어려운 버튼이에요. 누르기 전에 한 번 더 확인하세요"),
  ).toBeVisible(AI_WAIT)
})
