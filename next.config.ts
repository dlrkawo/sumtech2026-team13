import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 이미지에 서버 실행에 필요한 파일만 담는다 (키트: 빌드는 Dockerfile, 시작은 서버 실행만)
  output: "standalone",
};

export default nextConfig;
