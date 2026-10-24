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
  // 실제 AI 없이 화면과 로그 기능을 시험해 볼 수 있는 가짜 응답기.
  mockProvider: bool(env.MOCK_PROVIDER, false),
};

export function ensureDirs() {
  fs.mkdirSync(config.dataDir, { recursive: true });
  fs.mkdirSync(config.agent.workspaceRoot, { recursive: true });
}
