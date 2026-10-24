# API cost estimate for a 30–50-student class using an instructor-run AI website (prices as of Oct 2026)

> **Date seen:** all prices fetched or searched on **2026-10-24**.
> **Access caveat:** this research environment could reach Anthropic's own pages directly: platform.claude.com, claude.com and code.claude.com. The proxy blocked OpenAI and Google pages (openai.com, platform.openai.com, developers.openai.com, ai.google.dev), and WebFetch also failed on many aggregator sites. So the **OpenAI and Google prices below come from search-engine summaries of their official pages plus dated third-party aggregators. They are marked "[not directly verified]"**, and you should re-check them on the live pricing pages before committing a budget.
> **Base assumptions used in every scenario:** N = 40 students (results scale linearly; ×0.75 for 30 students, ×1.25 for 50), 2 class sessions per week, 15 weeks. That gives **30 sessions per student and 1,200 student-sessions per semester**, or about **346 student-sessions per month** (2 × 4.33 weeks × 40). Currency: **₩1,330 = $1** (see Q8).

---

## Q1. Current API prices per 1M tokens (input / cached input / output, caching and batch discounts)

### Takeaway
The current-generation tiers from the three big vendors are priced in the same bands, and Anthropic's and OpenAI's mid and cheap tiers are identical:
- **Cheap:** about $0.10 in / $0.50 out (Claude Haiku 5.5, GPT-6 Luna).
- **Mid:** about $2 / $10 (Claude Sonnet 5.5, GPT-6 Sol).
- **Upper:** $4 / $20 (Claude Opus 5.5).
- **Top:** $10 / $50 (Claude Fable 5.1, GPT-6 Astra).

Gemini Flash runs $0.75 / $3.75 until Dec 31, 2026 and then doubles. Prompt-cache reads cost 2.5–10% of the input price. Batch is 50% off but is not usable for live classroom chat.

### Cited Findings
**Anthropic (official, platform.claude.com, seen 2026-10-24)**
- Per-MTok prices (base input / 5-min cache write / 1-h cache write / cache hit / output) — [Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing):
  - **Claude Fable 5.1:** $10 / $12.50 / $20 / $0.25 / $50. This is the most capable widely released model.
  - **Claude Opus 5.5:** $4 / $5 / $8 / $0.20 / $20.
  - **Claude Sonnet 5.5:** $2 / $2.50 / $4 / **$0.10** / $10.
  - **Claude Haiku 5.5:** $0.10 / $0.125 / $0.20 / $0.01 / $0.50 for prompts **up to 100k tokens**, and **$0.50 / $0.625 / $1 / $0.05 / $2.50 for prompts over 100k tokens**.
  - **Older models:** Opus 5 and Opus 4.5–4.8 are $5 / $25. Sonnet 4.6 is $3 / $15. Haiku 4.5 is $1 / $5.
- Cache multipliers: 5-min write is 1.25× base input and 1-h write is 2×. A cache read is normally 0.1×, but **0.025× on Fable 5.1** and **0.05× on Opus 5.5 and Sonnet 5.5** — [Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing).
- The Sonnet 5 price of $2 / $10, announced as introductory, "is now the standard price"; the planned increase to $3 / $15 on Sep 1, 2026 "will not occur" — [Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing).
- **Batch API is 50% off** input and output. Examples: Opus 5.5 $2 / $10, Sonnet 5.5 $1 / $5, Haiku 5.5 $0.05 / $0.25 (≤100k). Batch and caching discounts stack — [Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing).
- **Long context:** Claude 4.6+ models other than Haiku 5.5 bill the full 1M-token context window at standard rates — [Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing).
- **Data residency:** pinning inference to the US with `inference_geo: "us"` costs 1.1×; global routing, the default, uses standard prices — [Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing).
- **Fast mode** for Opus 5.5 is $8 / $40 — [Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing).
- **Tokenizer:** Claude 4.7 and later models use a tokenizer that "produces approximately 30% more tokens for the same text" than Sonnet 4.6 and earlier — [Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing).
- **Free trial:** "New users receive a small amount of free credits." The page also says "Academic and research discounts might be available," negotiated case by case — [Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing).
- claude.com/pricing shows the same API table (Fable 5.1 $10 / $50, Opus 5.5 $4 / $20, Sonnet 5.5 $2 / $10 with $0.10 cache read, Haiku 5.5 $0.10 / $0.50) — [claude.com/pricing](https://claude.com/pricing).
- **Conflict note:** the cached Claude API skill reference (dated 2026-10-06) lists Sonnet 5.5 cache reads at $0.20/MTok. Both official pages say **$0.10**, and $0.10 is what these notes use — [Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing).

**OpenAI [not directly verified; search summaries of developers.openai.com model pages and help.openai.com rate card]**
- **GPT-6 Sol:** $2.00 input, $0.20 cached input, $10.00 output per 1M. Cache writes billed at 1.25× the uncached input rate — [GPT-6 Sol model page](https://developers.openai.com/api/docs/models/gpt-6-sol); [ChatGPT rate card](https://help.openai.com/en/articles/20001415-chatgpt-rate-card-enterprise-token-based-pricing).
- **GPT-6 Luna:** $0.10 input, $0.01 cached, $0.50 output — [GPT-6 Luna model page](https://developers.openai.com/api/docs/models/gpt-6-luna).
- **GPT-6 Astra:** $10.00 input, $1.00 cached, $50.00 output. Prompts over **272K input tokens** cost more — [GPT-6 Astra model page](https://developers.openai.com/api/docs/models/gpt-6-astra). One aggregator says input doubles and output rises 1.5× above 272K — [morphllm OpenAI pricing](https://www.morphllm.com/openai-api-pricing).
- **GPT-6.1 Sol** (DevDay, Sep 30, 2026) is reported at the same $2 / $10 list price, with cached input possibly $0.10. The changelog's $0.10 cached rate conflicts with the Sol page's $0.20 — [OpenAI changelog](https://developers.openai.com/api/docs/changelog); [explainx.ai](https://explainx.ai/blog/gpt-6-sol-luna-launch-pricing-2026).
- **Launch dates:** Astra was reported released Sep 3, 2026. Sol and Luna followed Sep 22, 2026, at about half the price of the GPT-5.6 tiers they replace — [MarkTechPost](https://www.marktechpost.com/2026/09/22/openai-releases-gpt-6-sol-and-luna-50-cheaper-api-pricing-and-benchmarks/); [cloudzero OpenAI pricing](https://www.cloudzero.com/blog/openai-pricing/).
- **Batch and Flex are 50% of Standard; "Fast" is 2×** — [OpenAI model pages via search](https://developers.openai.com/api/docs/models/gpt-6-astra); [infro.io](https://infro.io/blog/openai-api-pricing-2026).
- **Codex-tuned model:** `gpt-5.3-codex` is $1.75 input, $0.175 cached, $14.00 output — [OpenAI pricing (via search)](https://developers.openai.com/api/docs/pricing); [pricepertoken](https://pricepertoken.com/pricing-page/model/openai-gpt-5.3-codex).
- **Older or other models:** GPT-5.5 at $5 / $30 and GPT-5.5 Pro at $30 / $180 — [morphllm OpenAI pricing](https://www.morphllm.com/openai-api-pricing). "GPT-5.6 Sol" promotional pricing is reportedly available at least through Nov 21, 2026 — [cloudzero Codex pricing](https://www.cloudzero.com/blog/openai-codex-pricing/).
- **Conflict:** one calculator lists gpt-6-astra at $60 / $300 and gpt-6.1-sol at $12 / $60. This contradicts every other source and is probably an error — [howtoai](https://howtoai.com/openai-api-pricing-calculator/).

**Google Gemini [not directly verified; search summaries of ai.google.dev]**
- **Gemini 3.8 Flash:** introductory **$0.75 / $3.75** per 1M input / output **through Dec 31, 2026**, then **$1.50 / $7.50 from Jan 1, 2027** — [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing); [What's new in Gemini 3.8](https://ai.google.dev/gemini-api/docs/whats-new-gemini-3.8).
- **Gemini 3.6 Flash** is listed at $1.50 / $7.50, and the batch rate is inconsistent between pages — [What's new in Gemini 3.6](https://ai.google.dev/gemini-api/docs/generate-content/whats-new-gemini-3.6).
- **Gemini 3.5 Flash-Lite** is $0.30 / $2.50. **Gemini 3.1 Flash-Lite** is $0.25 / $1.50 (audio input $0.50). Both have a free tier — [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing).
- **Gemini 3.1 Pro Preview** is $2 / $12 at ≤200k tokens and $4 / $18 above 200k. It has "no free tier available … in the Gemini API"; free Pro access is AI Studio only — [Gemini 3 developer guide](https://ai.google.dev/gemini-api/docs/gemini-3).
- Gemini 2.5 Flash-Lite ($0.10 / $0.40) is reported to retire Oct 16, 2026 — [cloudzero Gemini pricing](https://www.cloudzero.com/blog/gemini-pricing/).
- Aggregators disagree on newer Gemini model names; some list "Gemini 4 Argon" and similar names that appear in only one or two sources — [Puter Gemini pricing](https://developer.puter.com/tutorials/gemini-api-pricing/); [morphllm Gemini pricing](https://www.morphllm.com/gemini-api-pricing).

**Cheaper options [aggregators only; conflicting]**
- **DeepSeek V4 Flash:** $0.14 input (cache miss), $0.0028 input (cache hit), $0.28 output. **V4 Pro:** $1.74 / $3.48, with the cache-hit price reported as $0.0145 by one source and $0.145 by another. 1M context — [cloudzero DeepSeek](https://cloudzero.com/blog/deepseek-pricing/); [Puter DeepSeek (Jun 2026)](https://developer.puter.com/tutorials/deepseek-api-pricing/).
- Newer Oct 2026 posts conflict. One lists $0.30 cache-miss and $0.006 cache-hit input at peak times; another lists off-peak Flash at $0.15 / $0.003 / $0.60 — [Activepieces Oct 21](https://www.activepieces.com/blog/deepseek-api-pricing-2026-models-cache-output.md); [Activepieces Oct 15](https://www.activepieces.com/blog/deepseek-api-pricing-2026-cost-per-1m-tokens.md).
- No current Qwen or Mistral API prices were collected in this session.

### Inferences
- **Price-tier mapping used in the cost model:**

  | Tier | Model | Price per 1M (in / out) |
  |---|---|---|
  | Cheap | Haiku 5.5 / GPT-6 Luna / Gemini 3.1 Flash-Lite | $0.10–0.25 / $0.50–1.50 |
  | Mid | Sonnet 5.5 / GPT-6 Sol / Gemini 3.8 Flash | $0.75–2 / $3.75–10 |
  | Flagship | Opus 5.5 / GPT-6 Astra / Gemini 3.1 Pro | $2–10 / $12–50 |

  Fable 5.1 ($10 / $50) is shown for reference only.
- On today's list prices, **Opus 5.5 is 2.5× cheaper than GPT-6 Astra or Fable 5.1**. Sonnet 5.5 and GPT-6 Sol cost the same, but Sonnet 5.5's cache read is half Sol's ($0.10 vs $0.20). That matters most for long, cache-heavy agent sessions.
- **Timing risk for a Spring-2027 course** (Korean spring semester, March–June): Gemini 3.8 Flash doubles on Jan 1, 2027, and OpenAI's GPT-5.6 Sol promo ends Nov 21, 2026. Budget at post-promo prices.
- **Haiku 5.5's 100k-token threshold matters for agents.** Long agent contexts push requests onto the 5× price card. For short chat it is effectively as cheap as GPT-6 Luna.
- Reasoning and "thinking" tokens are billed as output on all three vendors. Opus 5.5, Sonnet 5.5, Haiku 5.5 and Fable can't fully turn thinking off ([Claude Code costs](https://code.claude.com/docs/en/costs)), so the scenarios add a thinking allowance to output.

### Gaps
- The official OpenAI pricing page (developers.openai.com/api/docs/pricing) and Google pricing page (ai.google.dev/gemini-api/docs/pricing) could not be fetched; the prices are from search summaries.
- **Gemini context-caching price** for Gemini 3.x was not found. The model **assumes a cache read at 0.1× input**, which is unverified.
- Current Mistral and Qwen API prices were not researched. DeepSeek prices conflict, and its data-residency and privacy implications for a Korean university were not assessed.
- Korean language tokenization: Korean text likely costs more tokens per character than English, but no measured ratio for the new tokenizers was found.

---

## Q2. Server-side tool prices: web search, web fetch, code execution / containers

### Takeaway
Web search costs **$10 per 1,000 searches on Claude and OpenAI**, plus the result tokens. Gemini 3+ costs **$14 per 1,000 after 5,000 free searches/month**, which would cover a 40-student class. Claude code execution is effectively free at this scale: free alongside web search/fetch, otherwise 1,550 free container-hours per month.

### Cited Findings
- **Claude web search:** "$10 USD per 1,000 searches, plus standard token costs for search-generated content." Results "are counted as input tokens, in search iterations run during a single turn **and in subsequent conversation turns**." Failed searches aren't billed — [Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing).
- Claude's documented single-search usage example shows input_tokens 105, cache_read 7,123, cache_creation 7,345, output 6,039. That is about 7k tokens of search context for one search — [Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing).
- **Claude web fetch:** no extra charge beyond tokens. Typical sizes: an average webpage (10 kB) is about 2,500 tokens, a large docs page (100 kB) about 25,000, and a research-paper PDF (500 kB) about 125,000. `max_content_tokens` caps it — [Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing).
- **Claude code execution:** "free when used with web search or web fetch" (`web_search_20260209` / `web_fetch_20260209`). Otherwise it is billed by execution time: 5-minute minimum, **1,550 free hours per organization per month**, then **$0.05 per hour per container** — [Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing). claude.com phrases this as "50 free hours per organization daily" — [claude.com/pricing](https://claude.com/pricing).
- **Claude Managed Agents:** **$0.08 per session-hour** of `running` time plus tokens; idle time is not billed — [Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing).
- Tool-definition overhead is added to input tokens: 286 tokens for the tool system prompt (Opus 5.5 / Sonnet 5.5 / Haiku 5.5), +325 for bash, +974 for the text editor — [Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing).
- **OpenAI `web_search` [not directly verified]:** about **$10 per 1,000 calls** on all models, with search content billed as input tokens. The legacy `web_search_preview` is $25/1k on non-reasoning models, with content tokens free; sources conflict on this — [Puter OpenAI pricing](https://developer.puter.com/tutorials/openai-api-pricing/); [nOps](https://www.nops.io/blog/openai-api-pricing/). For gpt-4o-mini and gpt-4.1-mini, search content is a fixed 8,000-token block per call — [Puter OpenAI pricing](https://developer.puter.com/tutorials/openai-api-pricing/).
- **OpenAI Code Interpreter / hosted shell containers [not directly verified; snapshot roughly a year old]:** priced per 20-minute session per container — $0.03 (1 GB), $0.12 (4 GB), $0.48 (16 GB), $1.92 (64 GB) — [OpenAI pricing (search snippet)](https://platform.openai.com/docs/pricing/); [OpenAI Responses API tools announcement](https://openai.com/index/new-tools-and-features-in-the-responses-api/).
- **Gemini Grounding with Google Search (Gemini 3+):** billed **per search query the model executes**, with "5,000 free search requests per month shared across all Gemini 3 and newer models, and then … $14 per 1,000." The pricing page shows grounding as "Not available" in the Free Tier column for Gemini 3.8 Flash; the 5,000 allowance belongs to the paid tier — [Gemini grounding docs](https://ai.google.dev/gemini-api/docs/google-search); [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing).
- Legacy Gemini 2.5 grounding is reported at $35 per 1,000 prompts with 1,500 free requests/day. One third-party source says grounded web content isn't charged as input tokens on Gemini (unverified) — [Puter Gemini pricing](https://developer.puter.com/tutorials/gemini-api-pricing/).

### Inferences
- **Search volume at the base assumptions (10 searches per chat+search session):** 40 × 8.66 sessions × 10 ≈ **3,460 searches/month**, or 12,000 per semester.
  - Claude or OpenAI: about **$35/month, $120/semester** in search fees.
  - Gemini 3+: **$0** in search fees, because 3,460 is under the 5,000 free monthly searches (paid tier).
- **Search result tokens cost far more than the search fee.** Results stay in the conversation, so about 7k tokens per search get re-sent on every later turn (see Q3/Q4).
- **Container hours:** 40 students × 8.66 sessions × 1.5 h ≈ 520 h/month, well under Anthropic's 1,550 free hours, so code execution costs $0. If run on Claude Managed Agents instead, runtime would be about 520 h × $0.08 ≈ **$42/month** (upper bound, since only `running` time is billed).

### Gaps
- OpenAI's current container price and session-length definition, and whether search content is billed on GPT-6 models, could not be verified on the live page.
- Whether Gemini 3.x bills grounded content as input tokens is unconfirmed.

---

## Q3. Typical token consumption per interaction (chat, chat + search, agentic coding)

### Takeaway
A 20-turn chat session uses about **150–160k input / 14k output tokens**; most of the input is re-sent history, which caching makes cheap. Keeping web-search results in history pushes a session to **about 1M input tokens**. Agentic coding sessions run **0.5–6M+ input tokens**, about 90–97% of it cache reads. Anthropic's enterprise average for full-time developers is **about $13 per active day and $150–250 per month**.

### Cited Findings
- **Anthropic, official, current:** "Across enterprise deployments, the average cost is around **$13 per developer per active day** and **$150–250 per developer per month**, with costs remaining **below $30 per active day for 90% of users**" — [Claude Code costs](https://code.claude.com/docs/en/costs).
- An **older** version of that page gave "$6 per developer per day … below $12 for 90% of users." Superseded, but often quoted — [old docs.anthropic.com costs page](https://docs.anthropic.com/en/docs/claude-code/costs).
- Claude Code's own `/usage` sample session on Sonnet 4.6: 1.2k input, 5.3k output, **940k cache read**, 50k cache write, **$0.55** total. Recomputed at Sonnet 4.6 prices: 940k×$0.30 + 50k×$3.75 + 5.3k×$15 + 1.2k×$3 ≈ $0.553. The sample also shows cached reads dominating volume — [Claude Code costs](https://code.claude.com/docs/en/costs).
- Anthropic's Managed Agents worked example: a 1-hour Opus 5.5 coding session with 50k input and 15k output costs $0.58 without caching, or $0.428 with 40k of the input as cache reads — [Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing).
- "Agent teams use approximately **7× more tokens** than standard sessions" in plan mode. "One debugging session can consume more than a day of chat" — [Claude Code costs](https://code.claude.com/docs/en/costs).
- **Measured power-user data (single developer, self-reported):** 471 Claude Code sessions, **6.12B input tokens (97.2% cache reads)**, 21.6M output. That is about 13M input and 46k output per session — [DEV Community](https://dev.to/danmercede/i-read-all-471-of-my-claude-code-sessions-where-6-billion-tokens-actually-went-1bde).
- **SEO-style guides (unverified):**
  - Most developers average about 150k–250k tokens per session unoptimized. Light sessions run 50–100k tokens; full-day heavy sessions 0.8–2M.
  - A typical 50-turn agentic session is about 1M input and 40k output tokens, with input about 85% of cost.
  - Sources: [Verdent guide](https://www.verdent.ai/guides/claude-code-pricing-2026); [SSD Nodes](https://www.ssdnodes.com/learn/claude-code-token-usage-explained).
- **OpenAI Codex:** no authoritative tokens-per-task figure was found. One blog estimates a typical coding session at $0.50–2.00 at API rates — [cloudzero Codex pricing](https://www.cloudzero.com/blog/openai-codex-pricing/); [UserJot](https://userjot.com/blog/openai-codex-pricing).
- `ccusage` is an open-source CLI that reads local Claude Code logs to report per-session tokens and cost. It is the recommended way to measure your own baseline — [search summary of morphllm / ccusage references](https://www.morphllm.com/claude-code-pricing).

### Inferences: token profiles used in the model
All profiles re-send the full conversation each request.

**A — Light chat**
- 20 turns. System prompt 1,500; user message 150; visible answer 500; thinking/reasoning allowance 200 output (not carried forward).
- Input = 20·S + 20·u + (u+a)·Σ(n−1) = 30,000 + 3,000 + 650·190 = **156,500 tokens**. Output = 20 × 700 = **14,000**.
- Cache-read share h = 0.75; the rest is billed at the 1.25× write rate where applicable.

**B — Chat + web search, results kept in history**
- Profile A plus **10 searches/session**: 2 searches on each of turns 2, 6, 10, 14 and 18.
- About 7k tokens per search, following Claude's documented example and OpenAI's 8k fixed block.
- Results persist for the rest of the conversation, plus one intra-turn re-read. Total ≈ **1.07M input / 15.5k output**, h = 0.85.

**B-lean — Same, but the app strips old search results**
- Search results are not re-sent after the turn they were used in. Total ≈ **264k input / 15.5k output**, h = 0.75.

**C — Agentic coding, medium (one 75–90-minute lab)**
- 40 model requests, context growing from 20k to 80k tokens.
- **2.0M input / 50k output**, h = 0.92, consistent with Claude Code's ~95–97% cache-read pattern.

**D — Agentic coding, heavy**
- 80 requests, context growing from 20k to 130k.
- **6.0M input / 120k output**, h = 0.92. About 27% of requests exceed Haiku 5.5's 100k threshold.

**Sanity checks**
- Profile C on Opus 5.5 costs about $2.17/session and D about $5.90/session, roughly 1/6 to 1/2 of Anthropic's $13 "active developer day." That fits a single class period for students who are less intensive than professional developers.
- Without caching, C on Sonnet 5.5 would cost $4.50/session instead of $1.08. Caching is the single biggest cost lever.

### Gaps
- No classroom-specific (student) agentic token data was found; profiles C/D are extrapolations from developer data.
- Codex/GPT token consumption per task is undocumented in what could be reached.
- Real cache-hit rates depend on students' pauses between turns. The default 5-minute TTL expires if a student idles, causing re-writes.

---

## Q4. Scenario cost model: monthly and semester totals (low / medium / high)

### Takeaway
For 40 students over a 15-week semester:
- **Light chat** on a mid-tier model (Sonnet 5.5 / GPT-6 Sol) costs about **$300 (≈₩40만)**. On a cheap model (Haiku 5.5 / GPT-6 Luna) it costs about **$16**.
- **Chat with web search** on a mid-tier model costs **$530–900 (₩70–119만)**.
- **Agentic coding in every class** costs about **$1,300 (₩173만) on Sonnet 5.5** and **$2,600 (₩346만) on Opus 5.5**. A heavy-agent stress case reaches **$3.5k–7.1k (₩471–942만)**.

### Cited Findings
- Per-token prices, cache multipliers and search fees are from Q1/Q2 — [Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing); [GPT-6 Sol](https://developers.openai.com/api/docs/models/gpt-6-sol); [GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna); [GPT-6 Astra](https://developers.openai.com/api/docs/models/gpt-6-astra); [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing); [Gemini grounding](https://ai.google.dev/gemini-api/docs/google-search).
- Exchange rate ₩1,330/$ is from Q8 — [Investing.com USD/KRW](https://kr.investing.com/currencies/usd-krw-historical-data).
- The Anthropic API **Start tier caps monthly spend at $500, Build at $1,000, Scale at $200,000**. At the cap, requests return HTTP 429 until the 1st of the next month (UTC) — [Claude rate limits](https://platform.claude.com/docs/en/api/rate-limits).

### Inferences

#### Formulas (transparent, reproducible)
- **Per request r with context C_r:**
  `cost_r = C_r × [h × P_cache_read + (1−h) × P_in × w] + share of output`
  - w = 1.25 for Anthropic and OpenAI GPT-6 (cache-write surcharge); w = 1.0 for Gemini, DeepSeek and gpt-5.3-codex (assumed).
  - For Haiku 5.5, requests with C_r > 100k use the $0.50 / $0.05 / $2.50 price card.
- **Per session:** `cost_session = Σ_r cost_r + Output × P_out + searches × fee_per_search`
- **Per month:** `cost_month = cost_session × (N × 2 × 4.33)`, i.e. × 346 for N = 40.
- **Per semester:** `cost_semester = cost_session × (N × 2 × 15)`, i.e. × 1,200 for N = 40.
- **Worked example — Sonnet 5.5, scenario A, one session:**
  - Input: 156,500 × [0.75 × $0.10 + 0.25 × $2.00 × 1.25] / 1M = 156,500 × $0.7000/1M = $0.1096.
  - Output: 14,000 × $10/1M = $0.14.
  - Session total = **$0.2496**. Semester = $0.2496 × 1,200 = **$299**.
- **No-cache upper bound** (h = 0, w = 1), per session: A on Sonnet 5.5 $0.453 (vs $0.25 cached); C on Sonnet 5.5 $4.50 (vs $1.08); C on Opus 5.5 $9.00 (vs $2.17).

#### Final estimate table: Claude models, N = 40, 2 sessions/week, 15 weeks (USD and KRW at ₩1,330)

| Scenario (per student per class) | Cheap: Haiku 5.5 | Mid: Sonnet 5.5 | Flagship: Opus 5.5 |
|---|---|---|---|
| **Low — A. Light chat** (20 turns) | $5/mo · **$16/sem** (₩2만) | $86/mo · **$299/sem** (₩40만) | $173/mo · **$599/sem** (₩80만) |
| **Medium-lean — B-lean. Chat + 10 searches, old results stripped** | $41/mo · **$142/sem** (₩19만) | $152/mo · **$528/sem** (₩70만) | $270/mo · **$936/sem** (₩124만) |
| **Medium — B. Chat + 10 searches, results kept** | $47/mo · **$164/sem** (₩22만) | $259/mo · **$896/sem** (₩119만) | $483/mo · **$1,672/sem** (₩222만) |
| **Blended course** (60% A / 25% B / 15% C sessions) | $18/mo · **$62/sem** (₩8만) | $173/mo · **$599/sem** (₩80만) | $337/mo · **$1,168/sem** (₩155만) |
| **High — C. Agentic coding every class** (2M in / 50k out) | $22/mo · **$76/sem** (₩10만) | $376/mo · **$1,301/sem** (₩173만) | $751/mo · **$2,602/sem** (₩346만) |
| **Stress — D. Heavy agentic** (6M in / 120k out) | $151/mo · **$523/sem** (₩70만) | $1,023/mo · **$3,542/sem** (₩471만) | $2,045/mo · **$7,085/sem** (₩942만) |

- **Scaling:** 30 students = ×0.75; 50 students = ×1.25. For example, C on Sonnet 5.5 is $976 / $1,301 / $1,626 for 30 / 40 / 50 students.
- **16 weeks** instead of 15 = ×1.067.
- **Per student per semester:**

  | Scenario | Haiku 5.5 | Sonnet 5.5 | Opus 5.5 |
  |---|---|---|---|
  | A. Light chat | $0.40 | $7.50 | $15 |
  | C. Agentic coding | $1.90 | $33 | $65 |

- Fable 5.1 for reference: A $1,462/sem (₩194만), C $5,952/sem (₩792만).

#### Cross-vendor semester totals (N = 40, USD; ₩ at 1,330)

| Model | A chat | B chat+search (kept) | C agentic med | D agentic heavy |
|---|---|---|---|---|
| Claude Haiku 5.5 | $16 | $164 | $76 | $523 |
| GPT-6 Luna [nv] | $16 | $164 | $76 | $210 |
| Gemini 3.1 Flash-Lite [nv] | $40 | $103 | $193 | $526 |
| DeepSeek V4 Flash [agg] (no built-in search fee) | $12 | $35 | $50 | $140 |
| Gemini 3.8 Flash, intro price to Dec 31, 2026 [nv] | $109 | $296 | $535 | $1,469 |
| Gemini 3.8 Flash, 2027 price [nv] | $218 | $592 | $1,069 | $2,938 |
| Claude Sonnet 5.5 | $299 | $896 | $1,301 | $3,542 |
| GPT-6 Sol [nv] | $314 | $1,005 | $1,522 | $4,205 |
| gpt-5.3-codex [nv] | $342 | $908 | $1,562 | $4,183 |
| Gemini 3.1 Pro [nv] | $324 | $826 | $1,546 | $4,205 |
| Claude Opus 5.5 | $599 (₩80만) | $1,672 (₩222만) | $2,602 (₩346만) | $7,085 (₩942만) |
| GPT-6 Astra [nv] | $1,568 (₩209만) | $4,546 (₩605만) | $7,608 (₩1,012만) | $21,024 (₩2,796만) |

[nv] = price not directly verified on the official page. [agg] = aggregator-only and conflicting.

Notes on the cross-vendor table:
- Gemini search fees are $0 because volume stays under the 5,000 free searches/month.
- The Gemini cache-read price of 0.1× is an assumption.
- Haiku 5.5 costs more than GPT-6 Luna in scenario D because of Haiku's >100k price card.

#### Reading the numbers
- **Output and uncached writes dominate chat costs; cache reads dominate agent volume.** Each lever's rough effect:

  | Lever | Effect |
  |---|---|
  | Keep the cache warm | 2–4× saving |
  | Strip old search results | B → B-lean saves 40% on Sonnet 5.5 |
  | Default to a cheap model | 15–20× saving vs mid tier |

- **The spend cap is an operational constraint.** On a new Anthropic org (Start tier, $500/month cap), scenarios C on Opus 5.5 ($751/mo) and D on Sonnet or Opus would hit the cap mid-month and stop the class. Plan to request the Build ($1,000) or Scale tier, or keep to Sonnet/Haiku.
- **A realistic planning figure** for a course that mixes chat, some search and occasional agent labs (the blended row): about **$600/semester (₩80만) on Sonnet 5.5**, about **$1,200 (₩155만) on Opus 5.5**, and about **$60 on Haiku 5.5**. Agent-heavy programming courses should budget **$1,300–2,600 (₩173–346만)**, with per-student caps.

### Gaps
- All token profiles are modeled, not measured, for students. A 1–2-week pilot with logging (`usage` fields or the Usage & Cost API) is needed to calibrate h, turns per session and searches per session.
- Korean VAT (10%) treatment of API invoices for a Korean individual or university buyer was not verified. Card FX fees are also not included.

---

## Q5. API vs flat-rate subscriptions (Claude Max, Claude Team, ChatGPT Pro)

### Takeaway
New since October 2026, **Claude Max 5x ($100) and Max 20x include $100 and $200 per month of Claude API credits**. Team plans include $20 per Standard seat and $100 per Premium seat, pooled and capped at $500. An instructor's "flat-rate" Max subscription can therefore prepay the website's API usage. That covers the light-chat scenario, but not search-heavy or agentic usage, which needs extra purchased credits. ChatGPT plans have no equivalent API credit that this research found.

### Cited Findings
- **Claude plans:**
  - Pro: $20/month monthly, or $17/month billed annually.
  - Max: "From $100/month" with 5x or 20x Pro usage.
  - Team: 2–150 seats. Standard seat $25 monthly / $20 annual; Premium seat $125 / $100 with 5× Standard usage. Claude Code is included.
  - Enterprise: $20/seat annual, 20-seat minimum, plus usage at API rates.
  - Education: custom institution-wide plan, price on request.
  - Source: [claude.com/pricing](https://claude.com/pricing).
- Subscription limits use a rolling five-hour window plus weekly limits. Activity "across Claude on web, desktop, mobile, and Claude Code all draws from the same pool" — [claude.com/pricing](https://claude.com/pricing).
- **API credits for Max and Team (official) — [API credits for Max and Team plans](https://platform.claude.com/docs/en/about-claude/api-credits-for-subscribers):**
  - **Amounts per month:** Max 5x $100, Max 20x $200, Team $20 per Standard seat and $100 per Premium seat, pooled and capped at $500.
  - **What they cover:** the Claude API, Managed Agents, the Agent SDK and the playground — **not Claude Code** and not extra usage in the Claude apps.
  - **Expiry and claiming:** credits **expire at the end of each billing cycle, with no rollover**. You claim them by linking one Console organization; new subscribers can claim after 7 days.
  - **Use:** credits are for "build[ing] and run[ning] your own applications and agents."
  - **Tier upgrade:** organizations with monthly credits over $200 move to at least the Build tier.
- The credit rollout began about **Oct 7, 2026** and is staged, so some accounts may not see it yet — [developersdigest](https://www.developersdigest.tech/blog/claude-max-team-monthly-api-credits-2026); [madrobot](https://madrobot.blog/2026/10/08/claude-max-team-free-api-credits-how-to-claim/).
- claude.com/pricing lists "New Monthly API credits†: $100/month for Max 5x and $200/month for Max 20x." It shows only "From $100" as the Max price, so the Max 20x price ($200) was not explicitly shown in this fetch — [claude.com/pricing](https://claude.com/pricing).
- Credits count toward the org's monthly spend cap. Every workspace in the linked org draws from one balance. When credits run out with no purchased balance, "API requests stop," and usage is never charged to the Claude plan — [API credits doc](https://platform.claude.com/docs/en/about-claude/api-credits-for-subscribers).
- **ChatGPT [not directly verified]:**
  - Plus is $20. Pro comes in **$100, $200 and $500** tiers; the $100 tier gives 5× Plus usage and $200 gives 20×. Codex is bundled into ChatGPT plans with a shared allowance — [toolcolumn](https://www.toolcolumn.com/learn/chatgpt-plus-vs-pro); [morphllm Codex pricing](https://www.morphllm.com/codex-pricing); [developersdigest Codex limits](https://www.developersdigest.tech/blog/codex-usage-limits-pricing-2026).
  - Pro $200 sign-ups were paused and then reopened around Sep 29, 2026 "with roughly half the old usage value" (single source) — [morphllm Codex pricing](https://www.morphllm.com/codex-pricing).
  - Since April 2026, Codex subscription usage is metered as token-based credits on a rolling five-hour window plus a weekly cap — [cloudzero Codex pricing](https://www.cloudzero.com/blog/openai-codex-pricing/).

### Inferences
- **Monthly API need vs Max 20x's $200 credit (40 students):**

  | Scenario | Haiku 5.5 | Sonnet 5.5 | Opus 5.5 |
  |---|---|---|---|
  | A. Light chat | $5 — covered | $86 — covered | $173 — covered |
  | B-lean. Chat + search, stripped | — | $152 — covered | $270 — $70 over |
  | C. Agentic coding | $22 — covered | $376 — $176 over | $751 — $551 over |

  Max 5x's $100 credit covers the Sonnet chat case.
- Put another way, $200/month buys about 800 Sonnet-5.5 chat sessions, 268 search-chat sessions or 185 agentic sessions per month. **The class needs about 346 sessions/month.**
- **Semester view (about 4 billing months):**
  - Max 20x costs about $800 and yields $800 of API credit, plus the instructor's own Max usage.
  - The best-fit pairing is **Max 20x plus a Sonnet-5.5 or Haiku-5.5 default model**. Anything above $200/month is bought as normal API credit.
  - Credits expire monthly, so under-use is lost.
- **Per-student seats instead of an instructor-run website:** 40 Team Standard seats at $25 × 4 months is **$4,000/semester**. Each student gets Claude and Claude Code in the app, and the org gets a $500/month pooled API credit (40 × $20 = $800, capped at $500). For most scenarios this is more expensive than API usage through the website, except the heavy-agentic stress case on Opus.
- **A single consumer subscription can't serve 40 people directly.** Plan limits are per user and tied to Claude apps and Claude Code. The API-credit route is the documented way for a subscription to power a website. Whether serving students through the site is fine under the credit "program terms" needs checking (see Gaps).

### Gaps
- The program terms at anthropic.com/legal/credit-terms (linked from the credits doc) were not read. It is unconfirmed whether credits may power an app used by third parties such as students; the doc says "your own applications and agents."
- The Max 20x monthly price was not shown verbatim on claude.com/pricing in this fetch; $200 is the commonly cited figure and the price the user stated.
- No evidence was found that ChatGPT Plus or Pro includes OpenAI API credits.
- Subscription terms on account sharing are covered by a separate research note, not here.

---

## Q6. Cost-control mechanisms (spend limits, workspaces/projects, rate limits, quotas, routing)

### Takeaway
Hard caps are available at both vendors:
- **Anthropic:** an org monthly spend limit (Billing page), **per-workspace monthly spend limits with alerts**, per-workspace rate limits, and tier spend caps. The Claude Code workspace adds per-user monthly limits.
- **OpenAI:** project-level monthly budgets with an optional **hard limit that returns 429**.
- **Inside the app:** add per-student quotas, cheap-model-by-default routing, search caps and history trimming.

### Cited Findings
- **Anthropic org limits:**
  - Tier spend caps are Start $500, Build $1,000 and Scale $200,000 per month.
  - You can set your own lower org spend limit on the Billing page. Hitting it returns HTTP 400 "You have reached your specified API usage limits."
  - Hitting the tier cap returns 429 `enforced_spend_limit_reached`, with no retry-after, until 00:00 UTC on the 1st.
  - Source: [Claude rate limits](https://platform.claude.com/docs/en/api/rate-limits).
- **Workspaces:**
  - Up to 100 per org. API keys can be scoped to a single workspace.
  - **Spend limits:** "cap monthly spending and configure alerts when spending reaches certain thresholds." These can't be set on the Default Workspace and can't exceed org limits.
  - **Rate limits:** per-workspace RPM / ITPM / OTPM limits per model.
  - **Claude Code workspace:** "the only workspace that supports per-user monthly spend limits."
  - Source: [Workspaces](https://platform.claude.com/docs/en/manage-claude/workspaces).
- **Rate limits (Start tier):** Opus 5.5, Sonnet 5.5 and Haiku 5.5 each allow 1,000 RPM, 2,000,000 ITPM and 400,000 OTPM. "Only uncached input tokens count toward your ITPM" for most models — [Claude rate limits](https://platform.claude.com/docs/en/api/rate-limits).
- **Claude Code team rate-limit guidance:** for 20–50 users, 50k–75k TPM per user and 1.25–1.75 RPM per user. "If you anticipate … live training sessions with large groups, you may need higher TPM allocations per user" — [Claude Code costs](https://code.claude.com/docs/en/costs).
- **Claude Code cost tools:** per-user reporting via the Console dashboard and the Claude Code Analytics API; the `--max-budget-usd` CLI flag; OpenTelemetry export. With a self-hosted Claude apps gateway, per-user spend limits are also possible on Bedrock, Google Cloud and Foundry. Advice: "use Sonnet for teammates," clear context between tasks, and lower effort for simple tasks — [Claude Code costs](https://code.claude.com/docs/en/costs).
- **Usage tracking:** the Usage and Cost API reports by workspace — [Workspaces](https://platform.claude.com/docs/en/manage-claude/workspaces).
- **OpenAI:** "set monthly budgets for your organization or for individual projects"; with "Enforce a hard limit," requests return 429 until you raise the limit or it resets. Alerts alone don't cap spend — [OpenAI spend limits](https://developers.openai.com/api/docs/guides/spend-limits).
  - Third-party guides date hard project limits to Jul 22, 2026 and note enforcement can slightly overshoot — [digitalapplied (Oct 3, 2026)](https://www.digitalapplied.com/blog/ai-spend-controls-compared-usage-caps-2026); [DEV runbook](https://dev.to/ahab_indieseek/openai-api-hard-spend-limits-429-runbook-and-budget-setup-b83).
  - Older forum posts report hard caps missing or exceeded — [OpenAI community](https://community.openai.com/t/per-project-and-per-organization-spending-limits-buttons-missing/1380321).
- **Server-tool knobs (Claude):** `max_uses` for web search; `max_content_tokens` for web fetch — [Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing).

### Inferences
- **Recommended setup:**
  1. Create a dedicated workspace, e.g. "Class 2027-1," with its own API key, a monthly spend limit at budget plus 10%, and alerts at 50% and 80%.
  2. Set an org spend limit as a backstop.
  3. In the app, give each student a daily or weekly token/dollar quota by logging `usage` per request.
  4. Default to Haiku 5.5 or Sonnet 5.5 and allow Opus by instructor toggle.
  5. Cap web searches per turn (`max_uses` = 2) and strip old search results.
  6. Use prompt caching on a fixed system prompt.
  7. Set a per-session task budget or max turns for agent mode.
- **Plan for class-wide bursts.** 40 students hitting Enter at once is a burst. Start-tier ITPM is fine with caching, because cached reads don't count, but staggering lab starts or requesting the Build tier reduces 429s.

### Gaps
- No programmatic OpenAI admin API for setting project budgets was confirmed.
- The latency of Anthropic workspace spend-limit enforcement (how much overshoot is possible) was not documented.

---

## Q7. Free or discounted API credit programs for educators and researchers

### Takeaway
No general "educator API credit" program was found at Anthropic, OpenAI or Google. The relevant paths are:
- Anthropic's research programs (External Researcher Access, AI for Science) and the new Max/Team-bundled credits.
- OpenAI's Researcher Access Program (up to $1,000).
- Gemini's no-card free tier for Flash and Flash-Lite. Pro has no API free tier, and grounding requires the paid tier.

### Cited Findings
- **Anthropic External Researcher Access Program:** free API credits for researchers on AI safety and alignment topics (API only, not the web app; Mar 16, 2026 update) — [Claude support](https://support.claude.com/en/articles/9125743-what-is-the-external-researcher-access-program).
- **Anthropic AI for Science Program:** free API credits for scientific research, with a focus on biology and life sciences, by application — [Claude support](https://support.claude.com/en/articles/11199177-anthropic-s-ai-for-science-program); [Anthropic news](https://www.anthropic.com/news/ai-for-science-program).
- **Anthropic pricing page:** "Academic and research discounts might be available," negotiated case by case. New users get "a small amount of free credits" — [Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing).
- **Bundled credits:** Max 5x / Max 20x / Team plans include $100 / $200 / up to $500 per month in API credits, and discounted Team plans (Nonprofit, Scientists) get the same per-seat credits — [API credits for Max and Team](https://platform.claude.com/docs/en/about-claude/api-credits-for-subscribers).
- **Claude for Education:** a custom institution-wide plan, price on request — [claude.com/pricing](https://claude.com/pricing).
- **OpenAI Researcher Access Program:** up to $1,000 in API credits, reviewed quarterly. One source says new API accounts get no free credit and must prepay at least $5 — [klymentiev](https://klymentiev.com/blog/openai-free-credits); [grabaicredits](https://grabaicredits.com/en/guides/how-to-get-free-ai-credits).
- **Gemini API free tier:**
  - Flash and Flash-Lite models (e.g. 3.1 Flash-Lite, 3.5 Flash-Lite, Gemini 3 Flash preview) have a free tier — [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing).
  - gemini-3.1-pro-preview has "no free tier … in the Gemini API" — [Gemini 3 guide](https://ai.google.dev/gemini-api/docs/gemini-3).
  - Search grounding is "Not available" in the free tier for Gemini 3.8 Flash — [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing).
  - An aggregator says Pro models lost free-tier API access Apr 1, 2026 — [morphllm Gemini pricing](https://www.morphllm.com/gemini-api-pricing).
- **Nonprofit and research options** (e.g. Google for Nonprofits Cloud/AI credits) are listed by an aggregator — [impactopen](https://www.impactopen.org/compute-credits).

### Inferences
- **For a Korean university instructor, the most practical options are:**
  1. Max 20x API credits, about $200/month.
  2. Asking Anthropic sales about an academic discount or Claude for Education through the university.
  3. A Gemini Flash-Lite free-tier fallback for low-stakes practice. Free-tier quotas are per project and rate-limited, so it is unlikely to sustain 40 simultaneous users.
- Research programs fit only if the course is tied to qualifying research.

### Gaps
- Current Gemini free-tier RPM/RPD numbers per model, and whether free-tier prompts may be used to improve Google products, could not be fetched from ai.google.dev. This matters for student privacy.
- No Google for Education Gemini API credit program was found.
- No Korea-specific (e.g. NIPA / government) AI-credit programs were researched.

---

## Q8. Exchange rate: USD/KRW for converting totals

### Takeaway
Use **₩1,330 per $1**, based on Investing.com's Oct 21, 2026 close of ₩1,325.02. The rate was about ₩1,460–1,480 in late July 2026, so a ₩1,450 sensitivity raises all KRW figures by about 9%.

### Cited Findings
- **Investing.com:** USD/KRW closed **1,325.02 on Oct 21, 2026**, 1,326.30 on Oct 20 and 1,332.36 on Oct 19 — [Investing.com USD/KRW history](https://kr.investing.com/currencies/usd-krw-historical-data).
- **Trading Economics:** 1,335.15 on Oct 18, 2026 — [Trading Economics KRW](https://ko.tradingeconomics.com/south-korea/currency).
- **Namuwiki:** intraday low of ₩1,325.5 on Oct 20, 2026 — [나무위키 원화 환율](https://namu.wiki/w/%EB%8C%80%ED%95%9C%EB%AF%BC%EA%B5%AD%20%EC%9B%90/%ED%99%98%EC%9C%A8).
- **Earlier reference:** about ₩1,478.44 on Jul 22, 2026 — [TradersUnion](https://tradersunion.com/currencies/price/usd-krw/); and ₩1,459.92 on Jul 27, 2026 — [goldpricez](https://goldpricez.com/currency-rates/south-korea).

### Inferences
- **Key totals at ₩1,330 (and at ₩1,450):**

  | Scenario | USD | ₩1,330 | ₩1,450 |
  |---|---|---|---|
  | A. Light chat on Sonnet 5.5, semester | $299 | ₩39.8만 | ₩43.4만 |
  | Blended course on Sonnet 5.5, semester | $599 | ₩79.6만 | ₩86.8만 |
  | C. Agentic coding on Sonnet 5.5, semester | $1,301 | ₩173만 | ₩189만 |
  | C. Agentic coding on Opus 5.5, semester | $2,602 | ₩346만 | ₩377만 |
  | Max 20x subscription, per month | $200 | ₩26.6만 | ₩29.0만 |

- Card or bank FX spreads and any VAT will add to these.

### Gaps
- The Oct 24, 2026 close and the official Bank of Korea (ECOS) rate were not retrieved.
- Whether Anthropic or OpenAI charge 10% Korean VAT on API usage for Korean customers was not verified.
