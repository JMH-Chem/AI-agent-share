// 에이전트의 코드 실행 도구. 학생 코드를 서버(교수자 PC)에서 그대로 돌리면 위험하므로
// 실행할 때마다 새 Docker 컨테이너를 만들어 그 안에서만 실행하고 바로 지웁니다.
// - 학생 작업 폴더만 /workspace 로 연결 (그 밖의 파일은 보이지 않음)
// - 인터넷 차단, 시스템 파일 읽기 전용, 권한 최소화, 메모리·CPU·프로세스 수·시간 제한
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';

const MAX_OUTPUT = 200_000;
const SANDBOX_UID = 1000;

export function codeExecEnabled() {
  return config.codeExec.mode === 'docker';
}

// 컨테이너 안에서 쓸 사용자. 포털을 일반 사용자로 돌리면 같은 사용자로, root 로 돌리면
// 작업 폴더 소유자를 1000 번으로 바꾸고 1000 번으로 실행합니다(컨테이너 안 root 금지).
function sandboxUser(root) {
  const c = config.codeExec;
  if (c.user) return c.user;
  if (typeof process.getuid !== 'function') return null; // Windows(Docker Desktop)는 자체 처리
  const uid = process.getuid();
  if (uid !== 0) return `${uid}:${process.getgid()}`;
  chownTree(root, SANDBOX_UID);
  return `${SANDBOX_UID}:${SANDBOX_UID}`;
}

function chownTree(dir, uid) {
  fs.chownSync(dir, uid, uid);
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isSymbolicLink()) continue;
    if (e.isDirectory()) chownTree(full, uid);
    else fs.chownSync(full, uid, uid);
  }
}

export function dockerArgs({ name, root, command, user }) {
  const c = config.codeExec;
  return [
    'run', '--rm', '--name', name,
    '--network', c.network ? 'bridge' : 'none',
    '--read-only',
    '--tmpfs', '/tmp:rw,exec,size=128m',
    '--memory', c.memory, '--memory-swap', c.memory,
    '--cpus', String(c.cpus),
    '--pids-limit', '128',
    '--cap-drop', 'ALL',
    '--security-opt', 'no-new-privileges',
    ...(c.runtime ? ['--runtime', c.runtime] : []),
    ...(user ? ['--user', user] : []),
    '-e', 'HOME=/tmp', '-e', 'MPLCONFIGDIR=/tmp', '-e', 'MPLBACKEND=Agg', '-e', 'PYTHONDONTWRITEBYTECODE=1',
    '-v', `${root}:/workspace:rw`,
    '-w', '/workspace',
    c.image,
    'sh', '-c', command,
  ];
}

// 성공(종료 코드 0)이면 출력 문자열을, 실패·시간 초과면 출력을 담은 Error 를 던집니다.
export function runCommand(root, command, { signal } = {}) {
  if (typeof command !== 'string' || !command.trim()) return Promise.reject(new Error('command 가 필요합니다.'));
  if (command.length > 10_000) return Promise.reject(new Error('명령이 너무 깁니다.'));
  const c = config.codeExec;
  fs.mkdirSync(root, { recursive: true });
  const name = `cai-${crypto.randomBytes(6).toString('hex')}`;
  const args = dockerArgs({ name, root, command, user: sandboxUser(root) });

  return new Promise((resolve, reject) => {
    const child = spawn(c.dockerBin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let truncated = false;
    const onData = (d) => {
      if (out.length < MAX_OUTPUT) out += d.toString();
      else truncated = true;
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);

    let timedOut = false;
    const kill = () => spawn(c.dockerBin, ['kill', name], { stdio: 'ignore' }).on('error', () => {});
    const timer = setTimeout(() => {
      timedOut = true;
      kill();
    }, c.timeoutSec * 1000);
    const onAbort = () => kill();
    signal?.addEventListener('abort', onAbort, { once: true });

    const finish = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    };
    child.on('error', (err) => {
      finish();
      reject(new Error(`코드 실행 환경(Docker)을 쓸 수 없습니다: ${err.message}`));
    });
    child.on('close', (code) => {
      finish();
      const body = (out.trim() || '(출력 없음)') + (truncated ? '\n…(출력이 너무 길어 일부만 표시)' : '');
      if (timedOut) return reject(new Error(`${c.timeoutSec}초 안에 끝나지 않아 중단했습니다.\n${body}`));
      if (code === 0) return resolve(`종료 코드 0\n${body}`);
      // 125 는 Docker 자체 오류(이미지 없음, 데몬 꺼짐 등)
      if (code === 125) return reject(new Error(`코드 실행 환경(Docker) 오류: ${body}`));
      reject(new Error(`종료 코드 ${code}\n${body}`));
    });
  });
}

// 서버 시작 때 Docker 를 쓸 수 있는지 미리 확인
export function checkDocker() {
  return new Promise((resolve) => {
    const child = spawn(config.codeExec.dockerBin, ['image', 'inspect', config.codeExec.image], { stdio: 'ignore' });
    child.on('error', () => resolve('Docker 를 찾을 수 없습니다. 코드 실행 기능이 동작하지 않습니다.'));
    child.on('close', (code) =>
      resolve(code === 0 ? null : `실행 이미지 ${config.codeExec.image} 가 없거나 Docker 가 꺼져 있습니다. 'docker pull ${config.codeExec.image}' 또는 README 의 이미지 만들기를 먼저 하세요.`),
    );
  });
}
