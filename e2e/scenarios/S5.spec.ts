import path from "node:path"
import { expect, test } from "@playwright/test"

test("S5: 완료 문구가 없는 화면에서는 완료를 단정하지 않는다", async ({ page }) => {
  await page.goto("/")

  // 1. 첫 화면의 '하고 싶은 작업을 입력하세요' 칸에 작업을 입력하고 '다음'을 누른다
  await page.getByLabel("하고 싶은 작업을 입력하세요").fill("개인정보 입력을 다 했는지 확인하고 싶어요")
  await page.getByRole("button", { name: "다음" }).click()

  // 2. '화면 사진 올리기'를 눌러 완료 문구가 없는 화면 사진을 고른다
  await page
    .getByLabel("화면 사진 올리기")
    .setInputFiles(path.join(__dirname, "../fixtures/mock-unclear.png"))
  // 3. '현재 화면 분석' 버튼을 누른다
  await page.getByRole("button", { name: "현재 화면 분석" }).click()

  // expected: '완료 여부를 확인할 수 없어요. 화면을 직접 확인해 주세요'가 보인다
  await expect(page.getByText("완료 여부를 확인할 수 없어요. 화면을 직접 확인해 주세요")).toBeVisible()
})
