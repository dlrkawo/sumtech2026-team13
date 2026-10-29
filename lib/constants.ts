// 화면 이미지 보내기 규칙 (API_CONVENTION.md 2번 「화면 이미지 보내기」)
export const MAX_IMAGE_WIDTH = 1280;
export const JPEG_QUALITY = 0.7;
// data URL 문자열 기준 3MB (Vercel 함수 요청 본문 한도 4.5MB 안). 넘으면 BE가 400 IMAGE_TOO_LARGE를 주므로 보내기 전에 막는다
export const MAX_IMAGE_DATA_URL_LENGTH = 3 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// 질문 글자 수 한도 (POST /api/guides의 question, server/guide/schema.ts와 같은 값)
export const MAX_QUESTION_LENGTH = 200;

// BE 연동 전 개발용 목업 (FE_CONVENTION.md 11번). main·배포에서는 꺼 둔다
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
