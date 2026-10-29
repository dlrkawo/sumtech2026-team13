// 사용법: node locate-element.js [이미지경로] [질문]
const fs = require('fs');

process.loadEnvFile('.env');

const MODEL = 'anthropic/claude-sonnet-5.5';
// 100만 토큰당 USD (입력, 출력) — 팀 대시보드 기준
const PRICE = { input: 2.0, output: 10.0 };

const imagePath = process.argv[2] || 'image.png';
const question = process.argv[3] || '지금 예산을 확인하려면 어디를 봐야 하니?';

const buf = fs.readFileSync(imagePath);
// PNG 헤더에서 원본 크기 읽기 (16~23 바이트)
const width = buf.readUInt32BE(16);
const height = buf.readUInt32BE(20);

const prompt = `이 이미지는 웹 화면 캡처이고 크기는 ${width}x${height} 픽셀이다.
질문: ${question}
질문이 가리키는 UI 요소를 찾아서, 원본 이미지 픽셀 좌표 기준으로 아래 JSON만 출력해라. 다른 텍스트는 쓰지 마라.
{"found": true/false, "x": 중심 x, "y": 중심 y, "box": [x1, y1, x2, y2], "description": "요소의 위치와 생김새를 한국어로 한두 문장"}`;

async function main() {
  const res = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:image/png;base64,${buf.toString('base64')}` } },
            { type: 'text', text: prompt },
          ],
        },
      ],
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error(res.status, JSON.stringify(data, null, 2));
    process.exit(1);
  }

  const text = data.choices[0].message.content;
  const json = JSON.parse(text.match(/\{[\s\S]*\}/)[0]);
  console.log(json);

  const { prompt_tokens, completion_tokens } = data.usage;
  const cost = (prompt_tokens * PRICE.input + completion_tokens * PRICE.output) / 1e6;
  console.log(`토큰: 입력 ${prompt_tokens}, 출력 ${completion_tokens} → 약 $${cost.toFixed(4)}`);
}

main();
