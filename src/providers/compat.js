// OpenAI 호환(Chat Completions) API 라면 무엇이든 연결하는 범용 채팅.
// 예: DeepSeek·Qwen·Kimi·GLM 같은 API, 또는 Ollama·vLLM·llama.cpp 로 직접 띄운 로컬 모델.
// .env 에 COMPAT_1_* ~ COMPAT_5_* 로 최대 5개까지 등록합니다 (.env.example 참고).
import OpenAI from 'openai';
import { config } from '../config.js';
import { estimateCost } from '../pricing.js';

// 일부 모델(Qwen3, DeepSeek-R1 계열 등)은 답 맨 앞에 <think>…</think> 로 생각 과정을 붙여 보냅니다.
// 스트림 조각이 태그 중간에서 잘려도 맨 앞의 생각 부분만 빼고 답을 내보내는 필터입니다.
// (답 중간에 나오는 <think> 글자는 그대로 둡니다.)
const OPEN = '<think>';
const CLOSE = '</think>';

export function createThinkFilter() {
  let buf = '';
  let state = 'start'; // start → think → pass, 또는 start → pass
  return (chunk, flush = false) => {
    if (state === 'pass') return chunk;
    buf += chunk;
    if (state === 'start') {
      const trimmed = buf.trimStart();
      if (trimmed.startsWith(OPEN)) {
        state = 'think';
        buf = trimmed.slice(OPEN.length);
      } else if (OPEN.startsWith(trimmed) && !flush) {
        return ''; // 아직 <think> 의 앞부분일 수 있어 기다림
      } else {
        state = 'pass';
        const out = buf;
        buf = '';
        return out;
      }
    }
    const end = buf.indexOf(CLOSE);
    if (end < 0) {
      buf = flush ? '' : buf.slice(-CLOSE.length);
      return '';
    }
    const out = buf.slice(end + CLOSE.length).replace(/^\s+/, '');
    buf = '';
    state = 'pass';
    return out;
  };
}

function makeProvider(entry) {
  let client;
  const getClient = () =>
    (client ??= new OpenAI({ apiKey: entry.apiKey || 'not-needed', baseURL: entry.baseUrl }));

  const cost = (usage) => {
    if (entry.price) {
      const p = entry.price;
      return ((usage.input || 0) * p.input + (usage.cachedInput || 0) * (p.cachedInput ?? p.input) + (usage.output || 0) * p.output) / 1_000_000;
    }
    return estimateCost(entry.model, usage); // PRICING_OVERRIDES 에 있으면 사용, 없으면 0
  };

  return {
    id: entry.id,
    label: entry.label,
    kind: 'chat',
    available: () => Boolean(entry.baseUrl && entry.model),
    model: () => entry.model,

    async *run({ history, userText, signal }) {
      const messages = [
        { role: 'system', content: config.systemPrompt },
        ...history.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: userText },
      ];
      const stream = await getClient().chat.completions.create(
        {
          model: entry.model,
          messages,
          stream: true,
          ...(entry.streamUsage ? { stream_options: { include_usage: true } } : {}),
        },
        { signal },
      );

      const filter = createThinkFilter();
      let text = '';
      let usage = null;
      let thinkingShown = false;
      let finishReason = null;
      for await (const chunk of stream) {
        if (chunk.usage) usage = chunk.usage;
        const choice = chunk.choices?.[0];
        if (!choice) continue;
        if (choice.finish_reason) finishReason = choice.finish_reason;
        const delta = choice.delta || {};
        // DeepSeek·Qwen 등은 생각 과정을 reasoning_content 로 따로 보냅니다(표시하지 않음).
        if ((delta.reasoning_content || delta.reasoning) && !thinkingShown) {
          thinkingShown = true;
          yield { type: 'status', message: '생각 중…' };
        }
        if (delta.content) {
          const visible = filter(delta.content);
          if (visible) {
            text += visible;
            yield { type: 'text', delta: visible };
          }
        }
      }
      const rest = filter('', true);
      if (rest) {
        text += rest;
        yield { type: 'text', delta: rest };
      }

      // 캐시 적중 토큰: OpenAI 형식(prompt_tokens_details.cached_tokens) 또는 DeepSeek 형식(prompt_cache_hit_tokens)
      const cached = usage?.prompt_tokens_details?.cached_tokens ?? usage?.prompt_cache_hit_tokens ?? 0;
      const u = {
        input: Math.max(0, (usage?.prompt_tokens || 0) - cached),
        cachedInput: cached,
        output: usage?.completion_tokens || 0,
      };
      yield {
        type: 'done',
        text,
        model: entry.model,
        usage: u,
        costUsd: cost(u),
        meta: { steps: [], sources: [], stopReason: finishReason, endpoint: entry.label },
      };
    },
  };
}

export const compatProviders = config.compat.map(makeProvider);
