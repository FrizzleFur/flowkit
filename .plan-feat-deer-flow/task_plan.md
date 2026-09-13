# deer-flow 对照调研计划

**Goal:** 调研 bytedance/deer-flow（82,329★ 已 API 核验），产出 ex-web 风格单文件 HTML 调研报告四部分：仓库详梳 / 同类性校准+优劣势对比 / flow 演进吸收 / flowkit 推广策略。
**Architecture:** fan-out 两分片并行采集（本地仓深读 + 生态社区数据）→ 主会话统一口径整合（校准→对比→演进→推广）→ ex-web HTML 产出 → 机检验证。
**Tech Stack:** 只读双仓 + web-access 生态采集 + GitHub API 权威数据 + ex-web 模版。

## 已核验基线事实（一手）

- star **82,329** / fork 11,358 / open issues 895 / subscriber 346（GitHub API 实测 2026-09-13）
- MIT / Python / 创建 2025-05-07 / 持续推送（2026-09-13）
- 官方描述: "long-horizon SuperAgent harness... sandboxes, memories, tools, skill, subagents and message gateway"
- 本地仓结构信号: backend+frontend 双端 / `skills/` / `plans/` / CLAUDE.md+AGENTS.md / README ×4 语言 / 完整 OSS 卫生文件

## 报告核心论证线（三角色收敛，待证据逐条证实/证伪）

1. 同类性校准先行：层级（产品框架 vs 会话编排方法论）×受众×分发三轴——「很接近」是待验证前提
2. 概念同构对照表（报告核心章节）：它的 skill/subagent/plans/memory/gateway ↔ flowkit 的 auto-skill/multi-agent/STATE/loops
3. star 归因只从可观察证据反推，逐条标[推断]；先校准 flowkit 意图目标，防伪命题归因
4. 演进守设计宪法（吸收≠重框架化）；推广给双路线（产品化 vs 窄众深耕）不替用户选

---

## Phase 1: 素材分片并行
**可否并行:** 是（两分片同消息 ≤3 合规）｜**依赖:** 克隆完成（已就绪）

### Task 1.1: deer-flow-explorer（本地仓深读，不联网）
**输入:** /Users/new/Documents/Repos/deer-flow（本地只读）
**产出底稿必答清单:**
- 产品形态与架构（backend/frontend 职责、技术栈、运行入口、安装路径 Install.md/Makefile/docker）
- `skills/` 与 `plans/` 目录的真实机制（与 flowkit 概念的表面同构有多少实质）
- CLAUDE.md/AGENTS.md 内容（它如何定义 agent 协作规范）
- 编排核心概念（graph/pipeline/subagent/loop/memory/sandbox/gateway 在代码里的落点，file:line）
- 有无 flowkit 强项对应物：evals/验证闭环/审查管道/状态管理
- 文档与 onboarding 质量评估（README 30 秒说服力、quickstart 长度、i18n 策略）
**验证条件:** 底稿每节有 file:line 证据；无凭记忆断言

### Task 1.2: eco-scout（生态社区数据，web-access 强制）
**输入:** 必须先加载 web-access skill 并遵循指引；失败即停询问，不得自行换工具
**产出底稿必答清单:**
- star 增长时间线（star-history 或 API 里程碑采样，标注来源与粒度）
- 官方渠道清单（deerflow.tech、docs、博客、视频、公众号/X）与内容策略
- 社区反馈（issue 主题分布抽样、discussions、第三方评价各≥3 条，标一手/自述/推断）
- 首发与传播节点（发布公告、HN/Reddit/掘金等痕迹）
**验证条件:** 关键数字全带来源 URL；证据分级徽章逐条标注
**降级路径:** web-access 不可用 → 标注降级原因，改 GitHub API 分页采样，缺口如实记录

## Phase 2: 主会话整合（串行，口径统一）
**依赖:** Phase 1 双底稿
1. 同类性校准章（三轴 + 意图目标校准）
2. 对比矩阵（可比面评分 + 不可比面描述 + 概念同构对照表）
3. 演进吸收建议（每条 = deer-flow 机制 → flowkit 落点 → 三选一判定[装/借鉴/不动] → 成本收益）
4. 推广策略（双路线 + 每条动作含第一步与成本）
**验证条件:** 每条建议可回溯到分片底稿证据；无「正确的废话」条目

## Phase 3: ex-web HTML 产出
**依赖:** Phase 2
- 加载 ex-web skill，按四件套模版适配调研报告形态
- 产出 `res/deer-flow-research.html`：单文件零依赖 + 证据分级徽章 + 阅读路径三线 + footer 快照日期与方法声明
**验证条件:** 机检（单文件/无外部 script/零外部依赖）；关键数字抽查回源

## Phase 4: Goal Verification
**依赖:** Phase 3
逐条核对 SC1-SC5（见 findings.md 契约），输出 Evidence 表

## Non-goals
不实施演进建议；不部署 deer-flow；不做 LangGraph 生态全景横评；不影响线 A/B 的并行推进

## 质量自检（plan-quality 适配）

| 维度 | 自检 | 评 |
|---|---|---|
| 精确性 | 分片任务有必答清单与产出路径；HTML 落点 res/deer-flow-research.html | ✓ |
| 完整性 | 降级路径（web-access 失败）已定义；证据分级贯穿 | ✓ |
| 可验证性 | 每 Phase 有验证条件；机检可执行 | ✓ |
| 依赖清晰性 | 1a∥1b → 2 → 3 → 4 严格串行段 | ✓ |
| 影响可控性 | 全程只读，写入仅 .plan-feat-deer-flow/ + res/ | ✓ |

**评分: 8.4/10**
