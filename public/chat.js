import { api, el, renderMarkdown, renderSteps, renderSources, showModal, fmtTime, toolLabel, toolSummary } from './common.js';

const $ = (s) => document.querySelector(s);
const state = { me: null, conversations: [], current: null, streaming: null, ready: null };
const isAgent = (providerId) => state.me?.agentProviders?.has(providerId);

init().catch((err) => alert(err.message));

async function init() {
  const [me, cfg] = await Promise.all([api('/me'), api('/config')]);
  state.me = me;
  me.agentProviders = new Set(me.providers.filter((p) => p.kind === 'agent').map((p) => p.id));
  document.title = cfg.className;
  $('#class-name').textContent = cfg.className;
  if (cfg.modelNotice) $('.composer-note').append(` ${cfg.modelNotice}`);
  $('#account-btn').textContent = `${me.user.displayName} ▾`;
  if (me.user.role === 'admin') $('#admin-link').classList.remove('hidden');
  renderUsage();

  const select = $('#provider-select');
  for (const p of me.providers) {
    select.append(el('option', { value: p.id, selected: p.id === me.defaultProvider }, `${p.label}`));
  }
  if (!me.providers.length) {
    select.append(el('option', {}, '사용 가능한 AI 없음'));
    $('#new-btn').disabled = true;
  }

  $('#new-btn').addEventListener('click', newConversation);
  $('#composer').addEventListener('submit', (e) => {
    e.preventDefault();
    send();
  });
  $('#input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      send();
    }
  });
  $('#stop-btn').addEventListener('click', () => state.streaming?.abort());
  $('#account-btn').addEventListener('click', accountMenu);
  $('#menu-btn').addEventListener('click', () => $('#sidebar').classList.toggle('open'));

  // 동의와 첫 화면 준비가 끝나기 전에 보낸 질문은 준비가 끝난 뒤 처리합니다.
  state.ready = (async () => {
    if (!me.user.consentedAt) await askConsent(cfg.consentText);
    await loadConversations();
    if (state.conversations[0]) await openConversation(state.conversations[0].id);
    else renderEmpty();
  })();
  await state.ready;
}

async function askConsent(text) {
  await showModal('AI 사용 기록 안내', el('pre', {}, text), [{ label: '확인했고 동의합니다', class: 'primary', value: true }]);
  await api('/consent', { method: 'POST', body: {} });
  state.me.user.consentedAt = new Date().toISOString();
}

function renderUsage() {
  const { usage, limits } = state.me;
  const ratios = [];
  if (limits.dailyTokens > 0) ratios.push(usage.tokens / limits.dailyTokens);
  if (limits.dailyCostUsd > 0) ratios.push(usage.cost / limits.dailyCostUsd);
  const ratio = Math.min(1, Math.max(0, ...ratios, 0));
  $('#usage-bar').style.width = `${Math.round(ratio * 100)}%`;
  $('#usage-text').textContent = state.me.user.role === 'admin' ? '' : `오늘 사용량 ${Math.round(ratio * 100)}%`;
}

async function refreshUsage() {
  const me = await api('/me');
  state.me.usage = me.usage;
  renderUsage();
}

async function loadConversations() {
  state.conversations = await api('/conversations');
  const list = $('#conv-list');
  list.replaceChildren(
    ...state.conversations.map((c) =>
      el(
        'button',
        { class: `conv-item${state.current?.id === c.id ? ' active' : ''}`, title: c.title, onclick: () => openConversation(c.id) },
        el('span', { class: 'badge' }, isAgent(c.provider) ? '에이전트' : '채팅'),
        c.title,
      ),
    ),
  );
}

function renderEmpty() {
  state.current = null;
  $('#messages-inner').replaceChildren(
    el('div', { class: 'empty' }, el('p', {}, '왼쪽에서 AI 종류를 고르고 질문을 입력해 보세요.'), el('p', { class: 'small' }, '에이전트 모드는 나만의 작업 폴더에서 파일을 만들고 고칠 수 있습니다.')),
  );
  $('#files-panel').classList.add('hidden');
}

async function newConversation() {
  const conv = await api('/conversations', { method: 'POST', body: { provider: $('#provider-select').value } });
  await loadConversations();
  await openConversation(conv.id);
  $('#input').focus();
  return conv;
}

async function openConversation(id) {
  const { conversation, messages } = await api(`/conversations/${id}`);
  state.current = conversation;
  $('#sidebar').classList.remove('open');
  await loadConversations();
  const inner = $('#messages-inner');
  inner.replaceChildren(...messages.map(renderMessage));
  if (!messages.length) inner.append(el('div', { class: 'empty' }, el('p', {}, isAgent(conversation.provider) ? '에이전트에게 작업을 맡겨 보세요. 예: "간단한 계산기 파이썬 파일을 만들어줘"' : '무엇이든 물어보세요.')));
  scrollDown();
  await refreshFiles();
}

function renderMessage(m) {
  if (m.role === 'user') return el('div', { class: 'msg user' }, el('div', { class: 'bubble' }, m.content));
  if (m.role === 'error') return el('div', { class: 'msg error' }, el('div', { class: 'bubble' }, m.content));
  const meta = m.meta || {};
  return el(
    'div',
    { class: 'msg assistant' },
    renderSteps(meta.steps || []),
    el('div', { class: 'bubble md', html: renderMarkdown(m.content) }),
    renderSources(meta.sources),
    el('div', { class: 'msg-foot' }, [fmtTime(m.created_at), meta.aborted ? '중단됨' : null].filter(Boolean).join(' · ')),
  );
}

async function send() {
  const input = $('#input');
  const text = input.value.trim();
  if (!text || state.streaming) return;
  await state.ready;
  if (!state.current) await newConversation();
  const conv = state.current;
  input.value = '';

  const inner = $('#messages-inner');
  inner.querySelector('.empty')?.remove();
  inner.append(el('div', { class: 'msg user' }, el('div', { class: 'bubble' }, text)));
  const steps = el('div', { class: 'steps' });
  const status = el('div', { class: 'small muted' }, '생각 중…');
  const bubble = el('div', { class: 'bubble md typing' });
  const foot = el('div', { class: 'msg-foot' });
  const box = el('div', { class: 'msg assistant' }, steps, status, bubble, foot);
  inner.append(box);
  scrollDown();

  const controller = new AbortController();
  state.streaming = controller;
  setBusy(true);
  let raw = '';
  let pending = false;
  const paint = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      bubble.innerHTML = renderMarkdown(raw);
      scrollDown(true);
    });
  };

  try {
    const res = await fetch(`/api/conversations/${conv.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `요청 실패 (${res.status})`);
    }
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buf = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += value;
      let nl;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl);
        buf = buf.slice(nl + 1);
        if (!line.trim()) continue;
        const ev = JSON.parse(line);
        if (ev.type === 'text') {
          status.textContent = '';
          raw += ev.delta;
          paint();
        } else if (ev.type === 'status') {
          status.textContent = ev.message;
        } else if (ev.type === 'tool') {
          const summary = toolSummary(ev);
          status.textContent = `${toolLabel(ev.name)} 중…`;
          steps.append(el('div', { class: 'step' }, `🔧 ${toolLabel(ev.name)}${summary ? `: ${String(summary).slice(0, 120)}` : ''}`));
        } else if (ev.type === 'tool_result' && ev.isError) {
          steps.lastElementChild?.classList.add('err');
        } else if (ev.type === 'done') {
          const src = renderSources(ev.meta?.sources);
          if (src) box.insertBefore(src, foot);
          foot.textContent = '방금';
        } else if (ev.type === 'error') {
          box.after(el('div', { class: 'msg error' }, el('div', { class: 'bubble' }, ev.message)));
        }
      }
    }
  } catch (err) {
    if (err.name !== 'AbortError') box.after(el('div', { class: 'msg error' }, el('div', { class: 'bubble' }, err.message)));
    else foot.textContent = '중단됨';
  } finally {
    bubble.classList.remove('typing');
    status.remove();
    if (!raw) bubble.remove();
    state.streaming = null;
    setBusy(false);
    scrollDown();
    loadConversations();
    refreshUsage();
    refreshFiles();
  }
}

function setBusy(busy) {
  $('#send-btn').classList.toggle('hidden', busy);
  $('#stop-btn').classList.toggle('hidden', !busy);
  $('#new-btn').disabled = busy;
}

function scrollDown(onlyIfNear = false) {
  const box = $('#messages');
  if (onlyIfNear && box.scrollHeight - box.scrollTop - box.clientHeight > 200) return;
  box.scrollTop = box.scrollHeight;
}

async function refreshFiles() {
  const panel = $('#files-panel');
  const conv = state.current;
  if (!conv || !isAgent(conv.provider)) return panel.classList.add('hidden');
  const files = await api(`/conversations/${conv.id}/files`);
  panel.classList.remove('hidden');
  const list = $('#files-list');
  if (!files.length) return list.replaceChildren(el('li', { class: 'muted' }, '아직 파일이 없습니다.'));
  list.replaceChildren(
    ...files.map((f) => {
      const base = `/api/conversations/${conv.id}/file?path=${encodeURIComponent(f.path)}`;
      return el(
        'li',
        {},
        el('span', { title: f.path }, f.path),
        el('button', { class: 'small', onclick: () => previewFile(base, f.path) }, '보기'),
        el('a', { href: base, class: 'small' }, '받기'),
      );
    }),
  );
}

async function previewFile(base, name) {
  const res = await fetch(`${base}&preview=1`);
  const text = res.ok ? await res.text() : (await res.json().catch(() => ({}))).error || '열 수 없습니다.';
  showModal(name, el('pre', {}, text));
}

async function accountMenu() {
  const form = el(
    'div',
    { class: 'auth-card' },
    el('p', { class: 'small muted' }, `${state.me.user.username} (${state.me.user.displayName})`),
    el('label', {}, '현재 비밀번호', el('input', { type: 'password', id: 'pw-cur', autocomplete: 'current-password' })),
    el('label', {}, '새 비밀번호 (8자 이상)', el('input', { type: 'password', id: 'pw-new', autocomplete: 'new-password' })),
  );
  const action = await showModal('내 계정', form, [
    { label: '로그아웃', value: 'logout', class: 'danger' },
    { label: '비밀번호 변경', value: 'password', class: 'primary' },
    { label: '닫기' },
  ]);
  if (action === 'logout') {
    await api('/logout', { method: 'POST', body: {} });
    location.href = '/';
  } else if (action === 'password') {
    const cur = form.querySelector('#pw-cur').value;
    const next = form.querySelector('#pw-new').value;
    try {
      await api('/password', { method: 'POST', body: { current: cur, next } });
      await showModal('완료', el('p', {}, '비밀번호를 바꿨습니다.'));
    } catch (err) {
      await showModal('실패', el('p', { class: 'error-text' }, err.message));
    }
  }
}
