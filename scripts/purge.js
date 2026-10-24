// 보존 기간이 지난 기록을 지웁니다 (개인정보 파기용).
// 사용법: npm run purge -- 2027-03-01          → 이 날짜 이전에 마지막으로 쓰인 대화·파일·감사 기록 삭제
//         npm run purge -- 2027-03-01 --yes    → 확인 없이 바로 삭제
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { openDb, all, one, run } from '../src/db.js';
import { config } from '../src/config.js';

const [before, flag] = process.argv.slice(2);
if (!/^\d{4}-\d{2}-\d{2}$/.test(before || '')) {
  console.error('사용법: npm run purge -- <YYYY-MM-DD> [--yes]');
  process.exit(1);
}

openDb();
const convs = all('SELECT id, user_id FROM conversations WHERE updated_at < ?', before);
const msgCount = one(
  'SELECT COUNT(*) AS n FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE updated_at < ?)',
  before,
).n;
const auditCount = one('SELECT COUNT(*) AS n FROM audit_log WHERE created_at < ?', before).n;
console.log(`${before} 이전: 대화 ${convs.length}개, 메시지 ${msgCount}개, 감사 기록 ${auditCount}개를 지웁니다.`);

if (flag !== '--yes') {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question('정말 지울까요? 되돌릴 수 없습니다. (yes 입력): ');
  rl.close();
  if (answer.trim() !== 'yes') {
    console.log('취소했습니다.');
    process.exit(0);
  }
}

for (const c of convs) {
  fs.rmSync(path.join(config.agent.workspaceRoot, String(c.user_id), String(c.id)), { recursive: true, force: true });
}
run('DELETE FROM conversations WHERE updated_at < ?', before); // 메시지는 함께 삭제됨(ON DELETE CASCADE)
run('DELETE FROM audit_log WHERE created_at < ?', before);
run("DELETE FROM auth_sessions WHERE expires_at < datetime('now')");
run('VACUUM');
console.log('삭제했습니다. 에이전트 세션 기록(data/claude-config)은 학기 종료 후 폴더째 지우세요.');
