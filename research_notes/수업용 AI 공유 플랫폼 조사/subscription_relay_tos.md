# Relaying a single personal AI subscription (Claude Pro/Max, ChatGPT Plus/Pro, Claude Code, Codex) to 30–50 students via a class website — technical mechanisms and ToS/policy status (as of 2026-10-24)

Research date: 2026-10-24. Method note: Anthropic pages (anthropic.com, code.claude.com, support.claude.com, platform.claude.com) were fetched directly, and the key Consumer Terms and Usage Policy clauses were checked against the raw page HTML. OpenAI domains (openai.com, help.openai.com, developers.openai.com, learn.chatgpt.com), theregister.com, thenewstack.io and news.ycombinator.com could **not** be fetched from this environment because egress was blocked. OpenAI wording below therefore comes from search-index snippets of those official pages and is marked "(search snippet)". It should be re-checked in a browser before anyone quotes it as verbatim.

Quick classification used below:
- **PROHIBITED**: an explicit clause forbids it.
- **GREY**: no clause names it directly, or the official statements conflict.
- **ALLOWED**: an official document permits it.

---

## Q1. Anthropic: what the Consumer Terms, Usage Policy and Claude Code "Legal and compliance" page say about account sharing, OAuth tokens in third-party products or services for other users, and automated access

### Takeaway
Three Anthropic documents, each binding on its own, prohibit the "one Max account → many students" relay outright:
- **Consumer Terms (effective Oct 8, 2025):** "You also may not make your Account available to anyone else."
- **Claude Code Legal & compliance page:** Anthropic does not permit developers "to route requests through Free, Pro, or Max plan credentials on behalf of their users."
- **Usage Policy (version effective Nov 12, 2026):** bans services "that route requests through consumer subscriptions."

The officially allowed route for many users is an **API key**. Since Oct 2026 the API usage can be paid from the monthly API credits included with Max ($100 or $200 per month).

### Cited Findings
**Consumer Terms of Service** (governs Free/Pro/Max, including Claude Code used on those plans). The page shows "Effective Oct 8, 2025", with a "See version history" link. — [Anthropic Consumer Terms](https://www.anthropic.com/legal/consumer-terms)
- PROHIBITED (account sharing), §2: "You may not share your Account login information, Anthropic API key, or Account credentials with anyone else. You also may not make your Account available to anyone else. You are responsible for all activity occurring under your Account…" — [Consumer Terms](https://www.anthropic.com/legal/consumer-terms)
- PROHIBITED unless explicitly permitted (automation), §3: "Except when you are accessing our Services via an Anthropic API Key or where we otherwise explicitly permit it, to access the Services through automated or non-human means, whether through a bot, script, or otherwise." — [Consumer Terms](https://www.anthropic.com/legal/consumer-terms)
- PROHIBITED (resale), §3: "To develop any products or services that compete with our Services … or resell the Services." — [Consumer Terms](https://www.anthropic.com/legal/consumer-terms)
- Sanction, §12: "We may suspend or terminate your access to the Services (including any Subscriptions) at any time without notice to you if we believe that you have breached these Terms… If we terminate your access to the Services due to a violation of these Terms and you have a Subscription, you will not be entitled to any refund." — [Consumer Terms](https://www.anthropic.com/legal/consumer-terms)
- The Register reported that the underlying prohibition on this kind of use had been in the Consumer Terms "since at least February 2024". This comes from a search summary of the article, because the page itself was blocked. — [The Register, 2026-04-06](https://www.theregister.com/2026/04/06/anthropic_closes_door_on_subscription/)

**Usage Policy (AUP).** The live page reads "Effective Nov 12, 2026". This is a version published in advance that takes effect about 3 weeks after this research date. — [Anthropic Usage Policy](https://www.anthropic.com/legal/aup)
- PROHIBITED, under "Do Not Abuse Our Platform": "Resell, proxy, or otherwise provide access to Claude through unauthorized means, including services that route requests through consumer subscriptions or misrepresent the product or client being used." — [Anthropic AUP](https://www.anthropic.com/legal/aup)
- Also: "Intentionally bypass or interfere with capabilities, restrictions, or guardrails established within our products, including by circumvention of the account sign-up or log-in process…" and "Circumvent a ban through the use of a different account, such as … providing access to a person or entity that was previously banned." — [Anthropic AUP](https://www.anthropic.com/legal/aup)
- Requirement on consumer-facing deployments, relevant even on the API route: consumer-facing chatbots and agents "must disclose to users that they are interacting with AI rather than a human", "at a minimum at the beginning of each chat session or in the product interface". Minors are defined as under 18 and have extra guidelines. — [Anthropic AUP](https://www.anthropic.com/legal/aup)

**Claude Code "Legal and compliance" page.** The page shows no date. Secondary sources date the "Authentication and credential use" section to around Feb 19–20, 2026. — [Claude Code docs: Legal and compliance](https://code.claude.com/docs/en/legal-and-compliance); dating per [The Register, 2026-02-20](https://www.theregister.com/software/2026/02/20/anthropic-clarifies-ban-on-third-party-tool-access-to-claude/5014546) and [zbuild.io](https://www.zbuild.io/resources/news/opencode-blocked-anthropic-2026)
- License split: Free/Pro/Max use of Claude Code is governed by the Consumer Terms. Team, Enterprise and API use is governed by the Commercial Terms. — [Legal and compliance](https://code.claude.com/docs/en/legal-and-compliance)
- "Advertised usage limits for Pro and Max plans assume ordinary, individual usage of Claude Code and the Agent SDK." — [Legal and compliance](https://code.claude.com/docs/en/legal-and-compliance)
- "OAuth authentication is intended exclusively for purchasers of Claude Free, Pro, Max, Team, and Enterprise subscription plans and is designed to support ordinary use of Claude Code and other native Anthropic applications." — [Legal and compliance](https://code.claude.com/docs/en/legal-and-compliance)
- PROHIBITED: "Developers building products or services that interact with Claude's capabilities, including those using the Agent SDK, should use API key authentication through Claude Console or a supported cloud provider. Anthropic does not permit third-party developers to offer Claude.ai login into their own applications, or to route requests through Free, Pro, or Max plan credentials on behalf of their users. Moreover, developers may not collect, store, or intermediate Claude.ai credentials or session tokens — sign-in to a Claude account must complete through Anthropic's own flow." — [Legal and compliance](https://code.claude.com/docs/en/legal-and-compliance)
- ALLOWED (API keys for your own users): "This does not restrict how customers provision and manage their own API keys … for use by the customer's own authorized users — provided the resulting usage is billed to the key owner under their agreement with Anthropic … and is not resold or intermediated… Nor does it prevent an end user from signing in to the unmodified Claude Code binary with their own Claude subscription, including where a platform hosts Claude Code…" — [Legal and compliance](https://code.claude.com/docs/en/legal-and-compliance)
- Hosting Claude Code for others ("hosted sandboxes or other agent infrastructure") requires agreeing to the Commercial Terms, and "Customers may not pay for, resell, or intermediate Claude usage on their end users' behalf. Each end user must authenticate with their own Anthropic API key, Claude subscription plan credentials, or 3P inference provider credential." — [Legal and compliance](https://code.claude.com/docs/en/legal-and-compliance)
- Enforcement: "Anthropic reserves the right to take measures to enforce these restrictions and may do so without prior notice." — [Legal and compliance](https://code.claude.com/docs/en/legal-and-compliance)

**Technical mechanism: the Claude Code Authentication docs**
- `claude setup-token` generates "a one-year OAuth token" for "CI pipelines, scripts, or other environments where interactive browser login isn't available". You put it in `CLAUDE_CODE_OAUTH_TOKEN`. "This token authenticates with your Claude subscription and requires a Pro, Max, Team, or Enterprise plan. It can only make model requests…" — [Claude Code docs: Authentication](https://code.claude.com/docs/en/authentication)
- Precedence: `ANTHROPIC_API_KEY` outranks `CLAUDE_CODE_OAUTH_TOKEN` and the `/login` subscription OAuth. In non-interactive mode (`-p`), "the key is always used when present". Linux credentials are stored in `~/.claude/.credentials.json` (mode 0600). `--bare` mode does not read `CLAUDE_CODE_OAUTH_TOKEN`. — [Authentication](https://code.claude.com/docs/en/authentication)

### Inferences
- Running `claude setup-token` or `claude -p` on one's own server is a documented and permitted mechanism for the subscriber's own scripts and CI. The documentation describes the mechanism; it does not authorize other people's use. Once 30–50 other people's prompts flow through it, the setup hits all three clauses: "make your Account available to anyone else" (Consumer Terms), "route requests through … plan credentials on behalf of their users" (Claude Code legal page), and "services that route requests through consumer subscriptions" (AUP, effective Nov 12, 2026).
- The wording targets the act of intermediating, not only "third-party harnesses". An instructor's wrapper around the official, unmodified `claude` binary therefore does not escape the clauses just because it uses the first-party binary.

### Gaps
- The Legal & compliance page has no visible "last updated" date. The Feb 19–20, 2026 dating comes from secondary press. Whether later 2026 edits occurred could not be verified.
- The Nov 12, 2026 AUP links to a version history. I could not confirm whether the "route requests through consumer subscriptions" phrase is new in that version or was present earlier.

---

## Q2. Anthropic enforcement history (Jan–Oct 2026) and current status

### Takeaway
Anthropic moved through three phases:
1. **Jan 2026:** technical blocking of spoofed Claude Code clients, with some erroneous automated bans that were later lifted.
2. **Feb 2026:** a formal written policy.
3. **April 4, 2026:** billing enforcement, where third-party harness usage stopped drawing on subscription limits.

After a May announcement and a June pause of an "Agent SDK credit" plan, the official help page as of Oct 2026 says the subscriber's **own** use of the Agent SDK, `claude -p` and third-party apps still draws from subscription limits. Routing requests for other users remains prohibited throughout.

### Cited Findings
- **Jan 9, 2026, technical block:** Anthropic engineer Thariq Shihipar posted: "Yesterday we tightened our safeguards against spoofing the Claude Code harness after accounts were banned for triggering abuse filters from third-party harnesses using Claude subscriptions." — [Thariq on X](https://x.com/trq212/status/2009689809875591565)
- In the same thread he said Anthropic had lifted "all bans we're aware of that were caused by this issue", asked unreinstated users to DM their email, and added "we'll make it clearer in the OAuth screen going forward". — [Thariq on X](https://x.com/trq212/status/2009689809875591565), per search summary; corroborated by [VentureBeat](https://venturebeat.com/technology/anthropic-cracks-down-on-unauthorized-claude-usage-by-third-party-harnesses) ("currently reversing" the erroneous bans; blocking of the integrations themselves "appears to be intentional")
- Tools affected in Jan 2026 included OpenCode, Cline and RooCode. — [zbuild.io](https://www.zbuild.io/resources/news/opencode-blocked-anthropic-2026); [HN thread "Anthropic blocks third-party use of Claude Code subscriptions"](https://news.ycombinator.com/item?id=46549823)
- A Threads summary of Anthropic's stated rationale: third-party harnesses "create unusual traffic without telemetry, complicating support for rate limits or bans"; the use is "prohibited under Terms of Service"; and the API is recommended for custom tools. — [Threads summary](https://www.threads.com/@koltregaskes/post/DTT2gbdASGV/anthropic-has-lifted-bans-on-accounts-affected-by-third-party-harnesses) (secondary)
- DHH, a prominent critic, wrote: "Confirmation that Anthropic is intentionally blocking OpenCode, and any other 3P harness…" — [DHH on X](https://x.com/dhh/status/2009716350374293963)
- **Feb 19–20, 2026, written policy:** The Register reported that Anthropic revised its legal terms to make clear that OAuth for Free/Pro/Max "is only intended for Claude Code and Claude.ai", and that Anthropic framed this as formalizing longstanding policy. — [The Register, 2026-02-20](https://www.theregister.com/software/2026/02/20/anthropic-clarifies-ban-on-third-party-tool-access-to-claude/5014546) (search summary)
- Follow-up clarification: an Anthropic spokesperson told The New Stack that the docs cleanup had caused confusion and that "nothing is changing about how you can use the Agent SDK and MAX subscriptions". The spokesperson also said account holders would not have accounts cancelled for using tools like OpenClaw, and "if you're building a business on top of the Agent SDK, you should use an API key instead." — [The New Stack](https://thenewstack.io/anthropic-agent-sdk-confusion/) (search summary)
- **April 4, 2026, billing enforcement:** Boris Cherny, head of Claude Code, announced the change the day before. From April 4 at 12pm PT, subscriptions no longer cover third-party harnesses such as OpenClaw; Claude.ai, Claude Code and Cowork remain covered. Third-party use moved to "extra usage" or an API key. Anthropic offered a one-time credit equal to one month of the plan price and extra-usage bundles at 30% off. A spokesperson's quote: subscriptions are not permitted for third-party tools under the ToS, and "these tools put an outsized strain on our systems." — [The Register, 2026-04-06](https://www.theregister.com/2026/04/06/anthropic_closes_door_on_subscription/); [TechRadar](https://www.techradar.com/pro/bad-news-claude-users-anthropic-says-youll-need-to-pay-to-use-openclaw-now); [The Next Web](https://thenextweb.com/news/anthropic-openclaw-claude-subscription-ban-cost)
- **May 13, 2026, announcement:** Anthropic announced (via @ClaudeDevs) a separate monthly "Agent SDK" credit for paid plans, usable for programmatic and third-party agent access including OpenClaw, starting June 15. The amounts were Pro $20, Max 5x $100 and Max 20x $200, metered at API rates. — [Annielytics timeline](https://www.annielytics.com/tools/ai-timeline/company/openclaw/); [VentureBeat](https://venturebeat.com/technology/anthropic-reinstates-openclaw-and-third-party-agent-usage-on-claude-subscriptions-with-a-catch); [TechTimes, 2026-06-02](https://www.techtimes.com/articles/317625/20260602/anthropic-ends-subscription-subsidy-agents-june-15-credit-pool-replaces-flat-rate-access.htm); [GitHub gist analysis](https://gist.github.com/MagnaCapax/d9177e35b355853f03c730dfcaa693ef)
- **June 15, 2026, pause:** The official help page says: "We've paused the previously-announced changes to Claude Agent SDK usage." Agent SDK, `claude -p` and third-party app usage still count against subscription limits. — [Claude Help Center: Use the Claude Agent SDK with your Claude plan](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan); [Digital Applied](https://www.digitalapplied.com/blog/anthropic-claude-credit-overhaul-june-15-2026)
- **Oct 7, 2026, current state:** The same help page notes that "Claude Max and Team plans now include monthly API credits" and says "You can still use the Claude Agent SDK, `claude -p`, and third-party apps with your subscription limits." The page says nothing about personal use or other users; searches for "personal", "on behalf" and "other users" found no matches. — [Claude Help Center 15036540](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- OpenClaw's own Anthropic provider docs, current as of fetch: "Claude Code owns its login and refresh lifecycle; do not copy an OAuth token into OpenClaw". They recommend an Anthropic API key for new setups and say the announced Agent SDK credit "is not available while Anthropic revises that plan". — [OpenClaw docs](https://docs.openclaw.ai/providers/anthropic) (search summary)

### Inferences
- Current status (Oct 2026), split by who uses it:
  - **The subscriber personally** using `claude -p`, the Agent SDK or a third-party app against their own subscription limits: ALLOWED or tolerated, per help article 15036540.
  - **Sharing one subscription with other users:** PROHIBITED, with no change at any point in 2026.
- The April 4 "third-party harnesses not covered" statement and the Oct help page ("third-party apps with your subscription limits") appear to conflict. This is a GREY zone for *personal* third-party harness use only. It does not affect the multi-user question.
- Enforcement has been both technical and billing-based: client-fingerprint checks, abuse filters that issued automated bans, and later billing reclassification. Anthropic says it may act "without prior notice", and the Consumer Terms deny refunds on termination for breach. A semester-long relay serving 30–50 people from one account would produce traffic far from "ordinary, individual usage". The Jan 2026 episode shows that abuse filters can ban accounts automatically.
- No court or regulatory challenge has changed these terms.

### Gaps
- No primary source gives the number of accounts banned in Jan 2026, and none was found for any ban specifically for sharing an account with students or teams.
- The VentureBeat and The Register articles could not be fetched directly. Quotes from them come from search summaries.
- Whether the "third-party apps" language on the Oct 2026 help page silently reverses the April 4 billing change is unclear. No Anthropic statement reconciling the two was found.

---

## Q3. Does headless Claude Code (`claude -p`) on the instructor's server, logged in with Max and exposed to students through a web UI, violate the terms? Is there any officially sanctioned way?

### Takeaway
Yes, it violates the terms (PROHIBITED). The mechanism itself is fine for the subscriber's own automation; exposing it to students is the violation. Sanctioned alternatives:
- **(a) API key:** an Anthropic API key used by the instructor's own backend for "the customer's own authorized users". It can be funded by the monthly API credits included with Max 5x ($100) or Max 20x ($200), claimed through a linked Console org; the Agent SDK is covered, Claude Code is not.
- **(b) Each student's own credentials:** every student signs in with their own Claude credentials.
- **(c) Seats:** Team or Enterprise seats, one per student.

### Cited Findings
- Developers "building products or services … including those using the Agent SDK, should use API key authentication… Anthropic does not permit … [routing] requests through Free, Pro, or Max plan credentials on behalf of their users." — [Legal and compliance](https://code.claude.com/docs/en/legal-and-compliance)
- "You also may not make your Account available to anyone else." — [Consumer Terms](https://www.anthropic.com/legal/consumer-terms)
- AUP (effective Nov 12, 2026) prohibits "services that route requests through consumer subscriptions". — [Anthropic AUP](https://www.anthropic.com/legal/aup)
- ALLOWED, API key: configuring an API key "for use by the customer's own authorized users" is permitted if the usage "is billed to the key owner … and is not resold or intermediated". — [Legal and compliance](https://code.claude.com/docs/en/legal-and-compliance)
- ALLOWED, credits included with Max. These are an official "flat-rate-funded" API path:
  - Max 5x gets $100 per month and Max 20x gets $200 per month. Team gets $20 per Standard seat and $100 per Premium seat, pooled and capped at $500.
  - You claim them by linking a Claude Console org and accepting the [program terms](https://www.anthropic.com/legal/credit-terms). The docs say "you can use them to build and run your own applications and agents."
  - Covered: Claude API, Managed Agents, Agent SDK and playground. Not covered: Claude Code or extra usage in the apps.
  - Credits expire each cycle with no rollover. When they run out, API requests stop unless purchased credits or auto-reload exist: "Usage is never charged to your Claude plan." New subscribers wait 7 days. Free, Pro and Enterprise are not eligible. A linked org moves to at least the Start tier, or the Build tier if credits exceed $200.
  — [Claude Docs: API credits for Max and Team plans](https://platform.claude.com/docs/en/about-claude/api-credits-for-subscribers); [Help Center 17154008](https://support.claude.com/en/articles/17154008-api-credits-for-max-and-team-plans)
- The credits are separate from chat and Claude Code limits: "Credits don't change your usage limits in Claude or Claude Code." — [API credits docs](https://platform.claude.com/docs/en/about-claude/api-credits-for-subscribers)
- ALLOWED but impractical, per-student login: "an end user signing in to the unmodified Claude Code binary with their own Claude subscription, including where a platform hosts Claude Code". This requires the host to accept the Commercial Terms, and "Each end user must authenticate with their own" credentials. — [Legal and compliance](https://code.claude.com/docs/en/legal-and-compliance)
- Anthropic's spokesperson (Feb 2026): "if you're building a business on top of the Agent SDK, you should use an API key instead." — [The New Stack](https://thenewstack.io/anthropic-agent-sdk-confusion/) (search summary)

### Inferences
- The most practical compliant design for the instructor:
  1. Keep the Max plan for personal use.
  2. Link a Console org and use the included $100 or $200 per month in API credits.
  3. Have the class website call the Messages API, or the Agent SDK with an API key, from a backend under the instructor's control.
  4. Log all prompts and outputs server-side. That is the instructor's own data handling; Anthropic's terms do not stop it, though Korean privacy law and university rules on student data apply and are outside this note's scope.
  5. Give each class a separate Console workspace with a spend limit. The docs recommend workspace spend limits for capping per-project spending.
- Under the API key route the governing terms change from Consumer to Commercial. The AUP's AI-disclosure rule for consumer-facing chatbots then applies to the site.
- Whether $100–$200 per month covers 30–50 students depends on the model and the number of prompts. Use a Haiku or Sonnet-class model and prompt caching, and check [pricing](https://platform.claude.com/docs/en/about-claude/pricing). Cost modelling is outside this note.

### Gaps
- I did not read the [credit program terms](https://www.anthropic.com/legal/credit-terms) themselves. They might restrict commercial or multi-user use of the included credits, though the docs' "build and run your own applications" suggests not.
- No Anthropic statement addresses educational relays specifically.

---

## Q4. OpenAI: Terms of Use and ChatGPT plan terms on account sharing; Codex CLI "Sign in with ChatGPT"; ChatGPT auth in third-party tools such as OpenCode; Codex SDK and `codex exec` headless use; serving multiple end users from one account

### Takeaway
OpenAI is far more open than Anthropic to *personal* use of a ChatGPT plan outside ChatGPT:
- Codex `exec` and CI use with ChatGPT login is documented.
- Since DevDay (Sep 29, 2026), "Sign in with ChatGPT" lets Plus and Pro users spend their own plan allowance in 16 partner tools, including OpenCode and OpenClaw.

OpenAI is equally firm that **one person's plan cannot serve other people's requests**:
- The Terms of Use ban making an account available to anyone else.
- The account-sharing policy says one account is for one person.
- The SIWC terms forbid using "one user's subscription for another user's requests" and pooling or sharing plan usage.

### Cited Findings
**Account sharing** (openai.com pages could not be fetched; wording from search snippets)
- PROHIBITED: OpenAI consumer Terms of Use, "Registration and access": users may not share account credentials or make their account available to anyone else, and are responsible for all activity under the account. Commonly published wording: "You may not share your account credentials or make your account available to anyone else and are responsible for all activities that occur under your account." The EU terms contain the same restriction. — [OpenAI Terms of Use (RoW)](https://openai.com/policies/row-terms-of-use/); [EU terms](https://openai.com/policies/dec-2024-eu-terms/) (search snippet; the effective date of the current version was not verified)
- PROHIBITED: the OpenAI Account Sharing Policy says an account is intended for the individual who created it and anyone else should register separately. Using one's own account on multiple devices is fine, subject to usage limits. — [OpenAI Help: Account Sharing Policy](https://help.openai.com/en/articles/10471989-openai-account-sharing-policy) (search snippet)
- The Business/API Services Agreement bars giving credentials to third parties, letting multiple users share individual logins, and reselling or leasing account access. The Teacher/education terms repeat the credential-sharing ban and say school-administrator oversight does not permit password sharing. — [OpenAI Services Agreement](https://openai.com/policies/services-agreement/); [Teacher access terms](https://openai.com/policies/education-terms/) (search snippets)

**Sign in with ChatGPT (SIWC) and third-party tools**
- **Sep 29, 2026, DevDay:** Plus and Pro subscribers can spend their existing plan allowance in participating third-party developer tools, expanding a SIWC beta from July 2026 that had covered identity only. There are 16 launch partners, including OpenCode, OpenClaw, Pi, T3, Amp Code, Devin, Kilo Code, Warp, Vercel and Notion. Users set a per-app weekly cap in ChatGPT settings (reported as 10–100% of weekly plan usage). Usage draws from the same ChatGPT/Codex allowance. — [The New Stack](https://thenewstack.io/sign-in-with-chatgpt/); [eesel.ai](https://www.eesel.ai/blog/sign-in-with-chatgpt); [OpenAI Help: Using your ChatGPT plan in other apps and sites](https://help.openai.com/en/articles/20001542-using-your-chatgpt-plan-in-other-apps-and-sites) (search snippets)
- PROHIBITED for multi-user, from the SIWC Terms (search snippet):
  - Requests "must originate from the user's local runtime or a remote runtime only that user controls", and one user's activity cannot trigger requests against another user's account.
  - The plan may be used "only for the application they connected, not for general-purpose API access".
  - "Creating multiple accounts, splitting usage, rotating accounts, or bypassing usage limits is not allowed, nor is pooling or sharing plan usage or tokens."
  - Users must be able to use their plan "without paying the developer or upgrading".
  — [Sign in with ChatGPT Terms](https://openai.com/policies/sign-in-with-chatgpt-terms/)
- Availability: at launch, plan usage via SIWC is open to open-source projects, personal projects that run locally, and selected private apps. Paid or remotely hosted apps must join a waitlist, and commercial apps get a limited trial. — [OpenAI SIWC developer docs](https://developers.openai.com/siwc); [SIWC quickstart](https://developers.openai.com/siwc/quickstart); [Cookbook: SIWC in open-source apps](https://developers.openai.com/cookbook/articles/sign-in-with-chatgpt) (search snippets)
- Before DevDay, community plugins already let OpenCode use ChatGPT Plus/Pro OAuth. They mimic the Codex CLI's flow and describe themselves as "for personal development use". Some add "multi-account rotation", which SIWC terms now prohibit. — [opencode-openai-codex-auth](https://numman-ali.github.io/opencode-openai-codex-auth/); [ndycode/oc-codex-multi-auth](https://github.com/ndycode/oc-codex-multi-auth); [Manifest blog](https://manifest.build/blog/chatgpt-plus-tokens-third-party-harnesses/)

**Codex CLI, `codex exec` and the SDK with a ChatGPT login**
- Codex supports two sign-in methods for OpenAI models: a ChatGPT subscription or an API key. With an API key, Codex uses standard API pricing instead of plan credits. — [Codex docs: Authentication](https://learn.chatgpt.com/docs/auth) (search snippet)
- ALLOWED for one's own automation, from the "Maintain Codex account auth in CI/CD (advanced)" page:
  - "API keys are still the recommended option for most CI/CD jobs."
  - The ChatGPT-managed `auth.json` path fits only when all conditions hold, including that the runner is "trusted private infrastructure". Do not use it for public or open-source repositories.
  - Seed the file once with `codex login`. Codex refreshes tokens during `codex exec`.
  - "Do not share the same file across concurrent jobs or multiple machines". Treat the file as a credential.
  - Enterprise and Business can instead use `CODEX_ACCESS_TOKEN`.
  — [Codex docs: CI/CD auth](https://developers.openai.com/codex/auth/ci-cd-auth); [Codex access tokens](https://developers.openai.com/codex/enterprise/access-tokens); [Non-interactive mode](https://learn.chatgpt.com/docs/non-interactive-mode) (search snippets)
- A GitHub issue reports that copied headless ChatGPT-plan tokens break when they expire. — [openai/codex issue #3820](https://github.com/openai/codex/issues/3820)

### Inferences
- **Officially allowed (OpenAI):** the instructor personally running `codex exec` or the Codex SDK with their own ChatGPT login on their own private server, and personal use of a ChatGPT plan in SIWC partner tools such as OpenCode.
- **Prohibited (OpenAI):** forwarding 30–50 students' prompts through the instructor's ChatGPT or Codex login. This conflicts with "make your account available to anyone else" (Terms of Use), the one-person account policy, and SIWC's explicit ban on "one user's subscription for another user's requests" and on pooling. The SIWC terms bind SIWC integrators rather than Codex CLI users, but they are OpenAI's clearest written statement of policy intent.
- **Technical red flag:** OpenAI's own docs say not to share `auth.json` across concurrent jobs. Fifty concurrent student requests through one ChatGPT login is exactly that pattern, and it risks token-refresh races on top of the policy breach.
- **Possible legitimate SIWC route:** a class site where *each student* connects *their own* ChatGPT plan through SIWC. This would require OpenAI approval, because remotely hosted apps are waitlisted and the request must come from a runtime only that user controls. Students would also need eligible plans.

### Gaps
- No primary source on OpenAI banning accounts for OpenCode-style personal use was found. OpenAI moved to embrace it. No primary source on OpenAI enforcement against account-sharing or "carpool" relays was found either.
- OpenAI's current Terms of Use effective date and exact wording could not be fetched because egress was blocked. The quote above is from search snippets and the commonly published text.
- Whether ChatGPT Free or Go plans can use SIWC plan usage is unclear. Sources mention Plus and Pro.

---

## Q5. Usage limits (5-hour and weekly) for Claude Max 5x/20x and ChatGPT Plus/Pro for Codex, late 2026; would 30–50 concurrent students exhaust them?

### Takeaway
Neither vendor publishes hard numbers for late 2026.
- **Anthropic:** a 5-hour session limit plus weekly limits. The 5-hour Claude Code limits were doubled on May 6, 2026. The only published hour estimates date from Aug 2025.
- **OpenAI Codex:** Plus has a 5-hour window, restored Aug 25, 2026 per secondary sources, with roughly 15–160 local messages per 5 hours on the flagship model. Pro currently has no 5-hour limit, only an undisclosed weekly cap.

A 40-student class sending about 15 prompts each in one session (about 600 requests in one 5-hour window) would very likely exhaust ChatGPT Plus within minutes. It could plausibly exhaust a Claude Max 5x session window. Max 20x and Pro might survive one session but carry the unknown weekly cap, and the anomalous traffic pattern is a ban risk in itself.

### Cited Findings
**Anthropic**
- Pro and Max have "a five-hour session limit and a weekly limit". Max also has "a separate weekly limit for Fable". "These limits are shared across Claude and Claude Code." The article gives no concrete message or hour numbers. — [Help Center: Use Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- Max 5x offers 5x and Max 20x offers 20x Pro's per-session allowance. Anthropic "may limit your usage in other ways, such as weekly and monthly caps or model and feature usage, at our discretion." — [Help Center: What is the Max plan?](https://support.claude.com/en/articles/11049741-what-is-the-max-plan); [How do usage and length limits work?](https://support.claude.com/en/articles/11647753-how-do-usage-and-length-limits-work) (search snippets)
- On May 6, 2026, Anthropic announced "doubling Claude Code's five-hour rate limits for Pro, Max, Team, and seat-based Enterprise plans" and removed "the peak hours limit reduction on Claude Code for Pro and Max accounts". No absolute numbers were given. — [Anthropic: Higher usage limits and a SpaceX compute deal](https://www.anthropic.com/news/higher-limits-spacex)
- The last published hour estimates date from Jul 28, 2025 and took effect Aug 28, 2025. Weekly guidance:
  - Pro: about 40–80 h Sonnet 4.
  - Max 5x: about 140–280 h Sonnet 4 and 15–35 h Opus 4.
  - Max 20x: about 240–480 h Sonnet 4 and 24–40 h Opus 4.
  These are token-based, so actual use varies. They predate the 2026 changes and model generations, so treat them as historical only. — [TechCrunch, 2025-07-28](https://techcrunch.com/2025/07/28/anthropic-unveils-new-rate-limits-to-curb-claude-code-power-users/); [Stark Insider](https://www.starkinsider.com/2025/07/anthropic-adds-weekly-limits-to-claude-cites-abuses.html)
- Max pricing is $100 per month for 5x and $200 per month for 20x. — [TechCrunch, 2025-07-28](https://techcrunch.com/2025/07/28/anthropic-unveils-new-rate-limits-to-curb-claude-code-power-users/); current plans at [claude.com/pricing](https://claude.com/pricing)

**OpenAI Codex**
- The official pricing page (search snippet) says local-message ranges per 5 hours are shown for Plus and Standard Business, "Pro plans currently have no five-hour limit", cloud tasks use more allowance than local messages, and weekly limits may also apply. — [Codex Pricing](https://developers.openai.com/codex/pricing); [OpenAI Help: Using Codex with your ChatGPT plan](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
- Secondary sources (Oct 2026), unverified against the official page:
  - The 5-hour window was suspended Jul 12, 2026 and restored for Plus on Aug 25, 2026.
  - Plus ranges per 5 hours: about 15–160 local messages on "GPT-6.1 Sol", 5–45 on "GPT-6 Astra", and 350–3,000 on "GPT-6 Luna".
  - Weekly numbers are unpublished.
  - Pro tiers at $100, $200 and $500 have no 5-hour cap, only a weekly cap.
  - Plus costs $20.
  — [SessionWatcher](https://sessionwatcher.com/guides/codex-rate-limits-explained); [Standard Compute (Oct 2026)](https://standardcompute.com/codex-usage-limits); [MorphLLM](https://www.morphllm.com/codex-pricing); [OpenAI Community thread](https://community.openai.com/t/understanding-the-new-codex-limit-system-after-the-april-9-update/1378768)
- Community complaints show that heavy single users regularly hit the limits. Examples: a Pro user hit the 5-hour limit twice and nearly exhausted the weekly cap in one day (older thread), and a single prompt consumed 7% of a Plus weekly limit. — [OpenAI Community](https://community.openai.com/t/pro-plan-hit-5-hour-limit-twice-in-2h-and-1-5h-and-nearly-exhausted-weekly-cap-in-1-day-after-today-s-update/1364782); [OpenAI Community](https://community.openai.com/t/codex-usage-after-the-limit-reset-update-single-prompt-eats-7-of-weekly-limits-plus-tier/1365284)
- Users can cap each SIWC app's share of the weekly allowance at 10–100%, and all of it draws from the same Codex allowance. — [eesel.ai](https://www.eesel.ai/blog/sign-in-with-chatgpt)

### Inferences
- Back-of-envelope (inference, not a vendor figure): 40 students × 10–20 prompts in a 75–90-minute class gives 400–800 requests in one 5-hour window.
  - Against Plus's roughly 15–160 flagship-model messages per 5 hours, the window would be gone within minutes.
  - Max is token-based, and each `claude -p` call carries Claude Code's large system prompt and tool definitions, which costs more than a plain chat turn. Max 5x could plausibly run out inside one class. Max 20x and ChatGPT Pro (no 5-hour cap) might survive a session, but weekly caps are undisclosed, and 2–3 class sessions plus homework per week could exhaust them mid-week.
- Concurrency is a separate problem. One subscription account serving many simultaneous sessions is the "unusual traffic" pattern Anthropic cited when abuse filters auto-banned accounts in Jan 2026. Codex's own docs advise against using one `auth.json` for concurrent jobs.
- Pay-per-use APIs have explicit, raisable rate limits and predictable failure modes. For a class, that makes them more reliable than any consumer plan.

### Gaps
- No official 2026 hour or message numbers exist for Claude Max. The weekly Codex caps are unpublished. Model names in the Codex tables (GPT-6.x "Sol/Astra/Luna") come from secondary sites and could not be verified on developers.openai.com because egress was blocked.
- No measured data was found on how much of a Max session limit one `claude -p` Q&A call uses.

---

## Q6. Unofficial reverse proxies that turn a Claude or ChatGPT subscription into an OpenAI-compatible API, and documented risks

### Takeaway
Many exist, such as claude-max-api-proxy, claude-code-proxy, CLIProxyAPI and sub2api; some are explicitly built for "carpool" sharing. All of them break Anthropic's "route requests through … plan credentials on behalf of their users" rule and the new AUP "route requests through consumer subscriptions" clause when used for others. Their own READMEs disclaim liability for bans. They are the highest-risk option.

### Cited Findings
- `sethschnrt/claude-max-api-proxy`: "Use your Claude Max subscription ($200/mo) as an OpenAI-compatible API." A maintained fork, `wende/claude-max-api-proxy`, uses Claude Code as a model provider. — [GitHub sethschnrt](https://github.com/sethschnrt/claude-max-api-proxy); [GitHub wende](https://github.com/wende/claude-max-api-proxy)
- `i-am-logger/claude-code-proxy`: an OpenAI-compatible proxy that spawns the Claude Code CLI as a subprocess. It acknowledges that Anthropic's Feb 2026 terms prohibit pulling OAuth tokens into third-party tools and argues that subprocessing avoids this. That is the project's own reading; Anthropic's text prohibits intermediating on others' behalf regardless of binary. — [GitHub i-am-logger](https://github.com/i-am-logger/claude-code-proxy)
- CLIProxyAPI is a guide to using a Claude Max subscription as an API. Sources note Anthropic blocks direct third-party use of OAuth tokens while the CLI itself can use them. — [rogs.me, Feb 2026](https://rogs.me/2026/02/use-your-claude-max-subscription-as-an-api-with-cliproxyapi/); [GitHub luispater/CLIProxyAPI](https://github.com/luispater/CLIProxyAPI)
- `Wei-Shaw/sub2api` is a relay that unifies Claude, OpenAI, Gemini and Grok subscriptions and explicitly supports "拼车共享" (carpool sharing) to split costs. Its README disclaims liability for account bans, and a third-party listing flags ToS compliance risk. — [GitHub sub2api](https://github.com/Wei-Shaw/sub2api); [opensourcealternatives.to](https://www.opensourcealternatives.to/item/sub2api)
- An Augment-based proxy warns that use may get accounts flagged or banned. — [GitHub augment2api](https://github.com/netcodeworkspace/augment2api)
- Anthropic's Jan 2026 server-side fingerprinting caught spoofed clients, and abuse filters banned accounts, some later reinstated. — [Thariq on X](https://x.com/trq212/status/2009689809875591565)
- On the OpenAI side, multi-account "rotation" plugins exist (e.g., ndycode/oc-codex-multi-auth). The SIWC terms now name "rotating accounts" and "pooling or sharing plan usage or tokens" as disallowed. — [GitHub ndycode](https://github.com/ndycode/oc-codex-multi-auth); [SIWC Terms](https://openai.com/policies/sign-in-with-chatgpt-terms/) (search snippet)

### Inferences
- For a university course, such proxies stack every risk at once: ToS breach, automated bans with no refund (Anthropic), mid-semester outages when a vendor changes client checks (as in Jan and Apr 2026), and token-refresh fragility. Students' prompts would also pass through unaudited third-party code.

### Gaps
- No primary-source report was found of Anthropic or OpenAI banning a specific named proxy's users, beyond the Jan 2026 harness bans.
- I found no dedicated "Codex subscription → OpenAI-compatible API" proxy. The searches returned only OpenCode auth plugins and multi-vendor relays such as sub2api.

---

## Q7. Legitimate multi-user paths that still use flat-rate seats; seat pricing and admin visibility of conversation logs (brief)

### Takeaway
Per-student seats are the compliant flat-rate option:
- **Claude Team:** $20 annual or $25 monthly per Standard seat; $100 or $125 per Premium seat; 2–150 seats. It has **no Compliance API**.
- **Claude Enterprise:** $20 per seat per year-billed month plus usage at API rates, 20-seat minimum. It **adds the Compliance API**, with chat histories by user and time range, plus audit logs.
- **ChatGPT Business:** $20 annual or $25 monthly per Standard seat; $100 or $125 per Premium seat; Codex included; 2-seat minimum.
- **ChatGPT Enterprise and Edu:** quote only; the Compliance API supports audit logs and usage monitoring, including Codex.

For 30–50 students, seats cost roughly $750–$1,250 per month on Team or Business monthly billing. That is usually far more than an API-key design funded by Max's included credits.

### Cited Findings
- Claude Team: Standard seat "$20 per seat / month if billed annually, $25 if billed monthly"; Premium $100 annual or $125 monthly; teams of 2 to 150, and above 150 you need Enterprise. — [Claude pricing](https://claude.com/pricing); [Help Center: What is the Team plan?](https://support.claude.com/en/articles/9266767-what-is-the-team-plan) (search snippets)
- Claude Enterprise: "US$20/seat/month, billed annually, 20 seat minimum", with usage billed separately at API rates. The seat fee covers access only. — [Claude Enterprise pricing](https://www.claude.com/pricing/enterprise); [Help Center: What is the Enterprise plan?](https://support.claude.com/en/articles/9797531-what-is-the-enterprise-plan) (search snippets)
- The Compliance API is unavailable on Team and available on Enterprise. It gives programmatic access to "activity logs, chat histories, and file content, with filtering capabilities by user and time range". Audit logs are a separate Enterprise feature. The Claude Code auth docs also say Enterprise "adds domain capture, role-based permissions, and the compliance API". — [Help Center: Enterprise plan](https://support.claude.com/en/articles/9797531-what-is-the-enterprise-plan) (search snippet); [Claude Code docs: Authentication](https://code.claude.com/docs/en/authentication)
- The Team plan includes pooled monthly API credits: $20 per Standard seat and $100 per Premium seat, capped at $500 per month. — [API credits docs](https://platform.claude.com/docs/en/about-claude/api-credits-for-subscribers)
- ChatGPT Business: Standard $20 annual or $25 monthly, Premium $100 or $125. Both include Codex, with a 2-seat minimum per workspace. — [OpenAI Help: Managing billing and seats in ChatGPT Business](https://help.openai.com/en/articles/8792536-managing-billing-and-seats-in-chatgpt-business); [Codex pricing](https://learn.chatgpt.com/docs/pricing) (search snippets)
- ChatGPT Enterprise and Edu have no published price. They bundle Codex with the Compliance API, and "Audit logs and usage monitoring via the Compliance API" are listed; the Compliance API can log Codex usage. Codex-only usage-based seats are "not currently offered for ChatGPT Edu". — [Codex pricing](https://learn.chatgpt.com/docs/pricing); [Codex flexible pricing for teams](https://openai.com/index/codex-flexible-pricing-for-teams/) (search snippets)

### Inferences
- If the instructor's hard requirement is to see every student prompt and output, a self-built site on an API key gives full logs at no extra cost. Claude Team does not expose members' chats through a Compliance API; that requires Enterprise. ChatGPT Business log access is unclear (see Gaps); Edu and Enterprise have the Compliance API.
- Seat-based plans are fully compliant and survive a semester with no relay risk. Students then use the vendor UI rather than the class site, unless the site has each student sign in with their own seat.

### Gaps
- Whether ChatGPT Business admins can export members' conversation content (rather than only usage or audit data) was not confirmed. Edu pricing and Claude for Education details are covered by another researcher.
- I did not check whether the Claude Compliance API has extra fees or eligibility requirements.

---

### Summary matrix (for the report writer; each cell is backed by the citations above)

| Scenario | Anthropic | OpenAI |
|---|---|---|
| Subscriber's own headless use (`claude -p` / Agent SDK / `claude setup-token`; `codex exec` with ChatGPT login) on own server | ALLOWED: counts against subscription limits (Help 15036540; setup-token documented for CI and scripts) | ALLOWED: documented as "advanced"; API key recommended; trusted private infra only; no concurrent sharing of `auth.json` |
| Subscriber's own use in third-party harness (OpenCode, etc.) | GREY: Apr 4, 2026 billing change says not covered; Oct 2026 help page says "third-party apps" still use limits | ALLOWED via SIWC partners (Sep 29, 2026), with per-app weekly caps; unofficial OAuth plugins GREY |
| One personal subscription relayed to 30–50 students via website | PROHIBITED: Consumer Terms §2; Claude Code Legal page; AUP (Nov 12, 2026) | PROHIBITED: ToU "make your account available to anyone else"; Account Sharing Policy; SIWC ban on cross-user use and pooling |
| Unofficial subscription→API reverse proxy | PROHIBITED when it serves others; ban history | PROHIBITED when pooled or rotated; no enforcement data found |
| Instructor's API key serving own students (logs kept by instructor) | ALLOWED ("customer's own authorized users"); can be funded by Max 5x/20x monthly API credits ($100/$200) | ALLOWED under the API Services Agreement (pay-per-use) |
| Per-student seats (Team/Enterprise; Business/Edu) | ALLOWED; Compliance API on Enterprise only | ALLOWED; Codex included in Business; Compliance API on Enterprise/Edu |
