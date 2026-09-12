# Goal Contract — 交付后清扫周期（sweep）

> 版本: v1 | 2026-09-12 | 状态: active | 用户指令: 四向全选（沉淀/挂账/ch11 交互/REC 核验）+「优化计划后执行」
> 前置: polish 三周期交付完成（HEAD 9c60cd6, 工作树净）

## Objective

对已交付教程站做一轮收尾清扫与轻量增量: 沉淀三周期经验、重建并清理低优挂账、为 ch11 补轻交互、对 REC-P1~P4 做触发条件核验——全程延续已决纪律。

## Success Criteria

| # | 标准 | 验收 |
|---|---|---|
| SC-S1 | 6 条候选经验写入 auto-skill（分流正确/格式合规/索引可召回） | `_index.json` 更新 + 条目含 Trigger/Outcome 字段 |
| SC-S2 | 挂账清单机械对账重建（gap 76 条 vs 站点实况, 有 done/not-done 证据）, not-done 条目逐条修复且各自验收标准过 | 对账表落盘 + 逐条验收记录 |
| SC-S3 | ch11 三道锁轻交互上线: 零依赖协议（FlowSite.fns + data-ready + _fsClear）+ zinc 主题 + PROTOCOL 合同 | 机检过 + CDP 前台 tab 实测交互 |
| SC-S4 | REC-P1~P4 逐条触发条件核验记录, 不达条件不实施 | 核验表落盘（结论+证据） |
| SC-S5 | 全站无回归 + 博客同步链完成 | Phase 4 机检复跑 ALL PASS + rsync 后两仓提交推送 |

## Constraints（已决纪律, 不重新讨论）

- SC5 锚点实读复核; 零依赖零构建; 渲染交付必须 CDP 实测（后台 tab 有节流假象, 强制渲染帧再判）
- 博客同步链 site/ → BlogBackUp/source/flowkit/（rsync）→ 用户 hexo d
- 站点内容事实与 SC5 锚点体系不动; 动画风格 follow learncc（zinc 深色/声明式步进表）
- 同消息并发 agent ≤ 3; CDP 验收由主会话统一做

## Non-goals

- 不实施未达触发条件的 REC 提案; 不代用户执行 hexo d; 不改 flowkit 本体 skills 源码
- 不新增大功能模块（ch11 轻交互限定「轻」: 单组件, 不引入新引擎概念）

## Verification Plan

机检基线先行（Phase 0）→ 每方向独立验收 → Phase 4 终验: 机检复跑 + CDP 渲染实测 + 同步链落盘。Goal Verification 按 SC-S1~S5 逐条出证据表。

## Relevant History（Stage -1 召回）

- experience/skill-flow-deep.md: 文档型任务裁剪/429 并发约束/CDP 三坑/假 Pass 防御
- knowledge-base/acceptance-command-discipline.md: 伪验收三形态 + 视觉交付物 DOM 断言证据学
- knowledge-base/agent-teams.md: 并行分发（未读, Phase 3 需并行时再读）
