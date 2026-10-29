import { describe, expect, it } from "vitest";

import { MAX_PREVIOUS_INSTRUCTIONS, MAX_PREVIOUS_INSTRUCTION_LENGTH, guideRequestSchema } from "@/server/guide/schema";

// POST /api/guides 요청 검증 (server/guide/schema.ts). 실패 문구는 화면에 그대로 보이므로 한국어여야 한다
const IMAGE = "data:image/jpeg;base64,/9j/4AAQ";

function firstMessage(input: unknown): string | undefined {
  const r = guideRequestSchema.safeParse(input);
  return r.success ? undefined : r.error.issues[0]?.message;
}

describe("guideRequestSchema", () => {
  it("사진과 질문만 있으면 통과하고 질문 앞뒤 공백은 지운다", () => {
    const r = guideRequestSchema.safeParse({ image: IMAGE, question: "  병원 예약하고 싶어  " });
    expect(r.success).toBe(true);
    expect(r.success && r.data.question).toBe("병원 예약하고 싶어");
  });

  it("사진이 없으면 한국어 문구로 거절", () => {
    expect(firstMessage({ question: "병원 예약" })).toBe("화면 사진이 필요해요.");
    expect(firstMessage({ image: "", question: "병원 예약" })).toBe("화면 사진이 필요해요.");
  });

  it("질문이 비었거나 200자를 넘으면 거절", () => {
    expect(firstMessage({ image: IMAGE, question: "   " })).toBe("하고 싶은 일을 적어 주세요.");
    expect(firstMessage({ image: IMAGE, question: "가".repeat(201) })).toBe("200자 안으로 적어 주세요.");
    expect(guideRequestSchema.safeParse({ image: IMAGE, question: "가".repeat(200) }).success).toBe(true);
  });

  it("본문이 객체가 아니면 한국어 공통 문구", () => {
    expect(firstMessage(null)).toBe("요청 형식이 올바르지 않아요.");
    expect(firstMessage([])).toBe("요청 형식이 올바르지 않아요.");
  });

  it("바로 전 안내는 300자까지만 쓰고(오류 아님), 2000자를 넘으면 거절", () => {
    const long = "가".repeat(500);
    const r = guideRequestSchema.safeParse({ image: IMAGE, question: "q", previousInstruction: long });
    expect(r.success && r.data.previousInstruction?.length).toBe(MAX_PREVIOUS_INSTRUCTION_LENGTH);
    expect(firstMessage({ image: IMAGE, question: "q", previousInstruction: "가".repeat(2001) })).toBe(
      "바로 전 안내가 너무 길어요. 새로 물어봐 주세요.",
    );
  });

  it("지난 안내 목록은 빈 줄을 빼고 최근 5개만 남긴다", () => {
    const list = ["1", "", "2", "3", "  ", "4", "5", "6", "7"];
    const r = guideRequestSchema.safeParse({ image: IMAGE, question: "q", previousInstructions: list });
    expect(r.success && r.data.previousInstructions).toEqual(["3", "4", "5", "6", "7"]);
    expect(MAX_PREVIOUS_INSTRUCTIONS).toBe(5);
  });

  it("지난 안내가 50개를 넘으면 거절", () => {
    const list = Array.from({ length: 51 }, (_, i) => `안내 ${i}`);
    expect(firstMessage({ image: IMAGE, question: "q", previousInstructions: list })).toBe("지난 안내가 너무 많아요. 새로 물어봐 주세요.");
  });
});
