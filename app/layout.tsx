import type { Metadata } from "next";
import "./globals.css";

// 서비스 이름은 첫 화면 제목(Landing)·PiP 창 제목과 같은 '곁길'
export const metadata: Metadata = {
  title: "곁길",
  description: "처음 보는 사이트에서 누를 곳을 하나씩 알려드려요. 지금 보고 있는 화면을 함께 보고, 다음에 눌러야 할 곳을 짚어 드려요.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-white text-neutral-900 antialiased">{children}</body>
    </html>
  );
}
