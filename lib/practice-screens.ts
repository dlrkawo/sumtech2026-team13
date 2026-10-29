// 연습 화면: 화면 공유(▶)를 못 쓰는 곳(E2E 채점, 처음 써 보는 부모님)에서 이 사진으로 물어보기를 해 볼 수 있다.
// FE는 src를 fetch → data URL로 바꿔서 POST /api/guides의 image로 보내면 된다. (실제 AI가 답한다, 가짜 응답 아님)
// 이미지는 직접 만든 가짜 화면이다 (실제 앱·은행 화면 아님).
export interface PracticeScreen {
  id: "chat" | "transfer" | "settings";
  title: string;
  src: `/practice/${string}.png`;
  sampleQuestion: string;
}

export const PRACTICE_SCREENS: readonly PracticeScreen[] = [
  { id: "chat", title: "메신저로 사진 보내기", src: "/practice/chat.png", sampleQuestion: "딸한테 사진 보내려면 어디 눌러요?" },
  // S6 위험 경고 확인용: 문자로 받은 계좌로 큰돈 이체
  { id: "transfer", title: "돈 보내기 확인", src: "/practice/transfer.png", sampleQuestion: "문자로 받은 계좌로 돈 보내려는데 여기서 뭐 눌러요?" },
  { id: "settings", title: "와이파이 연결하기", src: "/practice/settings.png", sampleQuestion: "와이파이 연결하려면 어디 눌러요?" },
];
