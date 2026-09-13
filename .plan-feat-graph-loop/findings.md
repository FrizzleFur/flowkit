# findings — graph of loops 理念对照审计

> 审计执行中的发现底稿。判定口径见 task_plan.md（三态×验证四分类联动）。

## Goal Contract（Stage 0.5）

- **Objective:** ① 吃透 explainer 第三概念 graph of loops 并给 flowkit 语境对应物 ② 全理念点（P-01~P-16）实现审计 ③ 「能否验证」分层作答
- **Success Criteria（v2 硬约束）:** SC1 逐锚点对照 explainer / SC2 矩阵 17 点全判定+三态分布+受监督级证据链+相似≠等价强制注记 / SC3 合法性规则内验证方式+lint exit code 与 warning 数留痕 / SC4 报告落盘+对话总结+需用户复核清单
- **Constraints:** 只读；「已实现」须证据；相似≠等价须标差异；伪验收纪律
- **Non-goals:** 不新增 loop、不改 evals/skills、gap 只记录
- **Execution Strategy:** 主会话串行；调研裁剪（无 panel/3.7/multi-agent）；plan-reviewer 保留
- **Relevant History:** experience/skill-flow-deep.md（只读裁剪/调研经验/断言核验）、kb/agent-harness-paradigms.md（flow-deep=范式三）、kb/acceptance-command-discipline.md（伪验收三形态）、experience/skill-multi-agent.md（未启用，索引命中）

## 摸底（Phase 1，2026-09-13 完成）

### 收官篇追溯（F12 结论）

- **真身找到**：`/Users/new/Documents/Repos/AIPrj/graph-engineering-research/research/09-loop-graph.md`（2026-09-09，311 行，已全文实读）——非「不在本仓可追溯失败」，而是**仓外研究仓本地可读**
- **裁决继承**（evals/README.md:45 原句 + 09 收官篇深化）：
  1. 任务与 loop 两种本体**正交共存**；loop 与 graph **分层不竞争**——loop 是动力单元（复利发动机），graph 是 loop 间连接结构（复利传导网络）
  2. **loop 三判据**（09:28）：持久触发 + 共享记忆 + 越跑越值钱；无持久记忆的 fan-out 编排（即使 1000 agents/run）**不是** loop graph
  3. **图由循环养出来，循环靠图复利**（09:26）——边是「两个循环读写同一个文件」的事实长出来的，非预设计 schema
  4. 验证判据（09:187）：loop 的合法性来自 verifier——「没有验证的 loop 是定时炸弹」

### 两 loop 三段判定（F13 口径）

| Loop | ①已定义 | ②验证器已挂载 | ③trigger 已运行 |
|---|---|---|---|
| repo-integrity | ✓ contract 全文（evals/loops/repo-integrity-loop.md，46 行） | ✓ `lint_flowkit.py` 经 `.github/workflows/lint.yml:24` | ✓ cron `23 4 * * 1`（lint.yml:13）；Logs 首条 2026-09-10 登记 |
| brain-integrity | ✓ contract 全文（brain-integrity-loop.md，46 行） | ✓ `check_integrity.py` 实存实读（三类检查：绝对路径/wikilink/索引对称；只报告不修复；退出码恒 0 非 gate，:16） | **✗ 未挂载**（contract:32「尚未挂载」；launchctl 时机由用户定 :34-39）→ **需用户复核清单 #1** |

- 第三个确定性验证器：`scripts/sync-check.sh`（双仓漂移检查，exit 1 报漂移；非正式 loop contract，属验证器脚本层资产）
- **研究→落地 1 天闭环**：09-09 收官篇 P1 建议（L4 挂 cron）→ 09-10 evals/loops/ 两 contract + lint.yml cron 落地（CHANGELOG:12）；brain-integrity-loop contract 与 09 §6.1 候选形态近乎逐字同构（Goal/Boundaries/SOP/Logs 四节 + 「Zero-drift found = a successful run」原句）——**第五方独立收敛**的落地实证

### README 过期冲突（审计发现 #1）

`evals/README.md:12` 自称 trigger 层「待启动」，但 `evals/trigger/` 实存 4 件（eval-set-v1.json / eval-set-v1-retry.json / results×2 / run_trigger_eval.py），且 CHANGELOG:32 记录 T-302 已跑三轮测量并有完整归因——README 表格滞后于现实，**恰是它自己五条防漂移规则 #2（谁改契约谁带测试）的活案例**。入报告。

### P-16 对应物强证据（F5 证实）

- `site/propositions.md`：REC 式改进提案（4 条，每条带触发条件），:3 自述「借鉴 graph-engineering-research 的 REC 触发条件模式」——「错误/改进复利」机制的 flowkit 直接对应物
- 09 收官篇 §2.4：五类边已落地（互链/消费/能力/追溯/时效，REC-1/2/3/4/7）
- L3 研究 loop 闭环链：zread 实读 → research 报告 + REC 提案 → 落地 skills 仓 → lint 兜底（09:40）

### 其他摸底发现

- HANDOFF.md 已裁决策区已读（站点 redesign 波 4 进行中，不涉本审计对象，遵守避让）；`.plan-feat-redesign/`、`.plan-feat-sweep/` 存在
- **repo 边界观察**：auto-iterate（Stage 5.5 keep/revert 机械）在 `~/.claude/skills/` 而非 flowkit repo `skills/`（5 skill 之外）——L2 执行 loop 的迭代机械**外部于仓**，Phase 2 矩阵按「生态资产（仓外）」标注

**Phase 1 验证条件自检**：收官篇真身有明确结论（找到+实读）✓；两 loop 三段判定带 file:line 证据 ✓

## 覆盖矩阵（Phase 2，2026-09-13 完成）

> 三态 + 监督级别按 v2 口径；所有 file:line 均本次实读。「相似≠等价」注记为强制字段。**三态分布：受监督级 8 / 载体级 4 / 部分实现 3 / 未实现 0（P-17 计部分实现）**——「flowkit 实现超前于名词」预判成立。

| # | 理念点 | flowkit 机制（证据） | 三态 | 级别 | 验证方式 | 语义校准注记 |
|---|---|---|---|---|---|---|
| P-01 | Loop 模式：trigger 唤醒 | repo-integrity-loop（CI cron `23 4 * * 1`，lint.yml:13；Logs 首条 09-10）；ralph-loop Stop Hook（ralph-integration.md:8-14）；auto-iterate keep/revert（auto-iterate SKILL.md:27-29）；brain-integrity-loop（待挂载） | 已实现 | **受监督** | 确定性脚本（lint+CI 实跑） | flowkit loops 只覆盖「监守自身」domain，无 explainer 实战一式「业务分拣」loop——正交性纪律（one loop = one separable workstream）的刻意选择，非缺失 |
| P-02 | boundary 人机分工 | loop contract Boundaries 节（repo-integrity-loop.md:12-16「Free to/Never do/Ship-on-its-own」逐字段对应 Jason Zhou 模板）；Stage 确认点；设计宪法第四问（控制权）；PR bounding（ralph-integration.md:266「产出速率 ≤ 评审速率」） | 已实现 | 载体 | 需用户复核 | boundary 文本无 lint 断言（契约对照靠 09 收官篇 checklist 人工完成） |
| P-03 | orchestrator 起团队+监控 | Stage 4 Execution Router + Delegate 模式（multi-agent SKILL.md:317-323「主 Agent 是 Coordinator 不是 Implementor」）+ Fast Path 分片 fan-out（:52-65） | 已实现 | 载体 | 行为 eval（T-301 盯 stage 纪律，间接） | flowkit 编排是会话级；explainer「夜间几千个 agent」常驻编排超出 skill 层射程（属 harness/基础设施层） |
| P-04 | 可靠性前提 + validator 护栏 | Stage 5 Goal Verification（SC×Evidence 表）；IL-2 验证铁律 + Rationalization Table（iron-laws.md:40-67）；evals 三层；独立审查 agent（3.5 plan-reviewer 全新上下文）；ch11 三道锁（site/mechanisms/ch11:24-58） | 已实现 | **受监督** | 行为 eval（T-301 三臂全绿绿基线，evals/flow-deep/benchmarks/iteration-1.json）+ L0 lint | explainer「验证器设置 skill 从 GitHub 获取」↔ flowkit 的 plan-reviewer/panel-review prompt 模板（references/plan-review.md、panel-review.md）同构 |
| P-05 | 三要素 node/edge/state | 节点=Stage/CID 能力/agent 队友；边=Stage 流转条件+回退边（fallback）+REC-4 能力关系图（capability-registry.md:98-136，含调用方向约束）+loop signal 边；状态=STATE.md 活记忆 <80 行+Run ID（context-management.md:31-45）+loop 游标 | 已实现 | **受监督** | L0 lint L2 项（registry 图一致性，幽灵引用=error）+ T-301 断言（「STATE.md 含 stage 进度与 next_action」evals.json:15/29/44） | 图为「约定级」（mermaid+文本）非引擎图——与研究仓「约定级够用，引擎按需」（09:292）结论一致；explainer 语境 LangGraph 是引擎级，层级不同 |
| P-06 | 节点三次演化 | registry 分层即节点谱系：确定性动作（脚本/命令）→ LLM 节点（/prompt 等 skill）→ agent 节点（teammate） | 已实现 | 载体 | L0 lint L2（registry 结构） | 「强弱模型路由」子点仅 model 参数存在（Agent tool），无选型纪律——注记为子点缺口 |
| P-07 | 两种实现路线 | 双形态并存：LLM 即 graph=5 个 SKILL.md 文本 SOP；代码即 graph=lint_flowkit.py（L1-L7）+ check_integrity.py + sync-check.sh + CI + evals 机检（grade_eval/run_trigger_eval/check_context） | 已实现 | **受监督** | 确定性脚本（CI cron 实跑） | flowkit 无 Dynamic Workflow JS 形态（Claude Code 原生 Workflow tool 属 harness 层，skill 层借思路——09 收官篇同判） |
| P-17 | 选型判据：何时 SOP→代码护栏 | REC-10 实践（lint_flowkit.py:2-6「人类品味捕获一次，机械处处强制」）+ SIZE_BUDGET 800 行下沉线（:44-45）+「管别人验证强唯独不验证自己」的空位识别（evals/README.md:3-4） | 部分实现 | - | 需用户复核 | **实践在而显式判据文档缺**——「何时写新脚本 vs 写 SOP」无成文条款，判据散在 lint docstring 与 REC 提案；语义等价度高但可检索性差 |
| P-08 | 三原语：bash/subagent/hooks | bash=scripts/ 六脚本；subagent+team=Agent(name)+SendMessage+TaskCreate（multi-agent SKILL.md:273-299）；hooks=ralph-loop Stop Hook 集成（ralph-integration.md 全文）+ settings hooks | 已实现 | **受监督**（bash 面） | L0 lint+CI | hooks 本体属 Claude Code harness，flowkit 是「消费+集成规范」——层级归属标注，不算自有实现 |
| P-09 | 原则1 何时拆节点 | 独立验证器=3.5 plan-reviewer（「消除沉没成本偏差」）+IL-4 审查只读铁律（iron-laws.md:103-131）；规划智能体=Stage 2/3 与执行分离；并行=multi-agent 互斥完备分片 | 已实现 | 载体 | 行为 eval（间接） | 前三子点强；「强弱模型」子点弱（同 P-06 注记） |
| P-10 | 原则2 合理时用脚本 | 六脚本各管确定性面（lint 完整性/registry/体量/引用/codex/frontmatter）+「机检断言优先，不用 LLM-as-judge 评文风」（evals.json:55） | 已实现 | **受监督** | 确定性脚本 | 无缺口注记 |
| P-11 | 原则3 定义输入输出边界 | Goal Contract（Objective/SC/Constraints/Non-goals）；plan-quality 精确路径+验证条件+依赖声明；multi-agent「文件边界/接口约定」（SKILL.md:189-195）；Workflow Input Contract（workflow-script-patterns.md:5-12「消费 clarified artifacts 非 raw intent」）；C36 交接契约 | 已实现 | **受监督** | T-301 断言（spec.md Success Criteria 落盘，evals.json:16/30/45） | 无缺口注记 |
| P-12 | 原则4 状态放哪 | STATE.md <80 行活记忆+progress.md 留痕+loop 游标（git SHA/last-scan）+contract Logs 节+Run ID 命名空间（context-management.md:37）；**第五方独立收敛**：Jason Zhou contract+state+logs 单文件 ≡ flowkit 四件套+REC-9 两层 body（09:148） | 已实现 | **受监督** | T-301 断言 + check_integrity 实跑（brain loop 验证器已可运行） | 无缺口注记——此点是 flowkit 与外部实践收敛最强处 |
| P-13 | 实战一：skill+脚本+契约+独立状态仓库 | 前三要素全（skills/=流程载体；scripts/=确定性步骤；evals 断言=输出契约护栏）；「独立状态仓库承载发生过的一切」仅部分对应=auto-skill 双库（经验/知识），任务实例状态内联各仓 .plan-feat-*/ | 部分实现 | - | 需用户复核 | explainer 实战一是公司级多工单场景（SuperDesign AGI 仓库承载每实例/每工单）；个人方法论无工单流——**规模差异所致，非机制缺失**；REC-P1/P2（propositions.md）若触发，双库即向该形态生长 |
| P-14 | 实战二：agent()/pipeline()/parallel()+schema | agent()≈Agent tool；pipeline()≈Phase 依赖序+Execution Pattern；parallel()≈同消息 ≤3 分批；schema 输出契约≈prompt「接口约定」+Goal Verification 表——**全为提示词级约定，无运行时 schema 强制** | 部分实现 | - | 暂不可验证（harness 层） | Dynamic Workflow 的 schema 是代码运行时强制；flowkit 刻意停在约定级（设计宪法「不上引擎」）——**路线取舍而非能力缺口**，但按口径须如实判部分 |
| P-15 | 反模式：不给测试工具的循环不起作用 | evals=「给自己的循环配 verifier」；IL-2「手动检查过了≠验证」（iron-laws.md:61）；ch11 批判小节自我披露「宪法抓不住『这次没问』」（ch11:72-74）；09 收官篇验证判据「没有验证的 loop 是定时炸弹」 | 已实现 | **受监督** | L0+L2 evals | 无缺口注记；自我批判在场是成熟度信号 |
| P-16 | graph of loops 本体 | loops 层（2 contract+signal 登记总表+README Loops 章节）+共享 brain（auto-skill 双库）+五类边（互链/消费/能力/追溯/时效，REC-1/2/3/4/7）+L1/L2/L3 三运行 loop | 已实现 | 载体（repo 维度受监督） | 确定性脚本（lint/CI）+ 需用户复核 | 四查：loop 本体 ✓（3 运行+2 定时契约）；signal 边 ✓（登记表 5 信号+consumed_by）；**trigger 形态单一**（cron+manual，缺 event/webhook——09:91 自认「最大 gap」）；**复利量化未跑**（REC-8 健康分依赖 brain loop 挂载） |

**矩阵结论**：17 点中 14 点达成已实现（8 受监督 + 6 载体；P-16 按整体载体级计），3 点部分实现（P-13/P-14/P-17），0 点未实现。部分实现的三个都不是「没做」而是「规模差异（P-13）/路线取舍（P-14）/可检索性（P-17）」。

## graph of loops 解析（Phase 3）

（执行中填写）

## 验证评估（Phase 3）

（执行中填写）

## Plan Review（Stage 3.5）

（待审查后填写）

## Goal Verification（Stage 5）

（待验证后填写）
