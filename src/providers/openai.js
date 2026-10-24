// OpenAI 채팅 (OpenAI API 키 사용). Responses API 의 web_search 도구로 웹 검색을 합니다.
import OpenAI from 'openai';
import { config } from '../config.js';
import { estimateCost, TOOL_PRICES } from '../pricing.js';

let client;
const getClient = () => (client ??= new OpenAI({ apiKey: config.openai.apiKey }));

export const openaiChat = {
  id: 'openai',
  label: 'OpenAI 채팅 (웹 검색 포함)',
  kind: 'chat',
  // 모델 이름은 자주 바뀌므로 OPENAI_MODEL 을 직접 지정해야 켜집니다.
  available: () => Boolean(config.openai.apiKey && config.openai.model),
  model: () => config.openai.model,

  async *run({ history, userText, signal }) {
    const { model, webSearch } = config.openai;
    const input = [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: userText },
    ];

    const stream = await getClient().responses.create(
      {
        model,
        instructions: config.systemPrompt,
        input,
        tools: webSearch ? [{ type: 'web_search' }] : [],
        stream: true,
        store: false,
      },
      { signal },
    );

    let text = '';
    let final = null;
    for await (const event of stream) {
      if (event.type === 'response.output_text.delta') {
        text += event.delta;
        yield { type: 'text', delta: event.delta };
      } else if (event.type === 'response.web_search_call.in_progress') {
        yield { type: 'status', message: '웹 검색 중…' };
      } else if (event.type === 'response.completed' || event.type === 'response.incomplete') {
        final = event.response;
      } else if (event.type === 'response.failed') {
        throw new Error(event.response?.error?.message || 'OpenAI 응답이 실패했습니다.');
      } else if (event.type === 'error') {
        throw new Error(event.message || 'OpenAI 스트림 오류');
      }
    }

    const steps = [];
    const sources = new Map();
    let searches = 0;
    for (const item of final?.output || []) {
      if (item.type === 'web_search_call') {
        searches += 1;
        steps.push({ type: 'tool', name: 'web_search', input: item.action ?? null });
      } else if (item.type === 'message') {
        for (const part of item.content || []) {
          for (const a of part.annotations || []) {
            if (a.type === 'url_citation') sources.set(a.url, a.title);
          }
        }
      }
    }

    const u = final?.usage;
    const cached = u?.input_tokens_details?.cached_tokens || 0;
    const usage = {
      input: (u?.input_tokens || 0) - cached,
      cachedInput: cached,
      output: u?.output_tokens || 0,
    };

    yield {
      type: 'done',
      text,
      model: final?.model || model,
      usage,
      costUsd: estimateCost(model, usage) + searches * TOOL_PRICES.openaiWebSearch,
      meta: {
        steps,
        sources: [...sources].map(([url, title]) => ({ url, title })),
        webSearches: searches,
        stopReason: final?.status ?? null,
      },
    };
  },
};
