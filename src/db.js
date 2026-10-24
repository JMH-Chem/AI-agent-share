// SQLite 한 파일(data/class-ai.db)에 계정, 대화, 메시지, 감사 로그를 모두 저장합니다.
// Node 22 내장 node:sqlite 를 써서 별도 네이티브 모듈 설치가 필요 없습니다.
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { config, ensureDirs } from './config.js';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  active INTEGER NOT NULL DEFAULT 1,
  consented_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '새 대화',
  provider TEXT NOT NULL,
  model TEXT,
  agent_session_id TEXT,
  agent_totals TEXT, -- 에이전트 세션 누적 사용량(JSON). 메시지별 비용을 차이로 계산하는 데 사용
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id, updated_at);

-- role: user | assistant | tool | error
-- meta: 도구 호출 입력/결과, 인용 출처 등 (JSON)
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  meta TEXT,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);

-- 로그인, 한도 초과, 관리자 열람 등 감사 기록
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  detail TEXT,
  ip TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
`;

let db;

export function openDb(file = path.join(config.dataDir, 'class-ai.db')) {
  if (file !== ':memory:') ensureDirs();
  db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  db.exec(SCHEMA);
  return db;
}

export function getDb() {
  if (!db) openDb();
  return db;
}

const plain = (row) => (row ? { ...row } : row);

export function one(sql, ...params) {
  return plain(getDb().prepare(sql).get(...params));
}

export function all(sql, ...params) {
  return getDb().prepare(sql).all(...params).map(plain);
}

export function run(sql, ...params) {
  return getDb().prepare(sql).run(...params);
}

export function audit(userId, type, detail = null, ip = null) {
  run(
    'INSERT INTO audit_log (user_id, type, detail, ip) VALUES (?, ?, ?, ?)',
    userId ?? null,
    type,
    detail == null ? null : JSON.stringify(detail),
    ip,
  );
}

export function addMessage(conversationId, msg) {
  const r = run(
    `INSERT INTO messages (conversation_id, role, content, meta, input_tokens, output_tokens, cost_usd)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    conversationId,
    msg.role,
    msg.content ?? '',
    msg.meta == null ? null : JSON.stringify(msg.meta),
    msg.inputTokens ?? 0,
    msg.outputTokens ?? 0,
    msg.costUsd ?? 0,
  );
  run("UPDATE conversations SET updated_at = datetime('now') WHERE id = ?", conversationId);
  return Number(r.lastInsertRowid);
}

// 학생 한 명의 오늘(서버 시간대 기준) 사용량
export function usageToday(userId) {
  return one(
    `SELECT COALESCE(SUM(m.input_tokens + m.output_tokens), 0) AS tokens,
            COALESCE(SUM(m.cost_usd), 0) AS cost
       FROM messages m JOIN conversations c ON c.id = m.conversation_id
      WHERE c.user_id = ? AND date(m.created_at, 'localtime') = date('now', 'localtime')`,
    userId,
  );
}

export function costThisMonth() {
  return one(
    `SELECT COALESCE(SUM(cost_usd), 0) AS cost FROM messages
      WHERE strftime('%Y-%m', created_at, 'localtime') = strftime('%Y-%m', 'now', 'localtime')`,
  ).cost;
}
