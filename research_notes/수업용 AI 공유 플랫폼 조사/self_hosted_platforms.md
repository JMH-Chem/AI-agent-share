# Open-source, self-hostable multi-user AI chat/agent platforms for a university class with instructor visibility (state as of Oct 24, 2026)

> Method note: the official docs sites (docs.openwebui.com, librechat.ai, docs.litellm.ai, langfuse.com, lobehub.com) were blocked by this environment's network proxy. The docs were therefore read from their **GitHub source repositories**, cloned on 2026-10-24: `open-webui/docs` (last commit 2026-10-23), `LibreChat-AI/librechat.ai` (2026-10-24), `BerriAI/litellm-docs`, `Mintplex-Labs/anythingllm-docs`, `langfuse/langfuse-docs`, and `lobehub/lobe-chat/docs`. Citations below link to the **public docs URL** that matches each source file. LICENSE and package files were fetched from raw.githubusercontent.com on main/master branches. The GitHub API was blocked, so star counts and exact release-tag dates are mostly missing. Versions are taken from `package.json`/`pyproject.toml` on main, or from release pages where those could be read.

## Open WebUI: admin visibility of all chats, auth, groups, quotas, search, code, MCP, license (exact terms)

### Takeaway
Open WebUI covers the instructor's core need best out of the box. By default (`ENABLE_ADMIN_CHAT_ACCESS=True`) an admin can open any user's chat read-only. It also has an admin Analytics dashboard with per-user and per-model token counts, admin export, optional full request/response audit logs, Google OAuth with domain restriction, LDAP/SCIM, an admin-approval ("pending") signup flow, native MCP, about 28 web-search backends, code execution, and a Korean UI. Two things are missing: there are **no built-in per-user token or cost quotas** (those need a Filter Function or a LiteLLM gateway), and the license is **not OSI open source**. It is BSD-3 plus a branding clause that only bites if you remove the "Open WebUI" branding while serving more than 50 users in a rolling 30 days.

### Cited Findings
**Release / activity**
- Latest releases: **v0.12.3 (16 Oct)**, v0.12.2 (14 Oct), v0.12.1 (14 Oct), v0.12.0 (10 Oct), v0.11.4 (21 Sep). The year is not shown on the page but is 2026 given main's `package.json` = `0.12.3`. v0.12.2 adds the requested model ID to audit-log entries for chat requests. v0.12.1 splits the Analytics Tokens column into input/output/total and merges model usage and user activity into one table with a Models/Users switch — [GitHub releases](https://github.com/open-webui/open-webui/releases); [package.json](https://raw.githubusercontent.com/open-webui/open-webui/main/package.json)
- The docs repo was being actively edited (last commit 2026-10-23) — [open-webui/docs](https://github.com/open-webui/docs)

**Admin visibility of student chats**
- `ENABLE_ADMIN_CHAT_ACCESS` (bool, **default True**): "Controls whether admins can open other users' chats inside Open WebUI. When enabled, an admin can read any user's chat, which opens read-only. Through the API the admin can also edit or delete its messages, delete the chat, change its share settings and clone it… When disabled, the admin panel hides other users' chats" — [Env config](https://docs.openwebui.com/reference/env-configuration#enable_admin_chat_access)
- Caveat for auditing: "internal chats" (sub-agent chats, timer chats, note-attached chats) "are excluded from every listing surface: they do not appear in chat lists, search, counts, exports, or the admin chat list. They are reachable only by id… Do not treat those surfaces as a complete record while sub-agents or timers are in use." — [Env config](https://docs.openwebui.com/reference/env-configuration#enable_admin_chat_access)
- `ENABLE_ADMIN_EXPORT` (default True) controls the admin-panel export action ("data, chats, and database export"). Database export works only for SQLite and copies `webui.db` without its `-wal` file, so it is not the recommended backup method — [Env config](https://docs.openwebui.com/reference/env-configuration#enable_admin_export)
- `ENABLE_ADMIN_ANALYTICS` (default True) shows the admin **Analytics** tab. It covers message volume, token usage "for cost estimation", user activity, time series (24h/7d/30d/90d/all/custom), a **group filter** ("view analytics only for users in that group"), and identification of "high-usage users for quota discussions". Every user also gets a personal **Settings > Usage** view of their own tokens and activity — [Analytics docs](https://docs.openwebui.com/features/administration/analytics)
- Audit logs: `AUDIT_LOG_LEVEL` (default `NONE`; options `NONE`, `METADATA`, `REQUEST`, `REQUEST_RESPONSE`, where the last one "includes both requests and responses"), `ENABLE_AUDIT_LOGS_FILE` (default True), `ENABLE_AUDIT_STDOUT` (default False) — [Env config](https://docs.openwebui.com/reference/env-configuration#audit_log_level)
- Preventing students from hiding activity:
  - `USER_PERMISSIONS_CHAT_DELETE` (default True; configurable per group as "Allow Chat Delete"). Set to False and non-admins lose the delete controls; archiving is unaffected.
  - `USER_PERMISSIONS_CHAT_TEMPORARY` (default True) lets users create temporary (unsaved) chats.
  - `USER_PERMISSIONS_CHAT_TEMPORARY_ENFORCED` forces every chat to be temporary (the opposite of what an instructor wants).
  — [Env config](https://docs.openwebui.com/reference/env-configuration#user_permissions_chat_delete)
- The privacy docs list `ENABLE_ADMIN_CHAT_ACCESS=false`, `ENABLE_ADMIN_EXPORT=false`, and `BYPASS_ADMIN_ACCESS_CONTROL=false` as the levers to *reduce* admin access, and recommend PostgreSQL with encryption for production — [Chat Data Privacy & Encryption](https://docs.openwebui.com/security/chat-data-privacy-and-encryption)
- No built-in chat-retention / auto-delete setting turned up in the env reference (searched "retention/expire"). Only unrelated JWT/compaction settings matched — [Env config](https://docs.openwebui.com/reference/env-configuration)

**Auth / onboarding**
- Built-in OAuth providers: Google, Microsoft, GitHub (plus generic OIDC/Keycloak). Google needs `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, with redirect `<open-webui>/oauth/google/callback`. Optional `GOOGLE_OAUTH_AUTHORIZE_PARAMS` (e.g. `hd` for a hosted domain). "You cannot have Microsoft **and** Google as OIDC providers simultaneously." — [SSO docs](https://docs.openwebui.com/features/authentication-access/auth/sso)
- Signup controls:
  - `OAUTH_ALLOWED_DOMAINS` (default `*`, e.g. "example1.com,example2.com")
  - `ENABLE_OAUTH_SIGNUP` (default False)
  - `ENABLE_SIGNUP` (default True)
  - `DEFAULT_USER_ROLE` (default **`pending`**: "New users are pending until their accounts are manually activated by an admin")
  - LDAP (`ENABLE_LDAP`), SCIM, and trusted-header auth (`WEBUI_AUTH_TRUSTED_EMAIL_HEADER`) also exist.
  — [Env config](https://docs.openwebui.com/reference/env-configuration#default_user_role); [LDAP](https://docs.openwebui.com/features/authentication-access/auth/ldap); [SCIM](https://docs.openwebui.com/features/authentication-access/auth/scim)
- Groups: permissions are additive (union), with no "deny" permissions. Nested groups inherit parent permissions — [Groups](https://docs.openwebui.com/features/authentication-access/rbac/groups)

**Quotas / rate limits**
- No native per-user token or cost quota was found in the docs. The Filter Function docs list "Rate Limiting: Track requests per user and reject requests that exceed your quota (works for both WebUI and API requests)" and "Request Logging" as things you can *build* with a filter — [Filter Functions](https://docs.openwebui.com/features/extensibility/plugin/functions/filter)
- `ENABLE_FORWARD_USER_INFO_HEADERS` (default False) attaches the signed-in user's identity (plus chat/message IDs) to outbound requests, "enabl[ing] per-user authorization, auditing, rate limiting and request tracing on external services" such as LiteLLM — [Env config](https://docs.openwebui.com/reference/env-configuration#enable_forward_user_info_headers)

**Providers**
- Anthropic is supported "natively through their OpenAI-compatible endpoint". Open WebUI auto-detects `api.anthropic.com` for model discovery. Warning: Anthropic says its OpenAI-compatible API is "for evaluation and testing, not production", and some Claude-native features (PDF, citations, extended thinking, prompt caching) need the native API — [Anthropic setup](https://docs.openwebui.com/getting-started/quick-start/connect-a-provider/starting-with-anthropic)
- Gemini works via its OpenAI-compatible endpoint ("Auto-detection works"), but its "tool calling does not follow the OpenAI schema". There are also connection guides for OpenAI, Ollama, vLLM, llama.cpp, and Open Responses — [OpenAI-compatible setup](https://docs.openwebui.com/getting-started/quick-start/connect-a-provider/starting-with-openai-compatible)

**Web search, code, MCP, extensibility**
- The web-search provider docs cover Bing, Brave, DDGS (no paid API), Exa, External, Firecrawl, Google PSE, Jina, Kagi, Linkup, Microsoft Web IQ, Mojeek, Ollama Cloud, OpenSERP, Perplexity, SearchApi, SearXNG, SerpApi, Serper, SerpHouse, Serply, Serpstack, Tavily, YaCy, Yandex, and You.com. DDGS "reaches each search provider through that provider's public pages rather than through a paid API" — [Web search providers](https://docs.openwebui.com/features/chat-conversations/web-search); [DDGS](https://docs.openwebui.com/features/chat-conversations/web-search/providers/ddgs)
- Code execution engines:
  - **Pyodide**: legacy, but the built-in default. Runs in the browser and is "sandboxed and safe for multi-user environments".
  - **Jupyter**: legacy.
  - **Open Terminal**: recommended. Gives full Python and shell "isolated in a Docker container". The "Terminals" orchestrator provisions "a dedicated computer substrate for every user" under an "Enterprise Multi-User" heading.
  — [Code Execution](https://docs.openwebui.com/features/chat-conversations/chat-features/code-execution); [Open Terminal](https://docs.openwebui.com/features/open-terminal)
- MCP has been native "starting in **v0.6.31**", over Streamable HTTP only, and requires `WEBUI_SECRET_KEY`. "MCP servers can only be added by **administrators**"; the admin can scope them by Access Control to users or groups — [MCP docs](https://docs.openwebui.com/features/extensibility/mcp)
- Pipelines (a separate Docker container, `ghcr.io/open-webui/pipelines:main`) is the documented way to plug in a Langfuse tracing filter — [Langfuse × OpenWebUI](https://langfuse.com/integrations/no-code/openwebui)

**Korean UI**
- A Korean locale file exists: `src/lib/i18n/locales/ko-KR/translation.json` (about 300 KB, 4,069 lines). 208 lines have empty translation strings — [ko-KR translation.json](https://raw.githubusercontent.com/open-webui/open-webui/main/src/lib/i18n/locales/ko-KR/translation.json)

**License (exact terms)**
- LICENSE clause 4 (verbatim): "Notwithstanding any other provision of this License, and as a material condition of the rights granted herein, licensees are strictly prohibited from altering, removing, obscuring, or replacing any "Open WebUI" branding, including but not limited to the name, logo, or any visual, textual, or symbolic identifiers that distinguish the software and its interfaces, in any deployment or distribution, except in the following circumstances: (i) deployments or distributions where the total number of end users (defined as individual natural persons with direct access to the application) does not exceed fifty (50) within any rolling thirty (30) day period; (ii) the licensee has obtained specific prior written permission from the copyright holder; or (iii) where the licensee has obtained a duly executed enterprise license expressly permitting such modification. For all other cases, any removal or alteration of the "Open WebUI" branding shall constitute a material breach of license." Clauses 1–3 are standard BSD-3. A CLA is required for contributions — [LICENSE](https://github.com/open-webui/open-webui/blob/main/LICENSE)
- Effective with **v0.6.6 (April 19, 2025)**. Code up to and including v0.6.5 remains BSD-3, and "anyone can still fork from v0.6.5 with zero restrictions". FAQ 1: "Can I still use Open WebUI freely for personal projects, businesses, or teaching? **Yes!** Just don't remove or alter the 'Open WebUI' branding". FAQ 6: "Open WebUI v0.6.6+ is not an OSI-approved 'open source' license". FAQ 10 describes a narrow branding exemption for academic research "exclusively for research studies, not for general-purpose or ongoing institutional use" — [License docs](https://docs.openwebui.com/license)

### Inferences
- For 30–50 students plus the instructor and TAs, the branding clause has no practical impact as long as branding is kept. It only restricts *removing or altering* branding, and only above 50 natural-person users in any rolling 30 days. A class of 50 students plus an instructor and a TA would cross 50 but would still be compliant by simply not rebranding.
- Recommended instructor configuration:
  - `ENABLE_ADMIN_CHAT_ACCESS=True` (default)
  - `USER_PERMISSIONS_CHAT_DELETE=False` and `USER_PERMISSIONS_CHAT_TEMPORARY=False`, so students cannot erase or bypass logs
  - `DEFAULT_USER_ROLE=pending`, plus Google OAuth with `OAUTH_ALLOWED_DOMAINS=<university domain>` as a de-facto invite gate
  - `AUDIT_LOG_LEVEL=REQUEST_RESPONSE`, if an immutable-ish file trail is wanted
  - Avoid, or separately audit, sub-agents and timers, because their chats are hidden from admin listings
- Per-student spending caps need either a community Filter Function or (more robustly) LiteLLM in front, using `ENABLE_FORWARD_USER_INFO_HEADERS`.

### Gaps
- No "invite code" feature was found. The approval queue (`pending`) and domain-restricted OAuth are the substitutes.
- Whether Open Terminal's "Terminals" per-user orchestrator needs an enterprise license was not confirmed. The page heading says "Enterprise Multi-User" without stating license terms.
- Star counts and commit frequency could not be read (GitHub API blocked).
- No native per-user token quota was found. A third-party Function may exist on openwebui.com, but none was verified.

## LibreChat: admin features, balance/credits, Agents, code interpreter, web search, MCP, admin conversation visibility, license

### Takeaway
LibreChat is **MIT-licensed**, is now owned by **ClickHouse**, and is very active (v0.8.8 on 2026-09-30; v0.8.9-rc1 on main). It has the strongest **per-user credit/quota system** of the chat UIs (token credits, auto-refill), plus Agents, MCP, web search, Google/LDAP/SAML/OIDC login, configurable data retention, a Korean UI, and, as of 2026, a bundled (preview) **Admin Panel** and an opt-in **Admin Insights** dashboard. However, **no documented in-product way for an admin to read other users' full conversations** was found. Insights shows only the first message of recent Agent conversations. Full transcripts need Langfuse tracing (natively integrated), direct MongoDB queries, or a gateway such as LiteLLM. The Code Interpreter is now backed by a **self-hostable Apache-2.0 service**.

### Cited Findings
- License: MIT ("Copyright (c) 2026 LibreChat") — [LICENSE](https://github.com/danny-avila/LibreChat/blob/main/LICENSE)
- Release: **v0.8.8 released 2026-09-30** (Config 1.3.17, Helm chart 2.0.16, Agents SDK 4.0.0). Main branch `package.json` = `v0.8.9-rc1` — [Changelog v0.8.8](https://www.librechat.ai/changelog/v0.8.8); [package.json](https://raw.githubusercontent.com/danny-avila/LibreChat/main/package.json)
- Ownership: LibreChat was "Acquired by ClickHouse" (2026 roadmap blog) and ClickHouse uses it internally. The repo is now referenced as `LibreChat-AI/LibreChat` — [2026 Roadmap](https://www.librechat.ai/blog/2026-02-18_2026_roadmap)
- **Admin Panel (Status: Preview)**:
  - Ships as the `admin-panel` service in `docker-compose.yml`/`deploy-compose.yml` (default port 3000) and requires LibreChat ≥ v0.8.5. Source: `github.com/ClickHouse/librechat-admin-panel`.
  - Functions: config editing with per-role/group/user overrides, user list and search, group CRUD, custom roles, and system grants (e.g. `manage:users`, `read:usage`, `manage:mcpservers`).
  - It keeps a grant **audit log** (`/api/admin/audit-log`, append-only, CSV export). This log covers grants and config changes, not chat content.
  - The documented admin API endpoints (users, groups, roles, grants, config, skills, code-environments, langfuse, audit-log) include **no conversation-reading endpoint**.
  — [Admin Panel](https://www.librechat.ai/docs/features/admin_panel)
- **Admin Insights** (`ENABLE_INSIGHTS=true`): an opt-in dashboard "for reviewing how Agents are used". It shows conversations, unique users, messages, tokens, top users, churned users, and "Latest conversations: … date, owner, first message, persisted message count, and recorded tokens". Custom ranges are limited to 30 days. "These are database activity metrics, not billing… do not calculate monetary cost." Scope is conversations with **Agents** — [Insights](https://www.librechat.ai/docs/features/insights)
- Langfuse:
  - Admins with `access:admin` + `manage:configs:langfuse` can configure Langfuse in **Settings → Langfuse** and open "View session in Langfuse" from a conversation's Context Usage breakdown.
  - The in-app trace viewer "does not appear for another user's conversation".
  - Traces can be keyed by `userIdField: email` (or id, username, googleId, ldapId, etc.).
  - The docs say "you will see a new trace for every chat message response in the Langfuse UI".
  — [Langfuse config](https://www.librechat.ai/docs/configuration/langfuse)
- **Balance / token credits**:
  - `balance` keys: `enabled` (default false), `startBalance` (e.g. 20000), `autoRefillEnabled`, `refillIntervalValue`, `refillIntervalUnit`, `refillAmount`, `refillMode`, `reservationTtlMs`, `display`. "balance configurations apply globally across the application."
  - Credit value: "1000 credits = $0.001 (1 mill USD)".
  - Admin CLI scripts: `npm run add-balance <email> <amount>`, `set-balance`, and `list-balances` (also via `docker compose exec api …`).
  - Token usage is recorded in a "Transactions" collection. Enabling balance forces transaction recording.
  - Conversation cost display is behind `interface.contextCost`.
  — [Balance](https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/balance); [Token usage](https://www.librechat.ai/docs/configuration/token_usage)
- **Data retention**:
  - `interface.retentionMode` has three values: `"temporary"` (default; only temporary chats expire), `"all"`, and `"ephemeral"`.
  - `temporaryChatRetention` defaults to 720 hours (range 1–8760). `generalChatRetention` applies under `all`. Cleanup runs via a MongoDB TTL index.
  - Temporary chats are not sent to Langfuse unless the admin opts in.
  - The `TEMPORARY_CHAT` permission can be managed per role in the Admin Panel.
  — [Temporary Chat & Data Retention](https://www.librechat.ai/docs/features/temporary_chat)
- **Code Interpreter**:
  - It is "powered by **ClickHouse/code-interpreter**, an open-source (Apache 2.0) sandboxed code-execution service. Self-host it and point LibreChat at your own instance" (`LIBRECHAT_CODE_BASEURL`, JWT auth or `LIBRECHAT_CODE_API_KEY`).
  - Opt-in stateful sessions and per-user "Code environments" (VM pairing, max 5 per user by default) are also available.
  — [Code Interpreter](https://www.librechat.ai/docs/features/code_interpreter)
- **Web search**: needs a search provider (Serper, SearXNG, or Tavily), a scraper (Firecrawl), and an optional reranker (Jina or Cohere, or `rerankerType: "none"`). "Keenable works without [an API key] for both search and page fetch" — [Web Search](https://www.librechat.ai/docs/features/web_search)
- **MCP**: supported for Agents, including "multi-user environments with proper authentication and isolation" — [MCP](https://www.librechat.ai/docs/features/mcp)
- **Auth**: email plus social logins "Google, GitHub, Discord, OpenID, and more", SAML, LDAP, passkeys, and 2FA for local/LDAP accounts. `ALLOW_REGISTRATION`, `ALLOW_SOCIAL_REGISTRATION`, and `registration.allowedDomains` restrict signup — [Authentication](https://www.librechat.ai/docs/features/authentication); [Registration object](https://www.librechat.ai/docs/configuration/librechat_yaml/object_structure/registration)
- **Providers**: pre-configured Anthropic, OpenAI, Google, Bedrock, and Assistants. Custom endpoints include Ollama, LiteLLM, OpenRouter, Helicone, Groq, Mistral, DeepSeek, vLLM, xAI, Azure, and more — [Pre-configured endpoints](https://www.librechat.ai/docs/configuration/pre_configured_ai); [Custom endpoints](https://www.librechat.ai/docs/configuration/librechat_yaml/ai_endpoints)
- **Korean**: the UI locale `client/src/locales/ko/translation.json` exists (about 96 KB), and the docs have Korean pages (`*.ko.mdx`) — [ko translation.json](https://raw.githubusercontent.com/danny-avila/LibreChat/main/client/src/locales/ko/translation.json)
- A web search for an admin "view all users' conversations" feature found only Insights and the Admin Panel. Neither exposes conversation content beyond first messages — [Insights](https://www.librechat.ai/docs/features/insights); [Admin Panel](https://www.librechat.ai/docs/features/admin_panel)

### Inferences
- For "instructor sees every prompt and output", LibreChat needs a sidecar:
  - **Langfuse** (native, admin-configurable, traces keyed by student email), or
  - **LiteLLM** with `store_prompts_in_spend_logs`, or
  - direct MongoDB access (e.g. `mongosh`/Compass on the `conversations`/`messages` collections). This is workable but not friendly for a non-sysadmin.
- LibreChat's balance system is the simplest built-in way to give each student a fixed budget (e.g. `startBalance` + monthly `autoRefill`). Because 1000 credits = $0.001, a $2 per-student monthly cap is 2,000,000 credits.
- Set `retentionMode: "temporary"` (default) and disable the `TEMPORARY_CHAT` permission for the USER role, so students cannot create unlogged chats.

### Gaps
- The docs did not say whether per-group/per-role balance overrides are possible via the Admin Panel's "per-principal configuration overrides". The `balance` page says settings are global.
- The docs did not say whether Langfuse traces cover non-Agent endpoints (plain chat) or only Agent runs. The docs mention "Agent traces" specifically.
- Whether a paid hosted Code Interpreter API (formerly code.librechat.ai) still exists was not checked. The current docs point only to self-hosting.
- No invite-code feature was verified. A `npm run invite-user` script is recalled from earlier versions but was not confirmed in current docs.

## Other platforms (LobeHub, AnythingLLM, Chatbot UI, Big-AGI, Dify, Onyx, HF Chat UI), focusing on admin log visibility

### Takeaway
Among the alternatives, **AnythingLLM** (MIT) has a built-in admin view of chat logs per workspace and per user, export to CSV/JSON, and per-user daily message limits. **Dify** has excellent per-app conversation logs (including raw prompts and agent tool steps), but its modified Apache license bans multi-tenant use and logo removal. **Onyx** puts its "Query History" log in the Enterprise Edition only. **LobeHub**, **HF Chat UI**, **Big-AGI**, and **Chatbot UI** have no documented admin view of other users' chats. Big-AGI stores data in the browser, and Chatbot UI appears dormant.

### Cited Findings
**LobeHub (LobeChat)**
- License: "LobeHub Community License", based on Apache 2.0 with conditions. "LobeChat may be utilized commercially, including as a frontend and backend service without modifying the source code"; "a commercial license must be obtained… if you want to develop and distribute a derivative work" — [LICENSE](https://github.com/lobehub/lobe-chat/blob/main/LICENSE)
- Version on main: `2.2.20`. The repo had commits on 2026-10-25 (UTC+8) — [package.json](https://raw.githubusercontent.com/lobehub/lobe-chat/main/package.json)
- Multi-user mode uses a server database (PostgreSQL stores conversations, agents, files, and user data). Auth is via Better Auth / OIDC providers, including Google, Microsoft, GitHub, Keycloak, Authentik, Casdoor, Logto, Okta, and generic OIDC. `AUTH_ALLOWED_EMAILS` restricts registration to listed emails or domains — [Self-hosting docs](https://lobehub.com/docs/self-hosting); [Auth env vars](https://lobehub.com/docs/self-hosting/environment-variables/auth); [Google provider](https://lobehub.com/docs/self-hosting/auth/providers/google)
- Korean locale `locales/ko-KR/` exists — [ko-KR chat.json](https://raw.githubusercontent.com/lobehub/lobe-chat/main/locales/ko-KR/chat.json)
- No documentation of an admin view of other users' conversations was found (the search returned none; the self-hosting docs' "admin" mentions refer to IdP admin accounts) — [Self-hosting docs](https://lobehub.com/docs/self-hosting)

**AnythingLLM**
- License: MIT — [LICENSE](https://github.com/Mintplex-Labs/anything-llm/blob/master/LICENSE). Main `package.json` = `1.19.0`. The latest docs changelog entry is Desktop v1.18.0 — [package.json](https://raw.githubusercontent.com/Mintplex-Labs/anything-llm/master/package.json)
- Multi-user mode is "**DOCKER VERSION ONLY**" and cannot be reverted to single-user. Roles: Admin (full access incl. "logs, analytics"), Manager ("view all workspaces"), and Default (only workspaces they're added to) — [Security and Access](https://docs.anythingllm.com/features/security-and-access)
- Workspace Chat Logs: "you can view the chat logs per workspace and per user of your AnythingLLM instance". Export as CSV, JSON, JSON (Alpaca), or JSONL (OpenAI fine-tune) "once at least 10 chat logs are available" — [Chat Logs](https://docs.anythingllm.com/features/chat-logs)
- The user model has a `dailyMessageLimit` field (a per-user daily message cap) — [server/models/user.js](https://github.com/Mintplex-Labs/anything-llm/blob/master/server/models/user.js)
- SSO: "Simple SSO Passthrough" (`SIMPLE_SSO_ENABLED`) generates per-user temporary login links for embedding in a larger system. No native Google OAuth was found in the docs — [Configuration](https://docs.anythingllm.com/configuration)
- Korean translations exist (`frontend/src/locales/ko/common.js`; "Added more translations (German, Korean…)" in v1.8.3) — [ko common.js](https://raw.githubusercontent.com/Mintplex-Labs/anything-llm/master/frontend/src/locales/ko/common.js)

**Dify**
- License: modified Apache 2.0. "you may not use the Dify source code to operate a multi-tenant environment" (tenant = workspace) without written authorization, and "you may not remove or modify the LOGO or copyright information in the Dify console or applications". There is also a note: "The interactive design of this product is protected by appearance patent." — [LICENSE](https://github.com/langgenius/dify/blob/main/LICENSE)
- Each app has a **Logs** tab that records conversations from the web app, the API, and Explore. Viewers can open "the raw prompt, an Agent app's tool iterations, or a Chatflow message's node-by-node trace". End users are identified by session ID, and "Logs contain complete user conversations" — [Dify Logs docs](https://docs.dify.ai/en/use-dify/monitor/logs)

**Onyx**
- License: MIT except `ee/` directories (Onyx Enterprise License) — [LICENSE](https://github.com/onyx-dot-app/onyx/blob/main/LICENSE)
- "Query History" ("a log of all messages sent to Onyx", CSV export) is labelled an **Enterprise Edition feature**. Usage analytics are also EE — [Query History](https://docs.onyx.app/admins/analytics/query_history); [Enterprise Edition](https://docs.onyx.app/admins/getting_started/enterprise_edition)

**Hugging Face Chat UI**
- License: Apache 2.0 — [LICENSE](https://github.com/huggingface/chat-ui/blob/main/LICENSE)
- It is a SvelteKit app that "connects to any OpenAI-compatible API endpoint" and uses MongoDB, MCP tools, an LLM router, and optional OpenID login. No admin chat viewer is documented — [Chat UI docs](https://huggingface.co/docs/chat-ui/index)
- The latest version is unclear: an aggregator lists v0.10.0 (May 2026) while a docs mirror shows 0.20.0. Not verified — [dev.co listing](https://dev.co/ai/frameworks/chat-ui)

**Big-AGI**
- License: MIT ("Copyright (c) 2023-2026 Enrico Ros") — [LICENSE](https://github.com/enricoros/big-AGI/blob/main/LICENSE)
- Conversations and settings are stored in the browser. Access control is HTTP Basic Auth. Cloud sync is a paid "Pro" feature (secondary sources) — [Hostinger app listing](https://www.hostinger.com/applications/big-agi); [README](https://cdn.jsdelivr.net/gh/enricoros/big-agi@main/README.md)

**Chatbot UI (mckaywrigley)**
- License: MIT (2024). The README says: "I've heard your feedback and am working hard on a big update… Be back soon. -- Mckay" — [README](https://github.com/mckaywrigley/chatbot-ui)

### Inferences
- AnythingLLM is the only "simple" alternative with a native per-user chat log viewer plus export and per-user daily caps. It is RAG/workspace-centric, though, with no Google OAuth (only Simple SSO passthrough) and no token/cost budgeting.
- Dify suits *instructor-built* tutoring apps where students use a published web app (logs per app are excellent). It is heavier to deploy (multiple containers) and is not a general ChatGPT-like client. One workspace for one class is fine under the license; offering it as a multi-tenant service is not.
- Big-AGI and Chatbot UI are unsuitable for instructor oversight. Onyx needs a paid EE license to get query history.

### Gaps
- LobeHub: no documented admin view of other users' chats and no per-user quota (it may exist in LobeHub Cloud/business editions, which were not checked).
- Dify and Onyx latest version numbers and dates were not retrieved. Dify's Korean UI was not verified (the expected i18n path returned 404, so the layout may have changed).
- Chatbot UI's last commit date was not retrieved.

## LLM gateways and observability (LiteLLM, Langfuse, Helicone): per-user keys, budgets, spend tracking, prompt logging, and how they combine with the UIs

### Takeaway
**LiteLLM Proxy** (MIT core) is the standard way to add hard per-student **budgets, rate limits, and spend tracking**, plus optional **full prompt/response logging** (`store_prompts_in_spend_logs`), in front of any UI. It hooks into Open WebUI via forwarded user headers and into LibreChat as a custom endpoint. **Langfuse** (MIT core) is the strongest open-source viewer for per-user traces (prompts, outputs, cost). It is natively integrated with LibreChat and attaches to Open WebUI via a Pipelines filter.

### Cited Findings
- LiteLLM license: MIT for everything outside `enterprise/` — [LICENSE](https://github.com/BerriAI/litellm/blob/main/LICENSE). Version on main is `1.108.0` (pyproject) with commits on 2026-10-24. Docs moved to the separate repo `BerriAI/litellm-docs` — [README](https://github.com/BerriAI/litellm)
- Budgets:
  - Global `max_budget` / `budget_duration` (e.g. "30d").
  - Team budgets with `rpm_limit`/`tpm_limit`, and per-team-member `max_budget_in_team`.
  - Internal-user budgets (`/user/new` with `max_budget`, `budget_duration`).
  - "Customers" budgets, which "budget `user` passed to `/chat/completions`, **without needing to create a key for every user**" (`/customer/new`).
  - "Every budget on this page is enforced against spend read from the database", so they do nothing in DB-less mode.
  — [Budgets, Rate Limits](https://docs.litellm.ai/docs/proxy/users)
- Prompt logging: `store_prompts_in_spend_logs` (default **false**): "If true, allows prompts and responses to be stored in the spend logs table" and makes them "visible in the logs UI". `maximum_spend_logs_retention_period` (default null) auto-purges spend logs (e.g. `30d`) — [Config settings](https://docs.litellm.ai/docs/proxy/config_settings)
- Open WebUI integration: set `ENABLE_FORWARD_USER_INFO_HEADERS=True` in Open WebUI, and in LiteLLM set `general_settings.user_header_mappings` (e.g. `X-OpenWebUI-User-Email → litellm_user_role: customer`) to get per-user tracking and budgets. Caveat: "Users can modify their own usernames; administrators can modify both usernames and emails" — [LiteLLM × Open WebUI](https://docs.litellm.ai/docs/tutorials/openweb_ui)
- The org-wide SSO rollout pattern (IdP token forwarded to LiteLLM as a JWT, with IdP groups mapped to LiteLLM teams/budgets) uses "LiteLLM JWT auth", which "is an enterprise feature and requires `LITELLM_LICENSE`". It was tested with Open WebUI v0.12.0 — [Open WebUI for Organizations](https://docs.litellm.ai/docs/tutorials/openwebui_org_rollout)
- Langfuse license: MIT outside the `ee/` directories. The LICENSE copyright line reads "Copyright (c) 2023-2026 ClickHouse, Inc." — [Langfuse LICENSE](https://github.com/langfuse/langfuse/blob/main/LICENSE)
- Langfuse × Open WebUI goes through the Pipelines container and the `langfuse_v3_filter_pipeline.py` filter. It provides traces, usage patterns, "Cost data by user and model", and evaluations — [Langfuse OpenWebUI integration](https://langfuse.com/integrations/no-code/openwebui)
- Langfuse × LibreChat is native: admin-configurable keys, `userIdField`, and per-conversation "View session in Langfuse" — [LibreChat Langfuse](https://www.librechat.ai/docs/configuration/langfuse). Langfuse's docs also have LiteLLM gateway and LibreChat integration pages (`integrations/gateways/litellm`, `integrations/clickhouse/librechat`) — [langfuse-docs repo](https://github.com/langfuse/langfuse-docs)
- LibreChat documents Helicone as a custom endpoint — [LibreChat custom endpoints](https://www.librechat.ai/docs/configuration/librechat_yaml/ai_endpoints)

### Inferences
- A robust "no-sysadmin-heroics" stack is **Open WebUI + LiteLLM (Postgres)**. Each student is a LiteLLM "customer" keyed by forwarded email, with `max_budget` + `budget_duration: 30d`. The instructor gets hard caps and a second, independent prompt/response log via LiteLLM's Logs UI, while Open WebUI's admin chat view stays the primary review surface.
- Langfuse adds the best review UX (filter by user, cost per user), but it is another multi-container service (Postgres + ClickHouse + Redis + S3-compatible). For 30–50 students it may be overkill unless the instructor wants analytics or evaluations.
- Both LiteLLM and Langfuse now have their copyright held by or associated with commercial owners (BerriAI; ClickHouse for Langfuse and LibreChat). This is noted as ownership context only.

### Gaps
- Helicone's current license and self-host status were not researched (helicone.ai was unreachable). It is a lower priority because LiteLLM + Langfuse cover the need.
- Whether LiteLLM's Admin UI "Logs" page or the spend-log retention setting is enterprise-gated was not confirmed.

## Can these connect to a consumer subscription (Claude Max / ChatGPT Plus) instead of API keys?

### Takeaway
It is technically possible via community proxies (and, for ChatGPT plans, via LiteLLM's `chatgpt/` provider using OAuth device flow). However, Anthropic reportedly banned the use of consumer-subscription OAuth in third-party apps in early 2026 and blocked known proxies, and sharing one personal subscription across 30–50 students is the kind of use ToS typically prohibit. Treat this as not viable for a class (ToS details are covered by another researcher).

### Cited Findings
- Reports say Anthropic's Feb 19, 2026 documentation update clarified that OAuth tokens from Free/Pro/Max plans may not be used outside Claude Code and Claude.ai, and that enforcement against third-party clients started Jan 9, 2026 — [AlternativeTo news](https://alternativeto.net/news/2026/2/anthropic-officially-bans-using-subscription-authentication-for-third-party-claude-use); [WinBuzzer](https://winbuzzer.com/2026/02/19/anthropic-bans-claude-subscription-oauth-in-third-party-apps-xcxwbn/)
- A blog post on CLIProxyAPI (Claude Max → OpenAI-format API) says it was blocked from using Max limits effective April 4, 2026 — [rogs.me](https://rogs.me/2026/02/use-your-claude-max-subscription-as-an-api-with-cliproxyapi/)
- Conflicting/unverified: an OpenClaw docs page claims a June 15, 2026 Anthropic support update lets Agent SDK / `claude -p` / third-party usage draw on subscription limits — [OpenClaw claude-max-api-proxy doc](https://cdn.jsdelivr.net/npm/openclaw@2026.7.1-2/docs/providers/claude-max-api-proxy.md)
- LiteLLM's "ChatGPT Subscription" provider (`chatgpt/`) uses a ChatGPT plan that includes Codex (Plus, Pro, Business, Enterprise, Edu) via OAuth device-code flow, with tokens stored in `~/.config/litellm/chatgpt/auth.json`. The backend rejects `max_tokens` fields — [LiteLLM ChatGPT provider](https://docs.litellm.ai/docs/providers/chatgpt)
- LiteLLM's Claude Code harness doc: "Subscription login (Claude Max) isn't used, because every model call goes through LiteLLM" — [LiteLLM Claude Code harness](https://docs.litellm.ai/docs/harness/claude_code)

### Inferences
- Technically, Open WebUI or LibreChat → LiteLLM (`chatgpt/` provider) → one ChatGPT Plus account would work. But it pools one personal account's limits across 50 students, would likely hit rate limits quickly, and probably violates OpenAI account-sharing terms (to be confirmed by the ToS researcher). API keys (or institutional plans such as ChatGPT Edu / Claude for Education) are the defensible path.

### Gaps
- OpenAI's and Anthropic's current primary ToS text was not fetched here (out of scope; covered by another researcher). The June 2026 Anthropic claim remains unverified.

## Education-specific open-source tools with teacher dashboards

### Takeaway
**Gen-Ed / CodeHelp** (AGPL-3.0, actively maintained, last commit 2026-10-23) is the most relevant purpose-built option. It has instructor and student roles, class enrollment, Google/GitHub/Microsoft SSO, LMS LTI, class data export (CSV), admin interfaces, and guardrailed tutoring that avoids handing out solution code. It talks to any OpenAI-compatible endpoint, so LiteLLM, Gemini, and others work. It is narrower than a general chat or agent platform.

### Cited Findings
- Gen-Ed provides "Authentication, including single-sign-on from Google, Github, and Microsoft; Class enrollment, with separate instructor and student roles; Connecting to LMSes via LTI; Class management and data export; Admin interfaces". Bundled apps are **CodeHelp** (CS help without solution code) and **Starburst** (non-CS components) — [Gen-Ed README](https://github.com/liffiton/Gen-Ed)
- License: `AGPL-3.0-only`. Its LLM client accepts `base_url` "for non-OpenAI providers". The instructor blueprint has CSV export routes (`/instructor/csv/<kind>`), and the tutors component has chat listing and chart functions (code inspection of `src/gened/instructor.py`, `src/components/tutors/data.py`) — [Gen-Ed repo](https://github.com/liffiton/Gen-Ed)
- CodeHelp research: a pilot with 52 students over 12 weeks. Responses can be incorrect, and the original design has no dialogue history — [CodeHelp paper (arXiv 2308.06921)](https://arxiv.org/abs/2308.06921). Cost: 2600+ queries for about $10 of OpenAI API usage (about $0.002/query) — [Illinois CS Teaching Workshop slides](https://teaching-workshop.cs.illinois.edu/files/2023/06/2023-IL-CS-Summer-Teaching-Workshop-CodeHelp.pdf)
- SIGCSE 2026 "Closing the Loop" includes an instructor frontend where instructors take queued feedback requests that students escalate when AI hints are unhelpful — [machine-teaching-group/sigcse2026-closing-the-loop](https://github.com/machine-teaching-group/sigcse2026-closing-the-loop)

### Inferences
- Gen-Ed fits a programming course that wants guardrailed help plus instructor review. For a general "students use AI for chat, web search, and coding agents" course, Open WebUI or LibreChat is a better fit, with Gen-Ed as an optional add-on. AGPL obligations matter only if the instructor modifies Gen-Ed and offers it over a network: the modified source must then be made available.

### Gaps
- Gen-Ed's Korean UI support was not checked (likely English-only). No Korean-specific open-source teacher-dashboard AI tool was found.

## Korean privacy/legal considerations (개인정보보호법) for logging students' prompts

### Takeaway
Logging student prompts and outputs is processing of personal information under PIPA. The instructor (or university) should give clear notice and get consent or another legal basis, state the purpose and retention period, and destroy logs after the course. Sending prompts to US model providers (OpenAI, Anthropic, Google) is an **overseas transfer/entrustment**. Under Art. 28-8 that requires either separate consent or disclosure of specific items in the privacy policy. The PIPC has issued generative-AI-specific guidance in 2025–2026.

### Cited Findings
- In August 2025 the PIPC published the "생성형 인공지능(AI) 개발·활용을 위한 개인정보 처리 안내서", aimed at companies and institutions, to reduce uncertainty in applying PIPA to generative AI — [디지털데일리](https://www.ddaily.co.kr/page/view/2025080611120338544); [smartcity.go.kr](https://smartcity.go.kr/?p=48889)
- The April 2026 revision of the PIPC's "개인정보 처리방침 작성지침" added a generative-AI appendix. Operators must state whether user-entered text, voice, or files are collected and stored, whether they are used for training, and how to opt out (secondary report) — [뉴시스](https://mobile.newsis.com/view/NISX20260424_0003604909)
- In May 2026 the PIPC published a user-side guide, "생성형 AI 서비스 이용자를 위한 개인정보 보호 가이드". It advises checking for personal data before entering prompts and reviewing training-use, chat-history, overseas-transfer, and integration settings (secondary summary) — [바이라인네트워크](https://byline.network/2026/05/19-618/)
- Art. 28-8 (overseas transfer):
  - The default rule bars providing, entrusting, or storing personal information abroad unless an exception applies. Exceptions include separate consent, specific laws or treaties, and necessity for contract performance where the items are disclosed in the Art. 30 privacy policy.
  - Required items: country, timing and method, recipient name and contact, purpose and retention, and how to refuse and its effect.
  - Privacy-policy disclosure alone does not substitute for separate consent where consent is the basis (legal commentary, secondary).
  — [로톡 해설](https://www.lawtalk.co.kr/posts/85853); [ISMS-P 3.3.4 국외이전](https://itwiki.kr/w/ISMS-P_%EC%9D%B8%EC%A6%9D_%EA%B8%B0%EC%A4%80_3.3.4.%EA%B0%9C%EC%9D%B8%EC%A0%95%EB%B3%B4%EC%9D%98_%EA%B5%AD%EC%99%B8%EC%9D%B4%EC%A0%84)

### Inferences
- Practical checklist (an inference, not legal advice):
  1. Give a written notice/consent form at the first class covering purpose (learning support and assessment), the items logged (account email, prompts, outputs, timestamps, token usage), who can view them (instructor/TA), retention (e.g. until grades are finalized + N months), and the overseas transfer to named API providers.
  2. Offer a non-AI alternative, so consent is genuinely free in a grading context.
  3. Configure retention technically: Open WebUI has no auto-expiry, so delete manually or by script. LibreChat has `retentionMode: all` + `generalChatRetention`. LiteLLM has `maximum_spend_logs_retention_period`.
  4. Tell students not to enter others' or sensitive personal data.
  5. Check whether the university's IRB/개인정보 담당 부서 rules apply if logs will be used for research.
- National universities may count as 공공기관 under PIPA, with additional obligations. Check with the university's privacy office.

### Gaps
- Primary statute text (law.go.kr) and PIPC originals (pipc.go.kr) could not be fetched (blocked). Articles 15 (collection/consent basis), 21 (destruction), and 22 (consent method) were not quoted from primary sources here. The figures above come from secondary news and legal commentary.

## Overall comparison (requested table)

### Takeaway
For a 30–50 student class run by a non-sysadmin, **Open WebUI** (optionally + LiteLLM for hard per-student budgets) is the best fit, because instructor review of every chat is built in and on by default. **LibreChat** is the best fit if built-in per-user credit caps and MIT licensing matter more, but full transcript review needs Langfuse or DB access. **AnythingLLM** is a simpler fallback with a native per-user chat-log viewer.

### Cited Findings
(All cells are sourced in the sections above. "—" = not found or not verified.)

| Platform | License (restrictions) | Latest version (as of Oct 2026) | Login options | Admin can read all students' chats? | Per-user quota / cost tracking | Providers | Web search | Code exec / agents / MCP | Korean UI | Deployment | Fit for class |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Open WebUI** | Open WebUI License = BSD-3 + branding clause (no removing "Open WebUI" branding if >50 users/30 days without enterprise license); not OSI. ≤v0.6.5 pure BSD-3 | v0.12.3 (16 Oct 2026) | Email; Google/MS/GitHub/OIDC OAuth; `OAUTH_ALLOWED_DOMAINS`; LDAP; SCIM; trusted header; `pending` approval default | **Yes, built-in** (`ENABLE_ADMIN_CHAT_ACCESS` default True, read-only); admin export; audit log up to `REQUEST_RESPONSE`; can disable student delete/temporary chats. Sub-agent/timer chats hidden from listings | Analytics (tokens by user/model/group); **no native quota**, so use a Filter Function or LiteLLM | OpenAI, Anthropic (via OpenAI-compat), Gemini (OpenAI-compat), Ollama, vLLM, any OpenAI-compatible | ~28 providers incl. keyless DDGS, SearXNG, Tavily, Brave, Google PSE | Pyodide (default), Jupyter, Open Terminal (Docker); native MCP (admin-added, Streamable HTTP); Functions/Pipelines; sub-agents | Yes (ko-KR) | Single Docker container (SQLite) or + Postgres | **Best fit** |
| **LibreChat** | MIT | v0.8.8 (30 Sep 2026); v0.8.9-rc1 on main | Email; Google/GitHub/Discord/OIDC; SAML; LDAP; passkeys; `allowedDomains` | **No in-app transcript viewer**; Insights shows first message of recent Agent chats; full content via Langfuse ("View session in Langfuse") or MongoDB | **Yes**: token-credit balance per user (start balance, auto-refill; 1000 credits = $0.001), transactions log | Anthropic, OpenAI, Google, Bedrock, Azure native; Ollama/LiteLLM/OpenRouter etc. custom | Serper/SearXNG/Tavily + Firecrawl + Jina/Cohere; Keenable keyless | Agents; MCP (multi-user); Code Interpreter via self-hosted Apache-2.0 service | Yes (ko) | Docker Compose (API + MongoDB + Meilisearch + RAG + admin-panel) | Strong, needs Langfuse for review |
| **AnythingLLM** | MIT | 1.19.0 on main | Local accounts (multi-user, Docker only); Simple SSO passthrough | **Yes**: chat logs per workspace and per user; export CSV/JSON/JSONL | Per-user `dailyMessageLimit`; no cost tracking found | Many (not detailed here) | Agent web browsing (not detailed) | Agents/agent flows; MCP — not verified | Yes (ko) | Single Docker container | Good simple fallback |
| **LobeHub** | LobeHub Community License (Apache-2.0 + derivative distribution needs commercial license) | 2.2.20 on main | Better Auth/OIDC incl. Google; `AUTH_ALLOWED_EMAILS` | Not documented | Not documented | Many | Yes (online-search docs) | Agents/plugins; MCP not verified | Yes (ko-KR) | Docker + Postgres (+ S3/Redis) | Weak for oversight |
| **Dify** | Modified Apache-2.0: no multi-tenant without authorization; can't remove logo | — | Workspace accounts | **Yes per app** (Logs tab: full conversations, raw prompt, agent steps) | — | Many | Via tools | Workflows/agents | — | Multi-container Docker Compose | Good for instructor-built tutor apps, not a general client |
| **Onyx** | MIT CE + Enterprise `ee/` | — | — | Query History is **EE-only** | Usage analytics EE-only | Many | Yes (RAG/search focus) | Agents/actions | — | Multi-container | Poor without EE |
| **HF Chat UI** | Apache-2.0 | conflicting (v0.10.0 vs 0.20.0) | Optional OpenID | Not documented | — | OpenAI-compatible only | — | MCP tools | — | Node + MongoDB | Weak |
| **Big-AGI** | MIT | — | HTTP Basic Auth | No (browser storage) | — | Many | — | — | — | Docker | Unsuitable |
| **Chatbot UI** | MIT | dormant ("Be back soon") | — | No | — | — | — | — | — | — | Unsuitable |
| **Gen-Ed / CodeHelp** (edu) | AGPL-3.0 | active (commit 23 Oct 2026) | Google/GitHub/MS SSO; LTI; class enrollment | **Yes** (instructor class data + CSV export) | — (cost ~$0.002/query reported) | OpenAI-compatible (`base_url`) | No | Guardrailed tutor, no agents | — | Python/Flask (Dockerfile present) | Good for CS courses |
| **LiteLLM** (gateway) | MIT core; JWT/SSO features enterprise | 1.108.0 on main | Virtual keys; customers via header | **Yes, if** `store_prompts_in_spend_logs: true` (Logs UI) | **Yes**: per key/user/team/customer `max_budget`, `budget_duration`, rpm/tpm; needs DB | 100+ providers incl. `chatgpt/` subscription | n/a | MCP gateway (not detailed) | — | Docker + Postgres | Add-on for caps and logging |
| **Langfuse** (observability) | MIT core + `ee/` | — | — | **Yes** (per-user traces, cost by user) | Cost tracking (no enforcement) | n/a | n/a | n/a | — | Multi-container (Postgres, ClickHouse, Redis, S3) | Add-on for review UX |

### Inferences
- Minimal-effort recommended setup: Open WebUI (Docker, PostgreSQL), with Google OAuth limited to the university domain, `DEFAULT_USER_ROLE=pending`, student chat delete and temporary chats disabled, and `AUDIT_LOG_LEVEL=REQUEST_RESPONSE`. Connect the instructor's OpenAI/Anthropic/Gemini keys directly, or through LiteLLM if per-student dollar caps are required.
- Alternative: LibreChat with `balance.enabled` + Langfuse, if MIT licensing and built-in credits matter more than a built-in transcript viewer.

### Gaps
- GitHub star counts, issue velocity, and exact release dates for most projects could not be gathered (GitHub API blocked). The activity signals used here are last-commit dates and version numbers on main.
- Korean UI quality (completeness, naturalness) was not assessed beyond the existence of locale files. For Open WebUI, about 208 of roughly 4,000 lines in the ko-KR file are untranslated strings.
