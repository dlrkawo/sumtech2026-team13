# E2E 입력 자료

눌러보슈 흐름에서 업로드하는 가짜 병원 예약 화면 사진을 이 폴더에 커밋한다.
주최 측 실행은 저장소에 있는 것만으로 흐름을 재현한다. 내 컴퓨터에만 있는 파일, 인터넷 주소에서 내려받는 파일,
실행할 때마다 생성하는 임의 자료에 기대면 주최 측 실행에서 같은 흐름이 돌지 않는다.

- `mock-step1.png`·`mock-step2.png`·`mock-done.png`: 예약 단계별 안내 확인용 화면.
- `mock-unclear.png`: 개인정보 제출 경고 확인용 화면.
- 실제 흐름에 쓰는 크기·형식의 자료를 둔다. 빈 파일이나 의미 없는 자료로 결과를 확인하지 않는다.
- 저작권·개인정보 문제가 없는 자료만 둔다. 실존 인물의 개인정보는 넣지 않는다.
- 파일 하나는 10MB 이하로 둔다.

spec에서는 spec 파일 위치를 기준으로 경로를 만든다. `__dirname`을 쓰므로 `e2e/package.json`에 `"type": "module"`을 넣지 않는다.

```ts
import path from "node:path"

// 실제 '사진 올리기' 버튼을 눌러 파일 선택 창으로 사진을 고른다 (S2와 동일).
const [chooser] = await Promise.all([
  page.waitForEvent("filechooser"),
  page.getByText("사진 올리기", { exact: true }).click(),
])
await chooser.setFiles(path.join(__dirname, "../fixtures/mock-step1.png"))
```
