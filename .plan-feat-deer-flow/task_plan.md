# deer-flow 对照调研计划（v2，经 plan-reviewer-c 19 条实证审查修订）

> v2 修订记录：采纳 F0-F18 全部（CRITICAL×1 / HIGH×7 / MEDIUM×9 / LOW×2）。核心变化：Phase 1 前置存在性断言（F0）；同构表改三问行为契约制、预填映射撤除（F3）；Phase 2 增详梳成稿与意图 sign-off（F4/F7）；分片清单补维护信号/自定位/部署企业化/用户画像/幸存者分母（F1/F2/F9/F5/F10）；证据编号制 + 假设看板（F6/F12/F13）；Phase 4 Evidence 表固定形式 + 抽查程序（F11/F18）。
**Goal:** 调研 bytedance/deer-flow（82,329★ API 已核验），产出 ex-web 风格单文件 HTML 调研报告四部分：仓库详梳 / 同类性校准+优劣势对比 / flow 演进吸收 / flowkit 推广策略。
**Architecture:** fan-out 两分片并行（本地仓深读 + web-access 生态）→ 主会话五步整合（详梳成稿→意图校准+sign-off→三轴校准→对比矩阵→演进+推广）→ ex-web HTML → 机检。
**Tech Stack:** 只读双仓 + web-access + GitHub API + ex-web 模版。

## 已核验基线事实（一手）

- star **82,329** / fork 11,358 / open issues 895 / subscriber 346（GitHub API 实测 2026-09-13；Phase 4 重放复核，F18）
- MIT / Python / 创建 2025-05-07 / 持续推送
- 官方描述: "long-horizon SuperAgent harness... sandboxes, memories, tools, skill, subagents and message gateway"
- 首轮克隆结构信号（12:06 ls 实证，重克隆后须复核一致性）: backend+frontend / `skills/` / `plans/` / CLAUDE.md+AGENTS.md / README ×4 语言 / OSS 卫生完整

## 假设看板（F12：命题结构化归属，防漏证伪）

| H | 假设内容 | 证伪判据 | 负责分片 | 状态 |
|---|---|---|---|---|
| H1 | deer-flow 与 flowkit 概念同构真实存在 | 三问行为契约（F3）两问以上不同 = 同名异构，只进形似表 | explorer 提取 → 主会话判定 | 待证 |
| H2 | 它的 `skills/`、`plans/` 与 flowkit 同名同义 | 三问对照；任一问不同即证伪「同义」 | explorer | 待证 |
| H3 | 它的强项在产品化（UI/安装/demo） | 若真实强项在生态集成/中文场景工程化/部署企业化，则证伪——explorer 部署企业化必答项（F9）作判据 | explorer + eco-scout | 待证 |
| H4 | flowkit 意图目标 ≠ 追大众 star | 意图校准三源（F7）若显示用户实有大众化意图，则「没做成」是真命题 | 主会话 + 用户 sign-off | 待证 |

## 证据编号契约（F6/F13）

- 分片底稿每条证据编号 `E1.1-nn`（explorer）/ `E1.2-nn`（eco-scout）；编号在证据表登记（file:line 或 URL）
- 底稿格式契约（F13）：按必答清单分节，每节末附证据表；**subagent 只返回文本，findings.md 由主会话落盘**
- 演进/推广建议**强制引用** ≥1 个存在的编号；Phase 4 机械核对：被引编号在底稿中真实存在

---

## Phase 1: 素材就绪 + 分片并行
**可否并行:** 两分片并行（≤3 合规）｜**依赖: 硬前置（F0）**

### Task 1.0: 素材存在性断言（CRITICAL 前置，F0）
- `test -d /Users/new/Documents/Repos/deer-flow/.git` 通过才允许派发 explorer；失败即停，不得凭记忆继续
- 重克隆后 diff 结构信号（上行基线），不符则更新基线并登记

### Task 1.1: deer-flow-explorer（本地仓深读，不联网）
**产出底稿必答清单（v2 扩充）:**
1. 产品形态与架构（backend/frontend 职责、技术栈、运行入口、Install.md/Makefile/docker）
2. `skills/` 与 `plans/` 真实机制——**三问行为契约**（F3）：解决什么问题（触发→产出）/ 状态存哪里（持久化形态）/ 失败怎样（回滚恢复语义）。**不做与 flowkit 的映射判断**（留给 Phase 2）
3. CLAUDE.md/AGENTS.md 内容（agent 协作规范定义）
4. 编排核心概念落点（graph/pipeline/subagent/loop/memory/sandbox/gateway 的 file:line）——**sandbox/gateway 拆两问**（F15）：①落点 ②隔离实现深度与信任边界
5. **维护信号**（F1）：git log 贡献者 top、release/tag 间隔、CONTRIBUTING 与 PR 模板、外部 PR 接纳情况
6. **官方自定位与竞品叙事摘录**（F2）：README 定位段/对比页如何对标 LangGraph/AutoGen 等，标注[自述]
7. **部署与企业化能力**（F9）：部署形态、企业特性、商业化信号
8. 有无 flowkit 强项对应物：evals/验证闭环/审查管道/状态管理
9. 文档与 onboarding 质量评估（README 30 秒说服力、quickstart 长度、i18n）
10. LICENSE 商业组件分离顺带核查（F15 注）

**格式契约:** 按清单分节 + 每节末证据表（E1.1-nn）
**验证条件:** 每节有证据编号；无凭记忆断言；三问契约每机制齐全

### Task 1.2: eco-scout（生态社区数据，web-access 强制）
**必答清单（v2 扩充）:**
1. star 增长时间线（milestone 采样，标注来源与粒度）
2. 官方渠道清单与内容策略（官网/docs/博客/视频/公众号/X）
3. 社区反馈（issue 主题分布抽样、第三方评价 ≥3 条，标一手/自述/推断）
4. **用户画像与使用场景**（F5）：人群信号、典型工作流、issue 高频抱怨 top5——回答「用户是谁/真实依赖什么」，不只在官方叙事里找
5. **幸存者分母参照**（F10）：3-5 个同期同赛道项目（如 LangGraph 生态 deep research 类）star 现状，给 82K 作分母
6. 首发与传播节点（发布公告、HN/Reddit/掘金痕迹）

**降级路径:** web-access 不可用 → 标注降级原因，改 GitHub API 分页采样，缺口如实记录
**格式契约:** 同上（E1.2-nn）

## Phase 2: 主会话五步整合（串行，口径统一）
**依赖:** Phase 1 双底稿 + Task 1.0 断言通过

0. **详梳章成稿**（F4）：底稿 → 读者导向重写；分工纪律 = 详梳讲「它是什么」，对比章讲「它相对 flowkit 如何」；详度裁剪由本步负责，底稿不直接当章
1. **意图校准 + 用户 sign-off**（F7/H4）：三源并取——README self-image + 设计宪法（四问/铁律）+ CHANGELOG 演进轨迹（revealed preference）→ 产出「flowkit 目标陈述」→ **设确认点请用户签字**，通过才进对比（防全篇方向性漂移 + 防 self-image 照单全收）
2. **同类性三轴校准**（F8）：三轴定离散档位——层级（产品框架/编排方法论/工具技能集三档）、受众（应用开发者/Claude Code 重度用户/混合）、~~分发~~（**移归推广章作差异化论据**）；判定规则 =「层级同档 + 受众交集非空 → 该功能面进可比集」
3. **对比矩阵 + 概念同构表**：可比面评分 / 不可比面描述；同构表按三问契约判定（H1/H2），两问不同 = 同名异构只进「形似表」；**三方对照**（F5）= 官方叙事 × 代码落点 × 用户抱怨交叉
4. **演进吸收建议**：每条 = deer-flow 机制（引证据编号）→ flowkit 落点 → 三选一判定 → **成本拆两栏**（F14）：实现成本 + 长期维护成本（对照其团队规模 vs 单人维护预算）
5. **推广策略**：双路线（产品化 vs 窄众深耕）+ **强制引用幸存者分母数据**（F10）+ 每条动作含第一步与成本；分发差异作论据

**star 归因证据分级**（F16）: 事件与 star 拐点时间对齐 = 强；仅机制解释无时间对齐 = 弱——报告显式区分，不统一标[推断]

## Phase 3: ex-web HTML 产出
**依赖:** Phase 2（含 sign-off 通过）
- 加载 ex-web skill；**先做模版裁剪决策**（F17）：四件套（泳道/分层/调用链/端点表）与调研四部分不同构，逐一套用或改造，决策留痕
- 产出 `res/deer-flow-research.html`：单文件零依赖 + 证据分级徽章（F11：无徽章数字/事实断言数 = 0）+ 阅读路径三线 + footer 快照日期 + **stargazers_count 原值 82,329**（F18）
- 机检：单文件/无外部 script/**四部分标题齐全**（F4b）
**验证条件:** 机检通过；关键数字抽查回源

## Phase 4: Goal Verification（F11 程序化）
**依赖:** Phase 3
- Evidence 表固定形式：SC 编号 / 实际执行的验证动作（含抽查命令）/ 结果
- 抽查程序：证据 <50 条全量核对，否则 ≥10 条（含实开文件核对行号内容）；不通过 → 记 Fail 回修
- 证据编号机械核对（F6）：每条建议被引编号存在性
- star 原值重放（F18）：GitHub API 复核 footer 数字
- 需用户复核项单列交付

## Non-goals
不实施演进建议；不部署 deer-flow；不做生态全景横评；不影响线 B

## 质量自检（v2）

| 维度 | 自检 | 评 |
|---|---|---|
| 精确性 | 硬前置断言（F0）；必答清单 10+6 项具体化；证据编号契约 | ✓ |
| 完整性 | 假设看板 H1-H4 归属（F12）；分片清单补齐 5 项（F1/F2/F5/F9/F10）；详梳环节（F4） | ✓ |
| 可验证性 | Evidence 表固定形式+抽查程序（F11）；编号机械核对（F6）；star 重放（F18） | ✓ |
| 依赖清晰性 | 1.0 硬前置 → 1.1∥1.2 → 2.0-2.5（sign-off 门）→ 3 → 4 | ✓ |
| 影响可控性 | 全程只读，写 .plan-feat-deer-flow/ + res/ | ✓ |

**评分: 9.3/10**（v1 8.4 → v2；剩余风险：克隆网络稳定性 + sign-off 可能返工意图陈述）
