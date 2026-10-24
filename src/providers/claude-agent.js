// Claude Code 와 같은 엔진(Claude Agent SDK)으로 학생별 작업 폴더 안에서 파일을 만들고
// 고치고, 웹을 검색하는 "에이전트 모드". 반드시 ANTHROPIC_API_KEY 로만 인증합니다.
// (Pro/Max 구독 로그인 토큰을 Agent SDK 에 쓰는 것은 Anthropic 약관상 금지되어 있습니다.)
import fs from 'node:fs';
import path from 'node:path';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { config } from '../config.js';

const FILE_TOOLS = ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'NotebookEdit'];

export function workspaceDir(userId, conversationId) {
  return path.join(config.agent.workspaceRoot, String(userId), String(conversationId));
}

export function isInside(root, target) {
  const rel = path.relative(root, target);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

// 파일 도구가 학생 작업 폴더 밖을 건드리지 못하게 막는 훅
function confineToWorkspace(cwd) {
  return async (input) => {
    const toolInput = input.tool_input || {};
    for (const key of ['file_path', 'path', 'notebook_path']) {
      const value = toolInput[key];
      if (typeof value !== 'string' || !value) continue;
      const resolved = path.resolve(cwd, value);
      let real = resolved;
      try {
        real = fs.realpathSync(resolved);
      } catch {
        // 아직 없는 파일(새로 쓰는 경우)은 경로만 검사
      }
      if (!isInside(cwd, resolved) || !isInside(fs.realpathSync(cwd), real)) {
        return {
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: 'deny',
            permissionDecisionReason: '작업 폴더 밖의 파일에는 접근할 수 없습니다.',
          },
        };
      }
    }
    return {};
  };
}

function summarize(value, limit = 4000) {
  const s = typeof value === 'string' ? value : JSON.stringify(value);
  return s && s.length > limit ? `${s.slice(0, limit)}… (${s.length}자 중 일부)` : s;
}

function toolResultText(block) {
  if (typeof block.content === 'string') return block.content;
  if (Array.isArray(block.content)) {
    return block.content.map((c) => (c.type === 'text' ? c.text : `[${c.type}]`)).join('\n');
  }
  return '';
}

// SDK 의 비용·토큰은 이어서 실행(resume)한 세션 전체의 누적값이므로,
// 대화에 저장해 둔 직전 누적값과의 차이를 이번 메시지 사용량으로 기록합니다.
export function sessionTotals(result) {
  const t = { cost: result.total_cost_usd || 0, input: 0, output: 0, cachedInput: 0, cacheWrite: 0 };
  for (const m of Object.values(result.modelUsage || {})) {
    t.input += m.inputTokens || 0;
    t.output += m.outputTokens || 0;
    t.cachedInput += m.cacheReadInputTokens || 0;
    t.cacheWrite += m.cacheCreationInputTokens || 0;
  }
  return t;
}

export function usageSince(prev, now) {
  // 누적값이 줄었다면(세션이 새로 시작됨) 지금 값 전체가 이번 사용량
  const base = prev && now.cost >= prev.cost ? prev : null;
  const out = {};
  for (const k of ['cost', 'input', 'output', 'cachedInput', 'cacheWrite']) {
    out[k] = Math.max(0, (now[k] || 0) - (base?.[k] || 0));
  }
  return out;
}

function parseTotals(json) {
  try {
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
}

export const claudeAgent = {
  id: 'claude-agent',
  label: 'Claude 에이전트 (파일 작업 · 웹 검색)',
  kind: 'agent',
  available: () => Boolean(config.agent.enabled && config.anthropic.apiKey),
  model: () => config.agent.model,

  async *run({ user, conversation, userText, signal }) {
    const cwd = workspaceDir(user.id, conversation.id);
    fs.mkdirSync(cwd, { recursive: true });

    const tools = [...FILE_TOOLS, 'WebSearch', 'WebFetch', ...(config.agent.allowBash ? ['Bash'] : [])];
    const abortController = new AbortController();
    signal?.addEventListener('abort', () => abortController.abort(), { once: true });

    const q = query({
      prompt: userText,
      options: {
        cwd,
        model: config.agent.model,
        tools,
        allowedTools: tools,
        permissionMode: 'dontAsk',
        permissionPrompts: 'none',
        // 서버 관리자의 개인 Claude Code 설정·로그인 정보를 읽지 않도록 격리
        settingSources: [],
        resume: conversation.agent_session_id || undefined,
        maxTurns: config.agent.maxTurns,
        maxBudgetUsd: config.agent.maxBudgetUsdPerRun || undefined,
        includePartialMessages: true,
        abortController,
        systemPrompt: {
          type: 'preset',
          preset: 'claude_code',
          append:
            `${config.systemPrompt}\n` +
            '지금 작업 폴더는 이 학생 전용 폴더입니다. 이 폴더 밖의 파일은 읽거나 쓰지 마세요. ' +
            '작업을 마치면 무엇을 만들었고 바꿨는지 한국어로 짧게 정리하세요.',
        },
        env: {
          PATH: process.env.PATH,
          HOME: config.dataDir,
          // 교수자 개인 ~/.claude (구독 로그인 포함) 대신 학생별 전용 설정 폴더 사용
          CLAUDE_CONFIG_DIR: path.join(config.dataDir, 'claude-config', String(user.id)),
          CLAUDE_CODE_DISABLE_AUTO_MEMORY: '1',
          ANTHROPIC_API_KEY: config.anthropic.apiKey,
          CLAUDE_AGENT_SDK_CLIENT_APP: 'class-ai-share/0.1',
        },
        hooks: {
          PreToolUse: [{ matcher: FILE_TOOLS.join('|'), hooks: [confineToWorkspace(cwd)] }],
        },
        sandbox: config.agent.allowBash
          ? {
              enabled: true,
              failIfUnavailable: true,
              autoAllowBashIfSandboxed: true,
              allowUnsandboxedCommands: false,
              filesystem: {
                allowWrite: [cwd],
                denyRead: [config.root],
                allowRead: [cwd],
              },
              credentials: {
                envVars: [
                  { name: 'ANTHROPIC_API_KEY', mode: 'deny' },
                  { name: 'OPENAI_API_KEY', mode: 'deny' },
                ],
              },
            }
          : undefined,
      },
    });

    const steps = [];
    const pendingTools = new Map();
    let text = '';
    let result = null;
    let sessionId = conversation.agent_session_id || null;

    for await (const message of q) {
      if (message.type === 'system' && message.subtype === 'init') {
        sessionId = message.session_id;
        if (message.apiKeySource === 'oauth' || message.apiKeySource === '/login managed key') {
          q.close();
          throw new Error('에이전트가 구독 로그인으로 실행되려 했습니다. ANTHROPIC_API_KEY 설정을 확인하세요.');
        }
        yield { type: 'session', sessionId };
      } else if (message.type === 'stream_event' && !message.parent_tool_use_id) {
        const ev = message.event;
        if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') {
          text += ev.delta.text;
          yield { type: 'text', delta: ev.delta.text };
        }
      } else if (message.type === 'assistant') {
        for (const block of message.message.content) {
          if (block.type === 'text' && block.text) {
            steps.push({ type: 'text', text: block.text });
          } else if (block.type === 'tool_use') {
            const step = { type: 'tool', name: block.name, input: block.input };
            steps.push(step);
            pendingTools.set(block.id, step);
            yield { type: 'tool', name: block.name, input: block.input };
          }
        }
        // 다음 텍스트 묶음과 붙지 않도록 줄바꿈
        if (text && !text.endsWith('\n')) {
          text += '\n\n';
          yield { type: 'text', delta: '\n\n' };
        }
      } else if (message.type === 'user' && Array.isArray(message.message?.content)) {
        for (const block of message.message.content) {
          if (block.type !== 'tool_result') continue;
          const step = pendingTools.get(block.tool_use_id);
          const output = summarize(toolResultText(block));
          if (step) {
            step.output = output;
            step.isError = Boolean(block.is_error);
          }
          yield { type: 'tool_result', name: step?.name, isError: Boolean(block.is_error) };
        }
      } else if (message.type === 'result') {
        result = message;
      }
    }

    if (!result) throw new Error('에이전트가 결과 없이 종료되었습니다.');
    const totals = sessionTotals(result);
    const usage = usageSince(parseTotals(conversation.agent_totals), totals);
    const notes = {
      error_max_turns: '\n\n(작업 단계 한도에 도달해 멈췄습니다. 이어서 요청하면 계속합니다.)',
      error_max_budget_usd: '\n\n(1회 실행 비용 한도에 도달해 멈췄습니다.)',
      error_during_execution: '\n\n(실행 중 오류로 멈췄습니다.)',
    };
    if (notes[result.subtype]) {
      text += notes[result.subtype];
      yield { type: 'text', delta: notes[result.subtype] };
    }

    yield {
      type: 'done',
      text: text.trim() || result.result || '',
      model: config.agent.model,
      sessionId: result.session_id || sessionId,
      usage,
      costUsd: usage.cost,
      agentTotals: totals,
      meta: {
        steps,
        numTurns: result.num_turns,
        resultSubtype: result.subtype,
        permissionDenials: result.permission_denials?.length || 0,
      },
    };
  },
};
