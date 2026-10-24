// Claude 채팅 (Anthropic API 키 사용). 서버측 web_search 도구로 웹 검색까지 처리합니다.
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';
import { estimateCost, TOOL_PRICES } from '../pricing.js';

let client;
const getClient = () => (client ??= new Anthropic({ apiKey: config.anthropic.apiKey }));

// 거절 시 서버측 자동 대체(fallbacks)를 지원하는 모델
const FALLBACK_MODELS = new Set(['claude-fable-5-1', 'claude-opus-5-5', 'claude-opus-5', 'claude-sonnet-5-5']);
// 결과 필터링이 들어간 최신 웹 검색 도구를 지원하지 않는 모델은 기본 버전을 씁니다.
const webSearchType = (model) => (/haiku/.test(model) ? 'web_search_20250305' : 'web_search_20260209');

export const anthropicChat = {
  id: 'claude',
  label: 'Claude 채팅 (웹 검색 포함)',
  kind: 'chat',
  available: () => Boolean(config.anthropic.apiKey),
  model: () => config.anthropic.model,

  async *run({ history, userText, signal }) {
    const { model, maxTokens, effort, webSearch, webSearchMaxUses } = config.anthropic;
    const tools = webSearch
      ? [{ type: webSearchType(model), name: 'web_search', max_uses: webSearchMaxUses }]
      : [];
    const messages = [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: userText },
    ];

    const usage = { input: 0, output: 0, cachedInput: 0, cacheWrite: 0 };
    let searches = 0;
    let costUsd = 0;
    let text = '';
    let servedBy = model;
    const steps = [];
    const sources = new Map();
    let stopReason = null;

    // 서버측 도구가 오래 돌면 pause_turn 으로 끊겨 오므로, 이어서 요청합니다.
    for (let round = 0; round < 5; round++) {
      const stream = getClient().beta.messages.stream(
        {
          model,
          max_tokens: maxTokens,
          system: config.systemPrompt,
          messages,
          tools,
          output_config: { effort },
          cache_control: { type: 'ephemeral' },
          // 안전 분류기가 거절하면 서버가 알아서 다른 모델로 이어서 답하게 합니다.
          ...(FALLBACK_MODELS.has(model) ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' } : {}),
        },
        { signal },
      );

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          text += event.delta.text;
          yield { type: 'text', delta: event.delta.text };
        } else if (event.type === 'content_block_start' && event.content_block.type === 'server_tool_use') {
          yield { type: 'status', message: '웹 검색 중…' };
        }
      }

      const msg = await stream.finalMessage();
      servedBy = msg.model || model;
      stopReason = msg.stop_reason;
      const u = msg.usage;
      const roundUsage = {
        input: u.input_tokens || 0,
        output: u.output_tokens || 0,
        cachedInput: u.cache_read_input_tokens || 0,
        cacheWrite: u.cache_creation_input_tokens || 0,
      };
      for (const k of Object.keys(usage)) usage[k] += roundUsage[k];
      const roundSearches = u.server_tool_use?.web_search_requests || 0;
      searches += roundSearches;
      costUsd += estimateCost(servedBy, roundUsage) + roundSearches * TOOL_PRICES.anthropicWebSearch;

      for (const block of msg.content) {
        if (block.type === 'server_tool_use') {
          steps.push({ type: 'tool', name: block.name, input: block.input });
          yield { type: 'tool', name: block.name, input: block.input };
        } else if (block.type === 'web_search_tool_result' && Array.isArray(block.content)) {
          const results = block.content.map((r) => ({ title: r.title, url: r.url }));
          steps.push({ type: 'tool_result', name: 'web_search', results });
          for (const r of results) sources.set(r.url, r.title);
        } else if (block.type === 'text' && Array.isArray(block.citations)) {
          for (const c of block.citations) if (c.url) sources.set(c.url, c.title);
        }
      }

      if (msg.stop_reason === 'pause_turn') {
        messages.push({ role: 'assistant', content: msg.content });
        continue;
      }
      break;
    }

    if (stopReason === 'refusal' && !text) {
      text = '이 요청에는 답할 수 없습니다. 질문을 바꿔서 다시 시도해 주세요.';
      yield { type: 'text', delta: text };
    }

    yield {
      type: 'done',
      text,
      model: servedBy,
      usage,
      costUsd,
      meta: {
        steps,
        sources: [...sources].map(([url, title]) => ({ url, title })),
        webSearches: searches,
        stopReason,
      },
    };
  },
};
