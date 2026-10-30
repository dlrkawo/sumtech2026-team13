import { expect, type Page } from "@playwright/test";
import { matchesFixtureButton } from "./fixture-target";

export async function expectFixtureButtonHighlight(page: Page) {
  const highlight = page.getByTestId("click-highlight");
  await expect(highlight).toBeVisible();
  // 실제 렌더링된 박스를 이미지 영역 기준 비율로 환산한다. CSS 수치만 읽지 않는다.
  const image = page.getByRole("img", { name: "물어볼 때 본 화면", exact: true });
  await expect(image).toBeVisible();
  await expect.poll(async () => {
    const [h, i] = await Promise.all([highlight.boundingBox(), image.boundingBox()]);
    if (!h || !i || !i.width || !i.height) return false;
    return matchesFixtureButton({ x: (h.x - i.x) / i.width, y: (h.y - i.y) / i.height, width: h.width / i.width, height: h.height / i.height });
  }, { message: "빨간 표시가 고정 사진의 실제 파란 버튼(x900–1161, y680–751)을 감싸야 합니다" }).toBe(true);
}
