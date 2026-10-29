import { HomeApp } from "@/components/home";

// `/` 첫 화면 (FE 담당). 키트 규칙: 로그인 없이 서비스 이름과 하는 일이 보여야 한다.
// 소개 문구는 서버에서 그리고, 로그인/설정 창/아이콘 모드는 HomeApp(클라이언트)이 바꿔 가며 보여 준다.
// 문구·배치는 FE와 PM이 정한 방향으로 바꾼다.
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6 py-10">
      <h1 className="text-4xl font-bold">화면 안내 도우미 (가칭)</h1>
      <p className="text-2xl leading-relaxed">
        지금 보고 있는 화면을 AI가 함께 보고, 다음에 눌러야 할 곳을 짚어 드려요.
      </p>
      <p className="text-xl text-neutral-600">자녀에게 묻지 않아도, 한 단계씩 스스로 해결할 수 있어요.</p>
      <HomeApp />
    </main>
  );
}
