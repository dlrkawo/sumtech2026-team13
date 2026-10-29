import path from "node:path"
import { expect, test } from "@playwright/test"

test("S4: 완료 문구가 있는 화면에서 완료를 확인한다", async ({ page }) => {
  await page.goto("/")

  // 1. 첫 화면의 '하고 싶은 작업을 입력하세요' 칸에 작업을 입력하고 '다음'을 누른다
  await page.getByLabel("하고 싶은 작업을 입력하세요").fill("병원 예약 신청이 끝났는지 확인하고 싶어요")
  await page.getByRole("button", { name: "다음" }).click()

  // 2. '화면 사진 올리기'를 눌러 '신청이 완료되었습니다' 문구가 있는 화면 사진을 고른다
  await page
    .getByLabel("화면 사진 올리기")
    .setInputFiles(path.join(__dirname, "../fixtures/mock-done.png"))
  // 3. '현재 화면 분석' 버튼을 누른다
  await page.getByRole("button", { name: "현재 화면 분석" }).click()

  // expected: '화면에서 완료 상태를 확인했어요'가 보인다
  await expect(page.getByText("화면에서 완료 상태를 확인했어요")).toBeVisible()
})
