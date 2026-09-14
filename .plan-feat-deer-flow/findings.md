# findings — deer-flow 对照调研

## Goal Contract（Stage 0.5）

- **Objective:** 调研 bytedance/deer-flow → ex-web HTML 报告四部分（详梳/对比/演进/推广）
- **Success Criteria:**
  - SC1 详梳全部有本地仓实读证据（file:line）
  - SC2 对比先定口径（同类性校准三轴）再采集，证据分级（一手/自述/推断）逐条标注
  - SC3 演进建议逐条映射「deer-flow 机制 → flowkit 落点 → 三选一判定」
  - SC4 推广含双路线 + 每条动作有第一步与成本；生态数据权威源核验
  - SC5 HTML 单文件零依赖 + 关键声明可回源 + footer 快照日期
- **Constraints:** 关键数字 GitHub API 实测（star=82,329 已核验 2026-09-13）；只读双仓；演进建议不违反 flowkit 设计宪法
- **Non-goals:** 不实施建议；不部署 deer-flow；不做生态全景横评
- **Verification Plan:** HTML 机检 + 关键数字回源抽查 + Goal Verification 表
- **Execution Strategy:** fan-out 2 分片 + 主会话整合 + ex-web 产出（调研裁剪+fan-out，用户已批准）
- **Relevant History:** industry-research-wiki（分片按信息源切/证据分级/幸存者偏差防护）、agent-teams（三路分片/素材前置 clone/三选一判据）、evidence-audit-method（权威源实开核验）、experience/skill-flow-deep.md（调研裁剪经验）

## Stage 2 结论（ST + 三角色收敛四共识）

1. 先校准意图与同类性再对比（防伪命题归因 + 层级错配失真）
2. 对比分可比面（评分）/不可比面（描述）
3. 概念同构对照表为报告核心章节
4. 演进用三选一判据；推广给双路线，裁决留用户

## 分片底稿（Phase 1，执行中填写）

### 1.1 deer-explorer 底稿（已验收，2026-09-13；agent 已收本体）

**Step 0 结构核对**：基线信号全部在场（backend+frontend/skills/plans/CLAUDE.md/AGENTS.md/README×4/Install.md/Makefile/docker/docs/examples 均 CONFIRMED）。多出（正常补充）：contracts/、deploy/(helm)、pr-build/、tests/、scripts/、SECURITY.md、RELEASING.md、CONTRIBUTING.md、CHANGELOG×2、CODE_OF_CONDUCT.md。无缺失。

#### 1. 产品形态与架构

四服务拓扑（AGENTS.md:23-48）：**Nginx(2026 统一入口) → Gateway API(8001, FastAPI+内嵌 LangGraph 运行时) + Frontend(3000, Next.js 16/React 19) + Provisioner(8002, 可选, sandbox K8s 模式)**。backend 是 uv workspace 三包：`packages/extension-api`(公共契约) + `packages/harness`(deerflow.* agent 框架) + `app/`(FastAPI Gateway + IM channels)，依赖方向单向 app→harness，由 `tests/test_harness_boundary.py` 在 CI 强制（backend/AGENTS.md:197-221）。技术栈：Python 3.12+/LangGraph 1.2.x/FastAPI/e2b-code-interpreter + 8 个 IM SDK；前端 pnpm+Tailwind 4+Radix+TanStack Query。
**新用户最短路径**：`make setup`（约 2 分钟）→ `make dev` → localhost:2026；Docker：`make docker-init && make docker-start`。独特设计：**Install.md 是写给 coding agent 的执行剧本**（幂等规则/停止边界/成功判据/报告格式，Install.md:1-87）——clone 后丢给 Claude Code/Codex 即可自动安装（README.md:99-101 官方主推）。配置双文件 config.yaml+extensions_config.json，gitignored、可被 Gateway 运行时改写。版本 2.1.0 四源锁步（verify_versions.sh 在 v* tag 阻断，AGENTS.md:232-237）。

证据：E1.1-01 四服务 AGENTS.md:23-48｜E1.2-01 harness/app 边界 CI 强制 backend/AGENTS.md:204｜E1.3-01 Install.md agent 剧本 Install.md:3｜E1.4-01 版本锁步 AGENTS.md:232-237（均 CONFIRMED）

#### 2. skills/ 与 plans/ 真实机制（核心证伪点）

**skills/ 是真运行时机制，工程厚度远超「名字像」**：`skills/public/` 24 技能（SKILL.md+可选 scripts/references/evals），`skills/custom/` gitignored，`.deer-flow/integrations/skills/{provider}/` 全局集成包（AGENTS.md:65-67）。消费链 harness 侧 20+ 文件：
- **三问①触发→产出**：三激活路径——被动注入（`<available_skills>` 全量元数据）、延迟发现（`deferred_discovery` 只给 `<skill_index>` 名单保持 prompt-cache 友好，`describe_skill` 按需取全文，skills/AGENTS.md:10-12）、slash 激活（`/skill-name task` 仅当前 call 加载，AGENTS.md:13）。allowed-tools 动态生效：slash 期该技能策略权威；注册表失败 fail-closed（skills/AGENTS.md:7）
- **三问②状态**：技能本体=文件系统 SKILL.md；启用态=extensions_config.json+per-user；**Sandbox projection**（skills/projection.py）把 enabled-only 技能物化为 per-thread 复制树+三方签名 manifest，原子替换、拒逃逸 symlink、复制非硬链保写隔离——「为写隔离牺牲零拷贝」（skills/AGENTS.md:8）；digest 检测沙箱内篡改并修复
- **三问③失败**：注册 fail-closed；投影失败先清视图再 raise；安装 ZIP 先过 **SkillScan**（确定性 AST 扫描，CRITICAL 阻断）再过 LLM 扫描（skills/AGENTS.md:16）；CI waiver 清单绑定文件 SHA-256+过期日、永不豁免 blocker、**两个 merge 才生效**防「边改边免」（AGENTS.md:100-109）
- 安全边界自述：README.md:920 "best-effort behavioral scoping, not a hard security boundary"；required-secrets 六面封口不进 prompt/命令串/trace/checkpoint/审计/持久化（skills/AGENTS.md:19-32）

**plans/ 不是运行时机制**：仅 1 文件 `subagent-card-runtime-metadata.md`（2026-07-10 PRD→实施计划，过程工件，运行时无消费者）[CONFIRMED find 全目录]。真正运行时「计划」是 **Plan Mode**（TodoList 中间件+`write_todos` 工具，backend/AGENTS.md:358-365）。

证据：E2.1-01 三激活路径 skills/AGENTS.md:9-13｜E2.2-01 projection 写隔离 skills/AGENTS.md:8｜E2.3-01 SkillScan skills/AGENTS.md:16｜E2.4-01 waiver 双 merge AGENTS.md:100-109｜E2.5-01 plans/ 仅过程文档｜E2.6-01 best-effort 自述 README.md:920

#### 3. CLAUDE.md 与 AGENTS.md

CLAUDE.md 仅 5 行 thin shim `@AGENTS.md`。AGENTS.md 239 行 monorepo orientation layer，分层指路 backend/AGENTS.md(407 行)+frontend/AGENTS.md(174 行)+各子系统 AGENTS.md（skills/subagents/sandbox/runtime/memory/channels 均有）。文档同 update 政策（改代码必同 changeset 改 README+AGENTS.md，backend/AGENTS.md:85-92）；**TDD 强制**（"No exceptions"，backend/AGENTS.md:248-256）；**每个子系统目录有自己的 AGENTS.md 承载行为契约**——就近原则（"Follow the nearest file in the directory tree"，backend/AGENTS.md:193）。

证据：E3.1-01 shim CLAUDE.md:5｜E3.2-01 TDD 强制 backend/AGENTS.md:248｜E3.3-01 就近原则 backend/AGENTS.md:193

#### 4. 编排核心概念落点

- **graph**：LangGraph 单 lead agent 图（agent.py 1228 行+prompt.py 1178 行系统提示）；checkpoint full/delta 双模式（delta O(N)，process-frozen 需重启，非对称兼容 fail-closed）
- **pipeline**：无显式 pipeline 抽象——编排=**40+ middleware 链**（summarization/loop_detection/token_budget/input_sanitization/skill_activation/skill_tool_policy/subagent_limit/tool_receipt/receipt_verification/delegation_ledger/memory_middleware/sandbox_audit…）；官方叙事转折点 "From Deep Research to Super Agent Harness"（README.md:896）
- **subagent**：executor+registry+内置 general-purpose/bash；持久隔离 event loop+进程级 FIFO 准入（默认并发 3，上限 1-64）；`max_total_per_run` 默认 6 防批量绕过；超时 1800s；**benefit-based routing**："Sub-agents are an optimization, not the default response to a complex request"（README.md:1285）；context_mode isolated|snapshot（README.md:1257-1273）
- **loop**：LoopDetectionMiddleware（重复 tool-call 集→hard-stop 强制 final answer）；外部循环靠 **scheduler/**（cron 预览 API、lease-fenced claiming、多实例需 Postgres+heartbeat+advisory lock）
- **memory**：MemoryManager 契约+middleware 被动捕获+工具 CRUD+4 后端（**DeerMem 默认本地**/mem0/OpenViking/Honcho）。DeerMem：extraction 按 scope/durability/authority 分类→确定性写门；驱逐=confidence 65%+显式确认 25%+访问热 10%（shadow 可并评）；SQLite FTS5/BM25；事实 per-agent Markdown 分桶；**LongMemEval 验证驱逐策略**（backend/AGENTS.md:119-136）
- **sandbox①落点**：ABC+provider resolve；6 实现：Local(host 子进程)/AIO(Docker DooD)/**E2B(云)**/OpenSandbox/Tenki/Boxlite+provisioner(K8s)；per-thread 隔离（config/paths.py:330-391）
- **sandbox②信任边界**：LocalSandboxProvider 官方标注 **"not a secure sandbox boundary"**，host bash 默认禁用（security.py:9-12、README.md:953-957）；env_policy.py 默认洗 *KEY*/*SECRET*/*TOKEN*/*PASS*/*CREDENTIAL*/*DSN*（"scrubs by default — security first"）；网络准入+TTL；默认仅 127.0.0.1 loopback、"Gateway Admin Is Equivalent to Code Execution"（README.md:1666-1695）
- **gateway①落点**：双含义——API Gateway=`app/gateway/`（27 routers）；message gateway=`app/channels/`（Feishu/Slack/Telegram/Discord/DingTalk/WeCom/WeChat/**Buzz(Nostr)**/GitHub webhooks，25 文件）
- **gateway②信任边界**：run-context 双门（context 白名单合并 × config 逐字复制；`__`前缀剥除防伪造）；fail-closed AuthMiddleware+JWT+PAT+OIDC；owner 过滤 repository 层自动生效；多 worker 需 Postgres+Redis stream bridge+lease 接管+SSE 重放

证据：E4.1-01 middleware 40 文件｜E4.2-01 benefit-based routing subagents/AGENTS.md:19｜E4.3-01 guardrail 三轴+additive stop_reason :32｜E4.4-01 DeerMem README.md:1466-1478｜E4.5-01 Local 沙箱不安全 security.py:9-12｜E4.6-01 env 洗涤 env_policy.py:1-17｜E4.7-01 run-context 双门 backend/AGENTS.md:237-244｜E4.8-01 loopback README.md:1685-1690

#### 5. 维护信号

**局限声明**：浅克隆被 squash 成单 commit，贡献者分布无法本地得出。活动代理指标：HEAD 是 PR **#4921**（2026-09-13）——约两年累计 4900+ PR。核心作者 2 人：Daniel Walnut(hetaoBackend)、Henry Li(magiccube)（README.md:1746-1753）。CONTRIBUTING.md 440 行（Docker 优先）。

证据：E5.1-01 浅克隆局限｜E5.2-01 PR#4921｜E5.3-01 核心作者 README.md:1746-1753

#### 6. 官方自定位与竞品叙事

- 定位句[自述]：README.md:16 "DeerFlow...is an open-source **super agent harness** that orchestrates **sub-agents**, **memory**, and **sandboxes** to do almost anything — powered by **extensible skills**."
- 转型叙事[自述]：README.md:896-908 从 Deep Research 到 harness 的社区驱动重建；"DeerFlow 2.0 is a ground-up rewrite. It shares no code with v1."（:15）；"Use it as-is. Or tear it apart and make it yours."（:908）
- **无显式竞品对比表**——对标策略是定义品类词而非拉踩[CONFIRMED+推断]；2026-02-28 登顶 GitHub Trending（:13）
- 商业引流：Volcengine Coding Plan+BytePlus InfoQuest+**「借用其他 agent 登录态当模型后端」**（Codex CLI/Claude Code OAuth/ACP 复用，README.md:204-246）

证据：E6.1-01 定位句 README.md:16｜E6.2-01 转型叙事 :896-908｜E6.3-01 无竞品对比段

#### 7. 部署与企业化能力

部署 4 模式+5 compose 变体+**K8s Helm chart 完整**（gateway/postgres/redis/provisioner/nginx 全套，deploy/helm/）。企业特性：自建认证（JWT/PAT/OIDC/密码/user_provisioning）、per-user 数据隔离（凭据 0700/0600+拒 symlink）、authz.py 路由级权限、scheduled tasks 多实例 lease。商业化：本体无付费墙，变现走生态位（Volcengine 导流/InfoQuest/LLM Space 姊妹工具）[推断：devrel 导流]。

证据：E7.1-01 Helm 清单｜E7.2-01 多 worker README.md:349｜E7.3-01 认证组件 auth/ 20 文件

#### 8. 质量保障机制

- **测试**：backend 693 test 文件（四类 marker+Blockbuster 阻塞 IO 门+时长感知分片）；frontend 175 test+Playwright e2e（4 config 含 real-backend/replay）+**replay-e2e 专门 workflow**
- **CI**：16 workflow（backend-unit/blocking-io/frontend-unit/e2e/replay-e2e/lint/nightly/skill-review-ci/verify-versions/sandbox-image-smoke/container/chart/label-sync/triage/lark-cli-images/network-proxy-image）
- **evals**：skill-reviewer 自带 evals.json；scripts/benchmark/ 规定不得复制运行时实现、数据集钉 revision+SHA-256、版本化 prompt/seed/时钟（backend/AGENTS.md:99-117）——deermem_eviction（LongMemEval）/context_snapshot/concurrency 三方向
- **验证闭环**：subagent **receipt verification 双层**——Layer 1 确定性 tool receipts（[rN tool_name] 写入 SystemMessage，单源 format_citation 防漂移）；Layer 2 **acceptance_checks.py 代码级验收**（file exists/file_written/tests_passed 确定性检查、shell 结构感知、0 passed 否决、截断降级 UNVERIFIED 不误判、prompt 注入只进 HumanMessage）——**判定 UNVERIFIED 而非默默通过**（subagents/AGENTS.md:26-29，「本仓工程密度最高单段」）
- **审查**：skill-reviewer（只读语义审查）+skill-creator（变更权）+review_skill_package+CI skill-review gate
- **状态管理**：RunManager+checkpoint full/delta+**cancel-with-rollback**（pre-run 物化失败则禁回滚 fail-closed；delta fork 不安全→线性化 resume）

证据：E8.1-01 测试规模｜E8.2-01 CI 16 workflow｜E8.3-01 benchmark 纪律 backend/AGENTS.md:99-117｜E8.4-01 acceptance 双层 subagents/AGENTS.md:26-29｜E8.5-01 rollback fail-closed

#### 9. 文档与 onboarding 质量

README 1757 行：30 秒说服力强（定位句+Trending 战报+demo+2 分钟 setup）但主体是运维手册级长文。**i18n：5 语言全量 README**（en/zh/ja/fr/ru+zh CHANGELOG）。文档三层：AGENTS.md 树（agent 向）+backend/docs 38 篇设计文档+顶层 docs/。特色：make doctor（配置体检）、**make support-bundle（脱敏诊断包+AI issue 草稿+triage.json，明确「AI 填 issue 从 draft 开始不要编造」README.md:137-146）**——onboarding 按「agent 也会读」设计。

证据：E9.1-01 5 语言 README｜E9.2-01 support-bundle README.md:137-146｜E9.3-01 docs 38 篇

#### 10. LICENSE 与商业组件分离

主 LICENSE=MIT（三处一致）。**仓内非 MIT**：`skills/public/skill-creator/LICENSE.txt` 与 `skills/public/frontend-design/LICENSE.txt` 均 **Apache 2.0**（[推断]与 Anthropic 开源 skill 库同源的外部引入技能带原许可证）。SKILL.md frontmatter 自带 `license` 字段（skills/AGENTS.md:4）——技能级许可是 schema 一等公民。

证据：E10.1-01 MIT｜E10.2-01 Apache 2.0 技能许可｜E10.3-01 license frontmatter skills/AGENTS.md:4

#### 附：三问速查表

| 机制 | 触发→产出 | 状态存哪里 | 失败语义 |
|---|---|---|---|
| skills | 被动注入/延迟发现/slash→SKILL.md 成当轮上下文+allowed-tools 收权 | SKILL.md+extensions_config.json+per-thread 投影树（签名 manifest） | 注册 fail-closed；投影先清再 raise；SkillScan 阻断 |
| subagent | lead 按 benefit 调 task→独立上下文→结构化回传 | delegation ledger+SubagentResult+RunEventStore | 不恢复；三轴帽 additive stop_reason；验收不过→UNVERIFIED |
| memory | middleware 捕获+CRUD→per-call 注入 | DeerMem memory.json+facts/*.md+FTS5 侧车 | 写门 fail-closed；驱逐物理删除+审计；索引自动重建 |
| sandbox | 工具调用→provider acquire→命令/文件 | per-thread 树+lease | capture 失败禁回滚；Local 明示非安全边界 |
| checkpoint | 每步写入→full/delta | sqlite/postgres/memory 统一后端 | 409/503 fail-closed；delta fork→线性化；回滚需 pre-run 物化成功 |
| scheduler | cron→durable queued→lease launching | scheduled_task_run 表（uq 活跃约束） | lease 过期→回队列/原子接管；ConflictError→回 queued |

**调研总评**：工程重心不在编排花式，在**验证与边界**——双层验证、fail-closed 密度极高、子系统 AGENTS.md 行为契约、诚实标注自身边界。skills 是被 harness 深度消费的一等公民（激活中间件×2+投影+扫描+waiver 五层设施），plans/ 只是过程文档。

### 1.2 eco-scout 底稿（已验收，2026-09-13；agent 已收本体）

**执行摘要**：web-access 全程可用（CDP + gh api 认证通道），无工具降级；唯一例外 = GitHub 已全平台关闭 stargazers 明细 API（REST 404/GraphQL totalCount=0，平台侧变更），star 时间线改用 star-history SVG 坐标重建（数据源替代非工具降级）。核心发现：**82K 中约 76% 来自 2026-02-28 DeerFlow 2.0 发布之后**；HN 全程冷清（历史最高 4 pts），增长靠 Trending+中文技术社区+字节生态导流。

#### 1. star 增长时间线（SVG 坐标反演，17 采样点，精度 ±400 star/±半个月 [推断]）

- 2025-05-07 创建[一手]；05-09 @ByteDanceOSS 官宣，10 天破 10K[自述+推断]；2025-06 ≈12.3K
- **平台期 2025-06→2026-02：12.3K→≈19.6K，9 个月仅 +7K（月均约 800）**
- 2026-02-28 2.0 发布当日登顶 GitHub Trending #1[一手]；2026-04 ≈35.6K→05 ≈62.1K（**两个月 +42K**）；媒体锚点交叉：知乎「25K+」（3 月上旬）、「不到一个月近 4.9 万」（3 月底）、掘金「43K+ 单日 +4000」（4 月）、钛媒体「57K 霸榜」[自述群]
- 2026-07 ≈70.9K → 08 ≈79.9K → 09-13 **82,333**[一手]
- 归因提示[推断]：两波结构——第 1 波靠「开源 Deep Research」定位+字节背书+LangChain 生态转发（Harrison Chase 转发）；第 2 波靠「SuperAgent harness」重新定位+Trending 榜首+skill 概念热度；第二波量级是第一波 6 倍

#### 2. 官方渠道清单

deerflow.tech（文档站刚起步+blog 仅 4 篇）｜GitHub 主仓 README 即门面（双语+战报+导流）｜org「deer-flow」生态矩阵刚成形（llm-space 1870 star，副仓 <10）｜X 无独立账号走 @ByteDanceOSS｜字节系导流（BytePlus/火山引擎 utm+Gitee 镜像）｜**无 Discord/官方群入口**。策略特点[推断]：渠道轻资产、GitHub 单点深耕+知乎官方号长文；自托管 star-history 实例说明团队自己盯 star 曲线作运营指标。

#### 3. 社区反馈

规模：issues 2,009（closed 74%）+PR 3,193+discussions 112（低一量级，偏企业集成 Q&A）。主题分布[一手]：历史热门期 top3=部署安装 Docker 45/UI 44/模型兼容 44；近期工程期 top=UI 56/Memory 49/部署 39/模型兼容 34/MCP 21。第三方评价[自述]：「执行优先的超级智能体运行时基础设施——给 AI 一台真正的计算机」「NAS 里装 Kimi/Gemini/GLM 的超级 Agent（自托管个人玩家）」「大部分框架解决怎么造一个 Agent，DeerFlow 解决怎么让一群 Agent 一起干活」；HN 负发现：历次最高 4 pts 从未进社区视野[一手]。

#### 4. 用户画像与使用场景（防官方叙事遮蔽）

谁在用[一手+自述]：国际开发者为主体+中文社区强参与（近期 issue 中文标题 26%）；自托管/NAS 个人玩家；企业内网部署方（#117 内网部署 30 评论全仓最热）；2.0 后专业开发者涌入（issue 面貌从配置踩坑变为 RFC/middleware/gateway/skill 工程议题，编号已达 #5394）。
**典型工作流[自述-官方亲口]**：「有人拿 DeerFlow 搭数据分析 pipeline，有人批量生成 PPT，有人做自动化内容工厂，甚至有人接内部系统做运维巡检」「**大家真正在用的不是 DeerFlow 的 Research 能力——而是它底下那套让 Agent 能真正做事的运行时基础设施**」。
**高频抱怨 top5**[一手]：①部署/安装/Docker（内网/Windows/socket 报错，两期均 Top3）②模型/供应商兼容（ollama/openrouter/内网模型）③UI/前端体验 ④Memory/上下文与多轮连续性 ⑤文档错误缺失。附加：性能（「慢得感人」/recursion limit 100 硬编码/504）。
**用户真实依赖**：开箱即用（对比自拼 framework）、可自托管、模型可替换——抱怨集中于「开箱即用承诺与真实环境（内网/国产模型/Windows）的摩擦」。

#### 5. 幸存者分母参照（GitHub API 2026-09-13 实测[一手]）

| 项目 | stars | 创建 | 赛道 |
|---|---|---|---|
| FoundationAgents/OpenManus | 58,291 | 2025-03 | 通用 SuperAgent（Manus 开源复刻） |
| stanford-oval/storm | 31,296 | 2024-03 | deep research（赛道基准） |
| huggingface/smolagents | 29,300 | 2024-12 | agent harness |
| dzhng/deep-research | 19,662 | 2025-02 | deep research |
| gemini-fullstack-langgraph-quickstart | 18,326 | 2025-05 | agent 官方 quickstart |
| langchain-ai/open_deep_research | 12,676 | 2024-11 | deep research |

量级结论[推断]：赛道头部常态 10K-60K（中位 ≈24K）；deer-flow 82K ≈ 中位 3.4 倍、第 2 名 1.41 倍——**突出但非孤例**（OpenManus 证明 50K+ 可达）；超额部分主要来自 2.0 转型+字节系导流，非赛道整体水涨船高。选择标准：同期窗口或赛道公认头部，剔除停维护/纯教程，含两个天花板不挑软柿子。

#### 6. 首发与传播节点

2025-05-07 创建→05-09 官宣推文→05 上旬 Harrison Chase 转发（生态大 V 背书=首月爆发放大器[自述]）→05-12 HN 首帖 4 pts 无热度→**2026-02-28 2.0 发布**（春节开发，与 1.0 零共享代码；「skill」表述对齐 OpenClaw/Claude Skills 热度）当日 Trending #1→2026-03 中文社区集中爆发→2026-06-25 v2.0.0 正式 tag。
**事件-拐点对齐判定[推断]**：2.0 发布与 star 拐点（斜率陡增 5-40 倍）强耦合；1.0 期平台期无等量级事件对应——**事件驱动特征显著**。

方法学附注：star 曲线为 SVG 反演非逐星原始数据（已按最保守口径）；issues 聚类为 keyword bucket 相对排序；知乎官方文按[自述-官方]采信。全程只读。

## 整合产出（Phase 2，执行中填写）

### 同类性校准
### 对比矩阵 + 概念同构对照表
### 演进吸收建议
### 推广策略

## Plan Review（Stage 3.5）

- 2026-09-13 plan-reviewer-c（独立上下文）审 v1：**NEEDS_REVISION**——CRITICAL×1（F0 克隆目录在会话期间被外部删除，「已就绪」为假前提，直接派发必失败或幻觉 file:line）+ HIGH×7（F1 维护信号缺/F2 自定位缺/F3 同构表预填映射致确认偏误/F4 详梳章无整合环节/F5 flowkit 视角遮蔽用户视角/F6 证据回溯无可检查机制/F7 意图校准无证据源无 sign-off）+ MEDIUM×9 + LOW×2，共 19 条
- v2 全数采纳：存在性断言前置（重克隆已启动，用户裁定）/ 同构表改三问行为契约制 / 详梳环节 / 意图 sign-off 门 / 分片清单 +5 项 / 证据编号制 / 假设看板 H1-H4 / Evidence 表固定形式。自评 8.4 → 9.3
- **漂移事故登记**：首轮克隆 exit 0 且 ls 验证过，12:13 前后被外部删除（非编排方动作）——planning-with-files「文件态≠磁盘态」实例；已前置存在性断言

## Goal Contract 增补（v2）

- SC2 升级：抽查 HTML 全部数字/事实断言，**无徽章断言数 = 0**
- SC5 升级：Phase 4 Evidence 表固定形式（SC 编号/实际执行验证动作含抽查命令/结果），抽查 ≥10 条或全量（证据 <50）
- 新增 SC6（F7）：意图目标陈述经用户 sign-off 后才进对比章
- 新增 SC7（F6）：每条演进/推广建议引用 ≥1 个真实存在的证据编号

## Goal Verification（Stage 5）
（待验证）
