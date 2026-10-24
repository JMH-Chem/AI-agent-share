# Offering Claude Code / Codex-like agents to 30–50 students via a web page (state as of 2026-10-24)

Research notes by a sub-researcher. Scope: technical building blocks, existing projects, auth requirements, isolation/security, logging/auditing, and web-search quality. All facts carry inline sources. Where a source was only reachable through a search-engine summary (OpenAI's developers.openai.com, help.openai.com, openai.com, e2b.dev, daytona.io, modal.com, vercel.com, developers.cloudflare.com were blocked to direct fetch from this environment), it is marked "(search summary)". Anthropic docs (code.claude.com, platform.claude.com, anthropic.com) and GitHub READMEs were read directly.

Current model landscape (context for prices below): Anthropic lists Claude Opus 5.5 (released 2026-09-22, $4/$20 per MTok), Sonnet 5.5 ($2/$10), Haiku 5.5 ($0.10/$0.50 for prompts up to 100k tokens), and Fable 5.1 ($10/$50) — [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing); [Introducing Claude Opus 5.5](https://www.anthropic.com/claude-opus-5-5). OpenAI's current models referenced by competitors' pages are GPT-6 Astra, GPT-6.1 Sol and GPT-5.6 Sol — [Anthropic Opus 5.5 page](https://www.anthropic.com/claude-opus-5-5); [LibreChat README](https://github.com/LibreChat-AI/LibreChat).

---

## 1. Claude Agent SDK: capabilities, auth, and Anthropic's official multi-user hosting guidance

### Takeaway
The Claude Agent SDK (Python `claude-agent-sdk`, TypeScript `@anthropic-ai/claude-agent-sdk`) gives the full Claude Code agent loop (Read/Write/Edit/Bash/Glob/Grep/WebSearch/WebFetch, subagents, hooks, MCP, permission modes, sessions, skills) as a library, but it must be authenticated with an API key (or Bedrock / Claude Platform on AWS / Google Cloud / Foundry credentials) — Anthropic explicitly forbids third parties from offering claude.ai subscription login. Anthropic's "Hosting the Agent SDK" page is now a full multi-tenant guide (subprocess-per-session model, per-tenant `cwd`/`CLAUDE_CONFIG_DIR`, `settingSources: []`, SessionStore, OTel, egress proxy), and it also points to a new fully hosted alternative, Claude Managed Agents.

### Cited Findings
**What it is / capabilities**
- The Agent SDK "gives you the same tools, agent loop, and context management that power Claude Code, programmable in Python and TypeScript." Capabilities listed: built-in tools ("Read, write, edit files, run commands, and search the web"), hooks, subagents, MCP, permissions, sessions ("resume or fork later"), skills/commands/memory, plugins — [Agent SDK overview](https://code.claude.com/docs/en/agent-sdk/overview)
- Anthropic's comparison table: Agent SDK = "a library that runs the Claude Code binary" in a process you operate; Client SDK = raw API where you write the tool loop; Managed Agents = "Anthropic host[s] the agent", "sessions in an Anthropic-managed cloud sandbox or a self-hosted sandbox on your own infrastructure" — [Agent SDK overview](https://code.claude.com/docs/en/agent-sdk/overview)
- Built-in Claude Code tools include `Agent`, `Bash`, `Edit`, `Glob`, `Grep`, `NotebookEdit`, `Read`, `WebFetch`, `WebSearch`, `Write`, `TaskCreate/…`, `Monitor`, `LSP`, `Workflow`, and others; `Bash`, `Edit`, `Write`, `WebFetch`, `WebSearch` require permission by default — [Claude Code tools reference](https://code.claude.com/docs/en/tools-reference)
- Install: `npm install @anthropic-ai/claude-agent-sdk` / `pip install claude-agent-sdk` (or `uv add claude-agent-sdk`); requires Node.js 18+ or Python 3.10+; both SDKs bundle a native Claude Code binary — [Agent SDK quickstart](https://code.claude.com/docs/en/agent-sdk/quickstart)
- Migration from the old "Claude Code SDK" packages is documented in a migration guide (i.e., the Claude Code SDK was renamed to the Agent SDK) — [Agent SDK overview](https://code.claude.com/docs/en/agent-sdk/overview)
- Messages stream as an async iterator (`async for message in query(...)`), yielding assistant reasoning, tool calls, tool results, and a final `ResultMessage`; Python `ClaudeSDKClient` / TS `streamInput()` keep a session open across turns — [Agent SDK quickstart](https://code.claude.com/docs/en/agent-sdk/quickstart); [Hosting the Agent SDK](https://code.claude.com/docs/en/agent-sdk/hosting)

**Permission modes**
- Modes: `default`, `dontAsk` (deny instead of prompting), `acceptEdits`, `bypassPermissions`, `plan`, `auto` (a classifier model reviews shell commands/network requests). Evaluation order: hooks → deny rules → ask rules → permission mode → allow rules → `canUseTool` callback — [Agent SDK permissions](https://code.claude.com/docs/en/agent-sdk/permissions)
- Recommended locked-down headless pattern: `allowedTools` + `permissionMode: "dontAsk"`. Warning: "`allowed_tools` does not constrain `bypassPermissions`" — setting `allowed_tools=["Read"]` with `bypassPermissions` still approves Bash/Write/Edit. A `PreToolUse` hook deny "applies even in `bypassPermissions` mode." On Linux/macOS Claude Code refuses `bypassPermissions` as root outside a recognized sandbox — [Agent SDK permissions](https://code.claude.com/docs/en/agent-sdk/permissions)

**Hooks**
- Hook events include `PreToolUse` (can block or modify via `permissionDecision` allow/deny/ask/defer and `updatedInput`), `PostToolUse` (can replace output via `updatedToolOutput`), `PostToolUseFailure`, `UserPromptSubmit`, `Stop`, `SubagentStart/Stop`, `PreCompact`, `PermissionRequest`, `Notification` (both SDKs); `SessionStart`, `SessionEnd`, `MessageDisplay`, `PermissionDenied` and ~20 others are TypeScript-only. All hook inputs share `session_id`, `cwd`, `hook_event_name`; tool use ID correlates Pre/Post events. Async hook outputs (`async: true`) are meant for logging side effects — [Agent SDK hooks](https://code.claude.com/docs/en/agent-sdk/hooks)
- Caveat from the docs: a `Write|Edit` matcher does not catch a file written by Bash; use sandbox config for that — [Agent SDK hooks](https://code.claude.com/docs/en/agent-sdk/hooks)

**Authentication**
- `ANTHROPIC_API_KEY` from the Claude Console; alternatives: Amazon Bedrock (`CLAUDE_CODE_USE_BEDROCK=1`), Claude Platform on AWS (`CLAUDE_CODE_USE_ANTHROPIC_AWS=1` + `ANTHROPIC_AWS_WORKSPACE_ID`), Google Cloud's Agent Platform (`CLAUDE_CODE_USE_VERTEX=1`), Microsoft Foundry (`CLAUDE_CODE_USE_FOUNDRY=1`) — [Agent SDK quickstart](https://code.claude.com/docs/en/agent-sdk/quickstart)
- Policy (quoted): "Unless previously approved, Anthropic does not allow third party developers to offer claude.ai login or rate limits for their products, including agents built on the Claude Agent SDK. Use the API key authentication methods … instead." — [Agent SDK overview](https://code.claude.com/docs/en/agent-sdk/overview); repeated in [quickstart](https://code.claude.com/docs/en/agent-sdk/quickstart)
- Use is governed by Anthropic's Commercial Terms, including when powering services for your own end users; branding: may say "Claude Agent" or "{YourAgentName} Powered by Claude", must not call it "Claude Code" or mimic Claude Code visuals — [Agent SDK overview](https://code.claude.com/docs/en/agent-sdk/overview)
- `ANTHROPIC_BASE_URL` can point the SDK at a proxy that injects the key outside the container so the agent never sees it — [Hosting the Agent SDK](https://code.claude.com/docs/en/agent-sdk/hosting); [Secure deployment](https://code.claude.com/docs/en/agent-sdk/secure-deployment)

**Official hosting guidance (multi-user)**
- Architecture: `query()` spawns a `claude` CLI subprocess over stdio that "owns the shell, the working directory, and the JSONL session transcripts on local disk." "One agent session maps to one subprocess." Pass a distinct `cwd` per session — [Hosting the Agent SDK](https://code.claude.com/docs/en/agent-sdk/hosting)
- Four session patterns: ephemeral (container per task), long-running (persistent containers, many SDK processes per container), hybrid (ephemeral containers hydrating from a `SessionStore`), multi-agent container — [Hosting the Agent SDK](https://code.claude.com/docs/en/agent-sdk/hosting)
- Sizing: "1 GiB RAM, 5 GiB disk, and 1 CPU per agent is a reasonable starting point"; "agents per host = (host RAM − overhead) / (per-session RAM ceiling)"; for scale-out, pin sessions to containers via consistent hashing on `sessionId` — [Hosting the Agent SDK](https://code.claude.com/docs/en/agent-sdk/hosting)
- Cost: "Anthropic token cost typically dominates container infrastructure cost by an order of magnitude or more. A minimally provisioned container runs roughly $0.05 per hour, while a single long agent session can spend dollars in tokens." — [Hosting the Agent SDK](https://code.claude.com/docs/en/agent-sdk/hosting)
- Multi-tenant isolation inside a shared container: `settingSources: []`; `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`; per-tenant `CLAUDE_CONFIG_DIR`; per-tenant `cwd` on every call; per-tenant egress rules at the proxy. In TS, `env` replaces the subprocess env (spread `...process.env`) — [Hosting the Agent SDK](https://code.claude.com/docs/en/agent-sdk/hosting)
- Auth placement: "put authentication at a gateway in front of the agent container. The agent should receive pre-authenticated requests and should not be the component that validates user tokens." Keep tool credentials out of the agent environment via an injecting proxy — [Hosting the Agent SDK](https://code.claude.com/docs/en/agent-sdk/hosting)
- Known limitations: no top-level session timeout (use `maxTurns`), memory growth over long sessions, large subagent fan-outs can hit rate limits — [Hosting the Agent SDK](https://code.claude.com/docs/en/agent-sdk/hosting)
- Transcripts live in `~/.claude/projects/` (or under `CLAUDE_CONFIG_DIR`) and are lost on restart unless mirrored with a `SessionStore` adapter (reference adapters for object store, KV, DB); mirror writes are best-effort and emit `mirror_error` system messages on failure — [Hosting the Agent SDK](https://code.claude.com/docs/en/agent-sdk/hosting)
- Deployable Dockerfiles/K8s manifests and a Modal example are in the hosting cookbook — [Hosting the Agent SDK](https://code.claude.com/docs/en/agent-sdk/hosting) → [claude-cookbooks/claude_agent_sdk/hosting](https://github.com/anthropics/claude-cookbooks/tree/main/claude_agent_sdk/hosting)
- Anthropic demo apps: `anthropics/claude-agent-sdk-demos` (2,789 stars, active 2026-10-24) — [GitHub search API result](https://github.com/anthropics/claude-agent-sdk-demos)

### Inferences
- For a classroom, the Agent SDK is the closest thing to "Claude Code for each student" while staying within Anthropic's terms: the instructor's org API key pays for everything, students never need a subscription, and the instructor's backend (not Anthropic) owns per-student identity.
- Because each session is a subprocess with a shell, giving 30–50 students Bash in one shared container is unsafe even with `settingSources: []`; the docs' isolation options prevent context leakage, not malicious code. Per-student containers (Section 4) are the realistic minimum when Bash is enabled.
- A plausible concurrency profile for a class (e.g., 15–25 students active at once in lab hours) fits on one 32–64 GB VM using the 1 GiB/agent baseline — this is an estimate, not a documented figure.

### Gaps
- I did not find per-version SDK numbers (latest semver) on the pages read; changelog links exist but were not opened.
- No Anthropic statement found on education-specific/academic API pricing for this use case (may be covered by another researcher's education-plan notes).

---

## 2. Anthropic server-side tools and Claude Managed Agents (capabilities and pricing)

### Takeaway
Through the plain Messages API, Anthropic runs web search ($10 per 1,000 searches + tokens), web fetch (no extra charge), and code execution (1,550 free container-hours/org/month, then $0.05 per container-hour; free when used together with the 2026 web search/fetch versions). There is also **Claude Managed Agents** (beta; its required header is dated `managed-agents-2026-04-01`, exact launch date not verified): Anthropic hosts the agent loop plus a sandbox with bash/read/write/edit/glob/grep/web_search/web_fetch/MCP, persists the full event history server-side, and bills tokens + $0.08 per session-hour of `running` time. It is API-key-only and not ZDR-eligible.

### Cited Findings
**Server tools on the Messages API**
- Web search: "$10 USD per 1,000 searches, plus standard token costs for search-generated content"; each search counts as one use regardless of results; errors are not billed — [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing); [Web search tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool)
- Web search versions: `web_search_20250305` (basic), `web_search_20260209` (adds dynamic filtering: Claude writes code that filters results before they enter context; available on Claude 4.6+), `web_search_20260318` (adds `response_inclusion`). Parameters: `max_uses`, `allowed_domains` or `blocked_domains`, `user_location` (ISO country code), `allowed_callers` — [Web search tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool)
- Web search is enabled per org unless disabled in Console, where admins can also restrict domains; citations are always on — [Web search tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool)
- Web fetch: "available on the Claude API at no additional cost" — only token costs — [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- Code execution: "Code execution is free when used with web search or web fetch" (`web_search_20260209`+ / `web_fetch_20260209`+); otherwise "1,550 free hours of usage per month" per organization, then "$0.05 USD per hour, per container"; files in the request are billed even if the tool isn't called — [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- A browser use toolset (`browser_toolset_20260801`) also exists, priced as normal tool use (~6,600 input tokens of definitions + screenshots) — [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- US-only inference (`inference_geo: "us"`) costs 1.1×; Batch API is −50% — [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing)

**Claude Managed Agents**
- "Pre-built, configurable agent harness that runs in managed infrastructure"; concepts: Agent (model, system prompt, tools, MCP servers, skills), Environment (Anthropic cloud sandbox or self-hosted sandbox), Session, Events. "Claude autonomously runs tools and streams back results through server-sent events (SSE). Event history is persisted server-side and can be fetched in full." Users can steer or interrupt mid-run; supports scheduled (cron) deployments — [Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview)
- Beta: requires `managed-agents-2026-04-01` header (SDK sets it), "enabled by default for all API accounts"; needs a Claude API key. Also available on Claude Platform on AWS and Claude Models on Google Cloud (Anthropic managed) — [Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview)
- Not eligible for Zero Data Retention or HIPAA BAA because it's stateful; sessions and files can be deleted via API — [Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview)
- Built-in toolset `agent_toolset_20260401`: `bash`, `read`, `write`, `edit`, `glob`, `grep`, `web_fetch`, `web_search`; each can be disabled or given a `permission_policy`; web tools accept domain allow/block lists, content caps, and location; custom tools and an MCP connector are supported; outputs >100k chars are spilled to a sandbox file — [Managed Agents tools](https://platform.claude.com/docs/en/managed-agents/tools)
- Pricing: tokens at normal model rates (caching applies, no batch discount) + "Session runtime $0.08 USD per session-hour", metered to the millisecond only while status is `running` (idle time waiting for the user is free); this "replaces the code execution container-hour billing." Web search inside a session is billed at the standard rate. Worked example: 1-hour Opus 5.5 session with 50k input / 15k output ≈ $0.58 ($0.20 + $0.30 + $0.08) — [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- Agent SDK docs recommend Managed Agents "If you don't need to run the agent loop itself on your own infrastructure" — [Hosting the Agent SDK](https://code.claude.com/docs/en/agent-sdk/hosting)
- OpenTelemetry for the Claude API / Managed Agents is documented separately — [Agent SDK observability](https://code.claude.com/docs/en/agent-sdk/observability) → [OpenTelemetry for the Claude API](https://platform.claude.com/docs/en/manage-claude/opentelemetry)

### Inferences
- For a single instructor, Managed Agents removes the hardest parts (sandbox provisioning, isolation, transcript persistence): the backend only needs to (a) authenticate students, (b) create one session per student/assignment with the instructor's API key, (c) relay SSE events to the browser, and (d) store a `student_id → session_id` map. The instructor can then pull every session's full event history for review, which directly meets the "see every prompt, tool call and output" requirement.
- Idle time is free, so a class where students think between messages pays mostly for tokens; runtime cost for 40 students × 3 h of active agent time/week ≈ $9.6/week — an estimate from the $0.08/h rate.
- Not being ZDR-eligible means student work is stored at Anthropic; the instructor should disclose this to students (and consider Korean PIPA consent requirements — not researched here).

### Gaps
- I did not open the Managed Agents sessions/events reference pages, so the exact list/filter endpoints (e.g., listing all sessions, metadata tagging per student) and rate limits are unverified.
- Cloud sandbox specs (CPU/RAM, preinstalled packages) for Managed Agents environments were not read.

---

## 3. OpenAI Codex (CLI, `codex exec`, SDKs, app server) and OpenAI hosted-agent options

### Takeaway
Codex CLI (Apache-2.0) can be driven headlessly with `codex exec --json` (JSONL event stream), the TypeScript SDK (a wrapper that spawns the CLI; exact npm package name not verified here), the Python SDK (`openai-codex`, drives the local app-server over JSON-RPC), or the app server (JSON-RPC 2.0 over stdio; WebSocket experimental). The old `codex mcp-server` was removed 2026-09-05. For a server that serves other people, API-key auth is the documented automation path; ChatGPT-plan auth is per-user (OpenAI's new "Sign in with ChatGPT" for open-source apps lets each user spend *their own* plan, which conflicts with "students shouldn't need a subscription"). OpenAI also launched a hosted **Agents API** (public beta, 2026-09-10) that puts the Codex harness behind an API with OpenAI-hosted or self-hosted sandboxes.

### Cited Findings
**Codex CLI / SDKs / app server**
- Codex CLI "is a coding agent from OpenAI that runs locally on your computer"; licensed Apache-2.0; README recommends signing in with ChatGPT (Plus/Pro/Business/Edu/Enterprise) and says API-key use "requires additional setup" — [openai/codex README](https://github.com/openai/codex)
- TypeScript SDK: "wraps the Codex CLI … It spawns the CLI and exchanges JSONL events over stdin/stdout"; API `new Codex()`, `startThread({workingDirectory, skipGitRepoCheck})`, `thread.run()`, `thread.runStreamed()`, `resumeThread(id)`; threads persist in `~/.codex/sessions`; "Codex requires the working directory to be a Git repository" unless `skipGitRepoCheck`; `env` option replaces the inherited environment; injects `CODEX_API_KEY`; supports `outputSchema` per turn — [Codex TS SDK README](https://github.com/openai/codex/blob/main/sdk/typescript/README.md)
- Python SDK: `pip install openai-codex`; supports `login_chatgpt()`, device-code login, and `login_api_key("sk-...")`; returns `TurnResult` with final response, items and token usage — [Codex Python SDK README](https://github.com/openai/codex/blob/main/sdk/python/README.md)
- `codex exec` (alias `codex e`) for scripts/CI; `--json` emits JSONL events (`thread.started`, `turn.started`, `turn.completed`, `turn.failed`, `item.*`, `error`); `--output-schema` + `-o` writes structured final output; docs recommend setting `CODEX_API_KEY` inline per run rather than job-wide when running repository-controlled code — [Codex non-interactive mode (search summary)](https://developers.openai.com/codex/noninteractive); [Codex environment variables (search summary)](https://developers.openai.com/codex/environment-variables)
- CI/CD auth guide says the right way to authenticate automation is an API key; `CODEX_ACCESS_TOKEN` exists for ChatGPT-managed auth on trusted runners; Codex access tokens for automation are supported for ChatGPT Business/Enterprise workspaces — [Maintain Codex account auth in CI/CD (search summary)](https://developers.openai.com/codex/auth/ci-cd-auth); [Codex access tokens (search summary)](https://developers.openai.com/codex/enterprise/access-tokens)
- Codex App Server: local JSON-RPC 2.0 server "for embedding Codex in your own product"; stdio default, WebSocket "experimental and unsupported", Unix socket available; methods `thread/start|resume|fork|read|list|archive`, `turn/start|steer|interrupt` — [Codex App Server (search summary)](https://developers.openai.com/codex/app-server); the repo README documents many further experimental methods — [codex-rs/app-server/README.md](https://github.com/openai/codex/blob/main/codex-rs/app-server/README.md)
- "The codex mcp-server command and standalone codex-mcp-server binary have been removed after their deprecation on August 24, 2026" (removal 2026-09-05); app server is the replacement but is not MCP and is described as "experimental and isn't supported for production workloads" — [Codex MCP server removal (search summary)](https://developers.openai.com/codex/guides/agents-sdk)
- Auth: two sign-in options (ChatGPT subscription or API key); with an API key, usage follows the API org's retention settings, is billed at standard API pricing, and "some features that rely on ChatGPT workspace access or cloud services are limited or unavailable" (Codex cloud requires ChatGPT login) — [Codex authentication (search summary)](https://developers.openai.com/codex/auth); [Codex pricing (search summary)](https://developers.openai.com/codex/pricing)
- "Sign in with ChatGPT" for open-source apps: an app can request permission to use the *user's* ChatGPT plan for eligible Responses API requests; a Codex app-server path passes the user's OAuth token (`Authorization: Bearer` to `/v1/responses`); usage counts toward that user's plan with per-app weekly limits. The same search summary states the app-server docs say "app-server authentication has never been permitted for commercial or hosted services" (I could not open the page to verify the exact wording) — [SIWC Codex app-server (search summary)](https://developers.openai.com/siwc/token-sharing-open-source/codex-app-server); [Using your ChatGPT plan in other apps (search summary)](https://help.openai.com/en/articles/20001542-using-your-chatgpt-plan-in-other-apps-and-sites)
- OpenAI also has "Codex credits for Students" with separate terms — [Help Center (search summary)](https://help.openai.com/en/articles/20001147-codex-credits-for-students-terms-of-service)

**OpenAI Agents API (hosted Codex harness)**
- Public beta launched 2026-09-10, "putting the Codex harness behind one API call"; no separate API fee — you pay tokens, tools and container time — [MarkTechPost (search summary)](https://www.marktechpost.com/2026/09/10/openai-launches-the-agents-api-in-public-beta-putting-the-codex-harness-behind-one-api-call/); [tokencost.app (search summary)](https://tokencost.app/blog/openai-agents-api-hosted-sandbox-pricing)
- Execution options: OpenAI-hosted sandbox (Linux workspace with Python, Node.js, CLI tools), self-hosted sandbox (you run `codex exec-server`, which registers with a restricted API key and connects over WebSocket; one executor per session), or no sandbox. Sandbox partners: Modal, Cloudflare, Daytona, Blaxel, Runloop, Vercel, Oracle, E2B, DigitalOcean. Agents API supports data residency only in the US and does not support ZDR (even self-hosted) — [Self-hosted sandboxes (search summary)](https://developers.openai.com/api/docs/guides/agents-api/environments/self-hosted); [OpenAI-hosted sandboxes (search summary)](https://developers.openai.com/api/docs/guides/agents-api/environments/openai-hosted); [Agents API beta FAQ (search summary)](https://help.openai.com/en/articles/20001551-agents-api-beta-faq)

**Responses API / Agents SDK hosted tools and pricing**
- OpenAI Agents SDK (Python, provider-agnostic) hosted tools with `OpenAIResponsesModel`: `WebSearchTool`, `FileSearchTool`, `CodeInterpreterTool`, `HostedMCPTool`, `ImageGenerationTool`, `ToolSearchTool`, `ProgrammaticToolCallingTool`; `ShellTool` can run locally or in an OpenAI-hosted container; `ApplyPatchTool`/`ComputerTool` run locally; new `SandboxAgent` with local/Docker/hosted sandbox clients — [Agents SDK tools.md](https://github.com/openai/openai-agents-python/blob/main/docs/tools.md); [Agents SDK README](https://github.com/openai/openai-agents-python)
- Pricing (search summary of OpenAI pricing page): web search tool "$10.00 / 1k calls + search content tokens billed at model rates" (older preview on non-reasoning models $25/1k with free content tokens); containers (Code Interpreter & hosted shell) 1 GB $0.03, 4 GB $0.12, 16 GB $0.48, 64 GB $1.92 per 20-minute session per container, with a footnote that eligible sessions are billed per minute with a 5-minute minimum (the two statements conflict); file search $0.10/GB-day (1 GB free) + $2.50/1k calls — [OpenAI pricing (search summary)](https://platform.openai.com/docs/pricing/)
- Anecdotal developer-forum reports claim web search bills run 2–3× the listed rate (unverified) — [OpenAI community thread](https://community.openai.com/t/open-ai-charging-too-much-for-web-searches/1141592)

### Inferences
- The Codex path that fits "students don't need subscriptions" is: instructor's OpenAI API key + `codex exec --json` or the TS/Python SDK, one `CODEX_HOME`/working directory per student inside a per-student container. Because the app server is labelled experimental/not-for-production and WebSocket transport unsupported, a classroom backend should wrap the CLI/SDK per student rather than expose an app-server to browsers.
- The OpenAI Agents API is the OpenAI analogue to Claude Managed Agents (hosted harness + hosted sandbox) and would similarly offload isolation; it is newer (6 weeks old) and US-residency-only.
- The Sign-in-with-ChatGPT route is the only OpenAI-sanctioned way to use subscription quota in a third-party app, but it uses each student's own plan, so it does not meet the stated constraint (it could fit if the university already provides ChatGPT Edu seats).

### Gaps
- Could not directly read developers.openai.com (blocked), so Codex flag names, exact auth wording, and Agents API pricing/limits come from search summaries; exact Agents API tool list (shell/apply_patch/web search) not confirmed.
- No official OpenAI guidance found on serving many end users from one Codex install with a single API key (third-party blogs only).

---

## 4. Sandboxing options for per-student isolated workspaces (and rough costs)

### Takeaway
Anthropic's own guidance ranks isolation: sandbox-runtime (bubblewrap; low effort, shared kernel) < hardened Docker < gVisor (`runsc`) ≈ Firecracker/VM. For 30–50 students on one instructor-run server, hardened Docker + gVisor + an egress proxy is the realistic self-hosted option; managed sandboxes (E2B, Daytona, Modal, Cloudflare, Vercel) all cost roughly $0.05–0.20 per active sandbox-hour and remove ops burden. Token costs will dominate either way.

### Cited Findings
**Anthropic guidance**
- Isolation table: sandbox runtime "Good (secure defaults)/very low overhead/low complexity"; Docker "setup dependent/low/medium"; gVisor "Excellent (with correct setup)/medium-high/medium"; VMs (Firecracker, QEMU) "Excellent/high/medium-high" — [Secure deployment](https://code.claude.com/docs/en/agent-sdk/secure-deployment)
- `anthropics/sandbox-runtime` (`npm install @anthropic-ai/sandbox-runtime`) uses bubblewrap (Linux)/sandbox-exec (macOS) plus a built-in proxy with JSON domain/path allowlists; shares the host kernel and does no TLS inspection (domain fronting possible) — [Secure deployment](https://code.claude.com/docs/en/agent-sdk/secure-deployment); repo has 6,432 stars — [anthropics/sandbox-runtime](https://github.com/anthropics/sandbox-runtime)
- Hardened Docker example: `--cap-drop ALL --security-opt no-new-privileges --security-opt seccomp=… --read-only --tmpfs … --network none --memory 2g --cpus 2 --pids-limit 100 --user 1000:1000`, with the only network path a mounted Unix socket to a host proxy that "can enforce domain allowlists, inject credentials, and log all traffic" — [Secure deployment](https://code.claude.com/docs/en/agent-sdk/secure-deployment)
- gVisor via `docker run --runtime=runsc`; overhead ~0% CPU-bound, ~2× simple syscalls, "up to 10–200× slower for heavy open/close patterns"; "For multi-tenant environments or when processing untrusted content, the additional isolation is often worth the overhead." Firecracker boots "in under 125ms with less than 5 MiB memory overhead" — [Secure deployment](https://code.claude.com/docs/en/agent-sdk/secure-deployment)
- Credential "proxy pattern" is the recommended approach (Envoy `credential_injector`, mitmproxy, Squid, LiteLLM listed); never mount `~/.ssh`, `~/.aws`, `.env`, etc. — [Secure deployment](https://code.claude.com/docs/en/agent-sdk/secure-deployment)
- Hosting cookbook ships deployable code for local Docker, Modal, and Kubernetes — [Hosting the Agent SDK](https://code.claude.com/docs/en/agent-sdk/hosting)

**Managed sandbox pricing (all via search summaries of vendor pages; verify before budgeting)**
- E2B: per-second billing, ~$0.000014/s per vCPU (~$0.05/h) and ~$0.0000045/s per GiB RAM; Hobby $0/month + one-time $100 credit, ≤1-hour sessions, ≤20 concurrent sandboxes; Pro $150/month, 24-hour sessions, ≤100 concurrent — [E2B pricing (search summary)](https://www.e2b.dev/pricing); [E2B billing docs (search summary)](https://e2b.dev/docs/billing)
- Daytona: ~$0.0504/h per vCPU, ~$0.0162/h per GiB RAM, storage $0.000108/h per GiB (first 5 GiB free); $200 free compute; third-party reviews say low tiers restrict network access (full internet from "Tier 3" after a $500 top-up) and estimate a 2 vCPU/4 GiB sandbox at ~$0.17/h — [Daytona pricing (search summary)](https://www.daytona.io/pricing); [agentdeals.dev (secondary)](https://agentdeals.dev/vendor/daytona)
- Modal: Starter plan free with $30/month credits applicable to Sandboxes; sandbox CPU $0.00003942 per physical core-second (1 core = 2 vCPU), memory ~$0.00000672 per GiB-second; ~1 core + 2 GiB ≈ $0.19/h; sandbox lifetime default 5 min, configurable to 24 h — [Modal pricing (search summary)](https://modal.com/pricing); [morphllm (secondary)](https://www.morphllm.com/modal-pricing)
- Cloudflare Sandbox SDK: priced on the Containers platform; CPU billed on active usage at $0.00002 per vCPU-second (Nov 2025 change); Workers Paid $5/month base; fixed instance shapes from lite (1/16 vCPU, 256 MiB) to standard-4 (4 vCPU, 12 GiB); memory billing basis conflicts between sources — [Cloudflare Sandbox pricing (search summary)](https://developers.cloudflare.com/sandbox/platform/pricing/); [Cloudflare changelog (search summary)](https://developers.cloudflare.com/changelog/post/2025-11-21-new-cpu-pricing/)
- Vercel Sandbox: Active CPU $0.128/h, provisioned memory $0.0212/GB-h (other Vercel pages say $0.0106 or $0.0424 — conflicting), creations $0.60/1M, network $0.15/GB; Hobby includes 5 CPU-h, 420 GB-h, 5,000 creations; max runtime 45 min (Hobby) / 5 h (Pro) — [Vercel Sandbox pricing (search summary)](https://vercel.com/docs/vercel-sandbox/pricing)
- OpenAI lists Modal, Cloudflare, Daytona, Blaxel, Runloop, Vercel, Oracle, E2B, DigitalOcean as Agents API sandbox partners — [OpenAI self-hosted sandboxes (search summary)](https://developers.openai.com/api/docs/guides/agents-api/environments/self-hosted)
- Claude Managed Agents and OpenAI Agents API include their own hosted sandboxes (Sections 2–3) — [Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview)

### Inferences
- Rough self-hosted budget: one cloud VM with ~16 vCPU/64 GB RAM (order of a few hundred USD/month at typical cloud rates — not researched here) can host ~40 concurrently idle-heavy student containers at the 1 GiB baseline. Managed sandboxes at ~$0.05–0.20/active hour × 40 students × ~3 active h/week ≈ $6–24/week — small relative to tokens.
- E2B Hobby's 20-concurrent cap would bind for a 30–50 student lab session; Pro ($150/month) or a different provider would be needed.
- For a single instructor, Claude Managed Agents' built-in sandbox ($0.08/running-hour) is cheaper in ops effort than any of these, at the cost of data staying with Anthropic.

### Gaps
- Could not open any vendor pricing page directly; figures may be stale or misquoted by summaries (memory-rate conflicts noted for Modal, Cloudflare, Vercel).
- Did not verify which providers run Firecracker microVMs vs containers (E2B is commonly described as Firecracker-based, but no source was read here).
- Network-egress controls per provider (domain allowlists) not compared.

---

## 5. Existing open-source web UIs wrapping Claude Code / Codex / agent SDKs (license, maturity, multi-user, per-user logs)

### Takeaway
No mature open-source project found that offers *Claude Code/Codex-style agents* to *many authenticated users* with *per-user audit logs* out of the box. The "Claude Code web UI" projects (CloudCLI/claudecodeui, Claudable, opcode, claude-code-webui) are single-user tools that assume the operator's own Claude/ChatGPT subscription (which would breach Anthropic's terms if shared). The multi-user chat platforms (LibreChat, Open WebUI) have real auth/RBAC/admin features and are adding agentic code execution, but their terminal/workspace features are experimental or enterprise-only. OpenHands is the most capable agent platform (MIT, Docker sandbox per conversation, can drive Claude Code/Codex via ACP) but is oriented to a developer/team rather than a class roster.

### Cited Findings
(Stars and activity from GitHub search API on 2026-10-24.)
- **siteboon/claudecodeui ("CloudCLI")** — 14,269 stars, AGPL-3.0-or-later, actively pushed 2026-10-24; web/mobile UI for Claude Code, OpenCode, Cursor CLI and Codex; experimental Docker Sandboxes ("hypervisor-level sandbox (microVM)"); self-hosted table says "Team sharing: No"; "All options use your own AI subscriptions … CloudCLI provides the environment, not the AI"; AGPL requires publishing modified source when run as a network service — [claudecodeui README](https://github.com/siteboon/claudecodeui)
- **winfunc/opcode** (formerly Claudia) — 22,422 stars, AGPL-3.0; a Tauri 2 *desktop* GUI for Claude Code sessions/agents (not a multi-user web server) — [opcode README](https://github.com/winfunc/opcode)
- **anymorph-ai/Claudable** (moved from opactorai) — 4,054 stars, MIT; Lovable-style web app builder driving local CLI agents (Claude Code, Codex, Gemini CLI, Qwen, Cursor); "Simply login to Claude Code … no API key"; pricing "Included with Claude Pro/Max… or Anthropic API key" — single-user local design — [Claudable README](https://github.com/anymorph-ai/Claudable)
- **sugyan/claude-code-webui** — 1,137 stars, MIT, **archived** ("no longer actively maintained"); "No authentication: Currently no built-in auth mechanism"; "designed for local use" — [claude-code-webui README](https://github.com/sugyan/claude-code-webui)
- **coder/agentapi** — 1,496 stars, MIT, **archived/deprecated** ("AgentAPI is deprecated and no longer maintained"); was an HTTP API for Claude Code, Codex, Goose, Aider, etc. — [agentapi README](https://github.com/coder/agentapi)
- **CoderLuii/HolyClaude** — 2,589 stars, MIT; Docker "AI coding workstation: Claude Code + web UI + 8 AI CLIs + headless browser" — [GitHub](https://github.com/CoderLuii/HolyClaude)
- **OpenHands/OpenHands** — 91,738 stars, MIT (core); "Agent Canvas" self-hosted control center; runs its own agent or third-party agents (Claude Code, Codex, Gemini CLI, OpenCode) via Agent-Client Protocol; option to run "each new conversation in its own Docker container, with its own Agent Server" (`OH_CONVERSATION_RUNTIME=docker`); "you can share an Agent Server with your team"; bring-your-own LLM; OpenHands Cloud/Enterprise are separate offerings — [OpenHands README](https://github.com/OpenHands/OpenHands)
- **LibreChat-AI/LibreChat** — 46,254 stars, MIT; "Multi-User, Secure Authentication with OAuth2, LDAP, & Email Login", Admin Panel; Agents with MCP, file search, code execution; Code Interpreter API is now "Open-Source & Self-Hostable: powered by ClickHouse/code-interpreter" (Python, Node, Go, C/C++, Java, PHP, Rust, Fortran); v0.8.8 adds "Attached workspaces (highly experimental)" letting agents read/write files and run Bash, Ask/Allow/Deny code-approval controls, a Trace Viewer of "ordered model conversations, tool rounds, and costs", and OpenTelemetry/Langfuse export — [LibreChat README](https://github.com/LibreChat-AI/LibreChat)
- **open-webui/open-webui** — 156,649 stars; "Open WebUI License" (BSD-style with a requirement to preserve "Open WebUI" branding; mixed license history); granular RBAC and user groups; admin usage analytics "across users and models"; LDAP/AD, OAuth SSO, SCIM; agentic execution via "Open Terminal", while "per-user isolated containers with separate credentials, resource limits, and network rules" require "Terminals (Enterprise)" — [Open WebUI README](https://github.com/open-webui/open-webui)

### Inferences
- LibreChat is the strongest off-the-shelf base for a class: MIT license, mature multi-user auth, admin panel, per-conversation traces, Anthropic and OpenAI providers, MCP, and self-hostable sandboxed code execution. What it lacks vs Claude Code is a robust per-user persistent shell/workspace (its attached workspaces are "highly experimental"). A pragmatic hybrid is LibreChat for chat + code interpreter + MCP web search, with the instructor reading conversations via the admin/trace tooling.
- Open WebUI's per-user isolated terminals are an enterprise feature; its license's branding clause is fine for a class site but must be respected.
- The Claude Code wrapper UIs would require the instructor to log in with a personal Claude subscription and share it, which Anthropic's Agent SDK policy prohibits for third-party products (see Section 1); they would also need custom multi-user auth.
- Building a thin custom web app on the Claude Agent SDK or Managed Agents is likely less work than retrofitting multi-tenancy into a single-user Claude Code UI.

### Gaps
- Did not verify whether OpenHands self-hosted supports multiple user accounts/RBAC (multi-user may be limited to OpenHands Enterprise, whose license was not checked).
- Did not verify whether LibreChat/Open WebUI admins can view other users' full conversations in the UI (Open WebUI admin chat access and LibreChat Trace Viewer scoping need confirmation).
- No "Claude Code in the browser, multi-tenant" open-source project with per-user audit logs was found.

---

## 6. Logging and auditing all agent activity

### Takeaway
Every option can produce a complete per-student audit trail, at three layers: (1) capture the SDK message stream (every assistant message, tool call, tool result, final result) in your own DB; (2) hooks (`UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `Stop`) for structured audit and enforcement; (3) OpenTelemetry from the Claude Code CLI (and Codex), with content-logging opt-ins and `enduser.id` resource attributes. Managed Agents additionally persists full event history server-side.

### Cited Findings
- Agent SDK OTel: enable with `CLAUDE_CODE_ENABLE_TELEMETRY=1` plus `OTEL_METRICS_EXPORTER`, `OTEL_LOGS_EXPORTER`, `OTEL_TRACES_EXPORTER` (+ `CLAUDE_CODE_ENHANCED_TELEMETRY_BETA=1` for traces); "Prompt text and tool inputs are not included in exports by default" — [Hosting the Agent SDK](https://code.claude.com/docs/en/agent-sdk/hosting); [Agent SDK observability](https://code.claude.com/docs/en/agent-sdk/observability)
- Content opt-ins: `OTEL_LOG_USER_PROMPTS=1` (prompt text), `OTEL_LOG_TOOL_DETAILS=1` (tool inputs such as file paths and shell commands), `OTEL_LOG_TOOL_CONTENT=1` (file contents, Bash output, WebFetch/WebSearch results, truncated at 60 KB by default; requires tracing), `OTEL_LOG_RAW_API_BODIES` (full Messages API request/response JSON, inline or `file:<dir>`) — [Agent SDK observability](https://code.claude.com/docs/en/agent-sdk/observability)
- Spans: `claude_code.interaction`, `claude_code.llm_request`, `claude_code.tool` (with `tool.blocked_on_user` and `tool.execution` children), `claude_code.hook`; spans carry `session.id` — [Agent SDK observability](https://code.claude.com/docs/en/agent-sdk/observability)
- Per-end-user attribution: identity attributes default to the service credential, so set `OTEL_RESOURCE_ATTRIBUTES="enduser.id=…,tenant.id=…"` per `query()`; then `tool_decision`, `tool_result`, `safety_event`, `mcp_server_connection`, `permission_mode_changed` events become "a per-user audit trail you can forward to a … SIEM" — [Agent SDK observability](https://code.claude.com/docs/en/agent-sdk/observability)
- Do not use the `console` OTel exporter with the SDK (stdout is the SDK's message channel); export errors are silent unless `CLAUDE_CODE_OTEL_DIAG_STDERR=1` — [Agent SDK observability](https://code.claude.com/docs/en/agent-sdk/observability)
- Hooks for audit: `PostToolUse` "Log file changes to an audit trail"; async hook outputs for non-blocking logging; `PreCompact` "Archive full transcript before summarizing" — [Agent SDK hooks](https://code.claude.com/docs/en/agent-sdk/hooks)
- Session transcripts are JSONL files under `~/.claude/projects/` (or `CLAUDE_CONFIG_DIR`), mirrorable to durable storage via `SessionStore` — [Hosting the Agent SDK](https://code.claude.com/docs/en/agent-sdk/hosting)
- Per-session token/cost accounting is available from the response stream (cost tracking page) — [Hosting the Agent SDK](https://code.claude.com/docs/en/agent-sdk/hosting)
- Managed Agents: "Event history is persisted server-side and can be fetched in full" — [Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview)
- Codex: `codex exec --json` streams all events as JSONL — [Codex non-interactive (search summary)](https://developers.openai.com/codex/noninteractive); threads persist under `~/.codex/sessions` — [Codex TS SDK README](https://github.com/openai/codex/blob/main/sdk/typescript/README.md); OTel via `[otel]` in user-level `~/.codex/config.toml` (`exporter` = `none|otlp-http|otlp-grpc`, `log_user_prompt` default false), events include `codex.user_prompt`, `codex.tool_decision`, `codex.tool_result`; project-local `.codex/config.toml` ignores `otel` — [Codex config reference (search summary)](https://developers.openai.com/codex/config-reference); [Codex advanced config (search summary)](https://developers.openai.com/codex/config-advanced)
- Known Codex gap: issue reports `codex exec` emitted traces/logs but no metrics, and `codex mcp-server` emitted nothing (filed against 0.105.0) — [openai/codex#12913](https://github.com/openai/codex/issues/12913)
- An OTel Collector connector normalizing Codex and Claude Code traces exists (third-party) — [nijave/otel-agent-trace-connector](https://github.com/nijave/otel-agent-trace-connector)
- Anthropic recommends logging all traffic at the egress proxy for audit — [Secure deployment](https://code.claude.com/docs/en/agent-sdk/secure-deployment)

### Inferences
- Simplest robust design for an instructor: the backend writes every SDK message (already structured JSON) to a `events(student_id, session_id, ts, type, payload)` table as it relays them to the browser; an instructor dashboard is then just a query over that table. OTel + a self-hosted collector (e.g., Grafana/Loki) is an optional second layer.
- Logging full prompts/tool outputs of students is personal data; students should be informed up front that the instructor can see everything.

### Gaps
- Did not verify Managed Agents' list/query APIs for sessions across an org (needed for an "all students" dashboard without a local DB).

---

## 7. Web search quality: Claude vs ChatGPT/Codex, benchmarks, and better search via MCP

### Takeaway
There is no reliable evidence that Claude's *current* models are weaker at agentic web research than OpenAI's: third-party October-2026 BrowseComp leaderboards put Claude Opus 5 and GPT-6 Astra both in the low-to-mid 90s with order depending on setup; an earlier generation comparison favoured GPT-5.5 (84.4%) over Opus 4.7 (79.3%). Perceived weakness is more likely a harness issue: Claude Code's `WebSearch` returns only titles/URLs (Claude must then `WebFetch`), its backend is not configurable, and it is unavailable on Bedrock. The fix is either the API's dynamic-filtering web search (Managed Agents / Messages API) or plugging a different search provider in via MCP (Brave ~$5/1k, Exa ~$7/1k, Tavily ~$5–8/1k basic, Perplexity Search ~$5/1k).

### Cited Findings
**Benchmarks**
- Earlier generation: GPT-5.5 84.4% (GPT-5.5 Pro 90.1%) vs Claude Opus 4.7 79.3% on BrowseComp, per third-party comparisons — [DataCamp (search summary)](https://www.datacamp.com/blog/gpt-5-5-vs-claude-opus-4-7); [Medium (search summary)](https://medium.com/@cognidownunder/openai-gpt-5-5-b6cf7e37668e)
- October 2026 third-party leaderboards disagree: TensorFeed lists GPT-6 Astra top at 91.5% (vendor-reported); Mercor's Oct-1 capture: GPT-6.1 Sol 95.4%, GPT-6 Astra 94.2%; BenchLM lists Claude Opus 5 at 93.6% in a 10-agent prerelease setup and elsewhere Opus 5 90.8% vs GPT-5.5 Pro 90.1%; Steel.dev lists GPT-5.6 Sol Ultra 92.2% — [TensorFeed](https://tensorfeed.ai/benchmarks/browsecomp); [BenchLM Mercor BrowseComp](https://benchlm.ai/benchmarks/mercorbrowsecomp); [BenchLM BrowseComp](https://benchlm.ai/benchmarks/browsecomp); [llm-stats compare](https://llm-stats.com/models/compare/claude-opus-5-vs-gpt-5.5); [Steel.dev](https://leaderboard.steel.dev/leaderboards/browsecomp/) (all via search summary; non-comparable configurations)
- Anthropic's Opus 5.5 launch page does not report BrowseComp; it reports Humanity's Last Exam (with tools) 67.7% for Opus 5.5 vs 57.2% for GPT-6 Astra, and WANDR (web research) only as a chart — [Introducing Claude Opus 5.5](https://www.anthropic.com/claude-opus-5-5)
- Anthropic's cookbook to reproduce its BrowseComp/DeepSearchQA scores uses `web_search_20260318` and `web_fetch_20260318` called from code execution (programmatic tool calling), `effort: "max"`, compaction at 200k tokens and a 3M-token task budget, and notes third-party evaluations "often come in lower because of harness configuration" — [Claude cookbook: reproduce agentic search benchmarks](https://platform.claude.com/cookbook/evals-agentic-search-reproduce-agentic-search-benchmarks)

**Tool behaviour that affects perceived quality**
- Claude Code `WebSearch` "runs a query against Anthropic's web search backend and returns result titles and URLs. It doesn't fetch the result pages"; may issue up to eight backend searches per call; "The search backend is not configurable. To search with a different provider, add an MCP server"; available on Claude API, Claude Platform on AWS, Foundry, and Google Cloud (Opus 4+/Sonnet 4+/Haiku 4.5+), but "Amazon Bedrock doesn't expose the server-side web search tool"; interactive session limit 200 WebSearch calls — [Claude Code tools reference](https://code.claude.com/docs/en/tools-reference)
- Claude Code summarizes search results rather than passing raw content, to reduce prompt-injection risk — [Secure deployment](https://code.claude.com/docs/en/agent-sdk/secure-deployment)
- API web search with dynamic filtering (2026 versions) keeps only relevant content in context — [Web search tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool)
- OpenAI `WebSearchTool` options: `filters`, `user_location`, `search_context_size`, `external_web_access`, `search_content_types`, `image_settings` — [Agents SDK tools.md](https://github.com/openai/openai-agents-python/blob/main/docs/tools.md)

**Alternative search providers (pluggable via MCP)**
- Brave Search API $5/1k requests with $5 monthly free credit, open-source local MCP server; Perplexity Search API $5/1k ($1 Fast), hosted MCP with OAuth/API key; Perplexity Sonar $1/MTok + $5–12/1k requests (Sonar Pro $3/$15 + $6–14/1k); Tavily ~$8/1k basic pay-as-you-go ($5 on $500/month plan; $10–16 advanced), acquired by Nebius in 2026; Exa $7/1k auto/fast, $4 instant, $12–15 deep (another source says $5 base) — [beri.net comparison (search summary)](https://www.beri.net/article/tavily-vs-exa-vs-brave-vs-perplexity-search-api-agent-cost-2026); [parallel.ai Exa alternatives (search summary)](https://parallel.ai/articles/exa-alternatives.md); [parallel.ai Tavily alternatives (search summary)](https://parallel.ai/articles/tavily-alternatives.md); [fastcrw.com (search summary)](https://fastcrw.com/blog/web-search-api-pricing-2026)
- Both Claude Agent SDK and Codex support external MCP servers (`mcpServers` option; `codex mcp`) — [Agent SDK overview](https://code.claude.com/docs/en/agent-sdk/overview); [Codex MCP server removal (search summary)](https://developers.openai.com/codex/guides/agents-sdk)

### Inferences
- If students mainly need research-quality search, priced per search Anthropic ($10/1k) and OpenAI ($10/1k + content tokens) are similar; third-party APIs via MCP are roughly half the per-search price and let the instructor pick a provider with better Korean-language coverage (not evaluated).
- For a Korean class, set `user_location` with `country: "KR"` on API-level web search to localize results (supported parameter; quality for Korean not benchmarked).
- Avoid Bedrock if built-in web search is required.

### Gaps
- No official, apples-to-apples BrowseComp numbers for Claude Opus 5.5 vs GPT-6 Astra were found from vendor sources; all comparisons are third-party with differing harnesses.
- No benchmark of search quality for Korean-language queries found.

---

## 8. Architecture options a single instructor can realistically deploy (synthesis of the objective)

### Takeaway
Three viable tiers, all using the instructor's API key (no student subscriptions): **(A) Claude Managed Agents + thin web app** — least ops, built-in sandbox and server-side event history, ~$0.08/running-hour + tokens; **(B) Claude Agent SDK (or Codex SDK/`codex exec`) self-hosted with one hardened (gVisor) container per student + egress proxy + message-stream logging** — closest to real Claude Code/Codex, more ops; **(C) LibreChat (MIT) with Anthropic/OpenAI models, MCP search, and its self-hosted code interpreter** — mature multi-user chat/agents with admin tooling, but not a full coding-agent workspace. Using a personal Claude/ChatGPT subscription behind a shared UI is not permitted for Claude (and OpenAI only allows each user's own plan via Sign in with ChatGPT).

### Cited Findings
- Anthropic itself points non-infrastructure teams to Managed Agents: "If you don't need to run the agent loop itself on your own infrastructure, consider Managed Agents instead" — [Hosting the Agent SDK](https://code.claude.com/docs/en/agent-sdk/hosting)
- Managed Agents needs only an API key, is enabled for all API accounts, has built-in bash/file/web tools and SSE streaming with persisted history; $0.08/session-hour runtime (idle not billed) — [Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview); [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- Self-hosting guidance: auth at a gateway, per-tenant `cwd`/config dir, `settingSources: []`, egress proxy injecting credentials, OTel, `maxTurns` to bound sessions — [Hosting the Agent SDK](https://code.claude.com/docs/en/agent-sdk/hosting)
- Hardened Docker + gVisor recommended for multi-tenant/untrusted content — [Secure deployment](https://code.claude.com/docs/en/agent-sdk/secure-deployment)
- Locked-down headless permissions: `allowedTools` + `permissionMode: "dontAsk"`; PreToolUse hooks enforce rules even in bypass mode — [Agent SDK permissions](https://code.claude.com/docs/en/agent-sdk/permissions)
- Claude subscription login cannot be offered by third-party products — [Agent SDK overview](https://code.claude.com/docs/en/agent-sdk/overview); OpenAI's subscription sharing is per-user OAuth (SIWC) — [SIWC (search summary)](https://developers.openai.com/siwc/token-sharing-open-source)
- Token cost dominates infra cost by ≥10× — [Hosting the Agent SDK](https://code.claude.com/docs/en/agent-sdk/hosting)
- Model price points for budgeting: Sonnet 5.5 $2/$10 per MTok with cache hits at 0.05× input; Haiku 5.5 $0.10/$0.50; Opus 5.5 $4/$20 — [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- LibreChat: MIT, multi-user OAuth2/LDAP/email auth, admin panel, agents + MCP + self-hostable code interpreter, Trace Viewer, OTel export — [LibreChat README](https://github.com/LibreChat-AI/LibreChat)

### Inferences
- Suggested reference architecture for tier (A) or (B): university SSO or simple email login → small backend (FastAPI/Node) that holds the API key → per-student session (Managed Agents session, or Agent SDK subprocess in that student's container) → SSE/WebSocket relay to the browser → every event persisted to a DB keyed by student → instructor dashboard (list students → sessions → full event timeline, token cost per student) → per-student budget caps (`maxTurns`, daily token/$ limits enforced in the backend), web search `max_uses`, and a Console-level spend limit.
- Rough cost model (estimate, not from a source): an agentic session of ~30 turns with ~1.2M total input tokens (mostly cached) and ~30k output tokens costs on the order of $0.7–1 on Sonnet 5.5, ~2× on Opus 5.5, and a few cents on Haiku 5.5; 40 students × 2 sessions/week × 15 weeks ≈ 1,200 sessions ≈ $1k on Sonnet 5.5, plus web searches at $0.01 each and minor runtime/sandbox charges. Defaulting students to Sonnet/Haiku and capping Opus use is the main cost lever.
- Security priorities in order: (1) never expose the API key to the sandbox (proxy/`ANTHROPIC_BASE_URL` or Managed Agents); (2) per-student isolation if Bash is enabled; (3) egress allowlist to stop exfiltration and abuse (students running scanners/crypto miners from the instructor's IP); (4) spend caps; (5) clear student notice that all activity is logged.
- Tier (A) is the best fit for "a single instructor, not an IT team"; tier (B) is better if the class specifically needs Codex or a persistent Linux workspace the instructor controls; tier (C) is best if the priority is a polished multi-user chat UI with tools rather than a coding agent.

### Gaps
- No case study found of a university course deploying Managed Agents, the Agent SDK, or Codex for a whole class.
- Korean-specific constraints (PIPA consent, university data policies, latency from Korea to US-only residency options) were not researched.
- Exact token usage per student session is workload-dependent; no empirical classroom data found.
