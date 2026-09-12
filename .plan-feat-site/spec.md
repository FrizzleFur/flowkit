# Goal Contract — flowkit 机制原理教程站（flowsite）

> 版本: v1 草案（待三路侦察返回后细化）| 建立时间: 2026-09-12 | 状态: active

## Objective

把 flowkit（flow/flow-deep/multi-agent/prompt 等技能体系）的机制原理，做成参考 [hello-agents.datawhale.cc](https://hello-agents.datawhale.cc/#/)（docsify 形态）与 learn-claude-code（章节化+交互演示）风格的**交互教程站**，并深入研究 hello-agents 的 agent 原理体系，产出优秀 agent 教程内容，反哺 flowkit。

## Success Criteria（v1 草案，侦察后可修订）

| # | 标准 |
|---|---|
| SC1 | 教程站落 flowkit 仓内（docsify 零构建），含 flowkit 机制章（双引擎/管道 Stage/召回-沉淀闭环/multi-agent 等）+ agent 原理章（源自 hello-agents 研究），章内嵌轻交互演示 |
| SC2 | hello-agents 研究产出: 概念体系梳理 + 对 flowkit 的改进提案（REC 式附触发条件，落仓内 proposals/） |
| SC3 | learn-claude-code 交互形态研究转化为可借鉴清单，至少 N 个轻交互演示落地 |
| SC4 | 站点可本地 docsify 预览 + README 挂链接; 交互组件零框架依赖（原生 JS/CSS） |
| SC5 | 教程内容与 flowkit skills 真实行为一致（讲的就是代码里发生的，file:line 级对得上——防「教程幻觉」） |

## Constraints

- docsify 运行时经 CDN 加载（参考站同款），站点本体纯 markdown + 少量内嵌原生 JS 演示
- flowkit 仓既有文件只读（新增 site/ 目录 + proposals/ + README 挂链接一处）; 提交遵循用户节奏
- 教程叙述的事实断言以 flowkit skills 源文件为准（SC5 铁律）; hello-agents/learn-claude-code 的借鉴观点标注来源
- 并发与 429 防护照旧

## Non-goals

- 不做 Next.js/构建型站点; 不做独立 playground 模拟器（二期候选）
- 不直接改 flowkit skills 源码（反哺走提案）
- 不搬运 hello-agents 版权内容（研究方法与概念，不复制文本）

## Verification Plan

站点结构机检（章节数/锚点/交互组件计数）+ SC5 抽查（教程断言 vs skills 源 file:line 对照）+ docsify 本地预览实测 + 提案文件评审

## Execution Strategy

三路侦察并行（hello-agents 深研 / learn-claude-code 形态研究 / flowkit 机制地图）→ ST + 章节设计 → 计划审批 → 建站执行（多 agent 分章并行）→ 验证。与 iterate-r2 收尾并行不冲突（rag-lab 后台跑完即收）。
