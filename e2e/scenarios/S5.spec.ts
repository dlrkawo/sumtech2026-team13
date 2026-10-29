import { expect, test, type Page } from "@playwright/test"
import { E2E_USER_EMAIL, E2E_USER_PASSWORD } from "../env"

// ※ 라벨·버튼 이름은 기획 문서(docs/scenarios.yaml) 기준이다. 실제 화면 문구가 정해지면 같이 맞춘다.
//   아이콘 버튼(▶ ■ 마이크 설정)은 접근성 이름(aria-label)을 아래 이름과 같게 둔다.
//   AI 응답을 기다리는 확인은 시간을 넉넉히 준다(AI_WAIT).

/**
 * 로그인은 화면으로 한다. 시드 계정은 docker-compose.yml의 SEED_USER_EMAIL·SEED_USER_PASSWORD.
 * 첫 화면(설정 창 형태의 가입/로그인 화면)에서 이메일·비밀번호를 넣고 로그인하면 설정 창이 열린다.
 */
async function logIn(page: Page) {
  await page.goto("/")
  await page.getByLabel("이메일").fill(E2E_USER_EMAIL)
  await page.getByLabel("비밀번호").fill(E2E_USER_PASSWORD)
  await page.getByRole("button", { name: "로그인" }).click()
  await expect(page.getByRole("button", { name: "도움 시작하기" })).toBeVisible()
}

test("S5 설정 창으로 돌아가 설정을 바꾸고 다시 도움을 시작한다", async ({ page }) => {
  // 1. 사이트에 접속해 로그인한다
  await logIn(page)

  // 2. 설정 창에서 '도움 시작하기'를 누른다
  await page.getByRole("button", { name: "도움 시작하기" }).click()

  // 3. 아이콘 아래 '설정' 버튼을 누른다
  await page.getByRole("button", { name: "설정" }).click()

  // 4. '화면 가장자리 표시'를 끈다
  await page.getByRole("switch", { name: "화면 가장자리 표시" }).uncheck()

  // 5. '도움 시작하기'를 누른다
  await page.getByRole("button", { name: "도움 시작하기" }).click()

  // expected: 아이콘 모드로 돌아오고, 다시 설정 창을 열면 '화면 가장자리 표시'가 꺼져 있다
  await expect(page.getByRole("button", { name: "▶" })).toBeVisible()
  await page.getByRole("button", { name: "설정" }).click()
  await expect(page.getByRole("switch", { name: "화면 가장자리 표시" })).not.toBeChecked()
})
