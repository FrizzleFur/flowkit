
## Phase F: 深色主题落地后的修正与增强（2026-09-12 用户四点反馈）

| # | 任务 | 状态 | 落点 |
|---|---|---|---|
| F1 | 流程图右列展示不全（消息面板溢出裁切） | ✅ 已修: 面板 body 200→340px, stage 680→760px, 右列 min-width 250px | replay.css |
| F2 | 浏览器主题色仍是亮色（tab 栏） | ✅ 已修: meta theme-color #09090b | index.html |
| F3 | 各章节 CSS 逐一审计对齐 learncc | 🔄 audit agent 执行中: 11 章+封面+辅文逐章清单（标题/引用块/表格/代码/链接/侧栏/搜索），偏差逐条修 | 全站 CSS |
| F4 | 甬道样式多样化（不止一种流向） | 规划: 引擎新增布局变体——lanes 泳道面板（多列并行+token 流动）/ fork-join 分叉路由视图 / 横向 pipeline 变体；随波次 B/C 的 C9/C7/C10 落地 | replay.js + PROTOCOL |
| F5 | （衔接）波次 B: C9 路由分流用 fork 视图、C7 分片勾销用 lanes、S2 Learning Path | 排队 F4 引擎增强后派发 | — |

## 审查采纳记录（Phase F）
F1/F2 当轮完成（CDP 复验待主题审计一并做）；F3 派 audit agent；F4 引擎增强由主会话随波次 B 实施——新增面板类型进 PROTOCOL.md 后，C9/C7/C10 只写声明表。
