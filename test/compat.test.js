// OpenAI 호환 서버(DeepSeek·Ollama 등)를 흉내 낸 가짜 서버로 범용 연결부를 검사합니다.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

let server;
let lastBody;
const chunks = [
  { choices: [{ index: 0, delta: { role: 'assistant', reasoning_content: '고민 중' } }] },
  { choices: [{ index: 0, delta: { content: '<thi' } }] },
  { choices: [{ index: 0, delta: { content: 'nk>속마음</th' } }] },
  { choices: [{ index: 0, delta: { content: 'ink>\n\n안녕' } }] },
  { choices: [{ index: 0, delta: { content: '하세요' }, finish_reason: 'stop' }] },
  { choices: [], usage: { prompt_tokens: 1000, completion_tokens: 200, prompt_cache_hit_tokens: 400 } },
];

let compat;

before(async () => {
  server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (d) => (body += d));
    req.on('end', () => {
      lastBody = { url: req.url, auth: req.headers.authorization, json: JSON.parse(body) };
      res.writeHead(200, { 'Content-Type': 'text/event-stream' });
      for (const c of chunks) res.write(`data: ${JSON.stringify({ id: 'x', object: 'chat.completion.chunk', model: 'fake', ...c })}\n\n`);
      res.end('data: [DONE]\n\n');
    });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  Object.assign(process.env, {
    COMPAT_1_NAME: '테스트 호환 AI',
    COMPAT_1_BASE_URL: `http://127.0.0.1:${server.address().port}/v1`,
    COMPAT_1_API_KEY: 'sk-test',
    COMPAT_1_MODEL: 'fake-model',
    COMPAT_1_PRICE_INPUT: '1',
    COMPAT_1_PRICE_OUTPUT: '2',
    COMPAT_1_PRICE_CACHED_INPUT: '0.1',
  });
  compat = await import('../src/providers/compat.js');
});

after(() => server.close());

test('스트리밍 답변에서 맨 앞 생각 과정은 빼고, 사용량과 비용을 계산', async () => {
  const provider = compat.compatProviders[0];
  assert.equal(provider.id, 'compat-1');
  assert.equal(provider.label, '테스트 호환 AI');
  assert.ok(provider.available());

  const events = [];
  for await (const ev of provider.run({ history: [{ role: 'user', content: '이전 질문' }, { role: 'assistant', content: '이전 답' }], userText: '인사해줘' })) {
    events.push(ev);
  }
  const text = events.filter((e) => e.type === 'text').map((e) => e.delta).join('');
  assert.equal(text, '안녕하세요');
  assert.ok(events.some((e) => e.type === 'status'));

  const done = events.at(-1);
  assert.equal(done.type, 'done');
  assert.equal(done.text, '안녕하세요');
  assert.deepEqual(done.usage, { input: 600, cachedInput: 400, output: 200 });
  // (600×1 + 400×0.1 + 200×2) / 1e6
  assert.ok(Math.abs(done.costUsd - 0.00104) < 1e-12);

  assert.equal(lastBody.url, '/v1/chat/completions');
  assert.equal(lastBody.auth, 'Bearer sk-test');
  assert.equal(lastBody.json.model, 'fake-model');
  assert.equal(lastBody.json.messages[0].role, 'system');
  assert.deepEqual(lastBody.json.messages.slice(1).map((m) => m.role), ['user', 'assistant', 'user']);
  assert.deepEqual(lastBody.json.stream_options, { include_usage: true });
});

test('생각 필터: 답 중간의 <think> 글자는 그대로 둠', () => {
  const run = (parts) => {
    const f = compat.createThinkFilter();
    return parts.map((p) => f(p)).join('') + f('', true);
  };
  assert.equal(run(['그냥 ', '답입니다']), '그냥 답입니다');
  assert.equal(run(['XML 예: ', '<think>', ' 태그']), 'XML 예: <think> 태그');
  assert.equal(run(['  <think>a</think>답']), '답');
  assert.equal(run(['<', 'think>끝나지 않은 생각']), '');
  assert.equal(run(['<t', 'able>']), '<table>');
});
