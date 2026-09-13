# graph of loops 理念对照审计计划

**Goal:** 对照 `res/graph-loop-explainer.html` 的 Graph Engineering 理念，审计 flowkit 体系的实现覆盖度，重点解析 graph of loops 概念，并给出「能否验证」的分层答案。
**Architecture:** 研究型任务——理念点清单化（16 点）→ 全仓机制审计（证据=file:line 实读）→ 覆盖矩阵（三态×验证四分类联动）→ 报告。判定口径按「LLM 即 graph / 代码即 graph」分路线（三角色收敛共识）。
**Tech Stack:** 纯只读审计 + `scripts/lint_flowkit.py` 实跑作新鲜证据。

**对照边界（方法论者裁定）:** 对照对象 = explainer 页面论断（锚点 [MM:SS]），非视频原意；graph of loops 在视频中是开放问题[02:29]，审计只判「最小承重结构」吸收度，不判假设真伪。

## 理念点清单（W1 定稿，源自 explainer）

| # | 理念点 | 锚点 |
|---|---|---|
| P-01 | 循环 Loop 模式：trigger（时间/目标/事件）唤醒 agent 自主执行 | [03:32-04:01] |
| P-02 | 边界 boundary：人机分工表 | [04:09] |
| P-03 | 编排者 orchestrator 模式：全局上下文 + 起团队 + 监控 | [04:33-04:56] |
| P-04 | 可靠性为采用前提 + validator 护栏 | [05:44-06:08] |
| P-05 | control graph 三要素：节点（行动）/边（流转）/状态（数据） | [06:19-06:29] |
| P-06 | 节点三次演化：简单动作→LLM 节点→智能体节点 | [06:41-07:10] |
| P-07 | 两种实现路线：代码即 graph vs LLM 即 graph（skill 载体） | [10:02-10:50] |
| P-08 | 三原语：bash 脚本 / 子智能体与团队通信 / hooks | [10:52-11:21] |
| P-09 | 原则1 何时拆节点：自我验证做不好→验证器独立；规划智能体；并行；强弱模型 | [11:42-12:28] |
| P-10 | 原则2 合理时用脚本：数据获取/数据分析/跑服务/评估测试 | [12:38-13:14] |
| P-11 | 原则3 定义输入输出，节点边界清晰 | [13:18-13:24] |
| P-12 | 原则4 状态放哪：markdown 最新状态 + 运行日志 | [13:29-13:43] |
| P-13 | 实战一模式：skill=流程载体+脚本=确定性步骤+输出契约护栏+独立状态仓库 | [14:31-18:28] |
| P-14 | 实战二模式：agent()/pipeline()/parallel() 原语 + schema 节点输出契约 | [18:28-21:01] |
| P-15 | 反模式：不给智能体测试工具的循环不起作用 | [21:10-21:28] |
| P-16 | graph of loops：多循环网络 + 错误/改进复利叠加 + 跨 loop 边 | [01:55-02:34, 22:11] |

**三态判定口径（审计师裁定）:**
- 已实现 = 具名机制 + 语义等价 + 执行/验证路径（LLM 即 graph 路线下，文本 SOP 载体本身即实现形态，执行路径=LLM 遵循，但须有 evals 盯遵循纪律）
- 部分实现 = 有机制但缺要素（如仅文档契约无可执行性）
- 未实现 = 仅理念呼应，无具名机制

**验证方式四分类（方法论者裁定）:** 确定性脚本 / 行为 eval / 人工确认 / 暂不可验证。三态与验证方式联动填写。

---

## Phase 1: 摸底——已有裁决继承
**可否并行:** 否（先行）｜**依赖:** 无

**审计目标（只读）:**
- `docs/` — 定位「研究仓 09 收官篇」（evals/README.md:45 引用的裁决来源），读全文
- `CHANGELOG.md` — loop / evals / loops 相关演进时间线
- `evals/loops/repo-integrity-loop.md` + `brain-integrity-loop.md` — 全读；**关键判定：有无可执行脚本还是纯文档契约**
- `evals/flow-deep/evals.json` + `evals/trigger/results-*.json` — 覆盖什么行为

**产出:** findings.md「摸底」节——收官篇裁决摘要 + loops contract 可执行性初判
**验证条件:** 收官篇文档已定位并实读；每个 loop contract 标注「有脚本/无脚本」

## Phase 2: 全仓机制审计（W2 主体）
**可否并行:** 否（判定口径需主会话统一）｜**依赖:** Phase 1

**审计目标（只读）:**
- `skills/flow/SKILL.md`、`skills/flow-deep/SKILL.md`、`skills/multi-agent/SKILL.md`、`skills/auto-skill/SKILL.md`、`skills/prompt/SKILL.md` 精读
- flow-deep references 选择性：`capability-registry.md`、`skill-routing.md`、`context-management.md`、`iron-laws.md`、`ralph-integration.md`、`goal-contract.md`、`workflow-script-patterns.md`
- flow references：`stage5-verification.md`、`selection-guide.md`（按需）

**方法:** 对 P-01~P-16 逐点找具名机制，每点记录：机制名 + file:line（本次实读）+ 三态 + 语义校准注记（相似≠等价时写差异）+ 验证方式
**产出:** findings.md「覆盖矩阵」节
**验证条件:** 16 点每点都有判定与证据行；引用行号均来自本次 Read

## Phase 3: graph of loops 深解析 + 验证评估（W3+W4）
**可否并行:** 否｜**依赖:** Phase 2

**内容:**
1. 概念解析章：视频语义（Carlos 提出/复利叠加/开放问题/下期主题）+ flowkit 语境映射（loops 层 + auto-skill 经验 loop + evals=verifier 的既有定位）
2. 最小承重结构四查：loop 本体 / trigger / signal 边 / 复利机制
3. 「能否验证」三拆作答：①理念已实现可否验证 ②机制是否生效可否验证 ③概念假设本身可否验证
4. 实跑 `python3 scripts/lint_flowkit.py` 留输出作新鲜证据

**产出:** findings.md「graph of loops 解析」+「验证评估」节 + lint 输出留痕
**验证条件:** lint exit code 记录；四查每项有判定

## Phase 4: 报告定稿 + Stage 5 Goal Verification
**可否并行:** 否｜**依赖:** Phase 3

**内容:** findings.md 定稿；对话内结构化总结（概念讲解 + 矩阵 + 三拆答案）；Stage 5 逐条核对 SC1-SC4
**验证条件:** Goal Verification 表全部有 Evidence；SC 不全 Pass 则进 5.5

---

## 质量自检（plan-quality 适配版）

| 维度 | 自检 | 评 |
|---|---|---|
| 精确性 | 审计目标均为具体文件路径；理念点 16 条编号+锚点无 placeholder | ✓ |
| 完整性 | 判定口径、对照边界、验证条件均已定义；无 TBD | ✓ |
| 可验证性 | 每 Phase 有验证条件；lint 实跑为硬证据 | ✓ |
| 依赖清晰性 | 4 Phase 严格串行，依赖已标 | ✓ |
| 影响可控性 | 全程只读，唯一写动作是 .plan-feat-graph-loop/ 内文件 | ✓ |

**评分: 8.6/10**（扣分：Phase 2 审计发现的深度依赖实际读到的内容，无法预先完全枚举——研究任务固有属性）

## 明确不做（Non-goals 落地）

- 不新增 loop / 不修改 evals / skills 任何文件
- Stage 3.6 panel 跳过（调研裁剪，用户已批准）；Stage 3.7 不触发（无代码）
- docs/ 与 site/ 只作辅助证据不逐读；gsd-* references 不读
