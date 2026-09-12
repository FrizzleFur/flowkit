# learn-claude-code 设计体系认知文档

> 采样方法：CDP 直连 Chrome 打开 https://learn.shareai.run 逐页 `getComputedStyle` 实测 + GitHub 源码（`web/src/`）交叉验证。
> 采样页面：`/en/`（首页）、`/en/timeline/`、`/en/s01/`（四标签全点开）、`/en/compare/`（选 s01↔s03 触发 diff）、`/en/layers/`、`/zh/s01/`（混排策略）。
> 每个值标注来源：**[CS]** = computed style 实测，**[SRC]** = 源码类名/常量，**[CSS]** = globals.css 源码。主题默认 dark（`html.dark`）。

---

## 一、布局语法

| Token | 值 | 用在何处 | 来源 |
|---|---|---|---|
| 页面壳 | `mx-auto max-w-7xl px-4 py-8` | main（首页/timeline/compare/layers 共用） | CS: max-width 1280px, padding 32px |
| 内容列（阅读型） | `mx-auto max-w-3xl space-y-10 py-4` | 章节页（s01）主列 | CS: 768px |
| 双栏骨架 | `flex gap-8` | timeline/章节页：侧栏 + 主列，列距 32px | CS/SRC |
| 侧栏 | `w-56 shrink-0`，内容 `sticky top-[calc(3.5rem+2rem)] space-y-5` | 224px 宽；sticky 位 = nav 高 56px + 32px 悬浮距 | CS: width 224px |
| nav 高度 | `h-14`（56px + 1px border = 实测 57px） | 全站顶栏 | CS: height 57px |
| 首页分幕 | `flex flex-col gap-20 pb-16` | section 间 80px 垂直呼吸 | CS: gap 80px, pb 64px |
| hero 区 | `flex flex-col items-center px-2 pt-8 sm:pt-20 text-center` | 首屏 | CS: padding 80px 8px 0 |
| 可视化列 | `mx-auto max-w-2xl`（672px） | 首页 Core Pattern / Message Growth 容器 | CS: max-width 672px |
| section 头 | `mb-6 text-center`：h2 + `mt-2` 副标 p | 所有 section 的标题范式（24px 下距） | SRC |
| 卡片网格 | `grid gap-3 sm:grid-cols-2 lg:grid-cols-3` | 首页 Learning Path（列距 12px，小间距密排） | SRC |
| 列表行距 | `flex flex-col gap-12` / `space-y-6` / `gap-3` | timeline 主体 48px / 章节内模块 24px / 紧凑行 12px | CS/SRC |
| 层级顺序（章节页） | 徽章行 → 金句副标 → meta 行 → 引用 → 四标签区 → 上下章 nav | `space-y-10` 串起三大块 | CS |

**圆角阶梯**（全部实测）：
- `rounded-md` 6px —— 侧栏项、语言切换器内按钮、消息 chip
- `rounded-lg` 8px —— 一切按钮、代码卡（Code 标签版）、select、tab 内速度档
- `rounded-xl` 12px —— 一切「卡」：Card、可视化容器、时间线卡、层卡、hero-callout、prose pre
- `rounded-full` —— badge pill、时间线节点圆、LOC 进度条、左侧层色条

规律：**小件 6/8px，容器 12px，胶囊/圆点 full**。没有 2px/4px 的极小圆角。

字符画（章节页骨架）:
```
┌─ header h-14 max-w-7xl ─────────────────────┐
├─ main px-4 py-8 ────────────────────────────┤
│ ┌─sidebar w-56─┐ gap-8 ┌─max-w-3xl────────┐ │
│ │ sticky       │       │ header(徽章行…)   │ │
│ │ 分组侧栏      │       │ space-y-10       │ │
│ │              │       │ 四标签交互区       │ │
│ │              │       │ 上下章 nav        │ │
└──────────────────────────────────────────────┘
```

---

## 二、排版阶梯

| 层级 | size / lh | weight | letter-spacing | 颜色（dark） | 来源 |
|---|---|---|---|---|---|
| h1 hero | 30→48→**60px**(lg) / 60px | 700 | -0.025em（实测 -1.5px, `tracking-tight`） | #fafafa | CS: font-size 60px |
| h1 章节页 | 24→30px | 700 | 默认 | #fafafa | SRC `text-2xl sm:text-3xl` |
| h2 section/层 | 24→30px | 700 | 默认 | #fafafa | CS: 30px/700 |
| h2 prose | 1.25rem / 1.75rem | 700 | -0.01em | #fafafa + **border-b 1px zinc-800** | CSS |
| h3 prose | 1.0625rem(17px) / 1.5rem | 600 | — | #e4e4e7（zinc-200，比标题暗半档） | CSS |
| h3 卡标题 | 16→18px | 600 | — | 默认白；首页小卡 14px/600 | SRC |
| hero 副标 | 16→20px / 28px | 400 | — | #a1a1aa（zinc-400） | CS |
| body（prose p） | **0.9rem(14.4px) / 1.7** | 400 | — | **#d4d4d8**（zinc-300，比 secondary 亮半档） | CSS |
| 页面默认 body | 16px / 24px | 400 | — | #fafafa | CS |
| meta/small | 12px（text-xs） | 400–500 | — | #a1a1aa，**数字一律 `tabular-nums`** | CS |
| mono 代码 | Code 标签: 10→12px / 16→20px；prose pre: 0.8125rem(13px) / 1.6 | — | — | 正文 #e2e8f0(zinc-200 系) | CS/CSS |
| mono 栈 | `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, …` | | | | CS |

**层级策略（关键）**：标题一律白 zinc-50；正文不是 zinc-400 而是 **zinc-300（#d4d4d8）**——比辅助灰亮半档保证长文可读；辅助信息/meta 才用 zinc-400（`--color-text-secondary`）；最弱（占位、弱标签）zinc-500/600。即 **白 / zinc-300 / zinc-400 / zinc-500 四档灰阶** 承载全部信息层级，字号差反而克制（h2 只比 body 大一档多）。

prose 内其余：h4 15px/600、strong 700 白、em italic zinc-400、链接见色彩节、列表 `0.9rem/1.7` li 上下 0.375rem。

---

## 三、色彩全阶

### 3.1 中性底色阶（globals.css 变量，双主题）

| 角色 | 亮色 | 暗色 | 实测确认 |
|---|---|---|---|
| --color-bg | #ffffff | **#09090b**（zinc-950） | CS: rgb(9,9,11) |
| --color-bg-secondary | #f4f4f5（zinc-100） | **#18181b**（zinc-900） | CSS + CS lab(8.31…) |
| --color-text | #09090b | **#fafafa**（zinc-50） | CS |
| --color-text-secondary | #71717a（zinc-500） | **#a1a1aa**（zinc-400） | CS |
| --color-border | #e4e4e7（zinc-200） | **#27272a**（zinc-800） | CS |

### 3.2 表面用法（暗色实测）

- **页面底** = 卡片底更浅一档：卡片 `dark:bg-zinc-900`（首页 Learning Path 卡、Compare 双卡），可视化容器反而用 `bg-[var(--color-bg)]` 与页面同色（zinc-950）**靠 border 区分层次**
- **代码区永远更深**：代码窗体 `bg-zinc-950`（纯黑，首页）/ prose pre `#0f172a`（slate-900，冷黑）——代码块是全页最深的表面
- **hover 表面**：`dark:hover:bg-zinc-800/50`（半透明提亮）、表行 `#111113`、按钮 `hover:bg-zinc-100/zinc-800`
- **骨架屏**：`bg-zinc-100 dark:bg-zinc-800` + animate-pulse
- **layers 层卡身体**：`bg-zinc-50/50`（亮色下 50% 透明度的浅灰）

### 3.3 五层语义色（站点灵魂，--color-layer-*）

| 层 | 色值 | tailwind |
|---|---|---|
| Tools & Execution | #3B82F6 | blue-500 |
| Planning | #10B981 | emerald-500 |
| Memory | #8B5CF6 | purple-500 |
| Concurrency | #F59E0B | amber-500 |
| Collaboration | #EF4444 | red-500 |

**每层色有 5 个衍生态**（以 blue 为例，SRC）：
1. 实色件：`bg-blue-500`（节点圆/色点/进度条/色条）
2. 亮 badge：`bg-blue-100 text-blue-800`（亮模式）
3. 暗 badge：`dark:bg-blue-900/30 dark:text-blue-300`（30% 透明深底 + 300 亮字）
4. 边框态：`border-blue-500/30 hover:border-blue-500/60`（卡片按层着色）
5. 连接线：`bg-blue-500/30`（时间线竖线）

### 3.4 消息 chip 语义色（Message Growth，SRC）

`user=blue-500 / assistant=zinc-600 / tool_call=amber-500 / tool_result=emerald-500`——用实色底+白字区分角色。

### 3.5 diff / 状态色

- 删除行：`bg-red-50 dark:bg-red-950/30`；hljs deletion `#fca5a5` on `rgba(239,68,68,.15)` [CSS]
- 新增：`text-green-600 dark:text-green-400`；token 徽章 `bg-green-100 dark:bg-green-900/30 text-green-700/300`；hljs addition `#86efac` on `rgba(34,197,94,.15)`
- 空态/占位文字：zinc-400；macOS 三点：首页 `red/yellow/green-500/70`（70% 透明），Code 标签 `-400` 实色

### 3.6 prose 特殊色（globals.css）

- **inline code 是 pink**：`#be185d`（pink-700）/ dark `#f9a8d4`（pink-300）——全站唯一非语义强调色，用来让行内代码从灰底中跳出来
- **hero-callout**：渐变底 `linear-gradient(135deg,#eff6ff→#f0fdf4)` / dark `#172554→#052e16`；左侧 4px 竖条 `blue→emerald` 渐变；文字 `#1e40af` / dark `#93c5fd`
- **普通引用**：indigo 系——border-l 3px `#a5b4fc`（dark `#6366f1`）、底 `#eef2ff`（dark `rgba(99,102,241,.1)`）、文字 `#4338ca`（dark `#c7d2fe`）
- **链接**：`#2563eb` / dark `#60a5fa`，下划线装饰色淡一档（`#93c5fd`/`#1e40af`），hover 下划线变主色，`text-underline-offset: 2px`
- **ol 步骤圆片**：`linear-gradient(135deg,#3b82f6,#6366f1)`（blue→indigo）
- **hr**：`linear-gradient(to right, transparent, zinc→, transparent)` 两端消隐
- **语法高亮**（hljs）: keyword `#c084fc` / number·literal `#fb923c` / string `#34d399` / comment `#64748b` italic / 函数名 `#60a5fa` / built_in `#f472b6` / attr `#fbbf24` / tag `#f87171`

### 3.7 透明度语法

- **nav**：`zinc-950/80`（实测 oklab …/0.8）+ `backdrop-blur(8px)` + border-b——毛玻璃悬浮
- `/30` 系：层色边框静态态、连接线、暗 badge 底
- `/60` / `/70`：hover 边框、首页三点
- `/50`：zinc-50/50 层卡身体、zinc-800/50 hover
- 语义色 100/800/300/900 四件套：亮 badge = 100 底 + 800 字；暗 badge = 900/30 底 + 300 字

### 3.8 边框两档

- 常态边框 = `--color-border`（zinc-800/200）
- hover 边框 = 提亮一档：卡片 `border-[var(--color-text-secondary)]/30`（≈zinc-400/30）或层色 /30→/60
- 特殊：空态用 `border-dashed border-zinc-300 dark:border-zinc-600`（虚线=可交互空位）

---

## 四、组件解剖

### 4.1 Card 基件（ui/card.tsx [SRC]）
`rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900`
- 内边距 p-6=24px，边框 1px，圆角 12px，shadow-sm（亮模式主要层次手段，暗模式靠色差）
- 状态：按层追加 `border-blue-500/30 hover:border-blue-500/60 transition-all duration-200`（首页卡）

### 4.2 章节卡（timeline 版 [CS/SRC]）
结构：`relative flex gap-4 pb-8 sm:gap-6` →
- 左轨：节点圆 `h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-{layer}-500 ring-4 ring-[var(--color-bg)] z-10`，数字 `text-[10px] sm:text-xs font-bold text-white`；下方连接线 `w-0.5 flex-1 bg-{layer}-500/30`（下一项的层色）
- 右卡：`rounded-xl border border-[--color-border] bg-[--color-bg] p-4 sm:p-5 transition-colors hover:border-[--color-text-secondary]/30`
- 卡内顺序：badge 行（LayerBadge + text-xs 副标）→ h3（标题 + `ml-2 text-sm font-normal text-secondary` 英文金句）→ meta 行（`mt-3 flex gap-4 text-xs tabular-nums`）→ LOC 条 → keyInsight（`mt-3 text-sm italic`「…」引号包裹）→ 链接「Learn more →」

### 4.3 代码卡（macOS 三点头部）
- Code 标签版 [CS]：容器 `rounded-lg border border-zinc-200 dark:border-zinc-700`；头 `flex items-center gap-2 border-b px-4 py-2`；三点 `h-3 w-3 rounded-full bg-red-400/yellow-400/green-400`（实色）；文件名 `font-mono text-xs text-zinc-400`；体 `overflow-x-auto bg-zinc-950`，pre `p-2 text-[10px] leading-4 sm:p-4 sm:text-xs sm:leading-5`
- 行号：`inline-block w-6 sm:w-8 text-right select-none text-zinc-600 mr-2 sm:mr-4`
- 首页 hero 版 [SRC]：`max-w-2xl overflow-hidden rounded-xl border-zinc-800 bg-zinc-950`，头 `px-4 py-2.5`，三点 `-500/70`
- prose 内代码块 [CSS]：`rounded-[0.75rem] border #1e293b bg #0f172a p-[1.25rem]`；**右上角语言徽标**：`bg-#3b82f6 白字 0.625rem 700 uppercase ls-0.08em`，`sh` 语言自动变绿标 + 文案 "terminal"

### 4.4 消息 chip（Message Growth [SRC]）
`motion.div rounded-md px-1.5 py-1.5 {role色}` + `font-mono text-[10px] font-medium text-white whitespace-nowrap`；容器 `flex flex-wrap gap-1`；头部行 `font-mono text-xs` messages[] 标签 + `ml-auto rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs tabular-nums dark:bg-zinc-800` 的 len=N 计数徽章

### 4.5 徽章三形态
1. **LayerBadge pill**：`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium` + 层色 100/800 · 900/30/300
2. **方角 token 徽章**：`rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs tabular-nums dark:bg-zinc-800`（len 计数、diff token）
3. **version 大牌**（章节页 header）：`rounded-lg bg-zinc-100 px-3 py-1 font-mono text-lg font-bold dark:bg-zinc-800`——mono 大字号是「版本号」的专属形态

### 4.6 进度条（LOC）
- 卡内小条：轨 `h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800`，条 `h-full rounded-full bg-{layer}-500`，宽度 = loc/maxLoc%
- 图表条：轨 `h-5 rounded bg-zinc-100 dark:bg-zinc-800`，条内嵌 `text-[10px] text-white` 数字，宽度最小 clamp 2%

### 4.7 quote / 旁白
- header 金句：`blockquote border-l-4 border-zinc-300 pl-4 text-sm italic text-zinc-500 dark:border-zinc-600 dark:text-zinc-400`（4px 左线 + 16px 左距）
- 卡内 insight：`mt-3 text-sm italic text-[--color-text-secondary]` + 手写 `“…”` 引号
- prose 普通引用 / hero-callout：见 3.6（indigo / 渐变两档）

### 4.8 按钮层级
| 层级 | 样式 | 实测 |
|---|---|---|
| 主 CTA | `inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200` | CS: 8px 圆角, padding 12×24, 44px 最小高——**黑白反转**，无彩色 |
| 主播放（图标） | 同反转逻辑缩为 `h-9 w-9 rounded-lg` + `disabled:opacity-40` | SRC/CS |
| 次播放（图标） | `h-9 w-9 rounded-lg border border-[--color-border] hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40` | CS |
| 速度档（文本组） | `rounded px-2 py-1 text-xs font-medium` active=黑白反转 / inactive=`text-[--color-text-secondary]` | CS |
| 文字链接 | `text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:underline` + `→` 箭头 | SRC |
| 图标库 | lucide（stroke 2, 16px） | CS: svg |

### 4.9 四标签 tab（章节页 [CS]）
- 容器：`flex border-b border-zinc-200 dark:border-zinc-700`
- active：`px-4 py-2 text-sm font-medium border-b-2 border-zinc-900 dark:border-white`（2px 底线盖在容器 1px 线上，颜色白）
- inactive：`text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors`
- 面板：`mt-4 py-4`，无动画直接切换

### 4.10 侧栏 / 上下章 nav
- 侧栏项：`block rounded-md px-2.5 py-1.5 text-sm transition-colors`；active=`bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-white`；普通=`text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-300`；分组标题 text-sm（16px CS）+ 色点图例
- 上下章：`border-t pt-6 flex justify-between`，`text-zinc-500 hover:text-zinc-900/white`，箭头 `transition-transform group-hover:±translate-x-1`（4px 平移）

---

## 五、交互与动效

### 5.1 hover 语法（全部 150–200ms transition-colors/all）
- 边框提亮一档：zinc-800 → `zinc-400/30`；层色 `/30` → `/60`
- 文字提亮两档：zinc-500 → zinc-300/700（nav/侧栏/链接）
- 表面微亮：hover:bg-zinc-800/50（侧栏项）、zinc-100/zinc-800（按钮）
- 文字装饰：卡标题 `group-hover:underline`、badge `hover:opacity-80`
- 箭头位移：`group-hover:translate-x-1`（下一章 → 右移 4px）/ `-translate-x-1`（上一章左移）

### 5.2 入场动画（framer-motion，全部 `whileInView + once`，viewport margin -50px 提前触发 [SRC]）
| 元素 | initial → whileInView | duration | delay |
|---|---|---|---|
| 时间线卡 | `x:30 → 0` + `opacity 0→1`（右侧滑入） | 0.4s | 0.1s |
| LOC 图表条 | `width 0 → N%` | 0.6s | **0.05s × index（stagger）** |
| 消息 chip | `scale 0.6 → 1` + opacity | 0.25s | 0（+ `layout` 弹性重排） |

缓动：未显式指定 → framer 默认（easeOut 族）；CSS 侧全是 `transition-colors`（150ms）/`transition-all duration-200`。无 custom bezier。

### 5.3 播放器节奏 [SRC]
- **useSimulator**（章节 Simulate）：步进 `1200ms / speed`，速度档 0.5x/1x/2x/4x → 2400/1200/600/300ms；`setTimeout` 链式调度；**播完自动停，不循环**；reset 回 currentIndex=-1（全隐藏）
- **useSteppedVisualization**：`autoPlayInterval` 默认 **2000ms**，setInterval，同样播完即停
- **MessageFlow 首页循环**：单 timer 自调度——步进 **800ms**，走完 8 步后**满帧停留 1500ms** 再归零重播（唯一循环动画；注释明言防多 timer 竞态）

### 5.4 可视化内动效
- Deep Dive SVG 流程图：边线 `pathLength=1 + stroke-dasharray 0 1 + opacity 0` 初始，线条生长式显现，箭头 marker 用 `var(--color-text-secondary)`、stroke 1.5px——**用 CSS 变量让 SVG 跟随主题**
- 章节可视化懒加载：SSR 先出 `min-h-[500px] animate-pulse` 骨架占位（防布局跳动）

### 5.5 触达与细节
- 所有主 CTA 与汉堡按钮 `min-h/w-[44px]`（移动端触达标准）
- 全局 `-webkit-tap-highlight-color: transparent`
- 移动端代码 `pre,code { font-size: 11px }`（<640px 媒体查询 [CSS]）

---

## 六、内容组织语法

### 6.1 首页分幕（gap-80px 五幕）
hero（标题→副标→CTA，居中）→ The Core Pattern（居中标题+副标 → 代码窗）→ Message Growth（→ 动画）→ Learning Path（→ 3 列卡）→ Architectural Layers（→ 行卡）。**每个 section 都是同一范式：`mb-6 text-center` 的 h2 + `mt-2 text-secondary` 副标，先给一句话再给可视化**。

### 6.2 章节页 header 出场顺序（`header.space-y-3`，12px 累进）
1. **徽章行**（`flex flex-wrap gap-3`）：version 大牌（mono）+ h1 标题 + 层分类 pill——三者同行，信息密度即身份
2. **英文金句副标**：`text-lg text-zinc-500/zinc-400`（"One Loop Is All You Need"）
3. **meta 行**：`flex flex-wrap gap-4 text-sm`：`102 LOC`（mono）+ `1 tools` + coreAddition 小 pill（`rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs`）
4. **金句 blockquote**：border-l-4 italic（keyInsight）
5. → 四标签交互区 → 上下章 nav

### 6.3 渐进披露（四标签）
Learn（prose 叙事）→ Simulate（可操作播放器，先看再做）→ Code（完整带行号源码，给"真相"）→ Deep Dive（SVG 执行图 + 进阶机制文字）。同一容器切换、无路由跳转；active 用 2px 底线。**认知递进：读 → 玩 → 看 → 深挖**。

### 6.4 「一句话机制 + 最小代码」密度节奏
- prose 开头必是 **hero-callout**：金句 + 一行机制定位（"Harness Layer: The Loop — …"），再接 The Problem 场景化引入，然后才给代码
- 代码永远最小化（s01 只 102 LOC），行号 + 章节号前缀（`s01_agent_loop/code.py`）建立文件感
- 呼吸感靠**大间距不靠分隔线**：模块间 space-y-10 / section 间 80px；分隔物只有 h2 的 border-b 和两端消隐的 hr

### 6.5 中英混排策略（/zh/s01 实测）
- **保持英文**：章节标题（"Agent Loop"）、英文金句（"One Loop Is All You Need"、blockquote 原文）、代码/文件名、专有徽章（"Minimal model/tool loop"）、单位（"102 LOC"）
- **翻译中文**：分类名（"工具与执行"）、功能描述（"1 个工具"）、导航/控件文案（"上一章/播放"）
- 数字统计一律 `tabular-nums` + mono；语言切换器为 nav 内嵌 `border p-0.5` 分段控件

### 6.6 Compare / Layers 专页语法
- Compare：双 select（`rounded-lg border px-3 py-2`）+ 中间交换箭头 → 结果为左右两张同款 Card 对比 + diff token 徽章（green/red 系）+ `+78` 变更统计（green-600/400）；空态 `border-dashed p-12 text-center text-zinc-400` 引导选择
- Layers：每层一张 `overflow-hidden rounded-xl border` 卡 = 头（px-6 py-4：层色点 + `L1` zinc-400 前缀 + 层名 + 描述）+ 身（`border-t bg-zinc-50/50 px-6 py-4`：层内章节卡 grid 3 列）+ 层间向下箭头（`py-1 text-zinc-300` 的 svg）——**垂直堆叠 + 色点 + 箭头** 表达架构分层

---

## 附：站点信息架构速记

- 路由：`/`（首页）/ `/timeline` / `/s01…s20`（章节）/ `/compare` / `/layers`，双语 `/en` `/zh`
- 数据源 `versions.json`：每版本含 loc / tools / source / filename / diff——LOC 数驱动进度条与徽章（数据即 UI）
- 侧栏五分组 = 五层（色点 + 章节），timeline 节点/连接线/卡边框/badge 四处同色 = 层语义贯穿
