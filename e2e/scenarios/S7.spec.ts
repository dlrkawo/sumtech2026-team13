import { expect, test, type Page } from "@playwright/test"
import { E2E_USER_EMAIL, E2E_USER_PASSWORD } from "../env"

// 작은 창(Document Picture-in-Picture)은 버튼 클릭으로 새 창(page)이 열린다.
// 작은 창 안의 요소는 본 창(page)이 아니라 새로 열린 창(pip)으로 찾는다 (trash/tab-share-spike README 결과 4).
// 다른 프로그램 위에 떠 있는지는 자동 테스트로 확인할 수 없어, 창이 열리고 그 안에서 조작되는지까지 확인한다.

async function logIn(page: Page) {
  await page.goto("/")
  await page.getByLabel("이메일").fill(E2E_USER_EMAIL)
  await page.getByLabel("비밀번호").fill(E2E_USER_PASSWORD)
  await page.getByRole("button", { name: "로그인" }).click()
  await expect(page.getByRole("button", { name: "도움 시작하기" })).toBeVisible()
}

test("S7 작은 창으로 띄워 그 안에서 설정을 연다", async ({ page }) => {
  await logIn(page)

  // 1. 설정 창에서 '도움 시작하기'를 누른다
  await page.getByRole("button", { name: "도움 시작하기" }).click()

  // 2. '작은 창으로 띄우기'를 누른다 (새 창이 열리는 것을 기다린다)
  const pipOpened = page.context().waitForEvent("page")
  await page.getByRole("button", { name: "작은 창으로 띄우기" }).click()
  const pip = await pipOpened

  // 3. 작은 창에서 '설정'을 누른다
  await pip.getByRole("button", { name: "설정" }).click()

  // expected: 본 화면에 '작은 창에서 도와드리고 있어요'가 보이고, 작은 창 안에 설정 창과 '도움 시작하기' 버튼이 보인다
  await expect(page.getByText("작은 창에서 도와드리고 있어요")).toBeVisible()
  await expect(pip.getByRole("dialog", { name: "설정" })).toBeVisible()
  await expect(pip.getByRole("button", { name: "도움 시작하기" })).toBeVisible()
})
