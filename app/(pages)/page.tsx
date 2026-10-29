import { AuthProvider } from "@/components/auth";
import { HelperApp, PetChar } from "@/components/helper";

// `/` 첫 화면 (FE 담당). 키트 규칙: 로그인 없이 서비스 이름과 하는 일이 보여야 한다.
// 그 위에 가입/로그인 → 설정 창 → 아이콘 모드가 차례로 뜬다 (components/helper)
export default function HomePage() {
  return (
    <AuthProvider>
      <main className="flex min-h-screen flex-col items-center justify-center gap-[14px] bg-[#F7F6F2] px-[24px] break-keep pb-[40px] text-center lg:items-start lg:pl-[9vw] lg:text-left">
        <PetChar mood="calm" sign="flag" size={140} />
        <h1 className="text-[44px] font-bold text-[#16191D]">곁길</h1>
        <p className="max-w-[600px] text-[24px] leading-[1.5] text-[#454B53]">
          처음 보는 사이트에서 누를 곳을 하나씩 알려드려요
        </p>
        <p className="max-w-[600px] text-[20px] leading-[1.5] text-[#454B53]">
          지금 보고 있는 화면을 함께 보고, 다음에 눌러야 할 곳을 짚어 드려요. 자녀에게 묻지 않아도 한 단계씩 스스로
          해결할 수 있어요.
        </p>
      </main>
      <HelperApp />
    </AuthProvider>
  );
}
