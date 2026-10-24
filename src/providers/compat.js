// OpenAI 호환(Chat Completions) API 라면 무엇이든 연결하는 범용 채팅·에이전트.
// 예: DeepSeek·Qwen·Kimi·GLM 같은 API, 또는 Ollama·vLLM·llama.cpp 로 직접 띄운 로컬 모델.
// .env 에 COMPAT_1_* ~ COMPAT_5_* 로 최대 5개까지 등록합니다 (.env.example 참고).
// 모델이 도구 호출(function calling)을 지원하면 웹 검색과, 에이전트 모드에서는 파일 작업까지 합니다.
import fs from 'node:fs';
import OpenAI from 'openai';
import { config } from '../config.js';
import { estimateCost } from '../pricing.js';
import { workspaceDir } from './claude-agent.js';
import { searchEnabled, webSearch, fetchPage } from '../tools/web.js';
import { listFiles, readFile, writeFile, editFile } from '../tools/files.js';
import { codeExecEnabled, runCommand } from '../tools/exec.js';

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

const fn = (name, description, properties, required = Object.keys(properties)) => ({
  type: 'function',
  function: { name, description, parameters: { type: 'object', properties, required } },
});

const WEB_TOOLS = [
  fn('web_search', '웹에서 최신 정보를 검색합니다. 결과의 제목·주소·요약을 돌려줍니다.', {
    query: { type: 'string', description: '검색어' },
  }),
  fn('fetch_url', '웹 페이지 주소의 본문 글을 가져옵니다. 검색 결과를 자세히 읽을 때 씁니다.', {
    url: { type: 'string', description: 'http 또는 https 주소' },
  }),
];

const FILE_TOOLS = [
  fn('list_files', '작업 폴더의 파일 목록을 봅니다.', { path: { type: 'string', description: '하위 폴더 (기본: 전체)' } }, []),
  fn('read_file', '작업 폴더의 파일 내용을 읽습니다.', { path: { type: 'string', description: '작업 폴더 기준 경로' } }),
  fn('write_file', '작업 폴더에 파일을 만들거나 덮어씁니다.', {
    path: { type: 'string', description: '작업 폴더 기준 경로' },
    content: { type: 'string', description: '파일 전체 내용' },
  }),
  fn('edit_file', '파일에서 old_text 한 곳을 new_text 로 바꿉니다.', {
    path: { type: 'string', description: '작업 폴더 기준 경로' },
    old_text: { type: 'string', description: '바꿀 원래 글 (파일 안에서 한 번만 나와야 함)' },
    new_text: { type: 'string', description: '새 글' },
  }),
];

const EXEC_TOOLS = [
  fn('run_command', '작업 폴더(/workspace)에서 셸 명령을 실행합니다. 예: python main.py. 인터넷은 막혀 있고 실행 시간이 제한됩니다. 출력과 종료 코드를 돌려줍니다.', {
    command: { type: 'string', description: '실행할 셸 명령' },
  }),
];

const EXEC_PROMPT = ' 코드를 만들면 run_command 로 실행해 결과를 확인하고, 오류가 나면 고쳐서 다시 실행하세요.';

const AGENT_PROMPT =
  '\n\n지금은 에이전트 모드입니다. 학생 전용 작업 폴더에서 list_files, read_file, write_file, edit_file 도구로 파일을 만들고 고칠 수 있습니다. ' +
  '경로는 작업 폴더 기준 상대 경로로 쓰세요. 고치기 전에 먼저 읽고, 작업을 마치면 무엇을 만들고 바꿨는지 짧게 정리하세요.';
const WEB_PROMPT = '\n\n최신 정보가 필요하면 web_search 로 검색하고, 답에 참고한 주소를 밝히세요.';

function clip(s, limit = 4000) {
  return s.length > limit ? `${s.slice(0, limit)}… (${s.length}자 중 일부)` : s;
}

async function runTool(name, args, { root, signal, sources }) {
  switch (name) {
    case 'web_search': {
      const results = await webSearch(String(args.query || ''), { signal });
      for (const r of results) sources.set(r.url, r.title);
      return results.length
        ? results.map((r, i) => `${i + 1}. ${r.title}\n${r.url}\n${r.snippet}`).join('\n\n')
        : '검색 결과가 없습니다.';
    }
    case 'fetch_url': {
      const page = await fetchPage(String(args.url || ''), { signal });
      sources.set(page.url, page.url);
      return `주소: ${page.url}\n\n${page.text}`;
    }
    case 'list_files':
      return listFiles(root, args.path);
    case 'read_file':
      return readFile(root, args.path);
    case 'write_file':
      return writeFile(root, args.path, args.content);
    case 'edit_file':
      return editFile(root, args.path, args.old_text, args.new_text);
    case 'run_command':
      return runCommand(root, String(args.command || ''), { signal });
    default:
      throw new Error(`없는 도구입니다: ${name}`);
  }
}

function makeProvider(entry, kind) {
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
  const isAgent = kind === 'agent';

  return {
    id: isAgent ? `${entry.id}-agent` : entry.id,
    label: isAgent ? `${entry.label} 에이전트 (${codeExecEnabled() ? '파일 작업 · 코드 실행' : '파일 작업'})` : entry.label,
    kind,
    available: () => Boolean(entry.baseUrl && entry.model && (!isAgent || (entry.agent && entry.tools))),
    model: () => entry.model,

    async *run({ user, conversation, history, userText, signal }) {
      const root = isAgent ? workspaceDir(user.id, conversation.id) : null;
      if (root) fs.mkdirSync(root, { recursive: true });
      const web = entry.tools && searchEnabled();
      const exec = isAgent && codeExecEnabled();
      let tools = [...(isAgent ? FILE_TOOLS : []), ...(exec ? EXEC_TOOLS : []), ...(web ? WEB_TOOLS : [])];

      const messages = [
        {
          role: 'system',
          content: config.systemPrompt + (isAgent ? AGENT_PROMPT : '') + (exec ? EXEC_PROMPT : '') + (web ? WEB_PROMPT : ''),
        },
        ...history.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: userText },
      ];

      const total = { input: 0, cachedInput: 0, output: 0 };
      const steps = [];
      const sources = new Map();
      let text = '';
      let finishReason = null;
      let pendingTools = false;

      for (let step = 0; step < entry.maxSteps; step++) {
        let stream;
        try {
          stream = await getClient().chat.completions.create(
            {
              model: entry.model,
              messages,
              stream: true,
              ...(tools.length ? { tools } : {}),
              ...(entry.streamUsage ? { stream_options: { include_usage: true } } : {}),
              ...(entry.reasoningEffort ? { reasoning_effort: entry.reasoningEffort } : {}),
              ...(entry.extraBody || {}),
            },
            { signal },
          );
        } catch (err) {
          // 도구 호출을 지원하지 않는 모델: 채팅은 도구 없이 다시 시도, 에이전트는 쓸 수 없음
          if (err instanceof OpenAI.BadRequestError && tools.length && step === 0) {
            if (isAgent) throw new Error('이 모델은 도구 호출을 지원하지 않아 에이전트 모드를 쓸 수 없습니다. 도구 호출을 지원하는 모델로 바꾸세요.');
            tools = [];
            step--;
            continue;
          }
          throw err;
        }

        const filter = createThinkFilter();
        const calls = [];
        let stepText = '';
        let reasoning = '';
        let usage = null;
        for await (const chunk of stream) {
          if (chunk.usage) usage = chunk.usage;
          const choice = chunk.choices?.[0];
          if (!choice) continue;
          if (choice.finish_reason) finishReason = choice.finish_reason;
          const delta = choice.delta || {};
          // DeepSeek·Qwen 등은 생각 과정을 reasoning_content 로 따로 보냅니다(학생 화면에는 표시하지 않음).
          const thought = delta.reasoning_content || delta.reasoning;
          if (thought) {
            if (!reasoning) yield { type: 'status', message: '생각 중…' };
            reasoning += thought;
          }
          if (delta.content) {
            const visible = filter(delta.content);
            if (visible) {
              stepText += visible;
              yield { type: 'text', delta: visible };
            }
          }
          for (const tc of delta.tool_calls || []) {
            const c = (calls[tc.index ?? calls.length] ??= { id: '', name: '', args: '' });
            if (tc.id) c.id = tc.id;
            const name = tc.function?.name;
            if (name) c.name = c.name && c.name !== name ? c.name + name : name;
            if (tc.function?.arguments) c.args += tc.function.arguments;
          }
        }
        const rest = filter('', true);
        if (rest) {
          stepText += rest;
          yield { type: 'text', delta: rest };
        }
        // 캐시 적중 토큰: OpenAI 형식(prompt_tokens_details.cached_tokens) 또는 DeepSeek 형식(prompt_cache_hit_tokens)
        const cached = usage?.prompt_tokens_details?.cached_tokens ?? usage?.prompt_cache_hit_tokens ?? 0;
        total.input += Math.max(0, (usage?.prompt_tokens || 0) - cached);
        total.cachedInput += cached;
        total.output += usage?.completion_tokens || 0;
        text += stepText;

        const toolCalls = calls.filter(Boolean).map((c, i) => ({
          id: c.id || `call_${step}_${i}`,
          type: 'function',
          function: { name: c.name, arguments: c.args || '{}' },
        }));
        pendingTools = toolCalls.length > 0;
        if (!pendingTools) break;

        const assistant = { role: 'assistant', content: stepText || null, tool_calls: toolCalls };
        if (reasoning) assistant.reasoning_content = reasoning; // DeepSeek 생각 모드는 이어지는 요청에 이 값을 요구
        messages.push(assistant);

        for (const call of toolCalls) {
          const name = call.function.name;
          let args = {};
          let output;
          let isError = false;
          try {
            args = JSON.parse(call.function.arguments || '{}');
          } catch {
            output = '오류: 도구 인자가 올바른 JSON 이 아닙니다. 다시 시도하세요.';
            isError = true;
          }
          yield { type: 'tool', name, input: args };
          if (!isError) {
            try {
              if (!tools.some((t) => t.function.name === name)) throw new Error(`사용할 수 없는 도구입니다: ${name}`);
              output = await runTool(name, args, { root, signal, sources });
            } catch (err) {
              if (signal?.aborted) throw err;
              output = `오류: ${err.message}`;
              isError = true;
            }
          }
          const forModel = clip(String(output), config.search.fetchMaxChars);
          steps.push({ type: 'tool', name, input: args, output: clip(String(output)), isError });
          yield { type: 'tool_result', name, isError };
          messages.push({ role: 'tool', tool_call_id: call.id, content: forModel });
        }
        if (text && !text.endsWith('\n')) {
          text += '\n\n';
          yield { type: 'text', delta: '\n\n' };
        }
      }

      if (pendingTools) {
        const note = '\n\n(작업 단계 한도에 도달해 멈췄습니다. 이어서 요청하면 계속합니다.)';
        text += note;
        yield { type: 'text', delta: note };
      }

      yield {
        type: 'done',
        text: text.trim(),
        model: entry.model,
        usage: total,
        costUsd: cost(total),
        meta: {
          steps,
          sources: [...sources].map(([url, title]) => ({ url, title })),
          stopReason: finishReason,
          endpoint: entry.label,
        },
      };
    },
  };
}

export const compatProviders = config.compat.flatMap((entry) => [makeProvider(entry, 'chat'), makeProvider(entry, 'agent')]);
