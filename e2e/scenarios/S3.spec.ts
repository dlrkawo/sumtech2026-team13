import path from "node:path"
import { expect, test } from "@playwright/test"

test("S3: 다음 화면 사진으로 다음 단계 안내를 받는다", async ({ page }) => {
  await page.goto("/")

  // 1. 첫 화면의 '하고 싶은 작업을 입력하세요' 칸에 작업을 입력하고 '다음'을 누른다
  await page.getByLabel("하고 싶은 작업을 입력하세요").fill("병원 예약 방법을 알고 싶어요")
  await page.getByRole("button", { name: "다음" }).click()

  // 2. '화면 사진 올리기'로 예약 시작 화면 사진을 올리고 '현재 화면 분석'을 누른다
  await page
    .getByLabel("화면 사진 올리기")
    .setInputFiles(path.join(__dirname, "../fixtures/mock-step1.png"))
  await page.getByRole("button", { name: "현재 화면 분석" }).click()

  // 3. 첫 안내 문장과 표시 위치를 확인한다
  const guidance = page.getByTestId("guidance-message")
  await expect(guidance).toBeVisible()
  await expect(page.getByTestId("target-screen-highlight")).toBeVisible()
  const firstGuidance = await guidance.innerText()

  // 4. '화면 사진 올리기'를 눌러 다음 단계 화면 사진을 고른다
  await page
    .getByLabel("화면 사진 올리기")
    .setInputFiles(path.join(__dirname, "../fixtures/mock-step2.png"))
  // 5. '다음 화면 분석' 버튼을 누른다
  await page.getByRole("button", { name: "다음 화면 분석" }).click()

  // expected: 첫 안내와 다른 2단계 안내 문장이 보이고, 새로 올린 화면 사진 위에 빨간 테두리가 표시된다
  await expect(guidance).not.toHaveText(firstGuidance)
  await expect(page.getByTestId("target-screen-highlight")).toBeVisible()
})
