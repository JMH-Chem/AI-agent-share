// 학생 화면과 교수자 화면이 함께 쓰는 도우미

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && !path.startsWith('/login')) {
    location.href = '/';
    throw new Error('로그인이 필요합니다.');
  }
  if (!res.ok) throw new Error(data.error || `요청 실패 (${res.status})`);
  return data;
}

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (k === 'html') node.innerHTML = v;
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

// 외부 라이브러리 없이 쓰는 작은 마크다운 변환기.
// 먼저 모든 HTML 을 이스케이프하므로 AI 답변 속 스크립트가 실행되지 않습니다.
export function renderMarkdown(src) {
  const slots = [];
  const hold = (html) => `\u0000${slots.push(html) - 1}\u0000`;
  let s = escapeHtml(src).replace(/\r\n/g, '\n');

  s = s.replace(/```[^\n]*\n([\s\S]*?)(```|$)/g, (_, code) => hold(`<pre><code>${code.replace(/\n$/, '')}</code></pre>`));

  const inline = (t) =>
    t
      .replace(/`([^`\n]+)`/g, (_, c) => hold(`<code>${c}</code>`))
      .replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, label, url) =>
        hold(`<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`),
      )
      .replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, (_, pre, url) => `${pre}${hold(`<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`)}`)
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');

  const out = [];
  const lines = s.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\u0000\d+\u0000$/.test(line.trim())) {
      out.push(line.trim());
    } else if (/^#{1,6}\s/.test(line)) {
      const level = Math.min(line.match(/^#+/)[0].length + 2, 6);
      out.push(`<h${level}>${inline(line.replace(/^#+\s*/, ''))}</h${level}>`);
    } else if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, ''))}</li>`);
        i++;
      }
      i--;
      out.push(`<${ordered ? 'ol' : 'ul'}>${items.join('')}</${ordered ? 'ol' : 'ul'}>`);
    } else if (/^\|.*\|\s*$/.test(line) && /^\|[\s:|-]+\|\s*$/.test(lines[i + 1] || '')) {
      const cells = (row) => row.trim().replace(/^\||\|$/g, '').split('|').map((c) => inline(c.trim()));
      const head = cells(line);
      i += 2;
      const body = [];
      while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) body.push(cells(lines[i++]));
      i--;
      out.push(
        `<table><thead><tr>${head.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${body
          .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
          .join('')}</tbody></table>`,
      );
    } else if (/^&gt;\s?/.test(line)) {
      out.push(`<blockquote>${inline(line.replace(/^&gt;\s?/, ''))}</blockquote>`);
    } else if (line.trim() === '') {
      out.push('');
    } else {
      const para = [line];
      while (i + 1 < lines.length && lines[i + 1].trim() !== '' && !/^(#{1,6}\s|\s*([-*]|\d+\.)\s|\||&gt;|\u0000)/.test(lines[i + 1])) {
        para.push(lines[++i]);
      }
      out.push(`<p>${inline(para.join('<br>'))}</p>`);
    }
  }
  let html = out.join('\n');
  for (let k = 0; k < 3 && html.includes('\u0000'); k++) {
    html = html.replace(/\u0000(\d+)\u0000/g, (_, n) => slots[Number(n)]);
  }
  return html;
}

const TOOL_LABELS = {
  web_search: '웹 검색',
  WebSearch: '웹 검색',
  WebFetch: '웹 페이지 읽기',
  web_fetch: '웹 페이지 읽기',
  Read: '파일 읽기',
  Write: '파일 쓰기',
  Edit: '파일 수정',
  Glob: '파일 찾기',
  Grep: '내용 검색',
  Bash: '명령 실행',
  NotebookEdit: '노트북 수정',
};

export function toolLabel(name) {
  return TOOL_LABELS[name] || name;
}

export function toolSummary(step) {
  const i = step.input || {};
  return i.query || i.file_path || i.path || i.pattern || i.url || i.command || i.notebook_path || '';
}

// 도구 사용 기록을 접을 수 있는 목록으로 표시. full=true 면 입력/결과 전체를 보여줍니다(교수자용).
export function renderSteps(steps = [], { full = false } = {}) {
  const wrap = el('div', { class: 'steps' });
  for (const step of steps) {
    if (step.type === 'tool') {
      const summary = toolSummary(step);
      const det = el(
        'details',
        { class: `step${step.isError ? ' err' : ''}` },
        el('summary', {}, `🔧 ${toolLabel(step.name)}${summary ? `: ${String(summary).slice(0, 120)}` : ''}`),
      );
      if (full || step.output) {
        det.append(el('pre', {}, JSON.stringify(step.input ?? {}, null, 2)));
        if (step.output) det.append(el('pre', {}, step.output));
      }
      wrap.append(det);
    } else if (step.type === 'tool_result' && full && step.results?.length) {
      wrap.append(
        el(
          'details',
          { class: 'step' },
          el('summary', {}, `🔎 검색 결과 ${step.results.length}건`),
          el('ul', {}, step.results.map((r) => el('li', {}, el('a', { href: r.url, target: '_blank', rel: 'noopener noreferrer' }, r.title || r.url)))),
        ),
      );
    }
  }
  return wrap;
}

export function renderSources(sources = []) {
  if (!sources.length) return null;
  return el(
    'details',
    { class: 'sources' },
    el('summary', {}, `출처 ${sources.length}개`),
    el('ol', {}, sources.map((s) => el('li', {}, el('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer' }, s.title || s.url)))),
  );
}

export const fmtUsd = (n) => `$${(n || 0).toFixed(n >= 1 ? 2 : 4)}`;
export const fmtNum = (n) => (n || 0).toLocaleString('ko-KR');
export function fmtTime(s) {
  if (!s) return '';
  const d = new Date(s.includes('T') ? s : `${s.replace(' ', 'T')}Z`);
  return d.toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function showModal(title, body, buttons = [{ label: '닫기' }]) {
  return new Promise((resolve) => {
    const backdrop = el('div', { class: 'modal-backdrop' });
    const close = (v) => {
      backdrop.remove();
      resolve(v);
    };
    backdrop.append(
      el(
        'div',
        { class: 'modal', role: 'dialog', 'aria-modal': 'true' },
        el('h2', {}, title),
        body,
        el('div', { class: 'row' }, buttons.map((b) => el('button', { class: b.class, onclick: () => close(b.value) }, b.label))),
      ),
    );
    document.body.append(backdrop);
  });
}

export function downloadText(filename, text, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = el('a', { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
