import { api, el, renderMarkdown, renderSteps, renderSources, showModal, downloadText, fmtUsd, fmtNum, fmtTime, previewWorkspaceFile } from './common.js';

const $ = (s) => document.querySelector(s);
let overview = null;
const isAgent = (providerId) => overview?.providers.some((p) => p.id === providerId && p.kind === 'agent');

const AUDIT_LABELS = {
  login: '로그인',
  login_failed: '로그인 실패',
  logout: '로그아웃',
  signup: '자가 가입',
  consent: '기록 열람 동의',
  password_changed: '비밀번호 변경',
  quota_block: '사용 한도 초과',
  admin_view_conversation: '교수자 대화 열람',
  admin_export: 'CSV 내보내기',
  admin_bulk_create: '계정 일괄 생성',
  admin_reset_password: '비밀번호 초기화',
  admin_set_active: '계정 활성/비활성',
};

init().catch((err) => alert(err.message));

async function init() {
  const session = await api('/session');
  if (!session.loggedIn) return (location.href = '/');
  if (session.role !== 'admin') return (location.href = '/chat');
  const cfg = await api('/config');
  $('#class-name').textContent = cfg.className;
  document.title = `${cfg.className} 교수자 화면`;
  for (const btn of document.querySelectorAll('#tabs button')) btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  $('#logout-btn').addEventListener('click', async () => {
    await api('/logout', { method: 'POST', body: {} });
    location.href = '/';
  });
  $('#search-form').addEventListener('submit', search);
  $('#bulk-btn').addEventListener('click', bulkCreate);
  await loadOverview();
}

function switchTab(tab) {
  for (const btn of document.querySelectorAll('#tabs button')) btn.classList.toggle('active', btn.dataset.tab === tab);
  for (const id of ['students', 'search', 'accounts', 'audit']) $(`#tab-${id}`).classList.toggle('hidden', id !== tab);
  if (tab === 'audit') loadAudit();
  if (tab === 'accounts') renderAccounts();
}

async function loadOverview() {
  overview = await api('/admin/overview');
  const o = overview;
  const students = o.students.filter((s) => s.role === 'student');
  const budget = o.monthlyBudgetUsd > 0 ? ` / ${fmtUsd(o.monthlyBudgetUsd)}` : '';
  $('#cards').replaceChildren(
    card('등록 학생', `${students.length}명`, `기록 동의 ${students.filter((s) => s.consented_at).length}명`),
    card('오늘 질문', fmtNum(o.today.prompts), `${fmtNum(o.today.tokens)} 토큰`),
    card('오늘 비용(추정)', fmtUsd(o.today.cost)),
    card('이번 달 비용(추정)', `${fmtUsd(o.monthCost)}${budget}`),
    card(
      'AI 연결',
      `${o.providers.filter((p) => p.available).length}개 켜짐`,
      o.providers.filter((p) => p.available).map((p) => `${p.label} · ${p.model}`).join('\n') || '.env 에 API 키를 설정하세요',
    ),
  );
  $('#students-body').replaceChildren(
    ...o.students.map((s) =>
      el(
        'tr',
        { class: 'click', onclick: () => showStudent(s.id) },
        el('td', {}, s.username),
        el('td', {}, s.display_name, s.role === 'admin' ? ' (교수자)' : ''),
        el('td', {}, fmtNum(s.prompts)),
        el('td', {}, fmtUsd(s.cost)),
        el('td', {}, fmtTime(s.last_active)),
      ),
    ),
  );
}

function card(label, value, sub) {
  return el('div', { class: 'card' }, el('div', { class: 'label' }, label), el('div', { class: 'value' }, value), sub ? el('div', { class: 'small muted', title: sub }, sub.split('\n')[0]) : null);
}

async function showStudent(userId) {
  const { user, conversations } = await api(`/admin/users/${userId}/conversations`);
  const detail = $('#detail');
  detail.replaceChildren(
    el('h2', {}, `${user.displayName} (${user.username})`),
    conversations.length
      ? el(
          'table',
          { class: 'data' },
          el('thead', {}, el('tr', {}, el('th', {}, '대화'), el('th', {}, '종류'), el('th', {}, '메시지'), el('th', {}, '비용'), el('th', {}, '최근'))),
          el(
            'tbody',
            {},
            conversations.map((c) =>
              el(
                'tr',
                { class: 'click', onclick: () => showConversation(c.id) },
                el('td', { class: 'wrap' }, c.title),
                el('td', {}, isAgent(c.provider) ? '에이전트' : '채팅'),
                el('td', {}, fmtNum(c.messages)),
                el('td', {}, fmtUsd(c.cost)),
                el('td', {}, fmtTime(c.updated_at)),
              ),
            ),
          ),
        )
      : el('p', { class: 'muted' }, '아직 대화가 없습니다.'),
    el('div', { id: 'transcript' }),
  );
}

async function showConversation(convId) {
  const { conversation, messages } = await api(`/admin/conversations/${convId}`);
  const box = $('#transcript');
  const items = messages.map((m) => {
    const head = el('div', { class: 'msg-foot' }, `${fmtTime(m.created_at)} · ${m.role === 'user' ? '학생' : m.role === 'error' ? '오류' : 'AI'}${m.cost_usd ? ` · ${fmtUsd(m.cost_usd)} · ${fmtNum(m.input_tokens + m.output_tokens)} 토큰` : ''}`);
    if (m.role === 'user') return el('div', { class: 'msg user' }, head, el('div', { class: 'bubble' }, m.content));
    if (m.role === 'error') return el('div', { class: 'msg error' }, head, el('div', { class: 'bubble' }, m.content));
    return el('div', { class: 'msg assistant' }, head, renderSteps(m.meta?.steps || [], { full: true }), el('div', { class: 'bubble md', html: renderMarkdown(m.content) }), renderSources(m.meta?.sources));
  });
  const exportBtn = el('button', { class: 'small', onclick: () => downloadText(`conversation-${conversation.id}.json`, JSON.stringify({ conversation, messages }, null, 2), 'application/json') }, 'JSON 저장');
  const parts = [el('h2', {}, `「${conversation.title}」 · ${conversation.provider} (${conversation.model || ''})`), el('p', { class: 'row' }, exportBtn)];
  if (isAgent(conversation.provider)) parts.push(await filesBlock(conversation.id));
  box.replaceChildren(...parts, el('div', { class: 'transcript' }, items));
  box.scrollIntoView({ behavior: 'smooth' });
}

async function filesBlock(convId) {
  const files = await api(`/admin/conversations/${convId}/files`);
  if (!files.length) return el('p', { class: 'small muted' }, '작업 폴더에 파일이 없습니다.');
  return el(
    'details',
    { class: 'step', open: true },
    el('summary', {}, `작업 폴더 파일 ${files.length}개`),
    el(
      'ul',
      {},
      files.map((f) => {
        const url = `/api/admin/conversations/${convId}/file?path=${encodeURIComponent(f.path)}`;
        return el(
          'li',
          {},
          `${f.path} (${fmtNum(f.size)}B) `,
          el('button', { class: 'small', onclick: () => previewWorkspaceFile(url, f.path) }, '보기'),
          ' ',
          el('a', { href: url, class: 'small' }, '받기'),
        );
      }),
    ),
  );
}

async function search(e) {
  e.preventDefault();
  const q = new FormData(e.target).get('q');
  const rows = await api(`/admin/search?q=${encodeURIComponent(q)}`);
  $('#search-body').replaceChildren(
    ...(rows.length
      ? rows.map((r) =>
          el(
            'tr',
            {
              class: 'click',
              onclick: async () => {
                switchTab('students');
                await showStudent(r.user_id);
                await showConversation(r.conversation_id);
              },
            },
            el('td', {}, fmtTime(r.created_at)),
            el('td', {}, `${r.display_name} (${r.username})`),
            el('td', {}, r.role === 'user' ? '질문' : r.role === 'assistant' ? '답변' : r.role),
            el('td', { class: 'wrap' }, r.snippet),
          ),
        )
      : [el('tr', {}, el('td', { colspan: 4, class: 'muted' }, '결과가 없습니다.'))]),
  );
}

async function bulkCreate() {
  const lines = $('#bulk-input').value;
  if (!lines.trim()) return;
  const { created, skipped } = await api('/admin/users/bulk', { method: 'POST', body: { lines } });
  const csv = ['학번,이름,초기 비밀번호', ...created.map((c) => `${c.username},${c.displayName},${c.password}`)].join('\r\n');
  $('#bulk-result').replaceChildren(
    el('p', {}, `${created.length}명 생성, ${skipped.length}명 건너뜀`),
    created.length ? el('button', { class: 'primary', onclick: () => downloadText('student-passwords.csv', '\uFEFF' + csv) }, '초기 비밀번호 CSV 저장') : null,
    created.length ? el('pre', {}, csv) : null,
    skipped.length ? el('pre', { class: 'error-text' }, skipped.map((s) => `${s.line} → ${s.reason}`).join('\n')) : null,
  );
  $('#bulk-input').value = '';
  await loadOverview();
  renderAccounts();
}

function renderAccounts() {
  if (!overview) return;
  $('#accounts-body').replaceChildren(
    ...overview.students.map((s) =>
      el(
        'tr',
        {},
        el('td', {}, s.username),
        el('td', {}, s.display_name),
        el('td', {}, s.role === 'admin' ? '교수자' : '학생'),
        el('td', {}, s.consented_at ? '예' : '아니오'),
        el('td', {}, s.active ? '사용 중' : '정지'),
        el(
          'td',
          {},
          el('button', { class: 'small', onclick: () => resetPassword(s) }, '비밀번호 초기화'),
          ' ',
          s.role === 'admin' ? null : el('button', { class: 'small danger', onclick: () => toggleActive(s) }, s.active ? '정지' : '복구'),
        ),
      ),
    ),
  );
}

async function resetPassword(s) {
  const ok = await showModal('비밀번호 초기화', el('p', {}, `${s.display_name}(${s.username})의 비밀번호를 새로 만들까요? 기존 로그인은 모두 끊깁니다.`), [
    { label: '취소', value: false },
    { label: '초기화', value: true, class: 'primary' },
  ]);
  if (!ok) return;
  const r = await api(`/admin/users/${s.id}/reset-password`, { method: 'POST', body: {} });
  await showModal('새 비밀번호', el('pre', {}, `${r.username}\n${r.password}`));
}

async function toggleActive(s) {
  await api(`/admin/users/${s.id}/active`, { method: 'POST', body: { active: !s.active } });
  await loadOverview();
  renderAccounts();
}

async function loadAudit() {
  const rows = await api('/admin/audit');
  $('#audit-body').replaceChildren(
    ...rows.map((r) =>
      el(
        'tr',
        {},
        el('td', {}, fmtTime(r.created_at)),
        el('td', {}, r.username ? `${r.display_name} (${r.username})` : '-'),
        el('td', {}, AUDIT_LABELS[r.type] || r.type),
        el('td', { class: 'wrap small' }, r.type === 'consent' ? '' : r.detail || ''),
        el('td', { class: 'small' }, r.ip || ''),
      ),
    ),
  );
}
