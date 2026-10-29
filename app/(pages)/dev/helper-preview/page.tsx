import { readFile } from "node:fs/promises";
import path from "node:path";

import { notFound } from "next/navigation";

import { HelperPreview } from "./HelperPreview";

// 개발 중 화면 확인용 (목업과 나란히 비교). 배포(production)에서는 열리지 않는다.
//   /dev/helper-preview?mock=risk | step1 | step2 | done | need-info | no-target
// 화면 사진은 components/guide/mock.ts 좌표의 기준 그림(e2e/fixtures/mock-step1.png)을 쓴다
export const dynamic = "force-dynamic";

export default async function HelperPreviewPage({ searchParams }: { searchParams: Promise<{ mock?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { mock = "risk" } = await searchParams;
  const png = await readFile(path.join(process.cwd(), "e2e/fixtures/mock-step1.png"));
  return <HelperPreview mock={mock} image={`data:image/png;base64,${png.toString("base64")}`} />;
}
