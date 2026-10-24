// 학생 작업 폴더 안에서만 동작하는 파일 도구 (Claude 이외 모델의 에이전트 모드용).
import fs from 'node:fs';
import path from 'node:path';
import { isInside } from '../providers/claude-agent.js';

const MAX_READ = 100_000;
const MAX_WRITE = 500_000;
const MAX_FILES = 300;

function resolveInside(root, rel) {
  if (typeof rel !== 'string' || !rel.trim()) throw new Error('path 가 필요합니다.');
  const target = path.resolve(root, rel);
  if (!isInside(root, target)) throw new Error('작업 폴더 밖의 경로는 쓸 수 없습니다.');
  // 이미 있는 경로라면 심볼릭 링크로 밖을 가리키는지도 확인
  let probe = target;
  while (!fs.existsSync(probe)) probe = path.dirname(probe);
  if (!isInside(fs.realpathSync(root), fs.realpathSync(probe))) throw new Error('작업 폴더 밖의 경로는 쓸 수 없습니다.');
  return target;
}

export function listFiles(root, rel = '.') {
  const start = resolveInside(root, rel || '.');
  if (!fs.existsSync(start)) return '(빈 폴더)';
  const out = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (out.length >= MAX_FILES) return;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.isFile()) out.push(`${path.relative(root, full)} (${fs.statSync(full).size}B)`);
    }
  };
  walk(start);
  return out.length ? out.join('\n') : '(빈 폴더)';
}

export function readFile(root, rel) {
  const target = resolveInside(root, rel);
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) throw new Error(`파일이 없습니다: ${rel}`);
  const text = fs.readFileSync(target, 'utf8');
  return text.length > MAX_READ ? `${text.slice(0, MAX_READ)}\n…(${text.length}자 중 앞부분만 표시)` : text;
}

export function writeFile(root, rel, content) {
  if (typeof content !== 'string') throw new Error('content 는 문자열이어야 합니다.');
  if (content.length > MAX_WRITE) throw new Error('파일이 너무 큽니다.');
  const target = resolveInside(root, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  return `저장했습니다: ${path.relative(root, target)} (${Buffer.byteLength(content)}B)`;
}

export function editFile(root, rel, oldText, newText) {
  const target = resolveInside(root, rel);
  if (!fs.existsSync(target)) throw new Error(`파일이 없습니다: ${rel}`);
  if (typeof oldText !== 'string' || !oldText) throw new Error('old_text 가 필요합니다.');
  const text = fs.readFileSync(target, 'utf8');
  const count = text.split(oldText).length - 1;
  if (count === 0) throw new Error('old_text 를 파일에서 찾지 못했습니다. read_file 로 내용을 먼저 확인하세요.');
  if (count > 1) throw new Error(`old_text 가 ${count}번 나옵니다. 더 길게 지정해 한 곳만 가리키게 하세요.`);
  fs.writeFileSync(target, text.replace(oldText, () => String(newText ?? '')));
  return `수정했습니다: ${path.relative(root, target)}`;
}
