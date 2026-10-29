// GET /__health — 키트 필수. 대시보드 UP/DOWN 표시와 주최 측 E2E 시작 신호로 쓰인다.
// 로그인·리다이렉트 없이 200, 실제 배포 commit SHA를 releaseId로 응답한다.
// 폴더 이름이 %5F%5Fhealth인 이유: Next.js는 `_`로 시작하는 폴더를 주소로 만들지 않는다.
// docker(주최 측 실행·CI)는 RELEASE_ID, Vercel 배포는 VERCEL_GIT_COMMIT_SHA로 commit을 받는다.
export const dynamic = "force-dynamic";

export function GET() {
  const releaseId = process.env.RELEASE_ID || process.env.VERCEL_GIT_COMMIT_SHA || "dev";
  return Response.json({ releaseId }, { headers: { "Cache-Control": "no-store" } });
}
