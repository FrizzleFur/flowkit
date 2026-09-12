# D · learn-claude-code 四大交互模式源码级解剖（iviz 补充研究）

> 方法: CDP 运行时行为实测（采样捕获动画循环）+ GitHub 源码直读（web/src/components/）
> 结论: learncc 全部可视化的架构秘密是**「声明式步进表 + 单步进引擎 + 多面板订阅」**——一个 step index 同时驱动流程图高亮、消息面板、旁白卡三处。framer-motion 只做表现层补间, 可用 CSS transition 等价替换（我们的零依赖路线成立）。

## 模式一 · 增长动画（首页 Message Growth = message-flow.tsx）

- **行为实测**: messages[] 容器内角色芯片（user/assistant/tool_result 小色块）逐个 append, `len=N` 徽章同步递增; 播完重置 len=1 循环播放; 滚动进入视口才开演
- **实现**: useState/useEffect + setInterval append + framer-motion 出场; 循环 = 到尾步后 setTimeout 重置
- **aha 本质**: 「数组在增长」这个抽象概念变成**看得见的堆积**——与 context rot / 记忆复利天然同构
- **flowkit 对应**: C12 记忆复利闭环（召回→沉淀条目滚雪球）/ ch3 闭环收尾; 站点首页 hero 也可用（五 Stage 块逐个点亮循环）

## 模式二 · Learning Path 时间线（/timeline = timeline.tsx）

- **结构实测**: 左侧 sticky 章节导航（layer 色点分组）+ 右侧编号节点垂直轨道（01→20 蓝色圆点+连接线）; 每章卡片含: s0X 徽章 / 一句话机制 / **LOC 进度条**（长度=代码量, 直观传达「每章只加一点」）/ 金句引用 / Learn More
- **aha 本质**: 「渐进式构建」的**量感**——LOC 进度条让 102→完整 harness 的增长可感知; 层色点让 17 章的五域归属一眼可读
- **flowkit 对应**: **站点级新子项目 S2**——我们的 Learning Path 视图: 11 章 × 域色点（九域配色沿用 R3）/ 锚点数做进度条（替代 LOC, 同样传达「每章锚了多少源码」）/ sidebar 升级为此视图

## 模式三 · 交互路由台（s03 Permission Desk = s03-permission.tsx）

- **实现**: STEPS[] 声明步进脚本（每步一个 mode: overview/allow/ask/ask-approved/deny/summary）; REQUESTS[] 声明三个请求卡（tone: emerald/amber/red → toneClass 映射三色边框）; 步进引擎按 mode 高亮对应路由路径, 第三列 Outcome 面板随模式填充
- **aha 本质**: 「路由」不是文字——三张请求卡**走不同的道**, allow 直通 / ask 停下等确认 / deny 拦截, 分岔画面一眼懂
- **flowkit 对应**: C9 Fast/Full 风险路由分流（ch7 首节, 最贴）/ C15 复杂度闸门拦截（备选池——任务滑入 flow vs flow-deep 的岔路口, 与 ch1 开关面板联动）

## 模式四 · 流程图+多面板联动步进（s01 While-Loop = s01-agent-loop.tsx）★ 全站核心架构

- **实现**（源码实证）:
  - `NODES[]`/`EDGES[]`: 手排 SVG 流程图（节点 x/y/w/h + 类型 rect/diamond）
  - `ACTIVE_NODES_PER_STEP` / `ACTIVE_EDGES_PER_STEP`: **每步点亮哪些节点/边的声明表**
  - `MESSAGES_PER_STEP`: 每步右侧 messages[] 面板出现哪些块（含角色色）
  - `STEP_INFO[]`: 每步旁白卡（title + desc）
  - 全部由共享 hook `useSteppedVisualization`（step index + play/step/reset/speed）驱动——**一份步进状态, 三面板同步**
- **aha 本质**: 左眼看流程走到哪, 右眼看数据怎么变, 下方读旁白——**三通道同频**; 「1/7」圆点进度给完成感
- **flowkit 对应**: 这是 R0（replay 成熟化）的**真正终态**——从「单消息面板」升级为「多面板订阅引擎」; 直接服务: ch4 管道全景（Stage 流程图+行动面板联动升级）/ C3 keep-revert 轨道（轨道图+迭代日志联动）/ C9 路由分流

## 零依赖替换清单（framer-motion → 原生）

| learncc 用法 | 我们的等价物 |
|---|---|
| motion 出场动画（chip/卡片滑入） | CSS `@keyframes` + class 挂载（components.css 已有基础） |
| AnimatePresence 退出动画 | class 切换 + `transitionend` 或直接瞬时移除（教学场景可接受） |
| useSteppedVisualization | 扩展 replay.js: 步进状态抽出为可订阅引擎, 面板注册 `onStep(idx)` 回调 |
| lucide-react 图标 | 内联 SVG path（3-4 个常用图标手嵌） |

## 对 OUTLINE 的修订建议（待并入）

1. R0 范围升级: replay.js → 「多面板订阅步进引擎」（声明式 step 表协议: nodes/edges/messages/annotation per step）——工时 2-3h → 4-5h, 但 C2/C3/C6/C9 四个子项目全部站在它肩上
2. 新增 S2: 站级 Learning Path 视图（timeline.tsx 模式, 域色点+锚点进度条+编号轨道）
3. 新增 P11/P12/P13 三形态入 B 库（增长动画/交互路由台/多面板联动）
