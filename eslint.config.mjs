import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // e2e/는 독립 패키지(키트 규칙)라 루트 린트에서 제외
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "e2e/**", "trash/**"]),
]);
