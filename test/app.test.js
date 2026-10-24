// 실제 AI 를 부르지 않고(MOCK_PROVIDER) 로그인 → 동의 → 질문 → 교수자 열람 흐름을 검사합니다.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'class-ai-test-'));
Object.assign(process.env, {
  DATA_DIR: dataDir,
  MOCK_PROVIDER: 'true',
  ANTHROPIC_API_KEY: '',
  OPENAI_API_KEY: '',
  CLASS_JOIN_CODE: 'join-123',
  DAILY_TOKEN_LIMIT_PER_STUDENT: '100000',
  MONTHLY_BUDGET_USD: '0',
});

const { openDb, run } = await import('../src/db.js');
const { hashPassword } = await import('../src/auth.js');
const { createApp } = await import('../src/server.js');
const { config } = await import('../src/config.js');
const { workspaceDir } = await import('../src/providers/claude-agent.js');

let server;
let base;

before(async () => {
  openDb();
  run("INSERT INTO users (username, display_name, password_hash, role, consented_at) VALUES ('prof', '교수', ?, 'admin', datetime('now'))", hashPassword('prof-password'));
  server = createApp().listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
  fs.rmSync(dataDir, { recursive: true, force: true });
});

function client() {
  let cookie = '';
  return async (method, url, body, extraHeaders = {}) => {
    const res = await fetch(base + url, {
      method,
      headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...extraHeaders },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0];
    return res;
  };
}

test('학생 가입, 동의, 질문, 교수자 열람까지 전체 흐름', async () => {
  const student = client();
  let res = await student('POST', '/api/signup', { joinCode: 'wrong', username: '20261234', displayName: '홍길동', password: 'student-pass' });
  assert.equal(res.status, 403);

  res = await student('POST', '/api/signup', { joinCode: 'join-123', username: '20261234', displayName: '홍길동', password: 'student-pass' });
  assert.equal(res.status, 200);

  res = await student('POST', '/api/conversations', { provider: 'mock' });
  const conv = await res.json();
  assert.equal(conv.provider, 'mock');

  // 동의 전에는 질문 불가
  res = await student('POST', `/api/conversations/${conv.id}/messages`, { text: '안녕' });
  assert.equal(res.status, 403);

  res = await student('POST', '/api/consent', {});
  assert.equal(res.status, 200);

  res = await student('POST', `/api/conversations/${conv.id}/messages`, { text: '광합성을 설명해줘' });
  assert.equal(res.status, 200);
  const events = (await res.text()).trim().split('\n').map((l) => JSON.parse(l));
  assert.ok(events.some((e) => e.type === 'text'));
  assert.ok(events.some((e) => e.type === 'tool' && e.name === 'web_search'));
  assert.equal(events.at(-1).type, 'done');

  res = await student('GET', `/api/conversations/${conv.id}`);
  const { messages } = await res.json();
  assert.deepEqual(messages.map((m) => m.role), ['user', 'assistant']);
  assert.match(messages[1].content, /광합성을 설명해줘/);
  assert.equal(messages[1].meta.steps[0].name, 'web_search');

  // 학생은 교수자 API 접근 불가
  res = await student('GET', '/api/admin/overview');
  assert.equal(res.status, 403);

  const prof = client();
  res = await prof('POST', '/api/login', { username: 'prof', password: 'prof-password' });
  assert.equal(res.status, 200);

  res = await prof('GET', '/api/admin/overview');
  const overview = await res.json();
  const row = overview.students.find((s) => s.username === '20261234');
  assert.equal(row.prompts, 1);

  res = await prof('GET', `/api/admin/conversations/${conv.id}`);
  assert.equal((await res.json()).messages.length, 2);

  res = await prof('GET', '/api/admin/search?q=광합성');
  assert.ok((await res.json()).length >= 1);

  res = await prof('GET', '/api/admin/export.csv');
  const bytes = Buffer.from(await res.arrayBuffer());
  assert.deepEqual([...bytes.subarray(0, 3)], [0xef, 0xbb, 0xbf]); // 엑셀용 UTF-8 BOM
  const csv = bytes.toString('utf8');
  assert.match(csv, /20261234/);

  res = await prof('GET', '/api/admin/audit');
  const audit = await res.json();
  assert.ok(audit.some((a) => a.type === 'admin_view_conversation'));
});

test('다른 학생의 대화는 볼 수 없음', async () => {
  const a = client();
  const b = client();
  await a('POST', '/api/signup', { joinCode: 'join-123', username: 'stu-a', displayName: 'A', password: 'password-a' });
  await b('POST', '/api/signup', { joinCode: 'join-123', username: 'stu-b', displayName: 'B', password: 'password-b' });
  const conv = await (await a('POST', '/api/conversations', { provider: 'mock' })).json();
  assert.equal((await b('GET', `/api/conversations/${conv.id}`)).status, 404);
  assert.equal((await b('POST', `/api/conversations/${conv.id}/messages`, { text: 'x' })).status, 404);
});

test('CSRF: JSON 이 아니거나 다른 출처의 요청은 거부', async () => {
  const res1 = await fetch(`${base}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'username=a&password=b' });
  assert.equal(res1.status, 415);
  const res2 = await fetch(`${base}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example' },
    body: JSON.stringify({ username: 'prof', password: 'prof-password' }),
  });
  assert.equal(res2.status, 403);
});

test('하루 사용 한도를 넘으면 차단', async () => {
  const s = client();
  await s('POST', '/api/signup', { joinCode: 'join-123', username: 'heavy', displayName: '많이씀', password: 'password-h' });
  await s('POST', '/api/consent', {});
  const conv = await (await s('POST', '/api/conversations', { provider: 'mock' })).json();
  run("INSERT INTO messages (conversation_id, role, content, input_tokens, output_tokens) VALUES (?, 'assistant', 'x', ?, 0)", conv.id, config.dailyTokenLimit);
  const res = await s('POST', `/api/conversations/${conv.id}/messages`, { text: '또 질문' });
  assert.equal(res.status, 429);
});

test('작업 폴더 밖 파일은 내려받을 수 없음', async () => {
  const s = client();
  await s('POST', '/api/signup', { joinCode: 'join-123', username: 'files', displayName: '파일', password: 'password-f' });
  const conv = await (await s('POST', '/api/conversations', { provider: 'mock' })).json();
  const me = await (await s('GET', '/api/me')).json();
  const dir = workspaceDir(me.user.id, conv.id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'hello.py'), 'print("hi")');

  let res = await s('GET', `/api/conversations/${conv.id}/files`);
  assert.deepEqual((await res.json()).map((f) => f.path), ['hello.py']);

  res = await s('GET', `/api/conversations/${conv.id}/file?path=hello.py&preview=1`);
  assert.equal(await res.text(), 'print("hi")');

  res = await s('GET', `/api/conversations/${conv.id}/file?path=${encodeURIComponent('../../../class-ai.db')}`);
  assert.equal(res.status, 404);
});

test('마크다운 변환기는 HTML 을 실행하지 않음', async () => {
  const src = fs.readFileSync(path.join(config.root, 'public/common.js'), 'utf8');
  // 브라우저 전용 코드라서 문자열 함수만 꺼내 검사
  const mod = await import(`data:text/javascript,${encodeURIComponent(src.replace(/^export async function api[\s\S]*?\n}\n/m, ''))}`);
  const html = mod.renderMarkdown('<img src=x onerror=alert(1)> **굵게** [링크](javascript:alert(1)) `<b>`');
  assert.ok(!html.includes('<img'));
  assert.ok(html.includes('<strong>굵게</strong>'));
  assert.ok(!html.includes('href="javascript:'));
  assert.ok(html.includes('<code>&lt;b&gt;</code>'));
});

test('에이전트 비용은 이어진 세션의 누적값에서 차이만 기록', async () => {
  const { usageSince } = await import('../src/providers/claude-agent.js');
  const first = { cost: 0.3, input: 1000, output: 200, cachedInput: 5000, cacheWrite: 100 };
  assert.deepEqual(usageSince(null, first), first);
  const second = { cost: 0.5, input: 1500, output: 300, cachedInput: 9000, cacheWrite: 100 };
  const d = usageSince(first, second);
  assert.ok(Math.abs(d.cost - 0.2) < 1e-9);
  assert.equal(d.input, 500);
  assert.equal(d.cachedInput, 4000);
  // 세션이 새로 시작돼 누적값이 줄면 지금 값 전체를 사용량으로
  assert.deepEqual(usageSince(second, first), first);
});
