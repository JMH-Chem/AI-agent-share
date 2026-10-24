// 에이전트 코드 실행(Docker 격리) 검사. Docker 와 python:3.12-slim 이미지가 없으면 건너뜁니다.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';

const hasDocker = spawnSync('docker', ['image', 'inspect', 'python:3.12-slim'], { stdio: 'ignore' }).status === 0;
const skip = hasDocker ? false : 'Docker 또는 python:3.12-slim 이미지가 없음';

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'class-ai-exec-'));
let server;
let script = [];
let exec;
let compat;

before(async () => {
  server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (d) => (body += d));
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'text/event-stream' });
      for (const c of script.shift() || []) res.write(`data: ${JSON.stringify({ id: 'x', object: 'chat.completion.chunk', model: 'fake', ...c })}\n\n`);
      res.end('data: [DONE]\n\n');
    });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  Object.assign(process.env, {
    DATA_DIR: dataDir,
    CODE_EXEC: 'docker',
    CODE_EXEC_TIMEOUT_SEC: '3',
    COMPAT_1_BASE_URL: `http://127.0.0.1:${server.address().port}/v1`,
    COMPAT_1_MODEL: 'fake',
    COMPAT_1_AGENT: 'true',
    SEARCH_PROVIDER: '',
  });
  exec = await import('../src/tools/exec.js');
  compat = await import('../src/providers/compat.js');
});

after(() => {
  server.close();
  fs.rmSync(dataDir, { recursive: true, force: true });
});

const ws = (name) => {
  const dir = path.join(dataDir, 'ws', name);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

test('파이썬 실행 결과와 만든 파일이 작업 폴더에 남음', { skip }, async () => {
  const dir = ws('basic');
  fs.writeFileSync(path.join(dir, 'main.py'), 'print(1 + 2)\nopen("out.txt", "w").write("hi")\n');
  const out = await exec.runCommand(dir, 'python main.py');
  assert.equal(out, '종료 코드 0\n3');
  assert.equal(fs.readFileSync(path.join(dir, 'out.txt'), 'utf8'), 'hi');
});

test('인터넷 차단, 작업 폴더 밖 파일은 보이지 않음, 시스템 파일은 읽기 전용', { skip }, async () => {
  const dir = ws('isolation');
  fs.writeFileSync(
    path.join(dir, 'probe.py'),
    [
      'import os, socket',
      'try:',
      '    socket.create_connection(("1.1.1.1", 80), timeout=3); print("NET OPEN")',
      'except OSError: print("NET BLOCKED")',
      `print("HOST VISIBLE" if os.path.exists(${JSON.stringify(dataDir)}) else "HOST HIDDEN")`,
      'try:',
      '    open("/usr/evil", "w"); print("ROOT WRITABLE")',
      'except OSError: print("ROOT READONLY")',
      'print("UID", os.getuid())',
    ].join('\n'),
  );
  const out = await exec.runCommand(dir, 'python probe.py');
  assert.match(out, /NET BLOCKED/);
  assert.match(out, /HOST HIDDEN/);
  assert.match(out, /ROOT READONLY/);
  assert.doesNotMatch(out, /UID 0\b/);
});

test('시간 초과와 오류 종료는 실패로 돌려줌', { skip }, async () => {
  const dir = ws('fail');
  await assert.rejects(exec.runCommand(dir, 'sleep 20'), /3초 안에 끝나지 않아/);
  await assert.rejects(exec.runCommand(dir, 'python -c "raise ValueError(\'boom\')"'), /종료 코드 1[\s\S]*ValueError: boom/);
});

test('에이전트가 코드를 만들고 실행해 결과를 확인', { skip }, async () => {
  const call = (id, name, args) => ({
    choices: [{ index: 0, delta: { tool_calls: [{ index: 0, id, type: 'function', function: { name, arguments: JSON.stringify(args) } }] }, finish_reason: 'tool_calls' }],
  });
  script = [
    [call('w', 'write_file', { path: 'sq.py', content: 'print([i * i for i in range(5)])\n' })],
    [call('r', 'run_command', { command: 'python sq.py' })],
    [{ choices: [{ index: 0, delta: { content: '실행 결과는 [0, 1, 4, 9, 16] 입니다.' }, finish_reason: 'stop' }] }],
  ];
  const agent = compat.compatProviders.find((p) => p.id === 'compat-1-agent');
  const events = [];
  for await (const ev of agent.run({ user: { id: 1 }, conversation: { id: 9 }, history: [], userText: '제곱수 출력 코드' })) events.push(ev);
  const done = events.at(-1);
  const run = done.meta.steps.find((s) => s.name === 'run_command');
  assert.equal(run.isError, false);
  assert.match(run.output, /\[0, 1, 4, 9, 16\]/);
  assert.match(done.text, /실행 결과/);
});
