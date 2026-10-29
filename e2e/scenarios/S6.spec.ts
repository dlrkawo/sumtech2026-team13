import path from "node:path"
import { expect, test, type Page } from "@playwright/test"
import { E2E_USER_EMAIL, E2E_USER_PASSWORD } from "../env"

// ※ 라벨·버튼 이름은 기획 문서(docs/scenarios.yaml) 기준이다. 실제 화면 문구가 정해지면 같이 맞춘다.
//   아이콘 버튼(▶ ■ 마이크 설정)은 접근성 이름(aria-label)을 아래 이름과 같게 둔다.
//   화면은 '화면 사진 올리기'(파일 선택)로 e2e/fixtures/의 모의 화면 사진을 올려 얻는다(공유 선택 창 대신 setInputFiles).
//   AI 응답을 기다리는 확인은 시간을 넉넉히 준다(AI_WAIT).

const AI_WAIT = { timeout: 60_000 }
const fixture = (name: string) => path.join(__dirname, "../fixtures", name)


/**
 * 로그인은 화면으로 한다. 시드 계정은 docker-compose.yml의 SEED_USER_EMAIL·SEED_USER_PASSWORD.
 * 첫 화면(설정 창 형태의 가입/로그인 화면)에서 이메일·비밀번호를 넣고 로그인하면 설정 창이 열린다.
 */
async function logIn(page: Page) {
  await page.goto("/")
  await page.getByLabel("이메일").fill(E2E_USER_EMAIL)
  await page.getByLabel("비밀번호").fill(E2E_USER_PASSWORD)
  await page.getByRole("button", { name: "로그인" }).click()
  await expect(page.getByRole("button", { name: "도움 시작하기" })).toBeVisible()
}

test("S6 송금 화면에서 위험 경고를 본다", async ({ page }) => {
  // 1. 사이트에 접속해 로그인한다
  await logIn(page)

  // 2. 설정 창에서 '도움 시작하기'를 누른다
  await page.getByRole("button", { name: "도움 시작하기" }).click()

  // 3. '화면 사진 올리기'를 눌러 은행 송금 화면 사진을 고른다
  await page.getByLabel("화면 사진 올리기").setInputFiles(fixture("mock-transfer.png"))

  // 4. '질문 입력'에 '친구에게 만원 보내고 싶어'를 적는다
  await page.getByLabel("질문 입력").fill("친구에게 만원 보내고 싶어")

  // 5. '물어보기' 버튼을 누른다
  await page.getByRole("button", { name: "물어보기" }).click()

  // expected: '돈이 나가는 버튼이에요. 한 번 더 확인하세요' 경고가 보인다
  await expect(page.getByText("돈이 나가는 버튼이에요. 한 번 더 확인하세요")).toBeVisible(AI_WAIT)
})
