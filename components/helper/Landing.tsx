import { PetChar } from "./PetChar";

// `/` 첫 화면의 서비스 이름·설명 (키트 규칙: 로그인 없이 서비스 이름과 하는 일이 보여야 한다)
// 미니 브라우저 창 기준: 좁을 때는 위쪽에 짧게, sm 이상부터는 왼쪽 소개 영역으로 고정해
// 아이콘 모드의 안내·조작 영역(오른쪽)과 겹치지 않게 한다.
export function Landing() {
  return (
    <main
      className="flex w-full flex-col items-center justify-center gap-[10px] bg-[#F7F6F2] px-[20px] py-[20px] break-keep text-center
        sm:fixed sm:inset-y-0 sm:left-0 sm:z-0 sm:w-[300px] sm:items-start sm:justify-center sm:px-[28px] sm:py-0 sm:text-left"
    >
      <PetChar mood="calm" sign="flag" size={96} />
      <h1 className="text-[30px] font-bold text-[#16191D] sm:text-[36px]">눌러보슈</h1>
      <p className="max-w-[320px] text-[20px] leading-[1.45] text-[#454B53]">
        처음 보는 사이트에서 누를 곳을 하나씩 알려드려요
      </p>
      <p className="max-w-[320px] text-[20px] leading-[1.45] text-[#454B53]">
        지금 보고 있는 화면을 함께 보고, 다음에 눌러야 할 곳을 짚어 드려요. 자녀에게 묻지 않아도 한 단계씩 스스로
        해결할 수 있어요.
      </p>
    </main>
  );
}
