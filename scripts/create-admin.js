// 사용법: npm run create-admin -- <아이디> <비밀번호> [표시이름]
import { openDb, one, run } from '../src/db.js';
import { hashPassword } from '../src/auth.js';

const [username, password, displayName = '교수자'] = process.argv.slice(2);
if (!username || !password || password.length < 8) {
  console.error('사용법: npm run create-admin -- <아이디> <비밀번호(8자 이상)> [표시이름]');
  process.exit(1);
}

openDb();
const existing = one('SELECT id FROM users WHERE username = ?', username);
if (existing) {
  run("UPDATE users SET role = 'admin', password_hash = ?, active = 1 WHERE id = ?", hashPassword(password), existing.id);
  console.log(`'${username}' 계정을 교수자 권한으로 바꾸고 비밀번호를 재설정했습니다.`);
} else {
  run(
    "INSERT INTO users (username, display_name, password_hash, role, consented_at) VALUES (?, ?, ?, 'admin', datetime('now'))",
    username,
    displayName,
    hashPassword(password),
  );
  console.log(`교수자 계정 '${username}' 을(를) 만들었습니다.`);
}
