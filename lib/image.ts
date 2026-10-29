import {
  ACCEPTED_IMAGE_TYPES,
  JPEG_QUALITY,
  MAX_IMAGE_DATA_URL_LENGTH,
  MAX_IMAGE_WIDTH,
} from "./constants";

// 화면 이미지를 BE로 보낼 data URL로 바꾼다 (API_CONVENTION.md 2번).
// 화면 공유 캡처와 "화면 사진 올리기"가 모두 이 파일을 거쳐 같은 형식으로 보낸다.
// 브라우저 전용(canvas 사용)이므로 클라이언트 컴포넌트에서만 부른다.

// code는 BE 에러 코드와 같게 둬서 화면에서 한 가지 방식으로 처리한다
export class ImageError extends Error {
  constructor(
    public code: "IMAGE_INVALID" | "IMAGE_TOO_LARGE",
    message: string,
  ) {
    super(message);
    this.name = "ImageError";
  }
}

function drawToDataUrl(source: CanvasImageSource, width: number, height: number): string {
  const scale = Math.min(1, MAX_IMAGE_WIDTH / width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new ImageError("IMAGE_INVALID", "이 브라우저에서는 화면 사진을 처리할 수 없어요.");
  // 투명한 PNG가 JPEG로 바뀔 때 검게 칠해지지 않도록 흰 바탕을 먼저 깐다
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  if (dataUrl.length > MAX_IMAGE_DATA_URL_LENGTH) {
    throw new ImageError("IMAGE_TOO_LARGE", "사진이 너무 커요. 화면 일부만 찍어서 다시 올려 주세요.");
  }
  return dataUrl;
}

// "화면 사진 올리기"로 고른 파일 → data URL
export async function fileToDataUrl(file: File): Promise<string> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new ImageError("IMAGE_INVALID", "사진 파일(JPG, PNG, WEBP)만 올릴 수 있어요.");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new ImageError("IMAGE_INVALID", "사진을 열 수 없어요. 다른 사진을 골라 주세요.");
  }
  try {
    return drawToDataUrl(bitmap, bitmap.width, bitmap.height);
  } finally {
    bitmap.close();
  }
}

// 화면 공유 영상의 지금 장면 → data URL
export function videoFrameToDataUrl(video: HTMLVideoElement): string {
  if (!video.videoWidth || !video.videoHeight) {
    throw new ImageError("IMAGE_INVALID", "공유 중인 화면이 아직 준비되지 않았어요. 잠시 후 다시 눌러 주세요.");
  }
  return drawToDataUrl(video, video.videoWidth, video.videoHeight);
}
