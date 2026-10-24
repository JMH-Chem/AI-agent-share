// 모든 설정은 환경변수(.env)로 바꿀 수 있습니다. .env.example 참고.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// .env 파일이 있으면 읽어서 process.env 에 없는 값만 채웁니다 (외부 패키지 없이).
function loadDotEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m || line.trim().startsWith('#')) continue;
    let value = m[2];
    if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1);
    else value = value.replace(/\s+#.*$/, ''); // 따옴표 없는 값 뒤의 "  # 설명" 은 주석
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
}
loadDotEnv(path.join(ROOT, '.env'));

const env = process.env;
const num = (v, d) => (v === undefined || v === '' ? d : Number(v));
const bool = (v, d) => (v === undefined || v === '' ? d : ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase()));

export const config = {
  root: ROOT,
  port: num(env.PORT, 3000),
  host: env.HOST || '0.0.0.0',
  dataDir: path.resolve(ROOT, env.DATA_DIR || 'data'),
  // HTTPS 뒤(리버스 프록시)에서 운영하면 true 로 두세요. 쿠키에 Secure 가 붙습니다.
  secureCookies: bool(env.SECURE_COOKIES, false),
  trustProxy: bool(env.TRUST_PROXY, false),
  sessionDays: num(env.SESSION_DAYS, 14),

  className: env.CLASS_NAME || '수업용 AI',
  // 모델 라이선스가 요구하는 표기 등 학생 화면 하단에 보여줄 문구 (예: Powered by HyperCLOVA X)
  modelNotice: env.MODEL_NOTICE || '',
  // 비어 있으면 학생 자가 가입을 막고, 교수자가 관리자 화면에서 계정을 만듭니다.
  classJoinCode: env.CLASS_JOIN_CODE || '',
  systemPrompt:
    env.CLASS_SYSTEM_PROMPT ||
    '당신은 대학 수업의 AI 조교입니다. 기본적으로 한국어로 답하고, 학생이 스스로 이해할 수 있도록 근거와 과정을 설명하세요.',

  // 학생 1명당 하루 한도. 0 이면 무제한. 에이전트는 캐시된 토큰을 많이 읽으므로 비용 한도를 권장합니다.
  dailyTokenLimit: num(env.DAILY_TOKEN_LIMIT_PER_STUDENT, 0),
  dailyCostLimitUsd: num(env.DAILY_COST_LIMIT_USD_PER_STUDENT, 1.0),
  // 전체 월 예산(USD). 넘으면 학생 요청을 막습니다. 0 이면 무제한.
  monthlyBudgetUsd: num(env.MONTHLY_BUDGET_USD, 100),

  anthropic: {
    apiKey: env.ANTHROPIC_API_KEY || '',
    model: env.ANTHROPIC_MODEL || 'claude-opus-5-5',
    effort: env.ANTHROPIC_EFFORT || 'medium',
    maxTokens: num(env.ANTHROPIC_MAX_TOKENS, 16000),
    webSearch: bool(env.ANTHROPIC_WEB_SEARCH, true),
    webSearchMaxUses: num(env.ANTHROPIC_WEB_SEARCH_MAX_USES, 5),
  },
  openai: {
    apiKey: env.OPENAI_API_KEY || '',
    model: env.OPENAI_MODEL || '',
    webSearch: bool(env.OPENAI_WEB_SEARCH, true),
  },
  agent: {
    enabled: bool(env.AGENT_ENABLED, true),
    model: env.AGENT_MODEL || env.ANTHROPIC_MODEL || 'claude-opus-5-5',
    maxTurns: num(env.AGENT_MAX_TURNS, 30),
    maxBudgetUsdPerRun: num(env.AGENT_MAX_BUDGET_USD_PER_RUN, 0.5),
    // Bash(코드 실행)는 서버에서 실제 명령을 실행하므로 기본은 꺼둡니다.
    // 켤 때는 반드시 컨테이너/VM 안에서 운영하세요 (README 의 보안 절 참고).
    allowBash: bool(env.AGENT_ALLOW_BASH, false),
    workspaceRoot: path.resolve(ROOT, env.DATA_DIR || 'data', 'workspaces'),
  },
  // OpenAI 호환 API (DeepSeek·Qwen 등 API 또는 Ollama·vLLM 로컬 모델). COMPAT_1_* ~ COMPAT_5_*
  compat: compatEntries(),
  // Claude 이외 모델이 쓰는 웹 검색: searxng(직접 설치, 무료) 또는 tavily(API 키)
  search: {
    provider: (env.SEARCH_PROVIDER || '').toLowerCase(),
    searxngUrl: env.SEARXNG_URL || '',
    tavilyApiKey: env.TAVILY_API_KEY || '',
    language: env.SEARCH_LANGUAGE || 'ko',
    maxResults: num(env.SEARCH_MAX_RESULTS, 5),
    fetchMaxChars: num(env.FETCH_MAX_CHARS, 20000),
  },
  // Claude 이외 모델의 에이전트가 코드를 실행하는 방식: docker(격리 컨테이너) 또는 off
  codeExec: {
    mode: (env.CODE_EXEC || 'off').toLowerCase(),
    image: env.CODE_EXEC_IMAGE || 'python:3.12-slim',
    timeoutSec: num(env.CODE_EXEC_TIMEOUT_SEC, 30),
    memory: env.CODE_EXEC_MEMORY || '512m',
    cpus: env.CODE_EXEC_CPUS || '1',
    // 컨테이너 안에서 인터넷 사용 허용 여부 (기본 차단)
    network: bool(env.CODE_EXEC_NETWORK, false),
    // 더 강한 격리가 필요하면 gVisor 설치 후 runsc
    runtime: env.CODE_EXEC_DOCKER_RUNTIME || '',
    user: env.CODE_EXEC_USER || '',
    dockerBin: env.DOCKER_BIN || 'docker',
  },
  // 실제 AI 없이 화면과 로그 기능을 시험해 볼 수 있는 가짜 응답기.
  mockProvider: bool(env.MOCK_PROVIDER, false),
};

function parseJson(value, name) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    console.warn(`${name} 가 올바른 JSON 이 아니어서 무시합니다.`);
    return null;
  }
}

function compatEntries() {
  const entries = [];
  for (let n = 1; n <= 5; n++) {
    const get = (k) => env[`COMPAT_${n}_${k}`];
    if (!get('BASE_URL')) continue;
    const price =
      get('PRICE_INPUT') !== undefined || get('PRICE_OUTPUT') !== undefined
        ? {
            input: num(get('PRICE_INPUT'), 0),
            output: num(get('PRICE_OUTPUT'), 0),
            cachedInput: get('PRICE_CACHED_INPUT') === undefined ? undefined : num(get('PRICE_CACHED_INPUT'), 0),
          }
        : null;
    entries.push({
      id: `compat-${n}`,
      label: get('NAME') || `호환 AI ${n}`,
      baseUrl: get('BASE_URL'),
      apiKey: get('API_KEY') || '',
      model: get('MODEL') || '',
      price,
      // 사용량(토큰) 집계를 스트림 끝에 받기. 지원하지 않는 서버면 false 로.
      streamUsage: bool(get('STREAM_USAGE'), true),
      // 도구 호출(웹 검색·파일 작업) 사용 여부. 도구를 지원하지 않는 모델이면 false 로.
      tools: bool(get('TOOLS'), true),
      // 에이전트 모드(학생 작업 폴더에서 파일 작업)도 함께 제공할지
      agent: bool(get('AGENT'), false),
      maxSteps: num(get('MAX_STEPS'), 15),
      // 생각(추론) 강도: low | medium | high. 로컬 모델은 low 가 빠릅니다. 비우면 보내지 않음
      reasoningEffort: get('REASONING_EFFORT') || '',
      // 서버별 추가 옵션(JSON). 예: {"chat_template_kwargs":{"enable_thinking":false}}
      extraBody: parseJson(get('EXTRA_BODY'), `COMPAT_${n}_EXTRA_BODY`),
    });
  }
  return entries;
}

export function ensureDirs() {
  fs.mkdirSync(config.dataDir, { recursive: true });
  fs.mkdirSync(config.agent.workspaceRoot, { recursive: true });
}
