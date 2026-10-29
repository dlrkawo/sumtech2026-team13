import path from "node:path"
import { expect, test, type Page } from "@playwright/test"
import { E2E_USER_EMAIL, E2E_USER_PASSWORD } from "../env"

// ※ 라벨·버튼 이름은 docs/scenarios.yaml 기준이다. 화면 문구를 바꾸면 이 spec도 같은 커밋에서 고친다.

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

test("S5 지난 도움 기록을 다시 본다", async ({ page }) => {
  await logIn(page)

  // 1. 설정 창에서 '도움 시작하기'를 누른다
  await page.getByRole("button", { name: "도움 시작하기" }).click()

  // 2. '화면 사진 올리기'를 눌러 진료과 선택 화면 사진을 고른다
  await page.getByLabel("화면 사진 올리기").setInputFiles(fixture("mock-step1.png"))

  // 3. '질문 입력'에 '병원 예약하고 싶어'를 적는다
  await page.getByLabel("질문 입력").fill("병원 예약하고 싶어")

  // 4. '물어보기' 버튼을 누른다
  await page.getByRole("button", { name: "물어보기" }).click()
  await expect(page.getByTestId("guide-text")).not.toBeEmpty(AI_WAIT)

  // 5. 아이콘 아래 '설정' 버튼을 누른다
  await page.getByRole("button", { name: "설정" }).click()

  // 6. 설정 창에서 '도움 기록'을 누른다
  await page.getByRole("button", { name: "도움 기록" }).click()

  // expected: '도움 기록' 목록에 '병원 예약하고 싶어'가 보인다
  await expect(page.getByRole("listitem").filter({ hasText: "병원 예약하고 싶어" }).first()).toBeVisible()
})
