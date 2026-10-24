# 수업용 AI 공유 포털

학생들은 각자 구독 없이 웹페이지에서 AI를 쓰고, 교수자는 **학생별로 어떤 질문을 했고 AI가 무엇을 했는지(웹 검색·파일 작업 포함)** 전부 확인할 수 있는 수업 전용 사이트입니다.

- 학생: 학번으로 로그인 → 채팅(웹 검색 포함) 또는 **에이전트 모드**(Claude Code와 같은 엔진으로 학생 전용 폴더에서 파일 생성·수정)
- 교수자: 학생별 대화 전체 열람, 도구 사용 내역, 비용·토큰 집계, 내용 검색, 전체 기록 CSV 내보내기, 계정 일괄 생성, 접속·열람 감사 기록
- 사용 한도: 학생 1인당 하루 한도, 전체 월 예산, 학생당 동시 요청 1개

> 왜 "구독 계정 공유" 대신 API 키를 쓰는지, 어떤 대안이 있는지는 조사 보고서 [`reports/수업용 AI 공유 플랫폼 조사.md`](reports/) 에 정리했습니다. 요약은 아래 [구독 vs API](#구독-vs-api-왜-api-키인가) 절을 보세요.

## 빠른 시작

Node.js 22.13 이상이 필요합니다.

```bash
npm install
cp .env.example .env        # ANTHROPIC_API_KEY, ADMIN_PASSWORD 등을 채웁니다
npm start                   # http://localhost:3000
```

- 첫 실행 때 `.env`의 `ADMIN_USERNAME`/`ADMIN_PASSWORD`로 교수자 계정이 만들어집니다. (또는 `npm run create-admin -- prof 비밀번호`)
- 교수자로 로그인하면 `/admin` 교수자 화면으로 이동합니다.
- API 키 없이 화면만 보려면 `.env`에 `MOCK_PROVIDER=true` 를 넣고 실행하세요.

### 학생 계정 만들기 (둘 중 하나)

1. **교수자 화면 → 계정 만들기**: `학번,이름` 목록을 붙여넣으면 초기 비밀번호가 생성됩니다. CSV로 저장해 나눠주세요.
   (명령줄: `npm run import-students -- 명단.csv > 비밀번호.csv`)
2. **참여 코드**: `.env`에 `CLASS_JOIN_CODE=...` 를 넣으면 학생이 첫 화면의 "처음 가입"에서 코드·학번·이름으로 직접 가입합니다.

학생은 처음 로그인할 때 "모든 질문과 답변을 교수자가 열람한다"는 안내에 동의해야 질문할 수 있습니다(동의 시각이 기록됩니다). 문구는 `CONSENT_TEXT` 환경변수로 바꿀 수 있습니다.

## AI 연결 방식

| 화면에 보이는 이름 | 쓰는 것 | 필요한 설정 |
|---|---|---|
| Claude 채팅 (웹 검색 포함) | Anthropic Messages API + 서버측 `web_search` 도구 | `ANTHROPIC_API_KEY` |
| Claude 에이전트 (파일 작업 · 웹 검색) | Claude Agent SDK (Claude Code 엔진). 학생·대화별 작업 폴더에서 Read/Write/Edit/Glob/Grep/WebSearch/WebFetch | `ANTHROPIC_API_KEY`, `AGENT_ENABLED=true` |
| OpenAI 채팅 (웹 검색 포함) | OpenAI Responses API + `web_search` 도구 | `OPENAI_API_KEY`, `OPENAI_MODEL` |
| 이름은 직접 지정 (예: DeepSeek, 로컬 모델) | OpenAI 호환 API — 중국 API(DeepSeek·Qwen·GLM·Kimi·MiniMax)나 Ollama·vLLM·llama.cpp 로컬 모델. 웹 검색(SearXNG/Tavily)과 에이전트 모드(파일 작업) 선택 | `COMPAT_1_*` ~ `COMPAT_5_*`, `SEARCH_PROVIDER` |

- 기본 모델은 `claude-opus-5-5` 입니다. 비용을 줄이려면 `.env`에서 `ANTHROPIC_MODEL`/`AGENT_MODEL`을 `claude-sonnet-5-5`(약 절반) 또는 `claude-haiku-5-5`(약 1/40)로 바꾸세요.
- 에이전트 모드는 같은 대화 안에서 이전 작업을 이어갑니다(세션 재개). 학생과 교수자 모두 화면에서 작업 폴더의 파일을 보고 내려받을 수 있습니다.
- 에이전트의 **명령 실행(Bash)은 기본으로 꺼져 있습니다.** 켜면(`AGENT_ALLOW_BASH=true`) 학생이 서버에서 코드를 실행할 수 있게 되므로, 반드시 이 앱만 돌리는 전용 VM/컨테이너에서 운영하세요. 켜면 Claude Code의 샌드박스(리눅스는 bubblewrap 필요)가 강제되고, 샌드박스를 쓸 수 없으면 실행을 거부합니다.
- 에이전트는 교수자 개인 Claude Code 설정·로그인을 읽지 않도록 학생별 전용 설정 폴더(`data/claude-config/<학생ID>`)를 쓰고, 구독 로그인으로 실행되려 하면 즉시 중단합니다.

## Claude 이외 모델: 중국 API와 로컬 모델

`.env`의 `COMPAT_n_*` 설정으로 최대 5개까지 동시에 붙일 수 있고, 학생은 화면에서 고릅니다. 예시는 `.env.example`에 있습니다.

- 모델이 도구 호출(function calling)을 지원하면 **웹 검색**(`SEARCH_PROVIDER` 설정 시)과 **에이전트 모드**(`COMPAT_n_AGENT=true`, 학생 작업 폴더에서 파일 목록·읽기·쓰기·수정)가 됩니다. 에이전트의 코드 실행 기능은 없습니다.
- 웹 페이지 읽기는 서버 내부망(로컬 모델 서버, 공유기 등) 주소를 열지 못하게 막혀 있습니다.
- 생각(추론)하는 모델의 생각 과정은 학생 화면에 보이지 않고 답만 보입니다.

### 중국 API (종량제)

- **종량제 API 키만 쓰세요.** GLM Coding Plan, Kimi Code, MiniMax Token Plan, Alibaba Coding Plan 같은 **구독 플랜은 각 회사 약관이 자기 앱·웹사이트 백엔드에서 쓰는 것을 금지**합니다(계정 정지, 환불 없음).
- 종량제는 싸서, 학생 40명·주 2회·15주 가벼운 채팅 기준 한 학기 약 $10~100 수준입니다(DeepSeek Flash, Qwen Flash, GLM-5.3-Flash 등. 2026-10 검색 기준, 콘솔에서 확인).
- 학생 질문이 해외 서버로 가므로 **국외 이전 별도 동의**가 필요합니다. DeepSeek은 데이터가 중국에 저장되고 2025년 개인정보보호위원회 시정권고 이력이 있어(앱 대상), 학교가 민감하게 볼 수 있습니다. 싱가포르 서버를 쓰는 Qwen(국제판)·GLM(Z.ai)·Kimi가 무난합니다.

### 로컬 모델 (직접 운영)

약관 문제가 없고, **학생 질문이 밖으로 나가지 않아** 개인정보 부담이 가장 작습니다. 다만 2026년 GPU 가격이 높아 API보다 싸지는 않고, 품질은 Claude·GPT보다 낮습니다. 개념 설명과 학부 수준 코딩 도움은 27~35B급 모델로 대체로 충분하지만, 자연스러운 한국어 글쓰기·첨삭과 긴 에이전트 작업은 차이가 큽니다. 꼭 수업 전에 시험해 보세요.

동시 5명 기준 추천 구성 (2026-10 조사, 가격·속도는 2차 자료라 확인 필요):

| 구성 | 모델 | 장비 | 비용 |
|---|---|---|---|
| A. 수업 시간에만 클라우드 GPU 대여 (가장 먼저 시험해 볼 것) | Qwen3.8-27B 또는 더 빠른 Qwen3.6-35B-A3B | RunPod·Vast.ai의 RTX 5090 32GB | 시간당 약 $0.34~1.19, 학기당 약 $35~250 |
| B. 연구실 상시 서버 | Qwen3.6-35B-A3B, Qwen3.8-27B (한국어 비교용 EXAONE 4.5도 시험) | RTX 5090 워크스테이션 (약 ₩1,000만~1,300만) 또는 중고 RTX 3090 2장 | 장비 구입비 |
| C. 큰 모델·에이전트까지 | gpt-oss-120b + Qwen3.8-27B | RTX PRO 6000 96GB | GPU만 약 $9,000~16,000 |

- 라이선스: Qwen·gpt-oss(Apache-2.0)는 문제없습니다. EXAONE 4.x는 비영리 연구·교육용으로 허용(유료 강좌는 회색지대), HyperCLOVA X SEED는 "Powered by HyperCLOVA X" 표기가 필요합니다(`MODEL_NOTICE`에 넣으면 학생 화면 하단에 표시).
- 국산 모델이 한국어를 더 잘한다고 단정하기 어렵습니다. LG가 공개한 비교표에서도 Qwen3.5-27B가 EXAONE 4.5보다 한국어 점수가 높았습니다.

설치 순서 (서버 한 대에 포털과 모델을 같이 두는 경우):

1. **모델 서버** — 셋 중 하나
   - 가장 쉬움, Ollama: 설치 후 모델을 받고 **`OLLAMA_NUM_PARALLEL=5`** 를 꼭 설정하세요(기본값 1이라 학생들이 줄을 섭니다). 에이전트 모드를 쓰면 `OLLAMA_CONTEXT_LENGTH`도 32768 이상으로 늘리세요. 주소는 `http://localhost:11434/v1`.
   - 무난함, llama.cpp: `llama-server -m 모델.gguf -np 6 --jinja --api-key 비밀키` → `http://localhost:8080/v1` (SearXNG와 포트가 겹치면 바꾸세요).
   - 동시 접속에 가장 좋음, vLLM(리눅스): `vllm serve <모델> --enable-auto-tool-choice --tool-call-parser qwen3_coder --reasoning-parser qwen3 --api-key 비밀키` → `http://localhost:8000/v1`.
   - 모델 서버는 인터넷에 직접 열지 말고, 포털만 밖에서 접속하게 하세요.
2. **웹 검색(선택)** — SearXNG를 Docker로 띄우고 `settings.yml`의 `search.formats`에 `json`을 추가한 뒤, `.env`에 `SEARCH_PROVIDER=searxng`, `SEARXNG_URL=http://localhost:포트`. 검색어 자체는 외부 검색엔진으로 나갑니다(학생 신원은 나가지 않음).
3. **포털 `.env`**
   ```
   COMPAT_1_NAME=로컬 모델
   COMPAT_1_BASE_URL=http://localhost:11434/v1
   COMPAT_1_API_KEY=ollama            # vLLM·llama.cpp 는 위에서 정한 비밀키
   COMPAT_1_MODEL=받은 모델 이름        # ollama list 로 확인
   COMPAT_1_AGENT=true
   COMPAT_1_REASONING_EFFORT=low      # 생각 시간을 줄여 응답을 빠르게 (서버가 지원할 때)
   ```
   생각 모드를 아예 끄는 옵션은 서버마다 다릅니다. 예를 들어 vLLM의 Qwen은 `COMPAT_1_EXTRA_BODY={"chat_template_kwargs":{"enable_thinking":false}}`. 사용량 집계 때문에 오류가 나는 서버면 `COMPAT_1_STREAM_USAGE=false`.
4. 어려운 과제용으로 Claude나 중국 API를 `COMPAT_2_*`에 함께 붙여 두면, 평소에는 로컬, 필요할 때만 API를 쓰는 혼합 운영이 됩니다.

## 구독 vs API: 왜 API 키인가

조사 결과(2026년 10월 기준, 자세한 출처는 보고서):

- **개인 구독(Claude Pro/Max, ChatGPT Plus/Pro)을 웹사이트에 연결해 여러 학생이 쓰게 하는 것은 두 회사 모두 약관으로 명시적으로 금지**합니다. Anthropic은 Pro/Max 자격 증명으로 다른 사용자의 요청을 처리하는 것을 금지하고 계정 정지 시 환불도 없습니다. OpenAI도 계정을 다른 사람이 쓰게 하는 것과 "한 사용자의 구독으로 다른 사용자의 요청을 처리"하는 것을 금지합니다. 학기 중 계정이 정지되면 수업 전체가 멈추는 위험이 있습니다.
- 기술적으로도 40명이 한 구독을 동시에 쓰면 5시간/주간 사용 한도를 수업 한 번에 소진할 가능성이 큽니다.
- **구독을 우선하면서 약관을 지키는 방법**: Claude **Max** 요금제에는 매달 API 크레딧(Max 5x $100, Max 20x $200, 이월 불가)이 포함되어 있고, 연결한 Console 조직에서 "자신의 앱과 에이전트"를 만드는 데 쓸 수 있습니다. 그 조직에서 발급한 API 키를 이 포털의 `ANTHROPIC_API_KEY` 로 넣으면 구독료 안에서 먼저 쓰고, 넘으면 API 요금으로 이어집니다. (크레딧 세부 약관은 Console에서 꼭 확인하세요.)
- Claude Code의 법적 고지도 API 키를 "고객의 승인된 사용자"가 쓰는 것은 허용합니다. 이 포털이 바로 그 구조입니다.

### 대략적인 비용 (학생 40명, 주 2회, 15주)

| 사용 형태 | Haiku 5.5 | Sonnet 5.5 | Opus 5.5 |
|---|---|---|---|
| 가벼운 채팅 (수업당 20회 대화) | 약 $16 | 약 $300 | 약 $600 |
| 채팅 + 웹 검색 | 약 $140~160 | 약 $530~900 | 약 $940~1,670 |
| 매 수업 에이전트(코딩) 사용 | 약 $76 | 약 $1,300 | 약 $2,600 |

30명이면 ×0.75, 50명이면 ×1.25. 가정과 계산식은 보고서 참고. Max 20x 크레딧($200/월)이면 Sonnet 5.5 기준 대화형·검색형 수업은 대부분 감당되고, 매 수업 에이전트 실습은 크레딧을 넘습니다.

- **Anthropic Console에서 수업 전용 워크스페이스를 만들고 월 지출 한도와 알림(50%·80%)을 설정**하세요. 이 앱의 `MONTHLY_BUDGET_USD`, 학생별 하루 한도와 함께 쓰면 이중으로 막힙니다.
- 신규 Console 조직(Start 등급)은 **월 지출 상한이 $500**이라, 넘으면 다음 달 1일까지 요청이 막힙니다. 에이전트 실습을 많이 할 계획이면 미리 상위 등급을 신청하세요.
- 이 앱은 대화 기록을 다시 보낼 때 지난 웹 검색 결과 원문은 빼고 답변 텍스트만 보내므로, 검색 결과가 쌓여 비용이 불어나는 것을 줄입니다. 대화 앞부분은 프롬프트 캐싱으로 재사용됩니다.
- 학생에게 이용료를 받으면 안 됩니다(재판매에 해당). 비용 표시는 공개 단가로 계산한 추정치이며 실제 청구액은 Console 기준입니다. 단가가 바뀌면 `PRICING_OVERRIDES`로 고칠 수 있습니다.

## 교수자 화면에서 볼 수 있는 것

- 학생별: 대화 목록, 질문 수, 토큰, 추정 비용, 최근 사용 시각
- 대화별: 질문·답변 전문, AI가 실행한 웹 검색어와 검색 결과, 에이전트가 읽고 쓴 파일과 도구 입력/출력, 작업 폴더 파일, JSON 저장
- 전체 기록 검색, CSV 내보내기(엑셀에서 한글이 깨지지 않게 저장)
- 접속·감사 기록: 로그인/실패, 동의, 한도 초과, **교수자의 대화 열람·내보내기**까지 기록

학생은 자기 대화를 지울 수 없습니다(평가·지도용 기록 보존). 다른 학생의 대화나 파일에는 접근할 수 없습니다.

## 운영 시 유의점

- **개인정보보호법**: 수집 항목(학번·이름·질문/답변), 이용 목적, 보유 기간, 열람자, 그리고 **질문 내용이 해외(미국) AI 회사 API로 전송된다는 점(국외 이전)** 을 강의계획서나 첫 수업에서 안내하고 동의를 받으세요. 성적이 걸린 수업이면 AI 없이도 과제를 할 수 있는 대안을 함께 제시해야 동의가 자유롭다고 볼 수 있습니다. 화면의 동의 문구(`CONSENT_TEXT`)를 학교 기준에 맞게 고치세요. 학교 개인정보 담당 부서와 미리 상의하길 권합니다.
- **기록 파기**: 보존 기간이 지나면 `npm run purge -- 2027-03-01` 처럼 날짜를 주면 그 이전의 대화·메시지·작업 파일·감사 기록을 지웁니다. 학기가 끝나면 `data/claude-config/` 폴더도 지우세요.
- **AI 고지**: 채팅 화면과 동의 문구에 "답변하는 상대는 사람이 아닌 AI"라는 안내가 들어 있습니다(Anthropic 이용정책 요구사항). 지우지 마세요.
- **HTTPS**: 학교 밖에서 접속하게 하려면 Caddy/Nginx 같은 리버스 프록시로 HTTPS를 붙이고 `.env`에 `SECURE_COOKIES=true`, `TRUST_PROXY=true` 를 설정하세요.
- **백업**: 모든 기록은 `data/class-ai.db`(SQLite) 한 파일과 `data/workspaces/`(에이전트 작업 파일)에 있습니다.
- 서버 하나(1~2 vCPU, 2~4GB RAM)로 채팅은 충분합니다. 에이전트 모드는 동시 실행 1건당 메모리를 꽤 쓰므로(공식 권장 약 1GiB), 동시에 많이 쓸 예정이면 서버를 키우세요.

## 다른 선택지와 비교

이미 만들어진 오픈소스를 쓰고 싶다면 **Open WebUI + LiteLLM** 조합도 좋은 선택입니다(보고서의 1순위 권고). 관리자 대화 열람이 기본으로 켜져 있고 기능이 훨씬 많습니다. 이 포털과의 차이는 다음과 같습니다.

| | 이 포털 | Open WebUI (+LiteLLM) |
|---|---|---|
| 교수자의 학생 대화 열람 | 기본 제공 (도구 사용·작업 파일 포함) | 기본 제공 |
| 학생별 비용 한도 | 기본 제공 | LiteLLM 등 별도 구성 필요 |
| Claude Code식 에이전트(학생별 작업 폴더) | 기본 제공 | 사용자별 격리 터미널은 유료 기능 |
| Anthropic 프롬프트 캐싱 | 네이티브 API라 적용됨 | OpenAI 호환 경유라 제한될 수 있음 |
| 학교 계정(Google) 로그인, 플러그인, 다양한 검색엔진 | 없음 (학번·비밀번호) | 있음 |
| 성숙도 | 초기 버전 | 대규모 사용자, 활발히 개발 중 |

대학이 이미 ChatGPT Edu·Gemini for Education 등을 제공한다면 그쪽을 먼저 검토하세요. 다만 그 경우 학생 기록은 교수자가 아니라 학교 IT 관리자 권한으로만 볼 수 있습니다.

## 개발

```bash
npm test     # 실제 AI 호출 없이 로그인·동의·질문·교수자 열람·권한·한도·경로 보호를 검사
npm run dev  # 파일이 바뀌면 자동 재시작
```

구조:

```
src/server.js              라우트, 스트리밍(NDJSON), 한도 검사, 교수자 API
src/db.js                  SQLite 스키마 (users, conversations, messages, audit_log)
src/auth.js                scrypt 비밀번호, 세션 쿠키, CSRF 방어, 로그인 제한
src/providers/anthropic.js Claude 채팅 + 웹 검색
src/providers/claude-agent.js  Claude Agent SDK 에이전트 모드
src/providers/openai.js    OpenAI 채팅 + 웹 검색
src/providers/compat.js    OpenAI 호환 API(중국 API·로컬 모델) 채팅·에이전트
src/tools/                 Claude 이외 모델용 웹 검색·페이지 읽기·파일 도구
src/pricing.js             비용 추정 단가표
scripts/                   교수자 계정 생성, 학생 명단 가져오기, 기록 파기
public/                    학생 화면(chat), 교수자 화면(admin), 로그인
reports/, research_notes/  조사 보고서와 근거 노트
```
