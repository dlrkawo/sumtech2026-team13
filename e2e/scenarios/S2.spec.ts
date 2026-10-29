import { expect, test } from "@playwright/test"
import { E2E_USER_EMAIL, E2E_USER_PASSWORD } from "../env"

// ※ 라벨·버튼 이름은 기획 문서(docs/scenarios.yaml) 기준이다. 실제 화면 문구가 정해지면 같이 맞춘다.
//   아이콘 버튼(▶ 설정)은 접근성 이름(aria-label)을 아래 이름과 같게 둔다.

test("S2 로그인하고 도움을 시작한다", async ({ page }) => {
  // 1. 사이트에 접속한다
  await page.goto("/")

  // 2. 이메일과 비밀번호를 입력한다
  await page.getByLabel("이메일").fill(E2E_USER_EMAIL)
  await page.getByLabel("비밀번호").fill(E2E_USER_PASSWORD)

  // 3. '로그인' 버튼을 누른다
  await page.getByRole("button", { name: "로그인" }).click()

  // 4. 설정 창에서 '도움 시작하기'를 누른다
  await page.getByRole("button", { name: "도움 시작하기" }).click()

  // expected: 설정 창이 사라지고 아이콘 모드에서 '▶' 버튼과 '설정' 버튼이 보인다
  await expect(page.getByRole("button", { name: "도움 시작하기" })).toBeHidden()
  await expect(page.getByRole("button", { name: "▶" })).toBeVisible()
  await expect(page.getByRole("button", { name: "설정" })).toBeVisible()
})
