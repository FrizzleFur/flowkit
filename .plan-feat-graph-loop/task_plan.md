# graph of loops 理念对照审计计划（v2，经 plan-reviewer 实证审查修订）

> v2 修订记录：采纳 plan-reviewer F1-F17（3 必修全改 + 注记全采纳）。核心变化：判定口径拆监督级别两档；Phase 1 收官篇目标改写（原前提已证伪）；验证器脚本层补入信息源；理念点 16→17。
**Goal:** 对照 `res/graph-loop-explainer.html` 的 Graph Engineering 理念，审计 flowkit 体系的实现覆盖度，重点解析 graph of loops 概念，并给出「能否验证」的分层答案。
**Architecture:** 研究型任务——理念点清单化（17 点）→ 全仓机制审计（证据=file:line 实读）→ 覆盖矩阵（三态×监督级别×验证方式联动）→ 报告。
**Tech Stack:** 纯只读审计 + `scripts/lint_flowkit.py` 实跑（记录 exit code + warning 数）作仓外可复核证据。

**对照边界:** 对照对象 = explainer 页面论断（锚点 [MM:SS]），非视频原意；graph of loops 在视频中是开放问题[02:29]，只判「最小承重结构」吸收度。解析章须声明：flowkit 无 knowledge graph 混淆风险（F2）；「其他东西代表人类提示智能体/人抬到上一层」总纲并入解析章 framing（F3）。

## 理念点清单（v2：P-01~P-17）

| # | 理念点 | 锚点 |
|---|---|---|
| P-01 | 循环 Loop 模式：trigger（时间/目标/事件）唤醒 agent 自主执行 | [03:32-04:01] |
| P-02 | 边界 boundary：人机分工表 | [04:09] |
| P-03 | 编排者 orchestrator 模式：全局上下文 + 起团队 + 监控 | [04:33-04:56] |
| P-04 | 可靠性为采用前提 + validator 护栏 | [05:44-06:08] |
| P-05 | control graph 三要素：节点（行动）/边（流转）/状态（数据） | [06:19-06:29] |
| P-06 | 节点三次演化：简单动作→LLM 节点→智能体节点 | [06:41-07:10] |
| P-07 | 两种实现路线：代码即 graph vs LLM 即 graph（skill 载体） | [10:02-10:50] |
| **P-17** | **选型判据：何时从 SOP（LLM 即 graph）退到代码护栏（代码即 graph）——大多数选 LLM 即 graph 因 Dynamic Workflow 新会话不可恢复；任务庞大选代码即 graph** | [21:50][22:06-22:08] |
| P-08 | 三原语：bash 脚本 / 子智能体与团队通信 / hooks | [10:52-11:21] |
| P-09 | 原则1 何时拆节点：自我验证做不好→验证器独立；规划智能体；并行；强弱模型 | [11:42-12:28] |
| P-10 | 原则2 合理时用脚本：数据获取/数据分析/跑服务/评估测试 | [12:38-13:14] |
| P-11 | 原则3 定义输入输出，节点边界清晰 | [13:18-13:24] |
| P-12 | 原则4 状态放哪：markdown 最新状态 + 运行日志 | [13:29-13:43] |
| P-13 | 实战一模式：skill=流程载体+脚本=确定性步骤+输出契约护栏+独立状态仓库 | [14:31-18:28] |
| P-14 | 实战二模式：agent()/pipeline()/parallel() 原语 + schema 节点输出契约 | [18:28-21:01] |
| P-15 | 反模式：不给智能体测试工具的循环不起作用 | [21:10-21:28] |
| P-16 | graph of loops：多循环网络 + 错误/改进复利叠加 + 跨 loop 边 | [01:55-02:34, 22:11] |

## 判定口径（v2，F8/F9/F10 修订）

**三态 + 监督级别两档：**
- **已实现·载体级** = 具名机制 + 语义等价 + SOP 文本载体（LLM 即 graph 路线下文本 SOP 本身即实现形态）
- **已实现·受监督级** = 载体级 + 确定性脚本或行为 eval 盯防漂移（须附证据链：脚本名/eval 条目）
- **部分实现** = 有机制但缺要素
- **未实现** = 仅理念呼应，无具名机制

**组合合法性规则（F9）：**
- 受监督级 ⇒ 必须配「确定性脚本」或「行为 eval」，二者缺一不得标受监督级
- 「人工确认」更名**「需用户复核」**，只作辅助列，单会话内 LLM 自证不充当独立确认主体（F10）——此类条目汇入报告末「需用户复核清单」
- 「暂不可验证」仅允许配概念假设层（Phase 3 第三拆之③）

## 修订后的 Phase 划分

## Phase 1: 摸底——裁决继承 + 验证器脚本层实查
**可否并行:** 否（先行）｜**依赖:** 无

**审计目标（只读）:**
1. **收官篇追溯（F12 改写，原「docs/ 读全文」前提已证伪）**：裁决实质从 `evals/README.md:45` 原句继承（「任务与 loop 两种本体正交共存」）；**追溯收官篇真身**——候选 `site/mechanisms/ch11-orchestration-governance.md`（:9/:83 提及）、`site/propositions.md`（:3 自述借鉴 graph-engineering-research 的 REC 模式）、或仓外研究仓；**找不到则 findings 显式登记「裁决原文不在本仓」，不得以近似文档冒名**
2. **验证器脚本层实查（F4，直接决定 loop 相关 P 点三态）**：`scripts/check_integrity.py`（brain loop 验证器，contract:21 明引）、`scripts/sync-check.sh`、`.github/workflows/lint.yml`（实证 cron `23 4 * * 1` 挂载）——loops 判定按**两轴**：验证器脚本存在性 + trigger 挂载状态；且按**三段**（F13）：loop 已定义 / 验证器已挂载 / trigger 已运行
3. `evals/loops/repo-integrity-loop.md` + `brain-integrity-loop.md` 全读（注意 Logs 节：repo loop 已登记首条 cron 记录，brain loop 明写「尚未挂载」）
4. `evals/flow-deep/evals.json` + `evals/trigger/results-*.json`（README:12 自称 trigger 层「待启动」但实存 4 件 results——**README 过期冲突本身入审计发现**）
5. `HANDOFF.md`「已裁决策（勿重新讨论）」区扫读，涉及 site 判断时避免重新裁决（F7）
6. `site/propositions.md` 全读（F5：flowkit 吸收 graph engineering 的直接产物，P-16 最强对应物证据）
7. `site/mechanisms/ch9-verification-loop.md`、`ch3-memory-loop.md`、`ch11-orchestration-governance.md` 列**按需**（F6：与 P-04/P-12/P-16 直接重叠，解「相似≠等价」争议时的现成证据）

**产出:** findings.md「摸底」节——裁决继承登记 + 两 loop 三段判定 + README 过期冲突登记
**验证条件:** 收官篇真身有明确结论（找到/登记不在本仓）；两 loop 各有三段判定且每段有文件+行号证据

## Phase 2: 全仓机制审计（W2 主体）
**可否并行:** 否｜**依赖:** Phase 1

**审计目标（只读）:**
- `skills/{flow,flow-deep,multi-agent,auto-skill,prompt}/SKILL.md` 精读
- flow-deep references 选择性：`capability-registry.md`、`skill-routing.md`、`context-management.md`、`iron-laws.md`、`ralph-integration.md`、`goal-contract.md`、`workflow-script-patterns.md`
- flow references：`stage5-verification.md`、`selection-guide.md`（按需）
- site 章节按 Phase 1 结论按需

**方法:** 对 P-01~P-17 逐点找具名机制，每点记录：机制名 + file:line（本次实读）+ 三态 + **监督级别** + 语义校准注记（**强制字段**，相似≠等价必须写差异）+ 验证方式（合法性规则内）
**产出:** findings.md「覆盖矩阵」节
**验证条件:** 17 点每点有判定+证据行+级别+注记；矩阵报告三态分布统计

## Phase 3: graph of loops 深解析 + 验证评估（W3+W4）
**可否并行:** 否｜**依赖:** Phase 2

1. 概念解析章（含 F2/F3 framing 声明）
2. 最小承重结构四查：loop 本体 / trigger / signal 边 / 复利机制——loop 类判定用三段式（F13）
3. 「能否验证」三拆作答：①理念已实现可否验证 ②机制是否生效可否验证 ③概念假设本身可否验证
4. 实跑 `python3 scripts/lint_flowkit.py`，**记录 exit code + warning 数**（F14：lint 绿只证此刻结构完整，不证 loop 有效；已知 L1 有 warning 级豁免）

**产出:** findings.md「graph of loops 解析」+「验证评估」节 + lint 输出留痕
**验证条件:** lint exit code + warning 数记录；四查每项有判定

## Phase 4: 报告定稿 + Stage 5 Goal Verification
**可否并行:** 否｜**依赖:** Phase 3

- findings.md 定稿；对话内结构化总结；Stage 5 逐条核对 SC1-SC4
- 报告末附**「需用户复核清单」**（F10：所有「需用户复核」条目集中交付）

## Success Criteria（v2 硬约束，F15/F16/F17 修订）

- SC1 概念解析准确，**判据 = 逐锚点对照 res/graph-loop-explainer.html**
- SC2 矩阵 17 点全有判定+证据；**报告三态分布**；每个受监督级附脚本/eval 证据链；「相似≠等价」注记为强制字段——防宽口径形式刷满
- SC3 每点验证方式符合组合合法性规则；lint 实跑 exit code + warning 数留痕（仓外可复核物）
- SC4 报告落盘 + 对话总结 + 需用户复核清单

## Non-goals（v2，消除 F11 矛盾）

- 不新增 loop / 不修改 evals / skills 任何文件
- Stage 3.6 panel 跳过（调研裁剪，用户已批准）；Stage 3.7 不触发
- docs/ 与 site/ **按需读指定章节**（Phase 1/2 列明的），不做全目录逐读；gsd-* references 不读

## 质量自检（v2）

| 维度 | 自检 | 评 |
|---|---|---|
| 精确性 | 审计目标均为具体文件路径；**收官篇前提已改为可失败分支**（F12）；17 点编号+锚点 | ✓ |
| 完整性 | 判定口径拆级无矛盾（F8）；组合合法性定死（F9）；验证器脚本层补入（F4） | ✓ |
| 可验证性 | SC 带硬约束（F15/F16）；lint 记 warning（F14） | ✓ |
| 依赖清晰性 | 4 Phase 串行，依赖已标 | ✓ |
| 影响可控性 | 全程只读，唯一写动作是 .plan-feat-graph-loop/ 内文件 | ✓ |

**评分: 9.1/10**（v1 8.6 → v2 9.1；扣分项：收官篇真身可能在仓外，追溯结果影响 P-16 证据链完整性）
