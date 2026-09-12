# Task Plan — sweep 周期

> 2026-09-12 | 四向: 沉淀/挂账/ch11 交互/REC 核验 | 顺序依据: 对账先行（产出挂账工作清单）→ 轻量项先行 → 增量开发 → 批修 → 终验

## Phase 0 基线与对账（主会话串行）

| # | 任务 | 完成标准 |
|---|---|---|
| T0.1 | 跑 Phase 4 机检套件（site/ 下 python3 断言套件）确认基线 | ALL PASS 或差异记录 |
| T0.2 | 机械对账: gap-A(32)/gap-B(44) 汇总表 vs 站点实况（grep theme css/剧本/ch 文件）→ 重建挂账清单 | 对账表落盘 notes/, 每条带证据与验收标准 |
| T0.3 | REC-P1~P4 触发条件核验（只读推理 + 现状证据） | 核验表落盘, 4 条各给 达标/不达标 结论 |

## Phase 1 经验沉淀 6 条（主会话, 写 ~/.claude/skills/auto-skill/）

| # | 任务 | 完成标准 |
|---|---|---|
| T1.1 | 六条分流: SRI 钉版/后台 tab IO 假象/声明式动画架构/特异性优先审计 → knowledge-base（docsify 站点建设类新分类）; 双 agent 合稿纪律 → experience/skill-multi-agent.md 补录; 原有格式不可变 → 随 coding 类条目落位 | 分流表 |
| T1.2 | 逐条写入（Trigger/Observation/解法/Outcome/keywords + 证据锚点=提交 hash）+ `_index.json` 更新（lastUpdated/subject_version） | 索引可召回, 格式合规 |

## Phase 2 ch11 三道锁轻交互（主会话开发）

| # | 任务 | 完成标准 |
|---|---|---|
| T2.1 | 交互形式已定稿（2026-09-12 用户裁定）: **B 宪法四问自检小测**——场景题 + 逐问选择 + 过/不过判定, 与 quiz 家族同协议 | 形式 + 验收标准锁定 |
| T2.2 | 组件实现 + ch11 挂载（协议: FlowSite.fns + data-ready + _fsClear; 若走声明式则注册剧本进 PROTOCOL） | 组件文件 + PROTOCOL 登记 |
| T2.3 | CDP 前台 tab 交互实测 | 交互断言 + 截图证据 |

## Phase 3 挂账批修（Phase 0 对账清单驱动）

| # | 任务 | 完成标准 |
|---|---|---|
| T3.1 | 分批修复（每批 ≤6 条, 同文件改动合并; 渲染类单独标记） | 逐条验收标准过 |
| T3.2 | 并行判定: 默认主会话串行; 某批 ≥5 条独立纯 CSS 项 → ≤2 agent 并行（CDP 验收仍主会话统一做） | — |

## Phase 4 终验与同步

| # | 任务 | 完成标准 |
|---|---|---|
| T4.1 | 全站机检复跑 | ALL PASS |
| T4.2 | CDP 渲染抽查（新交互 + 本轮渲染类修复项） | 证据留 shots/ |
| T4.3 | rsync site/ → BlogBackUp/source/flowkit/ + 两仓提交推送 | 提交链干净; 提醒用户 hexo d |
| T4.4 | Goal Verification 表（SC-S1~S5 逐条证据） | 全 PASS → STATE.md completed |

## 风险与预案

- 对账若发现「已修但验收未勾」大面积存在 → 只修 not-done 实测项, 不回填勾选（gap 文件是审计快照, 不当账本）
- ch11 交互若与 B11 条目（若未修）重叠 → 合并处理避免二次动文件
- REC 核验若发现某条已达触发 → 单独升级为微任务走评审, 不混入批修
