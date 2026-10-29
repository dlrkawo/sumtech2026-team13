import type { Metadata } from "next";
import "./globals.css";

// 서비스 이름 '곁길' (Landing.tsx의 제목과 같다)
export const metadata: Metadata = {
  title: "곁길",
  description: "막힌 화면에서 다음에 누를 곳을 하나씩 짚어 주는 도우미",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-white text-neutral-900 antialiased">{children}</body>
    </html>
  );
}
