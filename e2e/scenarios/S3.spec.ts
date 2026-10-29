import path from "node:path"
import { expect, test, type Page } from "@playwright/test"
import { E2E_USER_EMAIL, E2E_USER_PASSWORD } from "../env"

const AI_WAIT = { timeout: 60_000 }
const fixture = (name: string) => path.join(__dirname, "../fixtures", name)

async function logIn(page: Page) {
  await page.goto("/")
  await page.getByLabel("이메일").fill(E2E_USER_EMAIL)
  await page.getByLabel("비밀번호").fill(E2E_USER_PASSWORD)
  await page.getByRole("button", { name: "로그인" }).click()
  await expect(page.getByRole("button", { name: "도움 시작하기" })).toBeVisible()
}

// 사용자가 실제로 보는 '사진 올리기'·'사진 바꾸기' 버튼을 눌러 파일 선택 창에서 사진을 고른다.
// 숨은 파일 입력에 직접 넣지 않으므로, 버튼이 화면에 보이지 않으면 여기서 실패한다 (F2)
async function choosePhoto(page: Page, buttonText: "사진 올리기" | "사진 바꾸기", file: string) {
  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.getByText(buttonText, { exact: true }).click(),
  ])
  await chooser.setFiles(fixture(file))
}

async function askNext(page: Page) {
  await page.getByRole("button", { name: "눌렀어요, 다음 알려 주세요" }).click()
  await expect(page.getByText("화면을 보고 답을 찾고 있어요")).toBeVisible()
  await expect(page.getByText("화면을 보고 답을 찾고 있어요")).toBeHidden(AI_WAIT)
}

test("S3 다음 화면으로 이어서 예약 완료까지 안내를 받는다", async ({ page }) => {
  await logIn(page)

  await page.getByRole("button", { name: "도움 시작하기" }).click()

  await page.getByRole("button", { name: "눌러보슈 도우미 열기" }).click()

  await choosePhoto(page, "사진 올리기", "mock-step1.png")

  await page.getByLabel("질문 입력").fill("병원 예약하고 싶어")

  await page.getByRole("button", { name: "물어보기" }).click()
  await expect(page.getByText("누를 곳을 찾았어요")).toBeVisible(AI_WAIT)
  // 입력 출처: 사진으로 묻고 있음을 말풍선 맨 위에 보여 준다 (#78)
  await expect(page.getByText("올린 사진으로 물어봐요")).toBeVisible()

  // 사진을 바꾸지 않고 '다음'을 누르면 옛 화면을 다음 화면처럼 보내지 않도록 요청 없이 안내만 한다 (#78, AI 호출 없음)
  let guideRequests = 0
  page.on("request", (req) => {
    if (req.method() === "POST" && new URL(req.url()).pathname === "/api/guides") guideRequests += 1
  })
  await page.getByRole("button", { name: "눌렀어요, 다음 알려 주세요" }).click()
  await expect(page.getByText("바뀐 화면을 '사진 바꾸기'로 올린 뒤 다시 눌러 주세요.")).toBeVisible()
  expect(guideRequests).toBe(0)

  await choosePhoto(page, "사진 바꾸기", "mock-step2.png")

  await askNext(page)

  await expect(page.getByText("누를 곳을 찾았어요")).toBeVisible()
  // 새 사진으로 이어 물었으므로 단계가 하나 올라간다
  await expect(page.getByText("2단계", { exact: true })).toBeVisible()
  await expect(page.getByTestId("click-highlight")).toBeVisible()

  await choosePhoto(page, "사진 바꾸기", "mock-done.png")

  await askNext(page)

  await expect(page.getByText("다 됐어요")).toBeVisible()
})
