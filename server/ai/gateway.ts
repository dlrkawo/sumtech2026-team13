import "server-only";

import { AppError } from "../errors";

// AI Gateway 호출 (OpenAI 호환 Chat Completions, 음성 인식). AI 호출은 서버의 이 폴더에서만 한다 (BE_CONVENTION 8번).
// 키는 process.env.AI_GATEWAY_API_KEY에서만 읽고, 비어 있으면 앱은 그대로 두고 호출할 때만 AI_UNAVAILABLE을 낸다.

const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";
// 음성 인식은 Chat Completions와 다른 전용 주소다 (Vercel 문서 AI Gateway Speech to Text, REST API)
const TRANSCRIPTION_URL = "https://ai-gateway.vercel.sh/v4/ai/transcription-model";
export const DEFAULT_TRANSCRIPTION_TIMEOUT_MS = 20_000;

// 팀 전체 예산이 $10라 호출 하나의 응답 길이와 대기 시간을 제한한다.
// max_tokens에는 보이지 않는 추론(생각) 토큰도 포함된다. 400이면 위험 화면처럼 판단이 어려운 화면에서
// 추론에 토큰을 다 쓰고 JSON이 잘렸다 (out=400, 답 41자). 1200이면 정상(out≈416). 출력은 쓴 만큼만 과금된다.
// 분석 요청 하나의 대기 시간을 25초로 제한한다. E2E는 별도로 흐름당 90초를 허용한다
export const DEFAULT_MAX_TOKENS = 1200;
export const DEFAULT_TIMEOUT_MS = 25_000;

const aiErrors = {
  unavailable: () => new AppError(503, "AI_UNAVAILABLE", "지금은 화면 분석을 사용할 수 없어요. 잠시 후 다시 시도해 주세요."),
  timeout: () => new AppError(503, "AI_TIMEOUT", "화면 분석이 오래 걸려요. 잠시 후 다시 시도해 주세요."),
  failed: () => new AppError(503, "AI_FAILED", "화면 분석에 실패했어요. 잠시 후 다시 시도해 주세요."),
  budgetExceeded: () =>
    new AppError(429, "AI_BUDGET_EXCEEDED", "지금은 화면 분석 요청이 많아요. 잠시 후 다시 시도해 주세요."),
};

export type ChatContent =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export interface ChatCompletionInput {
  model: string;
  content: ChatContent[];
  maxTokens?: number;
  timeoutMs?: number;
}

export interface ChatCompletionResult {
  text: string;
  promptTokens: number;
  completionTokens: number;
  // 추론(생각)에 쓴 토큰. completionTokens에 포함되어 있다. 응답에 없으면 0
  reasoningTokens: number;
  // "length"면 max_tokens에 걸려 답이 잘린 것
  finishReason: string | null;
}

// Gateway에 JSON을 보내고 응답 JSON을 돌려준다. 키 없음·시간 초과·HTTP 오류를 AI_* 에러로 바꾼다
async function postToGateway(
  url: string,
  body: unknown,
  timeoutMs: number,
  extraHeaders: Record<string, string> = {},
): Promise<unknown> {
  // 붙여 넣다 따라온 앞뒤 공백·줄바꿈을 지운다. GitHub Secret에 줄바꿈이 섞여 헤더를 못 만들어 CI E2E가 전부 실패한 적이 있다
  const apiKey = process.env.AI_GATEWAY_API_KEY?.trim();
  if (!apiKey) throw aiErrors.unavailable();
  // 가운데에 줄바꿈·공백이 남아 있으면(두 줄로 저장된 Secret 등) 헤더를 만들 수 없다. 키 설정 문제로 알린다
  if (/\s/.test(apiKey)) {
    console.error("[ai] AI_GATEWAY_API_KEY 안에 줄바꿈이나 공백이 있어요. 키를 한 줄로 다시 저장해 주세요");
    throw aiErrors.unavailable();
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", ...extraHeaders },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") throw aiErrors.timeout();
    console.error("[ai] gateway request failed", err);
    throw aiErrors.failed();
  }

  if (!res.ok) {
    console.error("[ai] gateway error", res.status, await res.text().catch(() => ""));
    // 401·403: 키가 틀렸거나 비활성 / 402·429: 예산 소진·요청 제한
    if (res.status === 401 || res.status === 403) throw aiErrors.unavailable();
    if (res.status === 402 || res.status === 429) throw aiErrors.budgetExceeded();
    throw aiErrors.failed();
  }

  return res.json().catch(() => null);
}

export async function createChatCompletion({
  model,
  content,
  maxTokens = DEFAULT_MAX_TOKENS,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: ChatCompletionInput): Promise<ChatCompletionResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Gateway 응답 모양은 아래에서 하나씩 확인한다
  const data: any = await postToGateway(
    GATEWAY_URL,
    { model, max_tokens: maxTokens, messages: [{ role: "user", content }] },
    timeoutMs,
  );
  const text: unknown = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string") {
    // 응답 본문에는 화면에서 읽은 내용이 섞일 수 있어 구조만 남긴다
    console.error("[ai] unexpected gateway response keys", data && typeof data === "object" ? Object.keys(data) : typeof data);
    throw aiErrors.failed();
  }

  return {
    text,
    promptTokens: data.usage?.prompt_tokens ?? 0,
    completionTokens: data.usage?.completion_tokens ?? 0,
    reasoningTokens: data.usage?.completion_tokens_details?.reasoning_tokens ?? 0,
    finishReason: data.choices[0].finish_reason ?? null,
  };
}

export interface TranscriptionInput {
  model: string;
  audioBase64: string; // data URL의 쉼표 뒤 base64 부분
  mediaType: string; // 예: "audio/webm"
  timeoutMs?: number;
}

export interface TranscriptionResult {
  text: string;
  language: string | null;
  durationInSeconds: number | null;
}

// 녹음 파일 → 글자. 본문은 base64 JSON만 받는다 (multipart 업로드는 지원하지 않음)
export async function createTranscription({
  model,
  audioBase64,
  mediaType,
  timeoutMs = DEFAULT_TRANSCRIPTION_TIMEOUT_MS,
}: TranscriptionInput): Promise<TranscriptionResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Gateway 응답 모양은 아래에서 하나씩 확인한다
  const data: any = await postToGateway(TRANSCRIPTION_URL, { audio: audioBase64, mediaType }, timeoutMs, {
    "ai-gateway-protocol-version": "0.0.1",
    "ai-transcription-model-specification-version": "4",
    "ai-model-id": model,
  });
  if (typeof data?.text !== "string") {
    // 응답 본문에는 말한 내용이 섞일 수 있어 구조만 남긴다
    console.error("[ai] unexpected transcription response keys", data && typeof data === "object" ? Object.keys(data) : typeof data);
    throw aiErrors.failed();
  }
  return {
    text: data.text,
    language: typeof data.language === "string" ? data.language : null,
    durationInSeconds: typeof data.durationInSeconds === "number" ? data.durationInSeconds : null,
  };
}

// 응답을 해석할 수 없을 때 등 다른 곳에서도 같은 안내를 쓰도록 내보낸다
export const aiFailed = aiErrors.failed;
