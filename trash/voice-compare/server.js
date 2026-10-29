// 목소리 인식 비교 실험용 로컬 서버: node trash/voice-compare/server.js → http://localhost:4180
// 페이지를 보여 주고, 녹음 파일을 AI Gateway 음성 인식으로 대신 보낸다 (키를 브라우저에 넘기지 않기 위해).
// 키는 저장소 루트 .env의 AI_GATEWAY_API_KEY에서 읽는다. 키는 커밋하지 않는다.
const fs = require('fs');
const http = require('http');
const path = require('path');

const PORT = 4180;
const ROOT_ENV = path.join(__dirname, '..', '..', '.env');
const RESULTS_FILE = path.join(__dirname, 'results.jsonl');
const TRANSCRIPTION_URL = 'https://ai-gateway.vercel.sh/v4/ai/transcription-model';
// 비교해 볼 수 있는 모델 (기본: 서비스 /api/voice-guides와 같은 모델)
const MODELS = ['google/gemini-3.5-transcribe', 'elevenlabs/scribe-v2', 'openai/whisper-1'];

if (fs.existsSync(ROOT_ENV)) process.loadEnvFile(ROOT_ENV);

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function sendJson(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }).end(JSON.stringify(obj));
}

// 녹음(data URL) → Gateway 음성 인식. 서비스의 server/ai/gateway.ts createTranscription과 같은 요청 모양
async function transcribe({ audio, model }) {
  if (!process.env.AI_GATEWAY_API_KEY) return { ok: false, status: 0, error: '저장소 루트 .env에 AI_GATEWAY_API_KEY가 없어요' };
  if (!MODELS.includes(model)) return { ok: false, status: 0, error: `모르는 모델: ${model}` };

  const mediaType = audio.slice('data:'.length, audio.indexOf(';'));
  const started = Date.now();
  const res = await fetch(TRANSCRIPTION_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
      'Content-Type': 'application/json',
      'ai-gateway-protocol-version': '0.0.1',
      'ai-transcription-model-specification-version': '4',
      'ai-model-id': model,
    },
    body: JSON.stringify({ audio: audio.slice(audio.indexOf(',') + 1), mediaType }),
    signal: AbortSignal.timeout(30_000),
  });
  const elapsedMs = Date.now() - started;
  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    // 오류 본문이 JSON이 아닐 수 있다
  }
  if (!res.ok) return { ok: false, status: res.status, elapsedMs, error: text.slice(0, 500) };
  return {
    ok: true,
    status: res.status,
    elapsedMs,
    mediaType,
    text: data?.text ?? '',
    language: data?.language ?? null,
    durationInSeconds: data?.durationInSeconds ?? null,
  };
}

http
  .createServer(async (req, res) => {
    try {
      if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(fs.readFileSync(path.join(__dirname, 'index.html')));
        return;
      }
      if (req.method === 'GET' && req.url === '/config') {
        sendJson(res, 200, { models: MODELS, hasKey: Boolean(process.env.AI_GATEWAY_API_KEY) });
        return;
      }
      if (req.method === 'POST' && req.url === '/transcribe') {
        sendJson(res, 200, await transcribe(JSON.parse(await readBody(req))));
        return;
      }
      // 한 번 비교한 결과를 한 줄씩 남긴다 (녹음 파일은 저장하지 않음)
      if (req.method === 'POST' && req.url === '/log') {
        const entry = { at: new Date().toISOString(), ...JSON.parse(await readBody(req)) };
        fs.appendFileSync(RESULTS_FILE, JSON.stringify(entry) + '\n');
        sendJson(res, 200, { ok: true });
        return;
      }
      res.writeHead(404).end('not found');
    } catch (e) {
      sendJson(res, 500, { ok: false, error: String(e) });
    }
  })
  .listen(PORT, () => console.log(`http://localhost:${PORT}`));
