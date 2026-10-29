import path from "node:path"
import { expect, test } from "@playwright/test"

// ※ 라벨·버튼 이름은 docs/scenarios.yaml 기준이다. 화면 문구를 바꾸면 이 spec도 같은 커밋에서 고친다.
//   시드 계정에는 다른 흐름(S5)이 남긴 기록이 있으므로, 이 흐름은 새로 가입한 계정으로 처음부터 한다.

const AI_WAIT = { timeout: 60_000 }
const fixture = (name: string) => path.join(__dirname, "../fixtures", name)

test("S6 새로 가입해 기록 저장을 끄고 물어보면 기록이 남지 않는다", async ({ page }) => {
  const email = `e2e-s6-${Date.now()}@example.com`

  // 1. 사이트에 접속한다
  await page.goto("/")

  // 2. '가입하기'를 누른다
  await page.getByRole("button", { name: "가입하기" }).click()

  // 3. 이메일과 비밀번호를 입력하고 '가입' 버튼을 누른다
  await page.getByLabel("이메일").fill(email)
  await page.getByLabel("비밀번호").fill("loopthon-2026")
  await page.getByRole("button", { name: "가입", exact: true }).click()

  // 4. 설정 창에서 '기록 저장'을 끈다
  await page.getByRole("switch", { name: "기록 저장" }).uncheck()

  // 5. '도움 시작하기'를 누른다
  await page.getByRole("button", { name: "도움 시작하기" }).click()

  // 6. '화면 사진 올리기'를 눌러 진료과 선택 화면 사진을 고른다
  await page.getByLabel("화면 사진 올리기").setInputFiles(fixture("mock-step1.png"))

  // 7. '질문 입력'에 '병원 예약하고 싶어'를 적는다
  await page.getByLabel("질문 입력").fill("병원 예약하고 싶어")

  // 8. '물어보기' 버튼을 누른다
  await page.getByRole("button", { name: "물어보기" }).click()
  await expect(page.getByTestId("guide-text")).not.toBeEmpty(AI_WAIT)

  // 9. 아이콘 아래 '설정' 버튼을 누른다
  await page.getByRole("button", { name: "설정" }).click()

  // 10. 설정 창에서 '도움 기록'을 누른다
  await page.getByRole("button", { name: "도움 기록" }).click()

  // expected: '도움 기록'에 '아직 도움 기록이 없어요'가 보인다
  await expect(page.getByText("아직 도움 기록이 없어요")).toBeVisible()
})
