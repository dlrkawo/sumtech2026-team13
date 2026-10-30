// 직접 확인한 고정 PNG(1280×800)의 파란 버튼: half-open x=900..1161, y=680..751.
// mock 응답을 읽지 않고 이미지 픽셀에 고정한 oracle이다.
export const FIXTURE_BUTTON = { x: 900 / 1280, y: 680 / 800, width: 261 / 1280, height: 71 / 800 };
export interface Box { x: number; y: number; width: number; height: number }

export function matchesFixtureButton(actual: Box): boolean {
  const expected = FIXTURE_BUTTON;
  if (!Object.values(actual).every(Number.isFinite) || actual.width <= 0 || actual.height <= 0) return false;
  const cx = actual.x + actual.width / 2;
  const cy = actual.y + actual.height / 2;
  if (cx < expected.x || cx > expected.x + expected.width || cy < expected.y || cy > expected.y + expected.height) return false;
  const intersection = Math.max(0, Math.min(actual.x + actual.width, expected.x + expected.width) - Math.max(actual.x, expected.x))
    * Math.max(0, Math.min(actual.y + actual.height, expected.y + expected.height) - Math.max(actual.y, expected.y));
  const union = actual.width * actual.height + expected.width * expected.height - intersection;
  // 실제 버튼과 60% 이상 IoU. 화면 전체·다른 버튼·텍스트 한 글자만 감싸는 오답은 통과하지 못한다.
  return intersection / union >= 0.6;
}
