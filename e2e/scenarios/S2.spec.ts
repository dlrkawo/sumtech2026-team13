import path from "node:path"
import { expect, test } from "@playwright/test"

test("S2: 현재 화면 사진으로 첫 안내를 받는다", async ({ page }) => {
  await page.goto("/")

  // 1. 첫 화면의 '하고 싶은 작업을 입력하세요' 칸에 작업을 입력하고 '다음'을 누른다
  await page.getByLabel("하고 싶은 작업을 입력하세요").fill("병원 예약 방법을 알고 싶어요")
  await page.getByRole("button", { name: "다음" }).click()

  // 2. '화면 사진 올리기'를 눌러 예약 시작 화면 사진을 고른다
  await page
    .getByLabel("화면 사진 올리기")
    .setInputFiles(path.join(__dirname, "../fixtures/mock-step1.png"))
  // 3. '현재 화면 분석' 버튼을 누른다
  await page.getByRole("button", { name: "현재 화면 분석" }).click()

  // expected: '화면을 분석하고 있어요' 상태 뒤에 한 단계 안내 문장이 보이고,
  // 올린 화면 사진 위에 눌러야 할 위치가 빨간 테두리로 표시된다
  await expect(page.getByText("화면을 분석하고 있어요")).toBeVisible()
  await expect(page.getByTestId("guidance-message")).toBeVisible()
  await expect(page.getByTestId("target-screen-highlight")).toBeVisible()
})
