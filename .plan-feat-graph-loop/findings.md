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

## 覆盖矩阵（Phase 2）

（执行中填写）

## graph of loops 解析（Phase 3）

（执行中填写）

## 验证评估（Phase 3）

（执行中填写）

## Plan Review（Stage 3.5）

（待审查后填写）

## Goal Verification（Stage 5）

（待验证后填写）
