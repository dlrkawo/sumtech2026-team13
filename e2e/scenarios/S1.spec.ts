import { expect, test } from "@playwright/test"

test("S1: 도움받을 작업을 입력한다", async ({ page }) => {
  await page.goto("/")

  // 1. 첫 화면의 '하고 싶은 작업을 입력하세요' 칸에 작업을 입력한다
  await page.getByLabel("하고 싶은 작업을 입력하세요").fill("병원 예약 방법을 알고 싶어요")
  // 2. '다음' 버튼을 누른다
  await page.getByRole("button", { name: "다음" }).click()

  // expected: 입력한 작업 요약과 '화면을 공유해 주세요' 안내가 보인다
  await expect(page.getByText("병원 예약 방법을 알고 싶어요")).toBeVisible()
  await expect(page.getByText("화면을 공유해 주세요")).toBeVisible()
})
