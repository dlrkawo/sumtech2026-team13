import "server-only";

import { createTranscription } from "../ai/gateway";
import { AppError } from "../errors";
import { createGuide } from "../guide/service";
import { readScreenImage } from "../guide/screen-image";
import { AUDIO_DATA_URL_PATTERN, MAX_AUDIO_DATA_URL_LENGTH, type VoiceGuideRequest, type VoiceGuideResponse } from "./schema";

// POST /api/voice-guides — 목소리를 글자로 바꾼 뒤 POST /api/guides와 같은 안내를 만든다 (담당: hyuckkim)
// 위험 경고·도움 기록·다시 묻기는 createGuide가 그대로 처리한다

const TRANSCRIPTION_MODEL = "google/gemini-3.5-transcribe";
// POST /api/guides의 question 최대 길이와 맞춘다
const MAX_QUESTION_LENGTH = 200;

const audioErrors = {
  invalid: () =>
    new AppError(400, "AUDIO_INVALID", "녹음을 열 수 없어요. 마이크 버튼을 눌러 다시 말씀해 주세요."),
  tooLarge: () => new AppError(400, "AUDIO_TOO_LARGE", "녹음이 너무 길어요. 짧게 다시 말씀해 주세요."),
  noSpeech: () => new AppError(400, "AUDIO_NO_SPEECH", "말씀을 알아듣지 못했어요. 조금 더 크게 다시 말씀해 주세요."),
};

export async function createVoiceGuide(
  userId: number,
  { image, audio, previousInstruction, previousInstructions }: VoiceGuideRequest,
): Promise<VoiceGuideResponse> {
  // 글자로 바꾸는 데 비용이 들기 전에 이미지도 먼저 검사한다
  readScreenImage(image);
  if (audio.length > MAX_AUDIO_DATA_URL_LENGTH) throw audioErrors.tooLarge();
  if (!AUDIO_DATA_URL_PATTERN.test(audio)) throw audioErrors.invalid();

  const mediaType = audio.slice("data:".length, audio.indexOf(";"));
  const transcription = await createTranscription({
    model: TRANSCRIPTION_MODEL,
    audioBase64: audio.slice(audio.indexOf(",") + 1),
    mediaType,
  });
  // 말한 내용은 개인정보가 섞일 수 있어 길이만 남긴다
  console.info(
    `[voice-guide] transcribed duration=${transcription.durationInSeconds ?? "?"}s ` +
      `language=${transcription.language ?? "?"} length=${transcription.text.length}`,
  );

  const question = transcription.text.trim().slice(0, MAX_QUESTION_LENGTH);
  if (!question) throw audioErrors.noSpeech();

  const guide = await createGuide(userId, { image, question, previousInstruction, previousInstructions });
  return { question, ...guide };
}
