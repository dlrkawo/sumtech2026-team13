import "server-only";

import { z } from "zod";

import { DbUnavailableError } from "./db/client";
import { AppError, errors } from "./errors";

// 공통 응답 형식 (API_CONVENTION 3번)
//   성공: { success: true, data, message }
//   실패: { success: false, data: null, message, code }

export function ok<T>(data: T, init?: { status?: number; headers?: HeadersInit }): Response {
  if (init?.status === 204) return new Response(null, { status: 204, headers: init.headers });
  return Response.json(
    { success: true, data, message: "OK" },
    { status: init?.status ?? 200, headers: init?.headers },
  );
}

export function fail(status: number, code: string, message: string): Response {
  return Response.json({ success: false, data: null, message, code }, { status });
}

// 모든 route handler를 감싼다. 던진 에러를 공통 실패 응답으로 바꾸고, 예상 못 한 오류는 로그에만 남긴다.
//   export const POST = withHandler(async (req) => { ... return ok(data) })
// C 기본값은 Next.js route handler의 두 번째 인자 형태 (handler가 ctx를 안 받아도 타입 검사를 통과하도록)
export function withHandler<C = { params: Promise<Record<string, string | string[]>> }>(
  handler: (req: Request, ctx: C) => Promise<Response>,
) {
  return async (req: Request, ctx: C): Promise<Response> => {
    try {
      return await handler(req, ctx);
    } catch (e) {
      if (e instanceof AppError) return fail(e.status, e.code, e.message);
      if (e instanceof z.ZodError) return fail(400, "VALIDATION_ERROR", firstIssueMessage(e));
      if (e instanceof DbUnavailableError) {
        return fail(503, "DB_UNAVAILABLE", "지금은 저장 기능을 쓸 수 없어요. 잠시 후 다시 시도해 주세요.");
      }
      console.error("[api] unexpected error", e);
      return fail(500, "INTERNAL_SERVER_ERROR", "잠시 후 다시 시도해 주세요.");
    }
  };
}

// 요청 본문(JSON)을 읽고 zod 스키마로 검사한다. 실패하면 400 VALIDATION_ERROR
export async function parseBody<S extends z.ZodType>(req: Request, schema: S): Promise<z.infer<S>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw errors.validation("요청 형식이 올바르지 않아요.");
  }
  const result = schema.safeParse(body);
  if (!result.success) throw errors.validation(firstIssueMessage(result.error));
  return result.data;
}

function firstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "입력한 값을 다시 확인해 주세요.";
}
