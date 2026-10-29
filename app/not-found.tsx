import Link from "next/link";

// 없는 주소는 404 (키트 규칙). FE가 문구·디자인을 다듬는다.
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6">
      <h1 className="text-3xl font-bold">찾는 화면이 없어요</h1>
      <Link href="/" className="text-2xl text-blue-700 underline">
        처음 화면으로 가기
      </Link>
    </main>
  );
}
