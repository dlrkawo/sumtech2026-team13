import type { GuideRequest, GuideResponse } from "@/server/guide/schema";
import { request } from "@/lib/api/client";
import { USE_MOCK } from "@/lib/constants";

import { mockCreateGuide } from "./mock";

// 화면 분석·안내 (POST /api/guides, API_CONVENTION.md 10번)
// body.image는 lib/image.ts가 만든 data URL ("data:image/jpeg;base64,...")
export function createGuide(body: GuideRequest): Promise<GuideResponse> {
  if (USE_MOCK) return mockCreateGuide(body);
  return request<GuideResponse>("/api/guides", { method: "POST", body: JSON.stringify(body) });
}
