# HANDOFF — flowkit 教程站三周期交接

> 生成: 2026-09-12 | 前置会话: flow-deep ×3（flowsite → iviz → polish）| 交接时全部工作已提交推送, 工作树净

## 一分钟读懂现状

FlowKit 交互教程站（`site/`, docsify 零构建）已建成并深度精修: 11 章 + 封面增长 hero + Learning Path 视图; 8 个原生 JS 交互组件 + 14 部声明式剧本; learncc zinc 深色主题全对齐; Phase 4 终验 ALL PASS。博客仓（BlogBackUp）已集成 `/flowkit/` 路径 + 导航 tab, 内容同步至最新——**用户执行 `hexo d` 即上线**。

## 状态获取指令（新会话按序读）

1. `.plan-feat-polish/STATE.md` — 最终态速览 + 恢复协议（主状态文件）
2. `.plan-feat-polish/notes/design-system.md` — learncc 设计体系六节（后续任何样式工作的标尺）
3. `.plan-feat-iviz/OUTLINE.md` — 16 子项目清单与波次记录（含否决区, 防重复提案）
4. `git log --oneline -12` — 提交链

## 未决事项（全部为可选项, 无阻塞）

| 项 | 谁 | 说明 |
|---|---|---|
| 博客上线 | 用户 | BlogBackUp 仓 `hexo d`（内容已同步至最新） |
| 5.8 沉淀 6 候选 | 待用户确认 | SRI 钉版姿势 / 后台 tab IO 假象 / 声明式动画架构 / 双 agent 合稿纪律 / 特异性优先审计 / 原有格式不可变 |
| 低优挂账 ~17 条 | 可选 | gap-A.md / gap-B.md 尾部汇总表, 每条自带验收标准 |
| REC-P1~P4 实施 | 触发条件驱动 | propositions.md——不达条件不实施 |

## 关键纪律（新会话必须延续）

- **SC5**: 教程叙述与 skills 源码逐锚对应, 落笔前 sed 实读复核（已知陷阱清单见 iviz task_plan 章节任务书模板）
- **零依赖零构建**: 原生 JS/CSS, 组件走 FlowSite.fns + data-ready + _fsClear 协议（replay.js 头注）
- **验收即实测**: 断言过 ≠ 通过——渲染类交付必须 CDP 截图/computed 复验; CDP 后台 tab 有 IO/节流假象, 需强制渲染帧再判
- **博客同步链**: site/ → BlogBackUp/source/flowkit/（rsync）→ hexo generate → 用户 hexo d
- **已知陷阱**: flow/SKILL.md:394 与 flow/references/agent-dispatch.md:24 残留旧值「≤4」勿引; multi-agent SKILL.md:55-70 重复编号按描述定位; v1 剧本标题在 annotation.title（步级校验须按 schema 分支）

## 本地预览

```bash
cd site && python3 -m http.server 4000   # file:// 不支持 docsify
```
