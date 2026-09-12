# R2 调研: learn-claude-code 教学站点形态研究

> 调研人: site-r2 | 日期: 2026-09-12 | 方法: web-access (github.com API 直读 + raw.githubusercontent 取源码 + CDP 实测官网)
> 对象: https://github.com/shareAI-lab/learn-claude-code ("Bash is all you need" — 17 章从零构建 claude-code 式 harness) + 在线站 https://learn.shareai.run

---

## 1. 项目定位

- repo: `shareAI-lab/learn-claude-code`, 描述 "Bash is all you need - A nano claude code–like 「agent harness」, built from 0 to 1"
- 核心理念（README-zh 开篇长文）: **Agency 来自模型训练，Agent 产品 = 模型 + Harness**。课程教的是"造载具"（harness），不是"造智能"
- 每章一个 `sXX_主题/` 目录: `README.md` / `README.zh.md` / `README.ja.md`（三语）+ `code.py`（本章完整可运行代码）+ `images/`（SVG 架构图）
- Python 单文件渐进式: s01 约 102 LOC → s17 完整 harness

## 2. 17 章全表

| 章 | 主题 | 一句话核心机制 | layer |
|----|------|----------------|-------|
| s01 | Agent Loop | 一个循环就够了: while True 调模型 → stop_reason != tool_use 则 break，最小 agent = 1 工具 + 1 循环 | tools |
| s02 | Tool Use | 多加一个工具只加一行: 循环不动，新工具注册进 dispatch map | tools |
| s03 | Permission | 执行前做权限判断: 权限管线决定哪些操作需要审批 | tools |
| s04 | Hooks | 挂在循环上不写进循环里: 工具执行前后注入扩展逻辑（生命周期钩子） | tools |
| s05 | TodoWrite | 没有计划的 agent 走哪算哪: 先列步骤再动手，长任务不漏项 | planning |
| s06 | Subagent | 给子任务一段独立上下文: 全新 messages[]，最终文本返回父循环，中间对话不进父上下文 | planning |
| s07 | Skill Loading | 用到时再加载: system prompt 存技能目录，load_skill 返回完整 SKILL.md | planning |
| s08 | Context Compact | 上下文总会满: 四步压缩，低成本操作优先执行 | memory |
| s09 | Memory | 让重要信息跨会话保留: 文件存储 + 索引 + 相关性选择 + 按需召回 | memory |
| s10 | Task System | 大目标拆成小任务排序持久化: 文件持久化任务图，多 agent 协作基础 | collaboration |
| s11 | Background Tasks | 慢操作放后台: 后台线程执行命令，后续轮次收集完成结果 | concurrency |
| s12 | Cron Scheduler | 按时间启动任务: 保存执行时间 → 到点入队 → agent 空闲时交给 loop | concurrency |
| s13 | Agent Teams | 团队运行时与协作协议: 持久队友、共享任务认领、可选 worktree | collaboration |
| s14 | MCP Tools | 发现并调用外部工具: 连接服务、发现工具、加入工具循环（替代手写 per-service 工具） | — |
| s15 | Integrated Harness | 多种机制一个循环: 工具/权限/记忆/任务/团队/插件都挂在同一个 while True 上 | — |
| s16 | Workflow Runtime | 模型决定单步脚本决定编排: 一次 tool_use 启动可恢复脚本运行时，协调多次 agent 调用 | — |
| s17 | Goal Loop | 模型提出停止，独立判断器决定是否继续（goal 完成判定与 loop 解耦） | — |

来源: 各 `sXX_*/README.zh.md` 标题+首段; layer 归属见 `web/src/lib/constants.ts` VERSION_META（五层: tools/planning/memory/concurrency/collaboration）。

## 3. web/ 技术形态拆解

### 3.1 应用骨架

- **Next.js 15 App Router + TypeScript + Tailwind + framer-motion + lucide 图标**，部署 Vercel（`web/vercel.json`），即 learn.shareai.run 本体
- 路由: `src/app/[locale]/`（en/zh/ja 三语）+ `(learn)/` 路由组:
  - `[locale]/page.tsx` — 首页
  - `[locale]/[version]/page.tsx` — **每章一页**（version = s01~s17，generateStaticParams 静态生成 17 页）
  - `[locale]/[version]/diff/` — 章内代码 diff 页
  - `(learn)/timeline` — 垂直时间线页; `compare` — 双版本对比页; `layers` — 五层架构分组页
- **构建管线**: `web/scripts/extract-content.ts` 扫 repo 各章目录 → AST 解析 code.py 提取 classes/functions/tools/LOC → 生成 `src/data/generated/versions.json`（597KB）+ `docs.json`（483KB，三语 md 全文）→ 拷贝章内 images 到 `public/course-assets/`。**内容与代码同仓同源，站点数据是仓库的编译产物**

### 3.2 章页组装（核心页面形态）

`[version]/page.tsx`（服务端）+ `client.tsx`（客户端）:

```
┌ 章头（服务端静态）: sXX 徽章 | 标题 | layer 彩色徽章 | subtitle
│   LOC 数 | 工具数 | coreAddition 胶囊 | keyInsight 斜体引言
├ Hero 可视化（SessionVisualization，每章一个步进动画组件）
├ 四 Tab（learn / simulate / code / deep-dive）
│   learn:     DocRenderer — 渲染该章 markdown（来自 docs.json）
│   simulate:  AgentLoopSimulator — 剧本回放模拟器
│   code:      SourceViewer — 该章 code.py 源码查看
│   deep-dive: ExecutionFlow + ArchDiagram + WhatsNew + DesignDecisions
└ 上一章/下一章导航
```

### 3.3 Simulator（模拟器）机制 ★核心交互

**一句话: 纯前端剧本回放——每章一个 JSON 剧本，把 agent 的 messages 流做成可播放/单步/调速的"执行轨迹动画"，零真实模型调用。**

- 数据: `src/data/scenarios/s01~s17.json`，每章 8~20 步。step 结构: `{type, content, annotation, toolName?}`，type ∈ user_message / assistant_text / tool_call / tool_result / system_event
- 状态机: `useSimulator.ts`（~90 行）— currentIndex + isPlaying + speed(0.5/1/2/4x)，`setTimeout(1200/speed)` 逐步推进，visibleSteps = steps.slice(0, currentIndex+1)（**追加式**，非跳转式）
- UI: `agent-loop-simulator.tsx` 容器（动态 import 按章加载 JSON）+ `simulator-controls.tsx`（Play/Pause/SkipForward/Reset + 速度胶囊 + i/N 步数）+ `simulator-message.tsx`（5 类消息色块: user 蓝 / assistant 灰 / tool_call 琥珀+黑底等宽 code / tool_result 绿+黑底 code / system 紫；每步底部斜体 annotation 教学注释；framer-motion 淡入+上移动画；容器 max-h-500px 自动滚底）
- 空态: "Press Play or Step to begin"；无剧本章显示虚线占位框

### 3.4 Hero 步进可视化（每章开头的机制动画）

- `components/visualizations/s01-agent-loop.tsx` … `s15-integrated-harness.tsx`（15 个章级组件）+ 共享 `shared/mechanism-flow.tsx` + `shared/step-controls.tsx` + `hooks/useSteppedVisualization.ts`
- 形态（以 s01 为例）: **双面板联动** — 左侧 SVG 流程图（NODES 带手排 x/y 坐标 + EDGES），右侧 `messages[]` 面板；底部 StepControls（prev/next/reset/autoPlay + N 个圆点步骤指示器 + i/N）+ 当前步骤蓝框注释卡
- 数据驱动: `ACTIVE_NODES_PER_STEP` / `ACTIVE_EDGES_PER_STEP` / `MESSAGES_PER_STEP` / `STEP_INFO` 四个数组按步索引——每步哪些节点/边高亮、消息面板加什么、注释卡说什么
- `mechanism-flow.tsx` 泛化版: 节点带 `appearsAt`（第几步出现）渐进披露，6 种节点类型着色（start 蓝/process 绿/decision 琥珀/store 紫/external 红/end 灰），边路径自动计算（正交/贝塞尔）
- 状态机: `useSteppedVisualization`（~80 行）— currentStep + next/prev/reset/goToStep + setInterval(2000ms) autoPlay，到末步自动停

### 3.5 全局页面

- **首页**: Hero（标题+一句话+CTA→timeline）→ Core Pattern（macOS 三圆点终端卡 + 语法高亮 while True 代码，手写 span 着色）→ MessageFlow 可视化 → 学习路径卡片网格（每章一卡，layer 配色边框+圆点，含 LOC/工具数）
- **Timeline 页**: 垂直时间线，每章 = layer 配色圆点（内嵌章号）+ 竖向连线 + 卡片（标题/副题/LOC 进度条 loc/MAX_LOC），framer-motion whileInView 入场
- **Compare 页**: 双 `<select>` 选两个版本 → 前端集合运算出 onlyA/onlyB 工具、newClasses/newFunctions、locDelta → CodeDiff + ArchDiagram 并排
- **Layers 页**: 五层分组卡片墙（每层左侧 4px 彩色边 + 层内章节小卡片网格）
- 主题: 默认深色 + `useDarkMode`（含 SVG 调色板 hook）; i18n: en/zh/ja JSON messages

## 4. 可移植 docsify 轻交互清单

目标: docsify 站内零框架原生 JS/CSS。逐项判定:

### ✅ A. Simulator 剧本回放聊天模拟器 【docsify 可低成本复刻，TOP1】
- 交互描述: 章内嵌一个"对话回放器"——Play/单步/重置/0.5-4x 调速，user/assistant/tool_call/tool_result/system 五类彩色消息块逐条滑入，每步带斜体教学注释，容器自动滚底
- 实现要点: JSON 剧本（可内嵌章 md 的 `<script type="text/json">` 或独立 .json fetch）+ ~100 行原生 JS（setTimeout 步进 + appendChild）+ ~60 行 CSS（5 色块类 + keyframes 淡入上移，替代 framer-motion）。建议封装 docsify 插件: `hook: 'mounted'` 扫 `[data-simulator]` 容器初始化，读取 data-src 指向剧本。escapeHtml 防 XSS
- 成本估计: **低**（1 个插件文件 + 每章 1 份剧本 JSON，单剧本约 40 行）

### ✅ B. 步进消息面板（Hero 可视化降级版） 【可复刻，TOP2】
- 交互描述: 流程机制教学用"分步动画"——左侧机制说明（或静态 mermaid 图），右侧 messages 面板按步填充 + 底部蓝框注释卡切换 + 圆点步骤指示器 i/N + prev/next/autoPlay
- 实现要点: 与 A 共用步进状态机（~80 行）。SVG 联动高亮是加分项非必需——降级为"静态图 + 消息面板/注释卡步进"已拿到 80% 教学效果。若要 SVG 联动: 内联 SVG 节点加 id，JS 按步切 `.active` 类（每步数据 = activeNodes/activeEdges/annotation 三数组）。原文每章手排坐标的 React 组件成本高，docsify 场景建议 mermaid 出静态底图 + 少量关键节点 id 高亮
- 成本估计: 降级版 **低**（复用 A 的引擎 + 每章一份步骤数据）; 完整 SVG 联动版 **中**（每章需手做图）

### ✅ C. macOS 窗口式代码卡片 + 章头元数据徽章 【纯 CSS，TOP3】
- 交互描述: 深底代码块顶部三色圆点 + 文件名条；章头 sXX 徽章 + 彩色 layer 徽章 + LOC/工具数 + keyInsight 斜体引言
- 实现要点: 纯 CSS 类（`.mac-window::before` 画圆点）+ md 里手写少量 HTML 或 docsify 插件按 front-matter 渲染章头。零 JS
- 成本估计: **极低**（一个 CSS 文件，一次性）

### ✅ D. 垂直 Timeline 章节地图 【纯 HTML/CSS + 可选 IO 动画，TOP4】
- 交互描述: 全课程一页纵览——每章圆点（layer 配色、内嵌章号）+ 竖线串联 + 卡片（标题/一句话/LOC 进度条），滚动入场动画
- 实现要点: 静态 div 列表 + CSS（左线 + 圆点 + 进度条 width%）。入场动画 IntersectionObserver 10 行（可选）。章节数据硬编码或从一个 JSON 生成
- 成本估计: **低**

### ✅ E. What's New 章间差异卡片 【TOP5】
- 交互描述: 每章开头/结尾一张"本章新增"卡: 新增工具（胶囊）、新增类/函数（等宽列表）、LOC 增量（+N 绿色）
- 实现要点: 纯静态 HTML（数据来自章间对比，写站点时手工/脚本生成一次即可）。原文 compare 页的双选联动版需要框架，不做
- 成本估计: **极低**

### ⚠️ F. 四 Tab 章内切换（learn/simulate/code/deep-dive）
- docsify 有天然替代: 长滚动 + 锚点，或拆子页（`s01.md` / `s01-sim.md`）。若坚持章内 tab: radio-CSS hack 或 20 行 JS 均可，但与 docsify 阅读流冲突。**判定: 用滚动/子页替代，不移植 tab 本身**

### ⚠️ G. Compare 双版本对比页 — **值得二期**: 集合运算逻辑简单可原生 JS 写，但 code diff 高亮需引 CDN diff 库（diff2html），且需预生成章元数据 JSON。一期用 E（静态 What's New）覆盖 80% 需求

### ❌ H. mechanism-flow 渐进披露泛化图（appearsAt 自动布局）— **需要框架不适合**: 边路径自动计算+贝塞尔是 React 组件内手工几何; docsify 场景由 B 的 mermaid 底图替代

### ❌ I. 三语 i18n / generateStaticParams 静态生成 / extract-content.ts 编译管线 — Next.js 专属形态，docsify 无对应物（我们单语也不需要）。**可借鉴其思想: 内容与站点同仓，站点数据可脚本从源仓生成**

## 5. 官网 learn.shareai.run 实况（CDP 实测 2026-09-12）

- **确认就是 web/ 的 Vercel 部署**: 路由 `/en/ /zh/ /ja/`，源码所见组件（四 Tab、模拟器控件、五类色块）与线上逐一对上
- **观感**: 默认深色、近纯黑底，黑白灰三层文字层级 + 仅代码语法高亮着色（紫关键字/蓝方法/绿字符串），单列居中大留白，Inter 系无衬线。极克制的开发者教学站风格
- **首页动线**: Hero（一句定位 + Start Learning → timeline）→ Core Pattern（mac 终端卡 + 7 行 while True 核心代码）→ Message Growth → 17 章卡片网格
- **导航**: 仅 Timeline / Compare / Layers 三内容入口 + 语言胶囊 + 主题切换 + GitHub，≤6 元素
- **章页实测**（/zh/s01）: 左侧 layer 分组 sidebar（彩色圆点）→ 章头元数据带（s01 徽章/102 LOC/1 工具/coreAddition 胶囊/keyInsight 引言）→ Hero 步进动画（点 Auto-play 后流程图 Start 节点高亮 + messages 面板 length:1 + 2/7 圆点指示联动，注释卡同步换文案）→ 模拟器 Tab（Play/Skip/Reset/速度胶囊/0/8 计数，空态提示语）
- **值得借鉴的呈现手法**:
  1. "一句话机制 + 一段最小代码"节奏——每区块只讲一个机制
  2. 执行轨迹做成媒体播放器语言（Play/倍速/单步），学习者零学习成本
  3. 每步配 annotation 斜体注释——动画本身在"旁白"
  4. 导航即大纲（Timeline/Compare/Layers 预告课程组织方式）
  5. layer 五色系统贯穿 sidebar/徽章/时间线/卡片边框——一套语义色全局复用

## 6. 引用

- repo 根: https://github.com/shareAI-lab/learn-claude-code
- 中文主 README: https://raw.githubusercontent.com/shareAI-lab/learn-claude-code/main/README-zh.md
- 各章: `https://github.com/shareAI-lab/learn-claude-code/tree/main/s01_agent_loop` … `s17_goal_loop`
- web 源码关键文件（raw.githubusercontent.com/main/ 前缀）:
  - `web/src/hooks/useSimulator.ts` — 模拟器状态机
  - `web/src/components/simulator/{agent-loop-simulator,simulator-controls,simulator-message}.tsx`
  - `web/src/data/scenarios/s01.json` — 剧本样例
  - `web/src/hooks/useSteppedVisualization.ts` + `web/src/components/visualizations/shared/{mechanism-flow,step-controls}.tsx`
  - `web/src/components/visualizations/s01-agent-loop.tsx` — hero 双面板可视化样例
  - `web/src/app/[locale]/(learn)/[version]/{page,client}.tsx` — 章页组装
  - `web/src/lib/constants.ts` — VERSION_META + LAYERS
  - `web/scripts/extract-content.ts` — 内容编译管线
- 官网: https://learn.shareai.run（/zh/s01 实测）
