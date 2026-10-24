// OpenAI 호환 서버(DeepSeek·Ollama 등)를 흉내 낸 가짜 서버로 범용 연결부를 검사합니다.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'class-ai-compat-'));
let server;
let base;
let requests = [];
let script = []; // 요청마다 하나씩 꺼내 쓰는 응답 목록

const chunk = (delta, extra = {}) => ({ choices: [{ index: 0, delta, ...extra }] });
const usageChunk = (prompt, completion, cached = 0) => ({ choices: [], usage: { prompt_tokens: prompt, completion_tokens: completion, prompt_cache_hit_tokens: cached } });
const toolCall = (id, name, args) => chunk({ tool_calls: [{ index: 0, id, type: 'function', function: { name, arguments: JSON.stringify(args) } }] }, { finish_reason: 'tool_calls' });
const textReply = (text) => [chunk({ content: text }, { finish_reason: 'stop' }), usageChunk(100, 10)];

let compat;

before(async () => {
  server = http.createServer((req, res) => {
    if (req.url.startsWith('/search')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ results: [{ title: '광합성 - 위키백과', url: 'https://ko.wikipedia.org/wiki/광합성', content: '빛에너지를 화학에너지로' }] }));
    }
    let body = '';
    req.on('data', (d) => (body += d));
    req.on('end', () => {
      requests.push({ url: req.url, auth: req.headers.authorization, json: JSON.parse(body) });
      const next = script.shift() || textReply('기본 답');
      if (next.status) {
        res.writeHead(next.status, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: { message: next.message } }));
      }
      res.writeHead(200, { 'Content-Type': 'text/event-stream' });
      for (const c of next) res.write(`data: ${JSON.stringify({ id: 'x', object: 'chat.completion.chunk', model: 'fake', ...c })}\n\n`);
      res.end('data: [DONE]\n\n');
    });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
  Object.assign(process.env, {
    DATA_DIR: dataDir,
    COMPAT_1_NAME: '테스트 호환 AI',
    COMPAT_1_BASE_URL: `${base}/v1`,
    COMPAT_1_API_KEY: 'sk-test',
    COMPAT_1_MODEL: 'fake-model',
    COMPAT_1_PRICE_INPUT: '1',
    COMPAT_1_PRICE_OUTPUT: '2',
    COMPAT_1_PRICE_CACHED_INPUT: '0.1',
    COMPAT_1_AGENT: 'true',
    COMPAT_1_REASONING_EFFORT: 'low',
    COMPAT_1_EXTRA_BODY: '{"chat_template_kwargs":{"enable_thinking":false}}',
    SEARCH_PROVIDER: 'searxng',
    SEARXNG_URL: base,
  });
  compat = await import('../src/providers/compat.js');
});

after(() => {
  server.close();
  fs.rmSync(dataDir, { recursive: true, force: true });
});

const chatProvider = () => compat.compatProviders.find((p) => p.id === 'compat-1');
const agentProvider = () => compat.compatProviders.find((p) => p.id === 'compat-1-agent');

async function collect(provider, args) {
  const events = [];
  for await (const ev of provider.run({ user: { id: 7 }, conversation: { id: 3 }, history: [], ...args })) events.push(ev);
  return events;
}
const textOf = (events) => events.filter((e) => e.type === 'text').map((e) => e.delta).join('');

test('스트리밍 답변에서 맨 앞 생각 과정은 빼고, 사용량과 비용을 계산', async () => {
  requests = [];
  script = [
    [
      chunk({ role: 'assistant', reasoning_content: '고민 중' }),
      chunk({ content: '<thi' }),
      chunk({ content: 'nk>속마음</th' }),
      chunk({ content: 'ink>\n\n안녕' }),
      chunk({ content: '하세요' }, { finish_reason: 'stop' }),
      usageChunk(1000, 200, 400),
    ],
  ];
  const provider = chatProvider();
  assert.equal(provider.label, '테스트 호환 AI');
  const events = await collect(provider, {
    history: [{ role: 'user', content: '이전 질문' }, { role: 'assistant', content: '이전 답' }],
    userText: '인사해줘',
  });
  assert.equal(textOf(events), '안녕하세요');
  assert.ok(events.some((e) => e.type === 'status'));
  const done = events.at(-1);
  assert.equal(done.text, '안녕하세요');
  assert.deepEqual(done.usage, { input: 600, cachedInput: 400, output: 200 });
  assert.ok(Math.abs(done.costUsd - 0.00104) < 1e-12); // (600×1 + 400×0.1 + 200×2) / 1e6

  const req = requests[0];
  assert.equal(req.url, '/v1/chat/completions');
  assert.equal(req.auth, 'Bearer sk-test');
  assert.equal(req.json.model, 'fake-model');
  assert.deepEqual(req.json.messages.map((m) => m.role), ['system', 'user', 'assistant', 'user']);
  assert.deepEqual(req.json.stream_options, { include_usage: true });
  assert.equal(req.json.reasoning_effort, 'low');
  assert.deepEqual(req.json.chat_template_kwargs, { enable_thinking: false });
  // 검색이 설정되어 있으면 채팅에는 웹 도구만, 파일 도구는 없음
  assert.deepEqual(req.json.tools.map((t) => t.function.name), ['web_search', 'fetch_url']);
});

test('채팅: 웹 검색 도구를 쓰고 출처를 남김', async () => {
  requests = [];
  script = [[toolCall('c1', 'web_search', { query: '광합성' })], textReply('광합성은 빛으로 양분을 만드는 과정입니다.')];
  const events = await collect(chatProvider(), { userText: '광합성이 뭐야?' });
  assert.ok(events.some((e) => e.type === 'tool' && e.name === 'web_search' && e.input.query === '광합성'));
  const done = events.at(-1);
  assert.match(done.text, /광합성은/);
  assert.deepEqual(done.meta.sources, [{ url: 'https://ko.wikipedia.org/wiki/광합성', title: '광합성 - 위키백과' }]);
  assert.match(done.meta.steps[0].output, /위키백과/);
  // 두 번째 요청에 도구 결과가 붙어 있어야 함
  const second = requests[1].json.messages;
  assert.equal(second.at(-2).tool_calls[0].function.name, 'web_search');
  assert.equal(second.at(-1).role, 'tool');
  assert.equal(second.at(-1).tool_call_id, 'c1');
});

test('에이전트: 작업 폴더에 파일을 쓰고, 폴더 밖 경로는 거부', async () => {
  requests = [];
  script = [
    [toolCall('a1', 'write_file', { path: 'calc/main.py', content: 'print(1 + 1)\n' })],
    [toolCall('a2', 'write_file', { path: '../../escape.txt', content: 'x' })],
    textReply('calc/main.py 를 만들었습니다.'),
  ];
  const events = await collect(agentProvider(), { userText: '계산기 만들어줘' });
  const root = path.join(dataDir, 'workspaces', '7', '3');
  assert.equal(fs.readFileSync(path.join(root, 'calc', 'main.py'), 'utf8'), 'print(1 + 1)\n');
  assert.ok(!fs.existsSync(path.join(dataDir, 'workspaces', 'escape.txt')));
  const done = events.at(-1);
  assert.equal(done.meta.steps.length, 2);
  assert.equal(done.meta.steps[0].isError, false);
  assert.equal(done.meta.steps[1].isError, true);
  assert.match(done.meta.steps[1].output, /작업 폴더 밖/);
  // 에이전트는 파일 도구 + 웹 도구
  assert.deepEqual(requests[0].json.tools.map((t) => t.function.name), ['list_files', 'read_file', 'write_file', 'edit_file', 'web_search', 'fetch_url']);
});

test('fetch_url 은 서버 내부망 주소를 열지 않음', async () => {
  script = [[toolCall('f1', 'fetch_url', { url: `${base}/v1/models` })], textReply('열 수 없었습니다.')];
  const events = await collect(chatProvider(), { userText: '이 주소 읽어줘' });
  const step = events.at(-1).meta.steps[0];
  assert.equal(step.isError, true);
  assert.match(step.output, /내부망/);
});

test('도구를 지원하지 않는 모델이면 채팅은 도구 없이 다시 요청', async () => {
  requests = [];
  script = [{ status: 400, message: 'model does not support tools' }, textReply('도구 없이 답합니다.')];
  const events = await collect(chatProvider(), { userText: '안녕' });
  assert.equal(textOf(events), '도구 없이 답합니다.');
  assert.ok(requests[0].json.tools);
  assert.equal(requests[1].json.tools, undefined);
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

test('내부망 주소 판별', async () => {
  const { isPrivateAddress } = await import('../src/tools/web.js');
  for (const ip of ['127.0.0.1', '10.1.2.3', '192.168.0.1', '172.20.0.1', '169.254.1.1', '::1', 'fd00::1', '::ffff:127.0.0.1']) {
    assert.equal(isPrivateAddress(ip), true, ip);
  }
  for (const ip of ['8.8.8.8', '1.1.1.1', '2606:4700::1111']) assert.equal(isPrivateAddress(ip), false, ip);
});
