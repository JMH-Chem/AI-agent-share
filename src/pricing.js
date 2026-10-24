// 비용 추정용 단가표 (USD / 100만 토큰). 실제 청구액은 각 콘솔에서 확인하세요.
// 가격이 바뀌면 이 표나 PRICING_OVERRIDES 환경변수(JSON)로 고치면 됩니다.
// 예: PRICING_OVERRIDES='{"my-model":{"input":1,"output":4,"cachedInput":0.1}}'
const PRICES = {
  // Anthropic (2026-10 기준 공개 단가)
  'claude-fable-5-1': { input: 10, output: 50, cachedInput: 0.25 },
  'claude-opus-5-5': { input: 4, output: 20, cachedInput: 0.2 },
  'claude-opus-5': { input: 5, output: 25, cachedInput: 0.5 },
  'claude-sonnet-5-5': { input: 2, output: 10, cachedInput: 0.1 },
  'claude-sonnet-5': { input: 2, output: 10, cachedInput: 0.2 },
  'claude-haiku-5-5': { input: 0.1, output: 0.5, cachedInput: 0.01 },
};

// 서버측 도구 요금 (USD / 1회)
export const TOOL_PRICES = {
  anthropicWebSearch: 10 / 1000,
  openaiWebSearch: 10 / 1000,
};

let overrides = {};
try {
  overrides = JSON.parse(process.env.PRICING_OVERRIDES || '{}');
} catch {
  console.warn('PRICING_OVERRIDES 가 올바른 JSON 이 아니어서 무시합니다.');
}

export function priceFor(model) {
  return overrides[model] || PRICES[model] || null;
}

// usage: { input, output, cachedInput?, cacheWrite? } (토큰 수)
export function estimateCost(model, usage) {
  const p = priceFor(model);
  if (!p) return 0;
  const cached = usage.cachedInput || 0;
  const write = usage.cacheWrite || 0;
  return (
    ((usage.input || 0) * p.input +
      cached * (p.cachedInput ?? p.input) +
      write * p.input * 1.25 +
      (usage.output || 0) * p.output) /
    1_000_000
  );
}
