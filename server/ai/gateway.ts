import "server-only";

import { AppError } from "../errors";

// AI Gateway(OpenAI 호환 Chat Completions) 호출. AI 호출은 서버의 이 폴더에서만 한다 (BE_CONVENTION 8번).
// 키는 process.env.AI_GATEWAY_API_KEY에서만 읽고, 비어 있으면 앱은 그대로 두고 호출할 때만 AI_UNAVAILABLE을 낸다.

const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";

// 팀 전체 예산이 $10라 호출 하나의 응답 길이와 대기 시간을 제한한다.
// E2E 흐름 하나(분석 최대 2번)가 1분 안에 끝나야 하므로 타임아웃은 25초
export const DEFAULT_MAX_TOKENS = 400;
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
}

export async function createChatCompletion({
  model,
  content,
  maxTokens = DEFAULT_MAX_TOKENS,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: ChatCompletionInput): Promise<ChatCompletionResult> {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) throw aiErrors.unavailable();

  let res: Response;
  try {
    res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: [{ role: "user", content }],
      }),
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

  const data = await res.json().catch(() => null);
  const text: unknown = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string") {
    console.error("[ai] unexpected gateway response", JSON.stringify(data).slice(0, 500));
    throw aiErrors.failed();
  }

  return {
    text,
    promptTokens: data.usage?.prompt_tokens ?? 0,
    completionTokens: data.usage?.completion_tokens ?? 0,
  };
}

// 응답을 해석할 수 없을 때 등 다른 곳에서도 같은 안내를 쓰도록 내보낸다
export const aiFailed = aiErrors.failed;
