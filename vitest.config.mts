import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// 단위 테스트 (순수 함수만: lib/errors·lib/image·server/guide/prompt·server/guide/schema).
// 흐름 E2E(e2e/)와 별개이며, 앱·DB·AI를 띄우지 않는다. 실행: npm test
export default defineConfig({
  resolve: {
    alias: {
      // tsconfig paths와 같게 "@/..." → 저장소 루트
      "@": fileURLToPath(new URL(".", import.meta.url)),
      // 서버 파일의 import "server-only"는 Next.js 바깥(vitest)에서는 가져오기만 해도 실패하므로 빈 모듈로 바꾼다
      "server-only": fileURLToPath(new URL("./tests/stubs/server-only.ts", import.meta.url)),
    },
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
});
