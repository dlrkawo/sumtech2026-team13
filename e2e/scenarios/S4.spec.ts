import { expect, test, type Page } from "@playwright/test"
import { E2E_USER_EMAIL, E2E_USER_PASSWORD } from "../env"

// ※ 라벨·버튼 이름은 기획 문서(docs/scenarios.yaml) 기준이다. 실제 화면 문구가 정해지면 같이 맞춘다.
//   아이콘 버튼(▶ ■ 마이크 설정)은 접근성 이름(aria-label)을 아래 이름과 같게 둔다.
//   AI 응답을 기다리는 확인은 시간을 넉넉히 준다(AI_WAIT).

const AI_WAIT = { timeout: 60_000 }

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

test("S4 하고 싶은 일을 물어보고 누를 곳 안내를 받는다", async ({ page }) => {
  // 1. 사이트에 접속해 로그인한다
  await logIn(page)

  // 2. 설정 창에서 '도움 시작하기'를 누른다
  await page.getByRole("button", { name: "도움 시작하기" }).click()

  // 3. '▶' 버튼을 누른다
  // ※ 확인 필요: 화면공유 선택 창은 자동 테스트에서 고를 수 없다(개발 팀과 확인)
  await page.getByRole("button", { name: "▶" }).click()

  // 4. (확인 필요) 질문 입력 방법 — 예: 아이콘을 눌러 입력창을 열고 '친구에게 만원 보내고 싶어'를 적는다
  await page.getByLabel("질문 입력").fill("친구에게 만원 보내고 싶어")

  // 5. '물어보기' 버튼을 누른다
  await page.getByRole("button", { name: "물어보기" }).click()

  // expected: '답변 중' 아이콘이 보이고, 안내 문장과 누를 곳 표시가 나타난다
  await expect(page.getByRole("img", { name: "답변 중" })).toBeVisible(AI_WAIT)
  await expect(page.getByTestId("guide-text")).not.toBeEmpty(AI_WAIT)
  await expect(page.getByTestId("click-highlight")).toBeVisible(AI_WAIT)
})
