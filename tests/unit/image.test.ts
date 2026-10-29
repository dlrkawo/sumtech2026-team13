import { describe, expect, it } from "vitest";

import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_DATA_URL_LENGTH } from "@/lib/constants";
import { ImageError, fileToDataUrl, videoFrameToDataUrl } from "@/lib/image";
import { MAX_IMAGE_DATA_URL_LENGTH as SERVER_MAX_IMAGE_DATA_URL_LENGTH } from "@/server/guide/schema";

// 화면 이미지 → data URL 규칙 (API_CONVENTION.md 2번). canvas가 필요한 성공 경로는 브라우저(E2E)에서만 확인하고,
// 여기서는 canvas에 닿기 전에 걸러지는 입력과 FE·BE 상수 일치만 본다
describe("lib/image", () => {
  it("FE가 보내기 전에 막는 크기 한도는 BE 한도와 같다", () => {
    expect(MAX_IMAGE_DATA_URL_LENGTH).toBe(SERVER_MAX_IMAGE_DATA_URL_LENGTH);
  });

  it("허용 형식은 JPG·PNG·WEBP 셋", () => {
    expect(ACCEPTED_IMAGE_TYPES).toEqual(["image/jpeg", "image/png", "image/webp"]);
  });

  it("허용하지 않는 파일 형식은 IMAGE_INVALID로 거른다", async () => {
    const file = new File(["x"], "memo.pdf", { type: "application/pdf" });
    await expect(fileToDataUrl(file)).rejects.toMatchObject({ name: "ImageError", code: "IMAGE_INVALID" });
  });

  it("공유 영상의 첫 장면이 아직 없으면(크기 0) IMAGE_INVALID", () => {
    const notReady = { videoWidth: 0, videoHeight: 0 } as unknown as HTMLVideoElement;
    expect(() => videoFrameToDataUrl(notReady)).toThrow(ImageError);
    expect(() => videoFrameToDataUrl(notReady)).toThrow(/준비되지 않았어요/);
  });

  it("ImageError는 BE 오류 코드와 같은 code를 가진다", () => {
    const e = new ImageError("IMAGE_TOO_LARGE", "사진이 너무 커요.");
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("ImageError");
    expect(e.code).toBe("IMAGE_TOO_LARGE");
  });
});
