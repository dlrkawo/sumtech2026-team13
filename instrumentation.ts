// Next.js가 서버를 시작할 때 한 번 호출한다. 여기서 DB 마이그레이션·시드 계정을 준비한다.
// (키트: 컨테이너 시작 명령은 서버 실행만, 마이그레이션·시드는 서버 시작에 포함)
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { initDatabase } = await import("./server/db/init");
  await initDatabase();
}
