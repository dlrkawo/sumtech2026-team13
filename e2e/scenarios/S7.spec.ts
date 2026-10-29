import { expect, test, type Page } from "@playwright/test"
import { E2E_USER_EMAIL, E2E_USER_PASSWORD } from "../env"

async function logIn(page: Page) {
  await page.goto("/")
  await page.getByLabel("이메일").fill(E2E_USER_EMAIL)
  await page.getByLabel("비밀번호").fill(E2E_USER_PASSWORD)
  await page.getByRole("button", { name: "로그인" }).click()
  await expect(page.getByRole("button", { name: "도움 시작하기" })).toBeVisible()
}

// AI를 부르지 않는 흐름이다. 작은 창(Document Picture-in-Picture)은 버튼 클릭으로 새 창(page)이 되어 열리므로
// 작은 창 안의 버튼은 page가 아니라 pip에서 찾는다. 다른 프로그램 위에 떠 있는지는 자동 테스트로 확인할 수 없다
test("S7 도우미를 작은 창으로 띄웠다가 원래 화면으로 돌아온다", async ({ page }) => {
  await logIn(page)

  await page.getByRole("button", { name: "도움 시작하기" }).click()

  const [pip] = await Promise.all([
    page.context().waitForEvent("page"),
    page.getByRole("button", { name: "작은 창으로 띄우기" }).click(),
  ])
  await expect(page.getByText("작은 창에서 도와드리고 있어요")).toBeVisible()

  // 말풍선이 처음엔 닫혀 있어 ▶는 '곁길 도우미 열기'를 누른 뒤에 보인다
  await pip.getByRole("button", { name: "곁길 도우미 열기" }).click()

  await expect(pip.getByRole("button", { name: "▶" })).toBeVisible()
  await expect(pip.getByRole("button", { name: "설정" })).toBeVisible()

  await Promise.all([
    pip.waitForEvent("close"),
    page.getByRole("button", { name: "이 화면으로 돌아오기" }).click(),
  ])

  expect(pip.isClosed()).toBe(true)
  await expect(page.getByText("작은 창에서 도와드리고 있어요")).toBeHidden()
  await expect(page.getByRole("button", { name: "작은 창으로 띄우기" })).toBeVisible()
})
