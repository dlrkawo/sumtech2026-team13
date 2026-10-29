// 연습 화면: 시나리오(e2e/fixtures/의 병원 예약 사진)에 쓰지 않는 화면으로 AI 안내가 일반 화면에서도 맞는지 확인하는 용도.
//   확인: bash scripts/smoke-guide.sh public/practice/transfer.png "아들한테 돈 보내려는데 여기서 뭐 눌러요?"
// 아직 화면에 연결하지 않았다. 연결하면 FE가 src를 fetch → data URL로 바꿔 POST /api/guides의 image로 보낸다 (실제 AI가 답한다)
// 이미지는 직접 만든 가짜 화면이다 (실제 앱·은행 화면 아님).
export interface PracticeScreen {
  id: "chat" | "transfer" | "settings";
  title: string;
  src: `/practice/${string}.png`;
  sampleQuestion: string;
}

export const PRACTICE_SCREENS: readonly PracticeScreen[] = [
  { id: "chat", title: "메신저로 사진 보내기", src: "/practice/chat.png", sampleQuestion: "딸한테 사진 보내려면 어디 눌러요?" },
  // 송금 위험 경고 확인용: 문자로 받은 계좌로 큰돈 이체
  { id: "transfer", title: "돈 보내기 확인", src: "/practice/transfer.png", sampleQuestion: "문자로 받은 계좌로 돈 보내려는데 여기서 뭐 눌러요?" },
  { id: "settings", title: "와이파이 연결하기", src: "/practice/settings.png", sampleQuestion: "와이파이 연결하려면 어디 눌러요?" },
];
