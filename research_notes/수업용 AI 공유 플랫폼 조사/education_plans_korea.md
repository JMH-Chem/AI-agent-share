# Education-oriented AI plans and free student offerings for a Korean university class (30–50 students), as of 2026-10-24

Research notes. Scope: official education and team plans, free student and teacher offers, and above all whether an instructor can legitimately see what students asked the AI and what it produced. South Korea eligibility is checked for every offering.

Method caveat: the research sandbox could not fetch openai.com, help.openai.com, docs.github.com, github.blog, gemini.google, workspaceupdates.googleblog.com, snu.ac.kr or most Korean news sites directly (DNS/egress blocked). For those vendors the facts below come from search-engine extracts of the official pages, which are marked "(search extract of official page)". The claude.com, anthropic.com and support.claude.com pages were fetched in full. Third-party blogs are marked as secondary, and conflicts are noted.

---

## Q1. Anthropic: Claude for Education, Team/Enterprise seats, and educator/student programs

### Takeaway
Claude for Education is a university-wide contract with no public price, so an individual instructor cannot buy it. No Korean university is publicly confirmed as a customer. Its admin side gives no routine instructor view of student chats: Primary-Owner data exports and audit logs are off by default and need Anthropic support to turn on. Claude Team ($25/seat billed monthly) includes Claude Code on every seat but has no audit logs or Compliance API. Enterprise has both, but needs at least 20 seats and adds API-rate usage on top of $20/seat.

### Cited Findings
**Claude for Education (institutional plan)**
- The pricing page describes the Education plan as university-wide for students, faculty and staff, with "discounted access for all members, dedicated API credits for student learning, and training resources". No price and no minimum seat count are listed. — [claude.com/pricing](https://claude.com/pricing)
- The education solutions page offers only a "Contact our Education team" link, with no pricing, eligibility rules or country list. It lists Claude Code, Claude Developer Platform, Cowork and Claude for Word as campus tools. — [claude.com/solutions/education](https://claude.com/solutions/education)
- Learning mode: "Claude's learning mode works like a good tutor: it asks questions that help you find the answers yourself." — [claude.com/solutions/education](https://claude.com/solutions/education)
- Canvas LTI support, plus Panopto and Wiley MCP connectors, were announced on July 9, 2025. The same announcement says conversations are private by default and excluded from training by default, institutional data requests need formal approval, and self-serve data exports are limited by default. — [Anthropic, "Advancing Claude for Education" (2025-07-09)](https://www.anthropic.com/news/advancing-claude-for-education)
- In Canvas, the Canvas admin creates a developer key, and the Claude for Education admin enables Canvas under the organization's Connectors settings. — [support.claude.com: Set up the Claude LTI in Canvas](https://support.claude.com/en/articles/11725453-set-up-the-claude-lti-in-canvas-by-instructure)
- **Admin visibility:** "Your university's organization's designated Primary Owner manages your Claude for Education account and all associated data." A Primary Owner data export "may contain your conversations with Claude, uploaded files, and usage patterns", but Primary Owner Data Exports are **disabled by default** and enabling them requires contacting Anthropic support. Audit Logs are also **disabled by default** and need the same support request. The article does not mention a Compliance API and does not say whether instructors can see student chats. — [support.claude.com: Who owns and manages the data of my Claude for Education account?](https://support.claude.com/en/articles/11732894-who-owns-and-manages-the-data-of-my-claude-for-education-account)
- Admin setup covers SSO, JIT/SCIM provisioning, project visibility and sharing, connectors, web search, audit logs, custom data retention and disabling public projects. — [support.claude.com: Get started with Claude for Education (Owners/Admins)](https://support.claude.com/en/articles/11139094-get-started-with-claude-for-education-at-your-university-for-owners-admins)
- Student and faculty features include Projects, an enhanced context window, file uploads, advanced models with higher limits, and web search/research (linked articles). — [support.claude.com: Use Claude for Education at your university](https://support.claude.com/en/articles/11139144-use-claude-for-education-at-your-university)
- Named partner institutions (secondary sources) include Northeastern, LSE, Champlain College, Syracuse, Pittsburgh, Columbia and Northampton. None are Korean. — [continuumcode.ai guide (secondary)](https://continuumcode.ai/guides/claude-for-education/); [krater.ai (secondary)](https://krater.ai/blog/claude-pro-student-discount)
- Anthropic publishes no individual student discount for Claude Pro (Pro is $20/month, or $17/month billed annually). — [claude.com/pricing](https://claude.com/pricing); [costbench (secondary)](https://costbench.com/software/ai-chatbots/claude/discounts/)

**Team / Enterprise seats**
- Team Standard costs $20/seat/month billed annually or $25 billed monthly. Team Premium costs $100 annually or $125 monthly, with 5x Standard usage. Team is "For teams of 2 to 150". Enterprise is "$20/seat/month billed annually, plus usage at API rates" with a "20 seat minimum". — [claude.com/pricing](https://claude.com/pricing)
- **Audit logs / Compliance API:** Team does not have them. Enterprise has them (both self-serve and sales-assisted). Pro and Max do not. — [claude.com/pricing](https://claude.com/pricing)
- "Claude Code is included with every seat" on Team, Standard and Premium alike (2026-01-28). — [Claude blog, "Updates to Claude Team"](https://claude.com/blog/claude-team-updates). Some secondary blogs claim Standard excludes Claude Code, for example [superblocks](https://www.superblocks.com/blog/claude-code-pricing). The official blog contradicts them.
- The pricing page summary also mentions pooled API credits for Team ("up to $500/month"). This came from an automated page summary and was not confirmed in a second source. — [claude.com/pricing](https://claude.com/pricing)

**Anthropic programs for students, educators and researchers**
- Claude Campus Ambassadors: undergraduate track (Claude Builder Clubs, members receive "API credits" among resources), Master's track (Campus Conversations) and PhD/postdoc track (Claude Science workshops). Each comes with a USD 3,600 stipend. "Students anywhere in the world can apply." Applicants must be 18+ with work authorization. The page says "The program is closed for Fall 2026". The cohort runs September 2026 to June 2027, and the application window is "September 1 – September 12" (year unstated). — [claude.com/programs/campus](https://claude.com/programs/campus)
- Claude Team plan for scientists: open to PIs at accredited universities and nonprofit institutes "around the world" in natural sciences, math, CS and engineering. Standard seats are free (normally $20) and Premium seats are $15 (normally $100), for 1–25 seats over 12 months from sign-up. It includes Claude Science, Claude Code and Cowork. Applicants verify by attestation, with review in 5–7 business days. There is no country list, and Korea is not mentioned. — [claude.com/programs/team-plan-for-scientists](https://claude.com/programs/team-plan-for-scientists)
- "Claude for Teachers" is reported as a free program for verified US K-12 educators only. — [fast.io (secondary)](https://fast.io/resources/claude-for-students-guide/); [kuraplan (secondary)](https://www.kuraplan.com/free-ai-for-teachers)

**Korea**
- Anthropic opened its Seoul office on 2026-06-17 (updated June 18). The only university-related item is the National AI Research Lab (NAIRL: KAIST, Korea University, Yonsei, POSTECH), where "Anthropic will provide Claude access to up to 60 NAIRL-affiliated researchers". The announcement mentions no Claude for Education deal in Korea and no student or educator credits. Partners include the Ministry of Science and ICT (MOU), NAVER, LG CNS, Samsung SDS and WRTN. — [Anthropic, "Anthropic opens Seoul office"](https://www.anthropic.com/news/seoul-office-partnerships-korean-ai-ecosystem)

### Inferences
- An individual instructor cannot buy Claude for Education. It requires a university contract, and no Korean university is publicly confirmed as a customer.
- For a self-funded class of 30–50, Claude Team Standard would cost about $750–$1,250/month billed monthly ($25 × 30–50), or $600–$1,000/month on annual billing. It includes Claude Code, but **gives the instructor no audit log or Compliance API**. Seats are also meant for members of the buyer's organization, so their fit for a class should be checked against Anthropic's commercial terms.
- Enterprise is the only Anthropic tier with a Compliance API and audit logs. With the 20-seat minimum it starts at about $400/month plus metered usage, but it needs a sales or self-serve Enterprise agreement and likely institutional procurement.
- The Team plan for scientists (free Standard seats, up to 25, 12 months) is aimed at research groups led by a PI, not courses. Using it for a 30–50 student class would exceed the seat cap and likely the program's intent.

### Gaps
- No public Claude for Education price per user or per FTE. Stanford's rates page ([uit.stanford.edu/rates/claude](https://uit.stanford.edu/rates/claude)) could not be fetched.
- Not confirmed: whether Claude for Education seats include Claude Code by default, and whether an instructor (not the Primary Owner) can be given any view of a course's student chats.
- No source states whether Claude for Education contracts are offered to Korean institutions. claude.com lists "Availability" and "Regional compliance" links, but they were not reviewed. Korea is a supported Claude country in general (Anthropic runs a Seoul office), but there is no education-specific confirmation.

---

## Q2. OpenAI: ChatGPT Edu, ChatGPT for Teachers, Business seats with Codex, student promos, researcher programs

### Takeaway
ChatGPT Edu is the strongest fit for instructor visibility: Edu admins can pull conversation logs through the Compliance API. But it is sold only through institutional sales, and in Korea it is confirmed only at Seoul National University (June 2026 to August 2027). LG CNS has been an Edu reseller in Korea since April 2026. ChatGPT for Teachers is US K-12 only. Business seats ($25 monthly, $20 annually, 2-seat minimum) include Codex, but sources conflict on whether Business admins can see member chats, and OpenAI's own help pages say data export is not available in Business. As of October 2026 there is no free ChatGPT Plus offer for Korean students.

### Cited Findings
**ChatGPT Edu**
- Edu pricing is "Contact sales". No public per-seat price is found. — [christopheralarcon (secondary)](https://christopheralarcon.com/blog/codex-pricing); [morphllm (secondary)](https://www.morphllm.com/codex-pricing)
- Plus, Pro, Business, Enterprise and **Edu** all include Codex. — [morphllm (secondary)](https://www.morphllm.com/codex-pricing); [continuumcode (secondary)](https://continuumcode.ai/guides/codex-pricing/)
- **Admin visibility:** "workspace admins can get an audit log of conversations and GPTs through the Enterprise Compliance API". End users see only their own conversations. — [OpenAI Enterprise privacy (search extract of official page)](https://openai.com/enterprise-privacy/)
- The OpenAI Compliance Platform covers Enterprise **and Edu** workspaces. A workspace owner or admin creates a workspace-scoped Admin key, and only the workspace owner can grant the "Conversation messages" permission. Messages from locked chats are included, and an account PIN does not block Compliance access. A new conversation-logs system launched 2026-03-05, and the old route was removed 2026-06-05. — [help.openai.com: OpenAI Compliance Platform for Enterprise and Edu customers (search extract of official page)](https://help.openai.com/en/articles/9261474-openai-compliance-platform-for-enterprise-and-edu-customers)
- One secondary source claims OpenAI limits Compliance API use to litigation holds, investigations and audits. This is not confirmed on OpenAI pages. — [search summary of third-party blogs, e.g. llmnesia (secondary)](https://www.llmnesia.com/blog/can-my-employer-see-my-chatgpt-conversations)

**Korea adoption of Edu**
- Seoul National University gives ChatGPT Edu to all members (faculty, students, staff) from 2026-06-05. Users are bulk-registered by admins with no application step and log in with their MySNU account. The service runs June 2026 to August 2027 (15 months), and SNU says it will also provide Codex, agent-development features and the OpenAI API. — [SNU press release](https://www.snu.ac.kr/snunow/press?md=v&bbsidx=170942); [한국대학신문](https://news.unn.net/news/articleView.html?idxno=593027); [대학지성 In&Out](https://www.unipress.co.kr/news/articleView.html?idxno=14663)
- LG CNS signed a reseller agreement with OpenAI to supply ChatGPT Edu to Korean educational institutions (2026-04-27). — [뉴시스](https://www.newsis.com/view/NISX20260427_0003607585)
- No other Korean university-wide Edu deployment was found in search. KAIST and POSTECH appear only in the researcher program below. — [search, no hit](https://news.unn.net/news/articleView.html?idxno=593027)

**ChatGPT for Teachers**
- Free for verified **US K-12** educators through June 2028, verified via SheerID. University professors and non-US educators are not eligible. A June 2027 date appears in some older FAQ text. — [help.openai.com: ChatGPT for Teachers (search extract of official page)](https://help.openai.com/en/articles/12844995-chatgpt-for-teachers); [justinmckelvey (secondary)](https://justinmckelvey.com/blog/chatgpt-for-teachers); [layer3labs (secondary)](https://www.layer3labs.io/guides/chatgpt-for-teachers)

**ChatGPT Business (formerly Team)**
- Standard seats cost $25/user/month billed monthly or $20 billed annually and include ChatGPT, ChatGPT Work and **Codex**. Premium seats cost $125 monthly or $100 annually. API usage is billed separately. — [help.openai.com: ChatGPT Business overview (search extract of official page)](https://help.openai.com/en/articles/8792828-chatgpt-business-overview); 2-seat minimum per [christopheralarcon (secondary)](https://christopheralarcon.com/blog/codex-pricing)
- Business and Enterprise can add Codex-only pay-as-you-go seats. One secondary source says new Business workspaces cannot add standalone Codex seats after 2026-06-24. This is unresolved. — [OpenAI: Codex flexible pricing for teams](https://openai.com/index/codex-flexible-pricing-for-teams/)
- **Admin visibility conflict:**
  - OpenAI's Business data and privacy help pages say each user has their own private chat and Codex history, other members do not automatically see it, admin spend and usage controls show only operational data, and "data export is not available in a ChatGPT Business workspace". — [help.openai.com: Managing data sharing and privacy in ChatGPT Business (search extract)](https://help.openai.com/en/articles/8798634-managing-data-sharing-and-privacy-in-chatgpt-business)
  - A search summary of OpenAI's Enterprise privacy page claimed Business admins "can view, access, export, and delete end-user conversations".
  - A third-party comparison table marks the Compliance API as Enterprise/Edu only, not Business. — [suprmind (secondary)](https://suprmind.ai/hub/chatgpt/pricing/)
  - The help-center wording (no admin view, no export) looks more specific. The report should flag this as unresolved and recommend not relying on Business for prompt visibility.
- Shared links: Business members can create and delete shared links, but only Enterprise can disable sharing workspace-wide. — [help.openai.com: shared links FAQ (search extract)](https://help.openai.com/en/articles/8798634-managing-chatgpt-shared-links-faq)

**Free student promos and education credits**
- The only confirmed free ChatGPT Plus student promotion was for US and Canada students, claimable until 2025-05-31. No 2026 promo for Korea was found. One unverified Bengali-language blog mentions a US-only 4-month promo through 2026-10-31. — [Thurrott](https://www.thurrott.com/?p=319341); [dupple (secondary, 2026)](https://dupple.com/learn/chatgpt-for-students); [cometapi (secondary)](https://www.cometapi.com/is-chatgpt-free-for-college-students/)
- "ChatGPT for Academic Researchers" (launched 2026-07-30) gives one year of free access to GPT-5.6 family models and Codex to science, math and engineering researchers, starting with 10,000 people and scaling to 100,000 by 2027. **17 Korean universities and institutes** are eligible, the most in Asia-Pacific, including SNU, Yonsei, Korea University and POSTECH. Researchers must apply individually. Approved workspaces get up to 5 free licenses for 12 months, with no auto-renewal. — [OpenAI (ko-KR)](https://openai.com/ko-KR/index/chatgpt-for-academic-researchers/); [Asia Business Daily](https://view.asiae.co.kr/en/article/2026073017122509947); [help.openai.com ko-kr (search extract)](https://help.openai.com/ko-kr/articles/20001406-chatgpt-for-academic-researchers); [이데일리](https://edaily.co.kr/News/Read?mediaCodeNo=257&newsId=05408726645519768)

### Inferences
- For prompt-level visibility from OpenAI, Edu (or Enterprise) plus the Compliance API is the legitimate route. It is an institutional purchase: the instructor's university would contract through OpenAI or LG CNS, and the Compliance API is run by workspace owners (IT), not instructors.
- A self-funded Business workspace for 30–50 students would cost about $750–$1,250/month (monthly billing). It gives Codex to every student but probably **no** instructor view of chats.
- The researcher program (5 seats) is for research, not classes, and is too small for 30–50 students.

### Gaps
- ChatGPT Edu per-seat price, and whether Codex and deep research are on by default in Edu.
- Whether OpenAI sells Edu to a single department or course in Korea, and whether LG CNS offers small-scale Edu.
- The Business admin visibility conflict could not be settled because help.openai.com could not be fetched directly.

---

## Q3. Google: Gemini for Education, Google AI Pro/Plus student offers, NotebookLM, Jules/Gemini CLI

### Takeaway
Gemini app and NotebookLM come free with every Google Workspace for Education edition. Admins (not instructors) can search and export students' Gemini app conversations in Google Vault, with retention rules since June 2026 and filtered exports since October 2026. Most Korean universities already run Workspace or Microsoft 365, so this is the cheapest legitimate "visible" option if the university's Workspace admin cooperates. In 2026 the individual student offer for Korea is **Google AI Plus** (not Pro) free for 12 months, with a reported deadline of 2026-12-31. It needs a personal Google account, so admins cannot see it.

### Cited Findings
**Gemini for Education (institutional)**
- "Gemini for Education is also included in all Google Workspace for Education editions free of charge." The Gemini app and NotebookLM are available to users of all ages. Institutions without Workspace can get access through Google for Education Fundamentals. — [edu.google.com: Gemini for Education](https://edu.google.com/intl/ALL_us/ai/gemini-for-education/); [Google Workspace Help: Quickstart Gemini & Gemini Notebook for Education](https://support.google.com/a/answer/16350447?hl=en)
- NotebookLM is increasingly branded "Gemini Notebook" in 2026 materials. — [edu.google.com: Gemini Notebook](https://edu.google.com/intl/ALL_us/ai-gemini-notebook/)
- The Google AI Pro for Education paid add-on adds premium models and features in Gemini and NotebookLM, listed at "$15.00* $20.00 per user/month, one year commitment" (* = education pricing). — [edu.google.com: Google Workspace with Gemini add-on](https://edu.google.com/intl/ALL_us/workspace-for-education/add-ons/google-workspace-with-gemini/); [Google blog, BETT 2026](https://blog.google/products-and-platforms/products/education/bett26-premium-ai/)
- Gemini in Classroom offers more than 30 AI tools at no cost to educators with Workspace for Education accounts. — [Google blog: Gemini in Classroom](https://blog.google/products-and-platforms/products/education/classroom-ai-features/)

**Admin visibility**
- Google Vault supports Gemini app conversations for all Google Workspace for Education editions (May 2025). — [Workspace Updates (2025-05)](https://workspaceupdates.googleblog.com/2025/05/google-vault-gemini-support-for-all-google-workspace-for-education-customers.html)
- Vault retention rules and litigation holds for the Gemini app (June 2026) can be set by OU or domain and override user and admin settings. Under a hold, chats a user deletes stay visible to Vault admins. — [Workspace Updates (2026-06)](https://workspaceupdates.googleblog.com/2026/06/google-vault-now-supports-retention-rules-and-litigation-holds-for-Gemini-app.html)
- Vault filtered exports for Gemini in Workspace (October 2026) capture Gemini in Workspace conversations created while conversation history is on. An older source says side-panel, Gems and media content are not retained. These conflict, and the newer post likely supersedes the older one. — [Workspace Updates (2026-10)](https://workspaceupdates.googleblog.com/2026/10/google-vault-now-supports-filtered-exports-for-Gemini-in-Workspace.html); [hoplite-tech (secondary)](https://www.hoplite-tech.com/blog/ai-governance-google-vault-gemini-guide)
- Admins set Gemini conversation-history retention to 3, 18 or 36 months (default 18), and users cannot change it. — [Workspace Help: Manage Gemini conversation history settings](https://knowledge.workspace.google.com/admin/generative-ai/workspace-with-gemini/manage-gemini-in-workspace-conversation-history-settings)
- There are no real-time alerts. Review is after the fact through Vault. — [flintk12 (secondary, advocacy)](https://flintk12.com/blog/gemini-for-students-keep-lock-down-or-replace)

**Individual student offers (Korea)**
- 2025 (closed): Google AI Pro (₩29,000/month) was free for 12 months to Korean university and graduate students aged 18+, with applications closing 2025-10-06. — [Google Korea blog](https://blog.google/intl/ko-kr/company-news/technology/google-ai-pro-students-learning/); [Asia Business Daily (2025-08-07)](https://www.asiae.co.kr/en/article/2025080708472801442)
- 2026: US students get 12 months of Google AI Pro, while students in more than 140 other markets, **including South Korea**, get 12 months of **Google AI Plus**. After that it is reportedly ₩7,500/month unless cancelled. The redeem-by date is reported as **2026-12-31**. Verification is through SheerID with a school email or enrollment proof plus a payment method, and the offer must be claimed on a **personal** Google account, not a school Workspace account. Eligibility conflicts: 18+ in one source, 18–24 in another. — [opentherank (secondary)](https://opentherank.com/ai-pricing/gemini/student-discount/); [wikidocs/openwiki (secondary)](https://wikidocs.net/blog/@openwiki/31520/); [itflash (secondary, Sept 2026)](https://itflash.co.kr/google-ai-student-free-korea/); [국제뉴스](https://www.gukjenews.com/news/articleView.html?idxno=3729091); [동양미래대 공지](https://www.dongyang.ac.kr/bbs/dmu/677/251648/artclView.do)
- No official 2026 Google page confirming the Korea AI Plus terms was retrieved. gemini.google/students was blocked in the research sandbox. — [gemini.google/students](https://gemini.google/students/)

**Coding agents**
- Gemini CLI: one secondary source says Google stopped serving free, AI Pro, AI Ultra and individual Gemini Code Assist users on 2026-06-18, pointing them to the "Antigravity CLI". The Gemini API free tier in AI Studio remains. — [tembo (secondary)](https://www.tembo.io/blog/gemini-cli-pricing)
- Jules: AI Pro gets 5x and Ultra 20x the free-tier limits. Absolute free numbers were not found. — [macaron (secondary)](https://macaron.im/en/blog/gemini-3-1-pro-free)

### Inferences
- If the instructor's university already uses Google Workspace for Education and the course uses school accounts, students get Gemini app and NotebookLM at no cost. The Workspace super-admin (IT) can review prompts and responses in Vault. That is an IT and eDiscovery tool, so routine instructor access would need a university policy and student notice, likely under Korea's PIPA.
- The AI Plus student promo is good for students individually. It is free and Korea-eligible until 2026-12-31 (reported), but gives the instructor no visibility.

### Gaps
- An official confirmation of 2026 AI Plus terms for Korea (age band, deadline, features).
- Whether Gemini for Education (free tier) offers Deep Research and which model limits apply.
- The current status of Jules and Gemini CLI free tiers on official pages.

---

## Q4. GitHub Copilot (Education, coding agent, Classroom, teacher visibility)

### Takeaway
Verified students, Korea included since GitHub Education is open worldwide, moved from free Copilot Pro to a free "Copilot Student" plan on 2026-03-13. It has unlimited completions, a monthly AI-credit allowance and Auto model selection only. Verified teachers still reportedly get Copilot Pro free. Sign-up availability in 2026 is contested. GitHub's audit logs do **not** capture prompts, so an instructor cannot see students' Copilot chats. They can see students' code and commits through GitHub Classroom repos.

### Cited Findings
- On 2026-03-13 students with GitHub Education benefits moved to the new "GitHub Copilot Student" plan. — [GitHub Changelog, "Updates to GitHub Copilot for students" (search extract)](https://github.blog/changelog/2026-03-13-updates-to-github-copilot-for-students/)
- The plan includes unlimited code completions, an allowance of GitHub AI Credits, and limited chat and agent usage with auto model selection only. — [GitHub Student Developer Pack](https://education.github.com/pack/)
- Students activate it from education benefits settings, and eligibility is re-evaluated monthly. — [GitHub Docs: Access Copilot free as a student (search extract)](https://docs.github.com/copilot/how-tos/manage-your-account/free-access-with-copilot-student)
- The credit allowance is reported as 200 AI Credits/month for chat, agents, code review and the CLI. Whether the cloud coding agent is included is disputed. — [chalkbox (secondary)](https://www.chalkbox.org/guides/github-copilot-student/); [GitHub plans docs (search extract)](https://docs.github.com/en/copilot/get-started/plans)
- Sign-up conflict: new Student sign-ups were paused on 2026-04-20 ([chalkbox (secondary)](https://www.chalkbox.org/guides/github-copilot-student/)), against a reopening announced 2026-06-17 ([felloai (secondary)](https://felloai.com/how-to-get-microsoft-and-github-copilot-pro-free/)). There is no official confirmation either way.
- All Copilot plans moved to usage-based billing in GitHub AI Credits on 2026-06-01. The free tier is 2,000 completions and 50 chats/month. — [fast.io (secondary)](https://fast.io/resources/github-copilot-free-access/)
- Teachers: verified teachers get Copilot Pro free through GitHub Education, verified with a school email or documents. — [fast.io (secondary)](https://fast.io/resources/github-copilot-free-access/); [felloai (secondary)](https://felloai.com/how-to-get-microsoft-and-github-copilot-pro-free/)
- Copilot coding agent became available to Copilot Pro users (public preview) on 2025-06-25. — [GitHub Changelog (2025-06-25)](https://github.blog/changelog/2025-06-25-github-copilot-coding-agent-is-available-for-copilot-pro-users-in-public-preview/)
- **Visibility:** the Copilot enterprise audit log covers plan, settings and policy changes, license changes and agent activity on github.com. "Prompts sent to Copilot locally are not included". Capturing them needs a custom solution, for example hooks forwarding Copilot CLI events to one's own logging. — [GitHub Docs: Review audit logs for Copilot (search extract)](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/administer-copilot/manage-for-enterprise/review-audit-logs)
- Korea: no official country list was found. GitHub Education is described as available to eligible students in many countries. — [search summary of third-party guides](https://truescho.com/en/blog/github-student-developer-pack-copilot-2026)

### Inferences
- Copilot Student is the best free coding-agent option that does not depend on the instructor paying. Korean students with a school email or enrollment proof should qualify if sign-ups are open.
- Instructor visibility comes from code (Classroom repos, commits, PRs, and coding-agent PRs on github.com), not prompts. Agent activity on github.com (cloud agent PRs and session logs) is more visible than IDE chat.

### Gaps
- Official current sign-up status of Copilot Student, and whether the cloud coding agent is included.
- GitHub Classroom documentation on Copilot. No source found.

---

## Q5. Microsoft Copilot for education (brief)

### Takeaway
Microsoft 365 Copilot Chat costs nothing for A1/A3/A5 users signed in with school accounts, including higher-ed students 13+. Full Microsoft 365 Copilot is an $18/user/month academic add-on. No Korea-specific terms were found.

### Cited Findings
- Copilot Chat is "available at no cost for users with a Microsoft 365 A1, A3, or A5 license when signed in with their school or work account". It covers faculty, staff and higher-ed students aged 13+. Microsoft 365 Copilot is an academic add-on at $18 USD/user/month. — [Microsoft: Copilot in education](https://www.microsoft.com/en-us/education/products/copilot-in-education)
- In Japan, K-12 setup requires admins to set school type and age groups and handle parental consent, an indication of tenant-level controls. — [Impress Watch](https://www.watch.impress.co.jp/docs/news/2019969.html)

### Inferences
- Korean universities on Microsoft 365 A licenses can probably offer Copilot Chat to students at no extra cost. Prompt review would go through Microsoft Purview (IT-side), which is not verified in this research.

### Gaps
- Korean availability and pricing, and whether Purview audit/eDiscovery of Copilot Chat prompts applies to A1 tenants. Not researched.

---

## Q6. Korea-specific programs (government, universities, domestic AI vendors)

### Takeaway
The only confirmed Korean university-wide commercial AI deployment found is SNU's ChatGPT Edu (2026-06 to 2027-08). The Ministry of Education's ₩20 billion "대학생 AI 공동구독" (joint AI subscription) program is in the **2027 budget proposal** and not yet enacted. It would let university consortia co-procure AI services, with costs split 50/50 between government and universities. No free university-class offering from Naver HyperCLOVA X or WRTN was found. LG AI Research said in 2025 that EXAONE 4.0 would be free for education.

### Cited Findings
- 2027 budget proposal: "대학생 AI 공동구독" from 2027, ₩20 billion, open to 4-year universities, junior colleges and special-act universities (e.g. KAIST). Universities choose AI services by demand and form consortia for joint contracts, government and universities pay 50/50, and about 800,000 students are targeted. Assuming 60% uptake, the subsidy is about ₩88,000 per person, compared with about ₩1.88M/year for an individual top-tier subscription. The proposal is pending National Assembly approval. — [공무원뉴스](https://www.korea-news.com/news/articleView.html?idxno=104908); [열린정책뉴스](https://www.opengo.center/news/articleView.html?idxno=39887); [네이트/연합 그래픽 (2026-09-01)](https://m.news.nate.com/view/20260901n29353)
- 2026 대학 AI 기본교육과정 개발 지원사업: 20 universities, ₩300M each, AI basic courses required for freshmen, launched 2026-07-14 at Sejong University. — [교육부 공고](https://www.moe.go.kr/boardCnts/viewRenew.do?boardID=294&boardSeq=105401&lev=0&m=020402&opType=N); [뉴시스 (2026-02-23)](https://www.newsis.com/view/NISX20260223_0003522177); [한국연합신문](https://www.koreaunionnews.com/2211271)
- SNU ChatGPT Edu: see Q2. LG CNS is OpenAI's Edu reseller in Korea (2026-04-27). — [뉴시스](https://www.newsis.com/view/NISX20260427_0003607585)
- Google AI Plus student promo is Korea-eligible: see Q3. Individual universities post notices, for example Dongyang Mirae University: Korean university and graduate students 18+, school-email verification, apply by 2026-12-31. — [동양미래대 공지](https://www.dongyang.ac.kr/bbs/dmu/677/251648/artclView.do)
- LG AI Research said EXAONE 4.0 would be free for K-12 and university students without an educational license (AI BUS 2025, a 2025 statement). — [더에이아이](https://www.newstheai.com/news/articleView.html?idxno=8372)
- WRTN partnered with LG AI Research to use EXAONE, including AI-literacy education. The terms for universities are unspecified. — [AI타임스](https://www.aitimes.com/news/articleView.html?idxno=201600)
- HyperCLOVA X education examples found were only a 2024 Daekyo content partnership, with no university-class offering. — [서울경제TV (2024-02)](https://www.sentv.co.kr/article/view/sentv202402160076)
- Anthropic Seoul office (2026-06-17): NAIRL research access only, no education deal (see Q1). — [Anthropic](https://www.anthropic.com/news/seoul-office-partnerships-korean-ai-ecosystem)
- A Korean comparison post (October 2026) lists three ways universities provide gen-AI: a vendor campus contract (e.g. ChatGPT Edu), per-user monthly accounts, or a shared credit pool with per-department or per-course caps. — [원포트 AI blog (commercial)](https://oneport.kr/blog/university-genai-provision-options)

### Inferences
- An instructor should first check whether their own university (a) runs Google Workspace for Education or M365 A-licenses, (b) is negotiating for the 2027 joint-subscription consortium, or (c) took part in the MoE AI basic-education program. Each could fund or host class AI with admin-side logging.

### Gaps
- Which Korean universities besides SNU have campus-wide ChatGPT Edu, Gemini Enterprise or Claude for Education. Searches for Yonsei, Korea University and KAIST found nothing.
- Whether the 2027 joint-subscription budget passed the Assembly. Final approval is due in December 2026.
- No information found on KERIS programs for higher education AI, or on Naver or WRTN offerings for university classes.

---

## Q7. Can the instructor see students' prompts and outputs? (cross-cutting summary and workarounds)

### Takeaway
Prompt-level visibility exists only on institution-administered tiers: ChatGPT Edu/Enterprise (Compliance API), Claude Enterprise and Claude for Education (audit logs and Primary-Owner exports, off by default), and Google Workspace for Education (Vault). In each case it sits with IT and the workspace owner, not the instructor, and is designed for compliance and eDiscovery. Every self-serve tier that a single instructor can buy or that students claim individually gives no instructor view: Claude Team, ChatGPT Business (contested), Google AI Plus or Pro for students, and GitHub Copilot Student or Pro (prompts not in audit logs).

### Cited Findings
| Offering | Instructor can buy alone? | Korea eligible? | Coding agent | Admin view of prompts/outputs |
|---|---|---|---|---|
| Claude for Education | No (university contract, price undisclosed) | Unconfirmed, no Korean customer found | Claude Code is listed as a campus tool | Primary-Owner export and audit logs, both off by default, enabled through Anthropic support ([support.claude.com](https://support.claude.com/en/articles/11732894-who-owns-and-manages-the-data-of-my-claude-for-education-account)) |
| Claude Team | Yes, 2–150 seats, $25/$20 per seat | Yes (Claude available in Korea, Seoul office) | Claude Code on every seat ([blog](https://claude.com/blog/claude-team-updates)) | No audit logs or Compliance API ([pricing](https://claude.com/pricing)) |
| Claude Enterprise | Yes, 20-seat minimum, $20/seat + API usage | Yes (general) | Yes | Audit logs and Compliance API ([pricing](https://claude.com/pricing)) |
| ChatGPT Edu | No (sales or LG CNS reseller) | Yes (SNU, 2026-06) | Codex included | Compliance API conversation logs, owner-granted ([help.openai.com](https://help.openai.com/en/articles/9261474-openai-compliance-platform-for-enterprise-and-edu-customers)) |
| ChatGPT Business | Yes, 2+ seats, $25/$20 | Yes (general) | Codex included | Conflicting; help center says no admin chat access and no export ([help.openai.com](https://help.openai.com/en/articles/8798634-managing-data-sharing-and-privacy-in-chatgpt-business)) |
| ChatGPT for Teachers | No: US K-12 only | **No** | — | — ([help.openai.com](https://help.openai.com/en/articles/12844995-chatgpt-for-teachers)) |
| Gemini for Education (Workspace) | Through university Workspace, free | Yes, if the university has Workspace for Education | Gemini app; Jules/CLI not covered | Vault search and export of Gemini app chats, retention rules ([Workspace Updates](https://workspaceupdates.googleblog.com/2026/06/google-vault-now-supports-retention-rules-and-litigation-holds-for-Gemini-app.html)) |
| Google AI Plus student (12 mo free) | Claimed by each student | Yes, deadline reportedly 2026-12-31 | Higher Jules limits (AI Pro tier; Plus not confirmed) | None (personal account) |
| GitHub Copilot Student / Teacher Pro | Claimed individually | Likely yes (global GitHub Education) | Agent mode; cloud agent disputed for Student | Audit log excludes prompts ([GitHub Docs](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/administer-copilot/manage-for-enterprise/review-audit-logs)) |
| M365 Copilot Chat (A1/A3/A5) | Through university tenant, free | Unconfirmed for Korea | — | Not researched |

- ChatGPT shared links: users can create and delete shared links of conversations, and Enterprise can disable sharing. This is a student-initiated way to hand over a chat. — [help.openai.com shared links FAQ (search extract)](https://help.openai.com/en/articles/8798634-managing-chatgpt-shared-links-faq)
- Claude for Education conversations are "private by default", and institutional data requests require formal approval. — [Anthropic (2025-07-09)](https://www.anthropic.com/news/advancing-claude-for-education)
- GitHub notes that capturing Copilot prompts requires custom hooks forwarding Copilot CLI events to the organization's own logging. — [GitHub Docs (search extract)](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/administer-copilot/manage-for-enterprise/review-audit-logs)

### Inferences
- **Legitimate workarounds without institutional admin access:**
  1. **Submission-based visibility.** Students use any free or personal tool (Google AI Plus promo, Copilot Student, free ChatGPT or Claude) and submit shared-chat links or exported transcripts with each assignment. Code tasks are submitted via GitHub Classroom repos, where commits and agent PRs are visible.
  2. **Instructor-run gateway on the API, not a consumer subscription.** The instructor builds the class website on a pay-as-you-go API key (Anthropic, OpenAI or Gemini API) and logs every prompt and response server-side with student consent. This is the legitimate version of the "relay one subscription via a website" idea. Proxying a single consumer Pro or Max subscription to 30–50 people would likely breach the consumer terms on account sharing (not verified in this research; another researcher covers subscription terms).
  3. **Custom hooks.** For coding agents (Claude Code, Copilot CLI), hooks can forward session events to the instructor's logging, which GitHub explicitly suggests.
- Any instructor-side logging of student prompts is personal-data processing. It needs notice and consent under Korea's Personal Information Protection Act (PIPA) and university IRB or privacy policy. Not researched here.
- Vendor admin views (Compliance API, Vault, audit logs) are IT and eDiscovery tools. Using them for routine grading would need explicit university policy and student notice.

### Gaps
- Whether Claude, Gemini and Copilot offer per-chat share links or export in Education tiers, and whether an Education admin can disable them. Not verified.
- Microsoft Purview visibility into Copilot Chat prompts for A1 tenants. Not researched.
- Exact consumer-terms wording on account sharing and relaying (outside this scope).
