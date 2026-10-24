// Claude 이외의 모델(로컬·중국 API 등)에 붙이는 웹 검색·페이지 읽기 도구.
// 검색엔진: SearXNG(무료, 직접 설치) 또는 Tavily(API 키, 무료 사용량 있음).
import dns from 'node:dns/promises';
import net from 'node:net';
import { config } from '../config.js';

export function searchEnabled() {
  const s = config.search;
  return (s.provider === 'searxng' && Boolean(s.searxngUrl)) || (s.provider === 'tavily' && Boolean(s.tavilyApiKey));
}

export async function webSearch(query, { signal } = {}) {
  const s = config.search;
  const max = s.maxResults;
  if (s.provider === 'searxng') {
    const url = new URL('/search', s.searxngUrl);
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    if (s.language) url.searchParams.set('language', s.language);
    const res = await fetch(url, { signal: withTimeout(signal, 15000) });
    if (!res.ok) throw new Error(`SearXNG 검색 실패 (${res.status}). settings.yml 에서 json 형식을 켰는지 확인하세요.`);
    const data = await res.json();
    return (data.results || []).slice(0, max).map((r) => ({ title: r.title, url: r.url, snippet: r.content || '' }));
  }
  if (s.provider === 'tavily') {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.tavilyApiKey}` },
      body: JSON.stringify({ query, max_results: max, search_depth: 'basic' }),
      signal: withTimeout(signal, 20000),
    });
    if (!res.ok) throw new Error(`Tavily 검색 실패 (${res.status})`);
    const data = await res.json();
    return (data.results || []).slice(0, max).map((r) => ({ title: r.title, url: r.url, snippet: r.content || '' }));
  }
  throw new Error('웹 검색이 설정되어 있지 않습니다.');
}

// 학생이 AI 에게 시킨 주소를 서버가 대신 여는 것이므로, 서버 내부망(로컬 모델 서버, 공유기 관리 화면 등)은 막습니다.
export function isPrivateAddress(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 0 || a === 10 || a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith('::ffff:')) return isPrivateAddress(v6.slice(7));
  return v6 === '::' || v6 === '::1' || v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe8') || v6.startsWith('fe9') || v6.startsWith('fea') || v6.startsWith('feb');
}

async function assertPublicUrl(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('올바른 주소가 아닙니다.');
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('http/https 주소만 열 수 있습니다.');
  const host = url.hostname.replace(/^\[|\]$/g, '');
  const addrs = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => isPrivateAddress(a.address))) {
    throw new Error('내부망 주소는 열 수 없습니다.');
  }
  return url;
}

export async function fetchPage(raw, { signal } = {}) {
  let url = await assertPublicUrl(raw);
  for (let hop = 0; hop < 4; hop++) {
    const res = await fetch(url, {
      redirect: 'manual',
      headers: { 'User-Agent': 'Mozilla/5.0 (class-ai-share)', Accept: 'text/html,text/plain,*/*' },
      signal: withTimeout(signal, 20000),
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      url = await assertPublicUrl(new URL(res.headers.get('location'), url).href);
      continue;
    }
    if (!res.ok) throw new Error(`페이지를 열 수 없습니다 (${res.status}).`);
    const type = res.headers.get('content-type') || '';
    if (!/text\/|json|xml/.test(type)) throw new Error(`글이 아닌 파일입니다 (${type}).`);
    const body = await readLimited(res, 2_000_000);
    const text = /html/.test(type) ? htmlToText(body) : body;
    return { url: url.href, text: text.slice(0, config.search.fetchMaxChars) };
  }
  throw new Error('다른 주소로 너무 여러 번 넘어갑니다.');
}

async function readLimited(res, maxBytes) {
  const reader = res.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    chunks.push(value);
    if (size >= maxBytes) {
      await reader.cancel();
      break;
    }
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

export function htmlToText(html) {
  return html
    .replace(/<(script|style|noscript|svg|head)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6]|tr|section|article)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n\n')
    .trim();
}

function withTimeout(signal, ms) {
  const t = AbortSignal.timeout(ms);
  return signal ? AbortSignal.any([signal, t]) : t;
}
