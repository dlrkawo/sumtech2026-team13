import { AuthProvider } from "@/components/auth";
import { HelperApp, Landing } from "@/components/helper";

// `/` 첫 화면 (FE 담당). 키트 규칙: 로그인 없이 서비스 이름과 하는 일이 보여야 한다.
// 그 위에 가입/로그인 → 설정 창 → 아이콘 모드가 차례로 뜬다 (components/helper)
export default function HomePage() {
  return (
    <AuthProvider>
      <Landing />
      <HelperApp />
    </AuthProvider>
  );
}
