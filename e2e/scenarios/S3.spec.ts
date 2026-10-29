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

test("S3 화면 보기를 시작하고 멈춘다", async ({ page }) => {
  // 1. 사이트에 접속해 로그인한다
  await logIn(page)

  // 2. 설정 창에서 '도움 시작하기'를 누른다
  await page.getByRole("button", { name: "도움 시작하기" }).click()

  // 3. '▶' 버튼을 누른다
  // ※ 확인 필요: ▶는 브라우저 화면공유 선택 창을 연다. 채점기의 자동 테스트 브라우저는 이 창을 고를 수 없다(개발 팀과 확인)
  await page.getByRole("button", { name: "▶" }).click()

  // 4. '■' 버튼을 누른다
  await page.getByRole("button", { name: "■" }).click()

  // expected: '멈춤' 상태가 표시되고 다시 '▶' 버튼이 보인다
  await expect(page.getByText("멈춤")).toBeVisible()
  await expect(page.getByRole("button", { name: "▶" })).toBeVisible()
})
