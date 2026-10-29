import type { Metadata } from "next";
import "./globals.css";

// 서비스 이름은 PM 확정 전 가칭. 확정되면 이 값과 첫 화면 제목을 바꾼다.
export const metadata: Metadata = {
  title: "화면 안내 도우미 (가칭)",
  description: "지금 보고 있는 화면을 AI가 함께 보고, 다음에 눌러야 할 곳을 짚어 드려요.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-white text-neutral-900 antialiased">{children}</body>
    </html>
  );
}
