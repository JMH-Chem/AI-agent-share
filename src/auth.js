import crypto from 'node:crypto';
import { config } from './config.js';
import { one, run, audit } from './db.js';

const COOKIE = 'cai_session';

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(password, stored) {
  const [scheme, saltB64, hashB64] = String(stored).split('$');
  if (scheme !== 'scrypt' || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = crypto.scryptSync(password, Buffer.from(saltB64, 'base64'), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

// 학생에게 나눠줄 초기 비밀번호 (헷갈리는 글자 0/O, 1/l 제외)
export function generatePassword(length = 10) {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

export function createSession(res, userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + config.sessionDays * 86400_000);
  run(
    'INSERT INTO auth_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)',
    sha256(token),
    userId,
    expires.toISOString(),
  );
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.secureCookies,
    expires,
    path: '/',
  });
}

export function destroySession(req, res) {
  const token = readCookie(req, COOKIE);
  if (token) run('DELETE FROM auth_sessions WHERE token_hash = ?', sha256(token));
  res.clearCookie(COOKIE, { path: '/' });
}

function readCookie(req, name) {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

// 모든 요청에서 쿠키를 확인해 req.user 를 채웁니다.
export function sessionMiddleware(req, _res, next) {
  const token = readCookie(req, COOKIE);
  if (token) {
    const row = one(
      `SELECT u.id, u.username, u.display_name, u.role, u.active, u.consented_at, s.expires_at
         FROM auth_sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ?`,
      sha256(token),
    );
    if (row && row.active && new Date(row.expires_at) > new Date()) {
      req.user = row;
    }
  }
  next();
}

export function requireUser(req, res, next) {
  if (!req.user) return res.status(401).json({ error: '로그인이 필요합니다.' });
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: '로그인이 필요합니다.' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: '교수자 권한이 필요합니다.' });
  next();
}

// 다른 사이트에서 몰래 보내는 요청(CSRF)을 막기 위해, 상태를 바꾸는 요청은
// JSON 본문 + 같은 출처(Origin)만 허용합니다.
export function csrfGuard(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const type = req.headers['content-type'] || '';
  if (!type.startsWith('application/json')) {
    return res.status(415).json({ error: 'application/json 요청만 허용됩니다.' });
  }
  const origin = req.headers.origin;
  if (origin) {
    let host;
    try {
      host = new URL(origin).host;
    } catch {
      host = null;
    }
    if (host !== req.headers.host) return res.status(403).json({ error: '허용되지 않은 출처입니다.' });
  }
  next();
}

// 비밀번호 무차별 대입을 늦추는 간단한 메모리 기반 제한
const attempts = new Map();
export function loginThrottle(key) {
  const now = Date.now();
  const entry = attempts.get(key) || { count: 0, first: now };
  if (now - entry.first > 15 * 60_000) {
    entry.count = 0;
    entry.first = now;
  }
  entry.count += 1;
  attempts.set(key, entry);
  return entry.count <= 10;
}

export function clearThrottle(key) {
  attempts.delete(key);
}

export function login(req, res, username, password) {
  const ip = req.ip;
  const key = `${ip}|${String(username).toLowerCase()}`;
  if (!loginThrottle(key)) {
    return { ok: false, status: 429, error: '로그인 시도가 너무 많습니다. 15분 뒤 다시 시도하세요.' };
  }
  const user = one('SELECT * FROM users WHERE username = ?', String(username).trim());
  if (!user || !user.active || !verifyPassword(String(password), user.password_hash)) {
    audit(user?.id, 'login_failed', { username }, ip);
    return { ok: false, status: 401, error: '아이디 또는 비밀번호가 올바르지 않습니다.' };
  }
  clearThrottle(key);
  createSession(res, user.id);
  audit(user.id, 'login', null, ip);
  return { ok: true, user };
}
