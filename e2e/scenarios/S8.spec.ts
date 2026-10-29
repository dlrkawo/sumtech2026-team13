import { expect, test, type Page } from "@playwright/test"
import { E2E_USER_EMAIL, E2E_USER_PASSWORD } from "../env"

// ※ 라벨·버튼 이름은 기획 문서(docs/scenarios.yaml) 기준이다. 실제 화면 문구가 정해지면 같이 맞춘다.
//   아이콘 버튼(마이크)은 접근성 이름(aria-label)을 아래 이름과 같게 둔다.

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

test("S8 마이크로 말한 내용이 글자로 바뀌어 질문 입력에 들어간다", async ({ page }) => {
  // 1. 사이트에 접속해 로그인한다
  await logIn(page)

  // 2. 설정 창에서 '음성 인식'을 켠다
  await page.getByRole("switch", { name: "음성 인식" }).check()

  // 3. '도움 시작하기'를 누른다
  await page.getByRole("button", { name: "도움 시작하기" }).click()

  // 4. '마이크' 버튼을 누른다 → 마이크가 켜진다
  await page.getByRole("button", { name: "마이크" }).click()
  await expect(page.getByText("듣고 있어요")).toBeVisible()

  // 5. '친구에게 만원 보내고 싶어'라고 말한다
  // ※ 확인 필요: 자동 테스트 브라우저에는 실제 마이크가 없어 말하는 동작을 화면 조작으로 옮길 수 없다.
  //   개발 팀과 방법을 정하기 전까지 이 단계는 비워 두며, 그래서 아래 확인은 실패한다(건너뛰지 않음).

  // expected: 말한 내용이 글자로 바뀌어 '질문 입력'에 '친구에게 만원 보내고 싶어'가 적힌다
  await expect(page.getByLabel("질문 입력")).toHaveValue("친구에게 만원 보내고 싶어", { timeout: 30_000 })
})
