import { anthropicChat } from './anthropic.js';
import { claudeAgent } from './claude-agent.js';
import { openaiChat } from './openai.js';
import { mockChat } from './mock.js';
import { compatProviders } from './compat.js';

const ALL = [anthropicChat, claudeAgent, openaiChat, ...compatProviders, mockChat];

export function listProviders() {
  return ALL.map((p) => ({ id: p.id, label: p.label, kind: p.kind, available: p.available(), model: p.model() }));
}

export function getProvider(id) {
  const p = ALL.find((x) => x.id === id);
  return p && p.available() ? p : null;
}

export function defaultProviderId() {
  return ALL.find((p) => p.available())?.id ?? null;
}
