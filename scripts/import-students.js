// 학생 명단 CSV(학번,이름)로 계정을 한꺼번에 만들고, 초기 비밀번호를 담은 CSV 를 출력합니다.
// 사용법: npm run import-students -- students.csv > passwords.csv
import fs from 'node:fs';
import { openDb, one, run } from '../src/db.js';
import { hashPassword, generatePassword } from '../src/auth.js';

const file = process.argv[2];
if (!file) {
  console.error('사용법: npm run import-students -- <학번,이름 CSV 파일>');
  process.exit(1);
}

openDb();
const lines = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/);
console.log('username,name,initial_password');
for (const line of lines) {
  const [username, ...rest] = line.split(',').map((s) => s.trim());
  if (!username || !/^[A-Za-z0-9._-]{2,40}$/.test(username)) continue; // 머리글/빈 줄 건너뜀
  const name = rest.join(' ') || username;
  if (one('SELECT id FROM users WHERE username = ?', username)) {
    console.error(`건너뜀(이미 있음): ${username}`);
    continue;
  }
  const password = generatePassword();
  run('INSERT INTO users (username, display_name, password_hash) VALUES (?, ?, ?)', username, name, hashPassword(password));
  console.log(`${username},${name},${password}`);
}
