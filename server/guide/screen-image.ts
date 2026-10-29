import "server-only";

import { AppError } from "../errors";
import { IMAGE_DATA_URL_PATTERN, MAX_IMAGE_DATA_URL_LENGTH } from "./schema";

// 화면 이미지 data URL의 형식·크기를 검사하고 원본 가로·세로를 읽는다 (API_CONVENTION 2번 「화면 이미지 보내기」).
// 크기를 알아야 AI에게 픽셀 기준으로 묻고, 받은 좌표를 0~1 비율로 바꿀 수 있다.
// 이미지 라이브러리 없이 파일 머리(헤더)만 읽는다.

export interface ScreenImage {
  mimeType: string;
  width: number;
  height: number;
}

const imageErrors = {
  invalid: () => new AppError(400, "IMAGE_INVALID", "사진을 열 수 없어요. 사진 파일(JPG, PNG, WEBP)을 다시 골라 주세요."),
  tooLarge: () => new AppError(400, "IMAGE_TOO_LARGE", "사진이 너무 커요. 화면 일부만 찍어서 다시 올려 주세요."),
};

export function readScreenImage(dataUrl: string): ScreenImage {
  if (dataUrl.length > MAX_IMAGE_DATA_URL_LENGTH) throw imageErrors.tooLarge();
  if (!IMAGE_DATA_URL_PATTERN.test(dataUrl)) throw imageErrors.invalid();

  const mimeType = dataUrl.slice("data:".length, dataUrl.indexOf(";"));
  const bytes = Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");
  const size =
    mimeType === "image/png" ? readPngSize(bytes) : mimeType === "image/jpeg" ? readJpegSize(bytes) : readWebpSize(bytes);
  if (!size || size.width <= 0 || size.height <= 0) throw imageErrors.invalid();
  return { mimeType, ...size };
}

type Size = { width: number; height: number };

function readPngSize(b: Buffer): Size | null {
  // 8바이트 시그니처 뒤 IHDR 청크에 가로·세로가 있다
  if (b.length < 24 || b.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

function readJpegSize(b: Buffer): Size | null {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < b.length) {
    if (b[offset] !== 0xff) return null;
    const marker = b[offset + 1];
    // 채움 바이트(0xFF 연속)는 건너뛴다
    if (marker === 0xff) {
      offset += 1;
      continue;
    }
    // SOF0~SOF15 중 크기를 담은 마커 (DHT·JPG·DAC 제외)
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: b.readUInt16BE(offset + 5), width: b.readUInt16BE(offset + 7) };
    }
    offset += 2 + b.readUInt16BE(offset + 2);
  }
  return null;
}

function readWebpSize(b: Buffer): Size | null {
  if (b.length < 30 || b.toString("ascii", 0, 4) !== "RIFF" || b.toString("ascii", 8, 12) !== "WEBP") return null;
  const chunk = b.toString("ascii", 12, 16);
  if (chunk === "VP8 ") {
    return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
  }
  if (chunk === "VP8L") {
    const bits = b.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === "VP8X") {
    return { width: b.readUIntLE(24, 3) + 1, height: b.readUIntLE(27, 3) + 1 };
  }
  return null;
}
