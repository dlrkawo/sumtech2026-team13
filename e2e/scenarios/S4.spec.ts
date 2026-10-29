import path from "node:path"
import { expect, test, type Page } from "@playwright/test"
import { E2E_USER_EMAIL, E2E_USER_PASSWORD } from "../env"

// ※ 라벨·버튼 이름은 docs/scenarios.yaml 기준이다. 화면 문구를 바꾸면 이 spec도 같은 커밋에서 고친다.
//   mock-unclear.png는 모의 병원 예약의 '개인정보 입력' 화면('제출' 버튼)이다.
//   경고 문구는 AI가 가리킨 버튼이 제출·결제·삭제 같은 되돌리기 어려운 버튼일 때 앱이 항상 같은 글자로 띄운다.

const AI_WAIT = { timeout: 60_000 }
const fixture = (name: string) => path.join(__dirname, "../fixtures", name)

/** account: 사용자 — 시드 계정(docker-compose.yml의 SEED_USER_*)으로 첫 화면에서 로그인한다. */
async function logIn(page: Page) {
  await page.goto("/")
  await page.getByLabel("이메일").fill(E2E_USER_EMAIL)
  await page.getByLabel("비밀번호").fill(E2E_USER_PASSWORD)
  await page.getByRole("button", { name: "로그인" }).click()
  await expect(page.getByRole("button", { name: "도움 시작하기" })).toBeVisible()
}

test("S4 개인정보 제출 버튼 앞에서 경고를 본다", async ({ page }) => {
  await logIn(page)

  // 1. 설정 창에서 '도움 시작하기'를 누른다
  await page.getByRole("button", { name: "도움 시작하기" }).click()

  // 2. '화면 사진 올리기'를 눌러 개인정보 입력 화면 사진을 고른다
  await page.getByLabel("화면 사진 올리기").setInputFiles(fixture("mock-unclear.png"))

  // 3. '질문 입력'에 '예약 마무리하고 싶어'를 적는다
  await page.getByLabel("질문 입력").fill("예약 마무리하고 싶어")

  // 4. '물어보기' 버튼을 누른다
  await page.getByRole("button", { name: "물어보기" }).click()

  // expected: '되돌리기 어려운 버튼이에요. 누르기 전에 한 번 더 확인하세요' 경고가 보인다
  await expect(
    page.getByText("되돌리기 어려운 버튼이에요. 누르기 전에 한 번 더 확인하세요"),
  ).toBeVisible(AI_WAIT)
})
