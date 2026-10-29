import path from "node:path"
import { expect, test, type Page } from "@playwright/test"
import { E2E_USER_EMAIL, E2E_USER_PASSWORD } from "../env"

// ※ 라벨·버튼 이름은 docs/scenarios.yaml 기준이다. 화면 문구를 바꾸면 이 spec도 같은 커밋에서 고친다.
//   '다음 화면 보기'도 '화면 사진 올리기'처럼 파일 선택으로 다음 화면 사진을 올린다(setInputFiles).

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

test("S3 다음 화면으로 이어서 예약 완료까지 안내를 받는다", async ({ page }) => {
  await logIn(page)

  // 1. 설정 창에서 '도움 시작하기'를 누른다
  await page.getByRole("button", { name: "도움 시작하기" }).click()

  // 2. '화면 사진 올리기'를 눌러 진료과 선택 화면 사진을 고른다
  await page.getByLabel("화면 사진 올리기").setInputFiles(fixture("mock-step1.png"))

  // 3. '질문 입력'에 '병원 예약하고 싶어'를 적는다
  await page.getByLabel("질문 입력").fill("병원 예약하고 싶어")

  // 4. '물어보기' 버튼을 누른다
  await page.getByRole("button", { name: "물어보기" }).click()
  await expect(page.getByText("1단계").first()).toBeVisible(AI_WAIT)

  // 5. '다음 화면 보기'를 눌러 예약 날짜 선택 화면 사진을 고른다
  await page.getByLabel("다음 화면 보기").setInputFiles(fixture("mock-step2.png"))

  // expected(앞부분): 예약 날짜 선택 화면 사진에는 '2단계' 안내가 보인다
  await expect(page.getByText("2단계").first()).toBeVisible(AI_WAIT)

  // 6. '다음 화면 보기'를 눌러 접수 결과 화면 사진을 고른다
  await page.getByLabel("다음 화면 보기").setInputFiles(fixture("mock-done.png"))

  // expected: 접수 결과 화면 사진을 올리면 '다 끝났어요' 안내가 보인다
  await expect(page.getByText("다 끝났어요").first()).toBeVisible(AI_WAIT)
})
