import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import express from 'express';
import { config } from './config.js';
import { openDb, one, all, run, audit, addMessage, usageToday, costThisMonth } from './db.js';
import {
  sessionMiddleware,
  requireUser,
  requireAdmin,
  csrfGuard,
  login,
  destroySession,
  createSession,
  hashPassword,
  verifyPassword,
  generatePassword,
} from './auth.js';
import { listProviders, getProvider, defaultProviderId } from './providers/index.js';
import { workspaceDir, isInside } from './providers/claude-agent.js';
import { codeExecEnabled, checkDocker } from './tools/exec.js';

const CONSENT_TEXT =
  process.env.CONSENT_TEXT ||
  `이 서비스는 ${config.className} 수업 운영을 위해 제공되는 AI(인공지능) 도우미입니다. 답변은 사람이 아닌 AI가 작성합니다. ` +
    '여기서 입력한 모든 질문과 AI의 답변, AI가 사용한 도구(웹 검색, 파일 작업)의 기록은 ' +
    '담당 교수자가 학습 지도와 평가 목적으로 열람합니다. 기록은 학기 종료 후 정해진 기간이 지나면 삭제됩니다. ' +
    '개인정보(주민등록번호, 연락처, 비밀번호 등)는 입력하지 마세요. 입력한 내용은 AI 제공사(Anthropic/OpenAI)의 API로 전송됩니다.';

const MAX_PROMPT_CHARS = 20000;
const running = new Map(); // userId -> AbortController (학생당 동시에 1개 요청)

export function createApp() {
  const app = express();
  if (config.trustProxy) app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use((_req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'same-origin',
      'Content-Security-Policy':
        "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
    });
    next();
  });
  app.use(express.json({ limit: '1mb' }));
  app.use(sessionMiddleware);
  app.use('/api', csrfGuard);
  app.use(express.static(path.join(config.root, 'public'), { extensions: ['html'] }));

  const api = express.Router();
  app.use('/api', api);

  // ---------- 공개 ----------
  api.get('/config', (_req, res) => {
    res.json({ className: config.className, joinEnabled: Boolean(config.classJoinCode), consentText: CONSENT_TEXT, modelNotice: config.modelNotice });
  });

  // 로그인 화면에서 이미 로그인되어 있는지 확인하는 용도 (401 없이 응답)
  api.get('/session', (req, res) => {
    res.json(req.user ? { loggedIn: true, role: req.user.role } : { loggedIn: false });
  });

  api.post('/login', (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: '아이디와 비밀번호를 입력하세요.' });
    const r = login(req, res, username, password);
    if (!r.ok) return res.status(r.status).json({ error: r.error });
    res.json({ ok: true, role: r.user.role });
  });

  api.post('/signup', (req, res) => {
    if (!config.classJoinCode) return res.status(403).json({ error: '자가 가입이 꺼져 있습니다. 교수자에게 계정을 요청하세요.' });
    const { joinCode, username, displayName, password } = req.body || {};
    if (joinCode !== config.classJoinCode) return res.status(403).json({ error: '수업 참여 코드가 올바르지 않습니다.' });
    const err = validateNewUser(username, displayName, password);
    if (err) return res.status(400).json({ error: err });
    if (one('SELECT id FROM users WHERE username = ?', username.trim())) {
      return res.status(409).json({ error: '이미 등록된 아이디입니다.' });
    }
    const r = run(
      'INSERT INTO users (username, display_name, password_hash) VALUES (?, ?, ?)',
      username.trim(),
      displayName.trim(),
      hashPassword(password),
    );
    const userId = Number(r.lastInsertRowid);
    audit(userId, 'signup', null, req.ip);
    createSession(res, userId);
    res.json({ ok: true, role: 'student' });
  });

  api.post('/logout', (req, res) => {
    if (req.user) audit(req.user.id, 'logout', null, req.ip);
    destroySession(req, res);
    res.json({ ok: true });
  });

  // ---------- 로그인 사용자 ----------
  api.get('/me', requireUser, (req, res) => {
    const usage = usageToday(req.user.id);
    res.json({
      user: pickUser(req.user),
      usage,
      limits: { dailyTokens: config.dailyTokenLimit, dailyCostUsd: config.dailyCostLimitUsd },
      providers: listProviders().filter((p) => p.available),
      defaultProvider: defaultProviderId(),
    });
  });

  api.post('/consent', requireUser, (req, res) => {
    run("UPDATE users SET consented_at = datetime('now') WHERE id = ?", req.user.id);
    audit(req.user.id, 'consent', { text: CONSENT_TEXT }, req.ip);
    res.json({ ok: true });
  });

  api.post('/password', requireUser, (req, res) => {
    const { current, next } = req.body || {};
    const user = one('SELECT password_hash FROM users WHERE id = ?', req.user.id);
    if (!verifyPassword(String(current || ''), user.password_hash)) {
      return res.status(400).json({ error: '현재 비밀번호가 올바르지 않습니다.' });
    }
    if (!next || String(next).length < 8) return res.status(400).json({ error: '새 비밀번호는 8자 이상이어야 합니다.' });
    run('UPDATE users SET password_hash = ? WHERE id = ?', hashPassword(String(next)), req.user.id);
    audit(req.user.id, 'password_changed', null, req.ip);
    res.json({ ok: true });
  });

  api.get('/conversations', requireUser, (req, res) => {
    res.json(
      all(
        'SELECT id, title, provider, model, created_at, updated_at FROM conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 200',
        req.user.id,
      ),
    );
  });

  api.post('/conversations', requireUser, (req, res) => {
    const providerId = req.body?.provider || defaultProviderId();
    const provider = getProvider(providerId);
    if (!provider) return res.status(400).json({ error: '사용할 수 있는 AI가 없습니다. 교수자에게 문의하세요.' });
    const r = run(
      'INSERT INTO conversations (user_id, provider, model) VALUES (?, ?, ?)',
      req.user.id,
      provider.id,
      provider.model(),
    );
    res.json(one('SELECT * FROM conversations WHERE id = ?', Number(r.lastInsertRowid)));
  });

  api.get('/conversations/:id', requireUser, (req, res) => {
    const conv = ownConversation(req, res);
    if (!conv) return;
    res.json({ conversation: conv, messages: conversationMessages(conv.id) });
  });

  api.post('/conversations/:id/messages', requireUser, async (req, res) => {
    const conv = ownConversation(req, res);
    if (!conv) return;
    await handleMessage(req, res, conv);
  });

  api.get('/conversations/:id/files', requireUser, (req, res) => {
    const conv = ownConversation(req, res);
    if (!conv) return;
    res.json(listWorkspace(conv));
  });

  api.get('/conversations/:id/file', requireUser, (req, res) => {
    const conv = ownConversation(req, res);
    if (!conv) return;
    sendWorkspaceFile(req, res, conv);
  });

  // ---------- 교수자(관리자) ----------
  const admin = express.Router();
  api.use('/admin', requireAdmin, admin);

  admin.get('/overview', (_req, res) => {
    const students = all(
      `SELECT u.id, u.username, u.display_name, u.role, u.active, u.consented_at, u.created_at,
              COUNT(DISTINCT c.id) AS conversations,
              COUNT(CASE WHEN m.role = 'user' THEN 1 END) AS prompts,
              COALESCE(SUM(m.input_tokens + m.output_tokens), 0) AS tokens,
              COALESCE(SUM(m.cost_usd), 0) AS cost,
              MAX(m.created_at) AS last_active
         FROM users u
         LEFT JOIN conversations c ON c.user_id = u.id
         LEFT JOIN messages m ON m.conversation_id = c.id
        GROUP BY u.id
        ORDER BY u.role DESC, u.username`,
    );
    const today = one(
      `SELECT COUNT(CASE WHEN role = 'user' THEN 1 END) AS prompts,
              COALESCE(SUM(input_tokens + output_tokens), 0) AS tokens,
              COALESCE(SUM(cost_usd), 0) AS cost
         FROM messages WHERE date(created_at, 'localtime') = date('now', 'localtime')`,
    );
    res.json({
      students,
      today,
      monthCost: costThisMonth(),
      monthlyBudgetUsd: config.monthlyBudgetUsd,
      limits: { dailyTokens: config.dailyTokenLimit, dailyCostUsd: config.dailyCostLimitUsd },
      providers: listProviders(),
    });
  });

  admin.get('/users/:id/conversations', (req, res) => {
    const user = one('SELECT * FROM users WHERE id = ?', Number(req.params.id));
    if (!user) return res.status(404).json({ error: '사용자가 없습니다.' });
    const conversations = all(
      `SELECT c.id, c.title, c.provider, c.model, c.created_at, c.updated_at,
              COUNT(m.id) AS messages, COALESCE(SUM(m.cost_usd), 0) AS cost
         FROM conversations c LEFT JOIN messages m ON m.conversation_id = c.id
        WHERE c.user_id = ? GROUP BY c.id ORDER BY c.updated_at DESC`,
      user.id,
    );
    res.json({ user: pickUser(user), conversations });
  });

  admin.get('/conversations/:id', (req, res) => {
    const conv = one(
      `SELECT c.*, u.username, u.display_name FROM conversations c JOIN users u ON u.id = c.user_id WHERE c.id = ?`,
      Number(req.params.id),
    );
    if (!conv) return res.status(404).json({ error: '대화가 없습니다.' });
    audit(req.user.id, 'admin_view_conversation', { conversationId: conv.id, studentId: conv.user_id }, req.ip);
    res.json({ conversation: conv, messages: conversationMessages(conv.id) });
  });

  admin.get('/conversations/:id/files', (req, res) => {
    const conv = one('SELECT * FROM conversations WHERE id = ?', Number(req.params.id));
    if (!conv) return res.status(404).json({ error: '대화가 없습니다.' });
    res.json(listWorkspace(conv));
  });

  admin.get('/conversations/:id/file', (req, res) => {
    const conv = one('SELECT * FROM conversations WHERE id = ?', Number(req.params.id));
    if (!conv) return res.status(404).json({ error: '대화가 없습니다.' });
    sendWorkspaceFile(req, res, conv);
  });

  admin.get('/search', (req, res) => {
    const q = String(req.query.q || '').trim();
    if (!q) return res.json([]);
    const like = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    res.json(
      all(
        `SELECT m.id, m.role, substr(m.content, 1, 300) AS snippet, m.created_at, c.id AS conversation_id, c.title,
                u.id AS user_id, u.username, u.display_name
           FROM messages m JOIN conversations c ON c.id = m.conversation_id JOIN users u ON u.id = c.user_id
          WHERE m.content LIKE ? ESCAPE '\\'
          ORDER BY m.id DESC LIMIT 200`,
        like,
      ),
    );
  });

  admin.get('/export.csv', (req, res) => {
    const rows = all(
      `SELECT m.id, m.created_at, u.username, u.display_name, c.id AS conversation_id, c.title, c.provider, c.model,
              m.role, m.content, m.meta, m.input_tokens, m.output_tokens, m.cost_usd
         FROM messages m JOIN conversations c ON c.id = m.conversation_id JOIN users u ON u.id = c.user_id
        ORDER BY m.id`,
    );
    const header = ['message_id', 'created_at', 'username', 'name', 'conversation_id', 'title', 'provider', 'model', 'role', 'content', 'tools', 'input_tokens', 'output_tokens', 'cost_usd'];
    const lines = [header.join(',')];
    for (const r of rows) {
      const steps = safeJson(r.meta)?.steps || [];
      const tools = steps.filter((s) => s.type === 'tool').map((s) => `${s.name}:${JSON.stringify(s.input ?? '')}`).join(' | ');
      lines.push(
        [r.id, r.created_at, r.username, r.display_name, r.conversation_id, r.title, r.provider, r.model, r.role, r.content, tools, r.input_tokens, r.output_tokens, r.cost_usd.toFixed(6)]
          .map(csvCell)
          .join(','),
      );
    }
    audit(req.user.id, 'admin_export', { rows: rows.length }, req.ip);
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', `attachment; filename="class-ai-log-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send('\uFEFF' + lines.join('\r\n')); // BOM: 엑셀에서 한글이 깨지지 않도록
  });

  admin.post('/users/bulk', (req, res) => {
    const text = String(req.body?.lines || '');
    const created = [];
    const skipped = [];
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line) continue;
      const [username, ...rest] = line.split(/[,\t]|\s+/).map((s) => s.trim()).filter(Boolean);
      const displayName = rest.join(' ') || username;
      if (!/^[A-Za-z0-9._-]{2,40}$/.test(username || '')) {
        skipped.push({ line, reason: '아이디는 영문/숫자/._- 2~40자' });
        continue;
      }
      if (one('SELECT id FROM users WHERE username = ?', username)) {
        skipped.push({ line, reason: '이미 있음' });
        continue;
      }
      const password = generatePassword();
      run('INSERT INTO users (username, display_name, password_hash) VALUES (?, ?, ?)', username, displayName, hashPassword(password));
      created.push({ username, displayName, password });
    }
    audit(req.user.id, 'admin_bulk_create', { count: created.length }, req.ip);
    res.json({ created, skipped });
  });

  admin.post('/users/:id/reset-password', (req, res) => {
    const user = one('SELECT id, username FROM users WHERE id = ?', Number(req.params.id));
    if (!user) return res.status(404).json({ error: '사용자가 없습니다.' });
    const password = generatePassword();
    run('UPDATE users SET password_hash = ? WHERE id = ?', hashPassword(password), user.id);
    run('DELETE FROM auth_sessions WHERE user_id = ?', user.id);
    audit(req.user.id, 'admin_reset_password', { userId: user.id }, req.ip);
    res.json({ username: user.username, password });
  });

  admin.post('/users/:id/active', (req, res) => {
    const id = Number(req.params.id);
    if (id === req.user.id) return res.status(400).json({ error: '자기 계정은 비활성화할 수 없습니다.' });
    const active = req.body?.active ? 1 : 0;
    run('UPDATE users SET active = ? WHERE id = ?', active, id);
    if (!active) run('DELETE FROM auth_sessions WHERE user_id = ?', id);
    audit(req.user.id, 'admin_set_active', { userId: id, active }, req.ip);
    res.json({ ok: true });
  });

  admin.get('/audit', (_req, res) => {
    res.json(
      all(
        `SELECT a.id, a.type, a.detail, a.ip, a.created_at, u.username, u.display_name
           FROM audit_log a LEFT JOIN users u ON u.id = a.user_id ORDER BY a.id DESC LIMIT 300`,
      ),
    );
  });

  // API 오류는 JSON 으로
  app.use('/api', (_req, res) => res.status(404).json({ error: '없는 API 입니다.' }));
  app.use((err, _req, res, _next) => {
    console.error(err);
    if (res.headersSent) return res.end();
    res.status(err.status || 500).json({ error: err.expose ? err.message : '서버 오류가 발생했습니다.' });
  });

  return app;
}

// ---------- 메시지 처리 (스트리밍) ----------
async function handleMessage(req, res, conv) {
  const user = req.user;
  const text = String(req.body?.text || '').trim();
  if (!text) return res.status(400).json({ error: '질문을 입력하세요.' });
  if (text.length > MAX_PROMPT_CHARS) return res.status(400).json({ error: `질문은 ${MAX_PROMPT_CHARS}자 이하로 입력하세요.` });
  if (!user.consented_at) return res.status(403).json({ error: '먼저 기록 열람 안내에 동의해야 합니다.' });

  const provider = getProvider(conv.provider);
  if (!provider) return res.status(400).json({ error: '이 대화에 쓰던 AI가 지금은 꺼져 있습니다. 새 대화를 만드세요.' });

  if (user.role !== 'admin') {
    const blocked = quotaBlock(user.id);
    if (blocked) {
      audit(user.id, 'quota_block', { reason: blocked }, req.ip);
      return res.status(429).json({ error: blocked });
    }
  }
  if (running.has(user.id)) return res.status(409).json({ error: '이전 질문에 대한 답변이 아직 진행 중입니다.' });

  const history = all(
    "SELECT role, content FROM messages WHERE conversation_id = ? AND role IN ('user', 'assistant') AND content != '' ORDER BY id",
    conv.id,
  );
  addMessage(conv.id, { role: 'user', content: text });
  if (conv.title === '새 대화') {
    run('UPDATE conversations SET title = ? WHERE id = ?', text.replace(/\s+/g, ' ').slice(0, 40), conv.id);
  }

  const controller = new AbortController();
  running.set(user.id, controller);
  res.on('close', () => {
    if (!res.writableFinished) controller.abort();
  });

  res.status(200).set({
    'Content-Type': 'application/x-ndjson; charset=utf-8',
    'Cache-Control': 'no-cache',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  const send = (obj) => {
    if (!res.writableEnded) res.write(JSON.stringify(obj) + '\n');
  };

  let partial = '';
  const liveSteps = [];
  try {
    for await (const ev of provider.run({ user, conversation: conv, history, userText: text, signal: controller.signal })) {
      if (ev.type === 'text') partial += ev.delta;
      if (ev.type === 'tool') liveSteps.push({ type: 'tool', name: ev.name, input: ev.input });
      if (ev.type === 'session') {
        run('UPDATE conversations SET agent_session_id = ? WHERE id = ?', ev.sessionId, conv.id);
        continue;
      }
      if (ev.type === 'done') {
        if (ev.sessionId) run('UPDATE conversations SET agent_session_id = ? WHERE id = ?', ev.sessionId, conv.id);
        if (ev.agentTotals) run('UPDATE conversations SET agent_totals = ? WHERE id = ?', JSON.stringify(ev.agentTotals), conv.id);
        const id = addMessage(conv.id, {
          role: 'assistant',
          content: ev.text,
          meta: { ...ev.meta, model: ev.model },
          inputTokens: (ev.usage.input || 0) + (ev.usage.cachedInput || 0) + (ev.usage.cacheWrite || 0),
          outputTokens: ev.usage.output || 0,
          costUsd: ev.costUsd || 0,
        });
        send({ type: 'done', messageId: id, costUsd: ev.costUsd, usage: ev.usage, meta: ev.meta });
        continue;
      }
      send(ev);
    }
  } catch (err) {
    const aborted = controller.signal.aborted;
    const message = aborted ? '사용자가 답변을 중단했습니다.' : friendlyError(err);
    if (!aborted) console.error(`[${provider.id}]`, err);
    if (partial) {
      addMessage(conv.id, { role: 'assistant', content: partial, meta: { steps: liveSteps, aborted: true } });
    }
    addMessage(conv.id, { role: 'error', content: message });
    send({ type: 'error', message });
  } finally {
    running.delete(user.id);
    res.end();
  }
}

function quotaBlock(userId) {
  if (config.monthlyBudgetUsd > 0 && costThisMonth() >= config.monthlyBudgetUsd) {
    return '이번 달 수업용 AI 예산을 모두 사용했습니다. 교수자에게 문의하세요.';
  }
  const u = usageToday(userId);
  if (config.dailyTokenLimit > 0 && u.tokens >= config.dailyTokenLimit) {
    return '오늘 사용할 수 있는 양을 모두 썼습니다. 내일 다시 이용하세요.';
  }
  if (config.dailyCostLimitUsd > 0 && u.cost >= config.dailyCostLimitUsd) {
    return '오늘 사용할 수 있는 양을 모두 썼습니다. 내일 다시 이용하세요.';
  }
  return null;
}

function friendlyError(err) {
  const status = err?.status;
  if (status === 401 || status === 403) return 'AI API 키가 올바르지 않거나 권한이 없습니다. 교수자에게 알려주세요.';
  if (status === 429) return '요청이 몰려 잠시 제한되었습니다. 30초 뒤 다시 시도하세요.';
  if (status === 529 || status === 503) return 'AI 서버가 혼잡합니다. 잠시 뒤 다시 시도하세요.';
  if (status === 400) return `요청을 처리하지 못했습니다: ${err.message}`;
  return err?.message ? `오류: ${err.message}` : '알 수 없는 오류가 발생했습니다.';
}

// ---------- 도우미 ----------
function validateNewUser(username, displayName, password) {
  if (!/^[A-Za-z0-9._-]{2,40}$/.test(String(username || '').trim())) return '아이디(학번)는 영문/숫자/._- 2~40자로 입력하세요.';
  if (!String(displayName || '').trim()) return '이름을 입력하세요.';
  if (String(password || '').length < 8) return '비밀번호는 8자 이상이어야 합니다.';
  return null;
}

function pickUser(u) {
  return { id: u.id, username: u.username, displayName: u.display_name, role: u.role, active: u.active, consentedAt: u.consented_at };
}

function ownConversation(req, res) {
  const conv = one('SELECT * FROM conversations WHERE id = ? AND user_id = ?', Number(req.params.id), req.user.id);
  if (!conv) res.status(404).json({ error: '대화를 찾을 수 없습니다.' });
  return conv;
}

function conversationMessages(convId) {
  return all(
    'SELECT id, role, content, meta, input_tokens, output_tokens, cost_usd, created_at FROM messages WHERE conversation_id = ? ORDER BY id',
    convId,
  ).map((m) => ({ ...m, meta: safeJson(m.meta) }));
}

function listWorkspace(conv) {
  const root = workspaceDir(conv.user_id, conv.id);
  if (!fs.existsSync(root)) return [];
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (files.length >= 500) return;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) {
        const st = fs.statSync(full);
        files.push({ path: path.relative(root, full), size: st.size, modified: st.mtime.toISOString() });
      }
    }
  };
  walk(root);
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

function sendWorkspaceFile(req, res, conv) {
  const root = workspaceDir(conv.user_id, conv.id);
  const target = path.resolve(root, String(req.query.path || ''));
  if (!isInside(root, target) || !fs.existsSync(target) || !fs.statSync(target).isFile()) {
    return res.status(404).json({ error: '파일이 없습니다.' });
  }
  if (!isInside(fs.realpathSync(root), fs.realpathSync(target))) return res.status(404).json({ error: '파일이 없습니다.' });
  // 학생이 만든 HTML 이 이 사이트에서 실행되지 않도록 항상 내려받기로 보냅니다.
  res.set('Content-Type', 'application/octet-stream');
  res.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(path.basename(target))}`);
  if (req.query.preview === '1') {
    const st = fs.statSync(target);
    // 그림은 바로 보여 주되, 스크립트를 품을 수 있는 SVG 는 내려받기만 허용
    const imageType = IMAGE_TYPES[path.extname(target).toLowerCase()];
    if (imageType) {
      if (st.size > 5_000_000) return res.status(413).json({ error: '미리보기는 5MB 이하 그림만 됩니다.' });
      res.set('Content-Type', imageType);
    } else {
      if (st.size > 200_000) return res.status(413).json({ error: '미리보기는 200KB 이하 파일만 됩니다.' });
      res.set('Content-Type', 'text/plain; charset=utf-8');
    }
    res.set('Content-Disposition', 'inline');
  }
  fs.createReadStream(target).pipe(res);
}

const IMAGE_TYPES = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp' };

function safeJson(s) {
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function csvCell(v) {
  const s = v == null ? '' : String(v);
  // 엑셀 수식 주입 방지
  const guarded = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\r\n]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

function bootstrapAdmin() {
  const hasAdmin = one("SELECT id FROM users WHERE role = 'admin'");
  if (hasAdmin) return;
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 8) {
    console.warn('교수자 계정이 없습니다. `npm run create-admin -- <아이디> <비밀번호>` 로 만들거나 ADMIN_PASSWORD(8자 이상)를 설정하세요.');
    return;
  }
  run(
    "INSERT INTO users (username, display_name, password_hash, role, consented_at) VALUES (?, ?, ?, 'admin', datetime('now'))",
    username,
    '교수자',
    hashPassword(password),
  );
  console.log(`교수자 계정 '${username}' 을(를) 만들었습니다.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  openDb();
  bootstrapAdmin();
  const providers = listProviders();
  createApp().listen(config.port, config.host, () => {
    console.log(`${config.className} 포털: http://localhost:${config.port}`);
    for (const p of providers) console.log(`  - ${p.available ? '켜짐' : '꺼짐'}  ${p.label} (${p.model || '모델 미지정'})`);
    if (codeExecEnabled()) {
      checkDocker().then((warning) => console.log(warning ? `  ! ${warning}` : `  - 코드 실행: Docker 격리 실행 (${config.codeExec.image})`));
    }
    if (!providers.some((p) => p.available)) {
      console.warn('사용 가능한 AI 가 없습니다. .env 에 ANTHROPIC_API_KEY 등을 설정하세요 (시험용: MOCK_PROVIDER=true).');
    }
  });
}
