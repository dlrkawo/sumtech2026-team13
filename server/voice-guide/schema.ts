import { z } from "zod";

import { previousInstructionSchema, type GuideResponse } from "../guide/schema";

// 목소리로 묻기 (POST /api/voice-guides) — 담당: hyuckkim
// 화면 이미지 + 녹음한 목소리 → 목소리를 글자로 바꿔 질문으로 삼고, POST /api/guides와 같은 안내를 돌려준다.
// 이미지 형식 규칙은 API_CONVENTION 2번 「화면 이미지 보내기」(POST /api/guides와 같음)

// data URL 문자열 기준 1MB. 이미지(최대 3MB)와 한 요청에 담겨 Vercel 함수 요청 본문 한도 4.5MB 안에 들어가야 한다.
// 브라우저 MediaRecorder(opus) 1분 녹음이 보통 0.5MB 안팎이다.
export const MAX_AUDIO_DATA_URL_LENGTH = 1 * 1024 * 1024;
// 브라우저 녹음(webm·ogg·mp4)과 일반 녹음 파일(mp3·wav). 코덱 표기(;codecs=opus)가 붙어도 받는다
export const AUDIO_DATA_URL_PATTERN =
  /^data:audio\/(webm|ogg|mp4|mpeg|mp3|wav|x-wav|m4a|x-m4a)(;codecs=[a-z0-9.]+)?;base64,[A-Za-z0-9+/]+={0,2}$/;

// image·audio는 문자열인지만 여기서 보고, 형식·크기는 service에서 IMAGE_* / AUDIO_*로 구분해 알린다
export const voiceGuideRequestSchema = z.object(
  {
    // 값이 아예 없을 때도 영어 기본 문구 대신 화면에 보여 줄 문장을 쓴다
    image: z.string({ error: "화면 사진이 필요해요." }).min(1, "화면 사진이 필요해요."),
    audio: z.string({ error: "목소리 녹음이 필요해요." }).min(1, "목소리 녹음이 필요해요."),
    // 선택. 바로 전에 받은 안내 문장 (POST /api/guides와 같음, 길면 잘라서 받음)
    previousInstruction: previousInstructionSchema,
  },
  { error: "요청 형식이 올바르지 않아요." },
);
export type VoiceGuideRequest = z.infer<typeof voiceGuideRequestSchema>;

// POST /api/guides 응답에 알아들은 문장을 더한다. FE는 question을 '질문 입력' 칸에 보여 줄 수 있다
export interface VoiceGuideResponse extends GuideResponse {
  question: string;
}
