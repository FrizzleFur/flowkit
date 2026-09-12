# 差距矩阵 B —— 机制篇 ch4–ch11 逐页审计

> 审计者: mike ｜ 日期: 2026-09-12 ｜ 方法: 只读逐页对照（site/mechanisms/ch4–ch11.md 8 章 + replay.css/replay.js/components.css/theme-learncc.css + 13 部剧本 JSON 横向比对）
> 基准: `.plan-feat-polish/notes/design-system.md`（learncc 六节设计体系，全部实测值）
> 审计范围含各章嵌入组件区（replay/lanes/autodecide/budget/johari/switch/funnel）及周边排版。零代码修改，本文档为唯一写入。

每条差距四字段:【差距描述｜learncc 参照｜修法（文件+改法）｜验收标准（可勾选）】
优先级: 🔴高（影响阅读/体系性缺失）｜🟡中（一致性/可感知打磨）｜⚪低（锦上添花）
ID 规则: S=系统性（作用于全部 8 章）｜B<章>-<n>=章专属｜C=一致性专项（13 部剧本横向）

---

## 一、系统性差距（S 系列，全部 8 章适用）

### S1 🔴 语义色五态衍生系缺失【已知必修①】
- **差距**: `:root` 定义了 --lc-blue/emerald/amber/red/purple 五个裸色值，但组件 CSS 全部硬编码 hex（replay.css/components.css 内 #3b82f6/#10b981/#ef4444/#f59e0b/#a855f7 共 30+ 处），且只用了「实色件」一个衍生态。五层语义色没有 badge/边框态/连接线衍生。另有映射偏差: ①fs-chip 把 tool_call 与 tool_result 并档为同一 emerald（learncc: tool_call=amber-500 / tool_result=emerald-500 两色）②--lc-purple #a855f7 ≠ learncc Memory 层 #8B5CF6。
- **learncc 参照**: design-system 3.3——每层色 5 个衍生态（实色件 / 亮 badge 100+800 / 暗 badge 900/30+300 / 边框 /30→hover /60 / 连接线 /30）；3.4 消息 chip 四色分工。
- **修法**: `site/assets/theme-learncc.css` 增补语义衍生 token（如 `--lc-blue-soft: rgba(59,130,246,.15)`、badge 字色 #93c5fd 等）+ `.lc-badge`/`.lc-line` 工具类；`replay.css`/`components.css` 全量替换硬编码 hex 为 `var(--lc-*)`；`replay.js` ROLE_CLS 拆开 tool_call（amber）与 tool_result（emerald）；`--lc-purple` 校准为 #8B5CF6。
- **验收**:
  - [ ] replay.css / components.css 中不再出现裸 hex 语义色（grep `#3b82f6|#10b981|#ef4444|#f59e0b|#a855f7` = 0）
  - [ ] tool_call chip 为 amber、tool_result chip 为 emerald（ch4 剧本可目检）
  - [ ] --lc-purple = #8B5CF6，lane done 等绿色系不受影响

### S2 🔴 ring 同色分层缺失，全站无 :focus-visible【已知必修②】
- **差距**: grep 全站 `ring-` = 0、`focus-visible` = 0。所有状态件（lane 条目、进度点、quiz 选项、播放按钮）只靠 1px border 表达状态；键盘导航无焦点环，触屏/键盘用户不可见当前位置。
- **learncc 参照**: design-system 4.2——时间线节点 `ring-4 ring-[var(--color-bg)]` 同色分层；5.1 hover 边框提亮一档语法。
- **修法**: `replay.css` 增 `box-shadow: 0 0 0 3px var(--lc-bg0)` 内圈 + 语义色外圈的双层 ring（当前活跃 lane 条目 `fs-li-running`、当前步 `fs-dot-on`、quiz 选中项）；`theme-learncc.css` 增全局 `:focus-visible { outline: 2px solid #93c5fd; outline-offset: 2px }`。
- **验收**:
  - [ ] ch7-shards 播放中分片卡出现双层 ring（深底内圈 + 蓝外圈）
  - [ ] Tab 键遍历播放/单步/重置/速度控件均有可见焦点环
  - [ ] `grep -c "focus-visible" site/assets/*.css` ≥ 1

### S3 🔴 hero-callout 金句锚点缺失（8/8）【已知必修③】
- **差距**: 8 章「一句话机制」全部是普通 blockquote，渲染为 indigo 蓝底引用；learncc 的「渐变底 + 渐变竖条」hero-callout 形态全站 0 处（grep hero-callout = 0）。各章「点破」金句（ch7×2、ch10×1、ch8 粗体句、ch6/ch9 裸段）无统一锚点载体。
- **learncc 参照**: design-system 3.6——hero-callout 渐变底 `#172554→#052e16`（dark）、左 4px blue→emerald 渐变竖条、文字 #93c5fd；6.4——prose 开头必是 hero-callout。
- **修法**: `theme-learncc.css` 新增 `.fs-callout`（渐变底 + 左渐变条 + #93c5fd 文字）；8 章 md 首部「一句话机制」blockquote 改包裹 `<div class="fs-callout">`（或约定 `> **一句话机制**` 首引 blockquote 由 CSS 按内文首粗体词升级——建议直接改 md 显式包裹，最稳）；各章「点破/金句」句统一收进同一组件。
- **验收**:
  - [ ] 8/8 章首部金句为渐变卡形态（蓝→绿渐变底可见）
  - [ ] ch6/ch7/ch8/ch9/ch10 的「点破」类句子样式一致（同为 fs-callout 或同一定义好的金句样式）
  - [ ] 普通说明性 blockquote（如 ch5 组件注）不被误升级

### S4 🔴 章节 header 四步出场不齐（仅第 4 步存在）
- **差距**: 8 章 header = h1 + 一句话机制 blockquote 两件套；learncc 的「徽章行 → 英文金句副标 → meta 行 → 金句 blockquote」四步中前三步全缺。章号、所属主题、体量信息（锚点数/组件数）无承载位。
- **learncc 参照**: design-system 6.2——徽章行（version 大牌 mono + 层 pill）→ 英文金句副标 `text-lg text-zinc-400` → meta 行（数字 mono + tabular-nums）→ 金句 blockquote，`space-y-3` 12px 累进。
- **修法**: 各章 h1 下插入 header HTML 块（docsify 支持 inline HTML）: ①徽章行: `机制篇 · 第 N 章` mono pill + 主题 pill（如「管道」「并发」「记忆」）②英文金句副标一句 ③meta 行: `N 条锚点 · N 个交互组件 · 约 N 分钟`（mono + tabular-nums）。
- **验收**:
  - [ ] 8/8 章 h1 与金句之间出现徽章行 + 副标 + meta 行
  - [ ] meta 行数字等宽对齐（tabular-nums 生效）

### S5 🔴 正文灰阶过暗一档（body=zinc-400）
- **差距**: `theme-learncc.css:17` 把正文 p/li/td 全压在 --lc-text2 (#a1a1aa = zinc-400)；learncc 层级策略明确「正文不是 zinc-400 而是 zinc-300 (#d4d4d8)——比辅助灰亮半档保证长文可读」。本站是长文教程站（单章 200+ 行），长文用辅助灰属于层级错位；组件内文字反而用了 #d4d4d8（fs-blocklabel/fs-fn-card），比页面正文还亮，内外倒挂。
- **learncc 参照**: design-system 二——body #d4d4d8；meta/small 才是 #a1a1aa；四档灰阶 = 白/zinc-300/zinc-400/zinc-500。
- **修法**: `theme-learncc.css` 拆档: `p, li, td { color: #d4d4d8 }`，meta 性内容（`.fs-dotnum`、表格 th 注、日期类）保持 --lc-text2；新增 `--lc-text2_5: #d4d4d8` 中间档 token 防再次混用。
- **验收**:
  - [ ] 章节正文段落取样为 #d4d4d8
  - [ ] 侧栏/时间戳类辅助信息仍为 #a1a1aa
  - [ ] 组件内文字与正文同档（不再内亮外暗）

### S6 🔴 引用层级三档塌缩成一档
- **差距**: theme-learncc.css:32 把**所有** blockquote 渲染为同一 indigo 蓝底形态——「一句话机制」金句、ch5 组件限定注、ch9/ch10 旁白注、「下一章:」导航、章间引用全部同款。learncc 有三档: hero-callout 渐变卡 / header 金句（border-l-4 + italic + 无底色）/ 普通引用（indigo）。金句与导航同貌，信息层级被抹平。
- **learncc 参照**: design-system 3.6 + 4.7——三档引用分工明确；「下一章」在 learncc 是 `border-t pt-6` 的 nav 行（4.10）而非引用。
- **修法**: ①金句档 → S3 的 fs-callout ②「下一章/上一章」导航改 `.fs-nav` 行样式（见 S15）③剩余说明性 blockquote 降级为 learncc header 金句档: 去蓝底，改 `border-left:4px solid var(--lc-border2); color: var(--lc-text2); font-style: italic`。
- **验收**:
  - [ ] 页面上同时存在 ≤2 种引用形态且分工明确（金句卡 / 说明引用）
  - [ ] 「下一章」不再是蓝底引用块

### S7 🟡 内联代码与链接同为蓝系，撞色
- **差距**: 行内代码 `p code` = #93c5fd（蓝-300），链接 = #3b82f6（蓝-500）hover #93c5fd——代码与链接同族同亮，扫描时无法瞬间区分「可点」与「不可点的标识符」。锚点表内大量 `file:line` 全是蓝码，与文中链接难以区分。
- **learncc 参照**: design-system 3.6——inline code 是 pink（dark #f9a8d4），「全站唯一非语义强调色，让行内代码从灰底中跳出来」。
- **修法**: `theme-learncc.css:43,48,53` 行内代码字色改 #f9a8d4（pink-300），底色不变 #26262c。
- **验收**:
  - [ ] 行内代码呈 pink，链接呈 blue，同段落并排可瞬间区分
  - [ ] 打印样式（@media print）同步校准

### S8 🟡 圆角阶梯越档
- **差距**: 组件圆角实测混有 5px（fs-chip）/6px（fs-btn、fs-node、fs-replay-speed）/7px（fs-laneitem、fs-fn-card）/8px（fs-annoc、fs-ad-finding）/10px（fs-msgpanel、fs-lane、表格）/12px（fs-replay、fs-funnel、quiz 容器）/14px（fs-sw-chip）。learncc 阶梯是 6/8/12/full 四档，「小件 6/8、容器 12、胶囊 full」。
- **learncc 参照**: design-system 一·圆角阶梯（全部实测）。
- **修法**: `replay.css`/`components.css` 归档: 5/7px→6px；10px 容器→12px；fs-btn 6→8px；fs-sw-chip 14px→999px（真胶囊）。
- **验收**:
  - [ ] `grep -oE "border-radius: *[0-9]+px" site/assets/interactive/*.css | sort -u` 仅剩 4/6/8/12/999 五值（4px 为代码底 inline 小件可保留）

### S9 🟡 边框杂色 + CSS 变量定义了却没人用
- **差距**: 边框两档体系应为 #27272a（常态）/#3f3f46（hover·次级），但 fs-ad-finding、fs-jh-card 边框与 fs-lenbadge 底用了体系外 #2c2c34；表格行线 #1e1e22、th 底 #1a1a1e 也是野值。theme-learncc.css:6-11 定义了 --lc-* 六个变量，replay.css/components.css 一处未引用（全部硬编码），改主题要改三处。
- **learncc 参照**: design-system 3.8——边框两档；3.1 全部色彩走 CSS 变量。
- **修法**: 组件 CSS 色值全部 var(--lc-*) 化（与 S1 合并执行）；#2c2c34 归入 #27272a 或新设 `--lc-border-soft` 并入文档；表格行线统一 #1e1e22→var(--lc-border) 的 50% 透明变体。
- **验收**:
  - [ ] `grep -c "var(--lc-" site/assets/interactive/replay.css` > 20
  - [ ] #2c2c34 全站清零

### S10 🟡 hover 语法偏离: 蓝色化 vs 中性提亮
- **差距**: `.fs-btn:hover` 变蓝边框 + 蓝字（replay.css:10）；learncc 的 hover 语法是「边框提亮一档 / 文字提亮两档 / 表面微亮」，从不把中性控件 hover 成彩色——彩色 hover 只属于层色边框卡（/30→/60）。次级按钮 hover 变蓝使「彩色=语义/主操作」的信号被稀释。
- **learncc 参照**: design-system 5.1 hover 语法全表；4.8 按钮层级。
- **修法**: `replay.css:10` 次级按钮 hover 改 `background: #26262c; color: #fafafa; border-color: var(--lc-border2)`（表面微亮 + 文字提亮两档）；主按钮 hover 见 S11。
- **验收**:
  - [ ] 次级按钮 hover 无蓝色出现
  - [ ] 主按钮 hover 语义不变

### S11 🟡 主按钮彩底，偏离「黑白反转」主 CTA 语法
- **差距**: `fs-btn-primary` = #3b82f6 蓝底白字（播放/下一题/再来一轮）。learncc 主 CTA 是黑白反转（dark: 白底黑字）、「无彩色」；彩色底只给层语义。播放键作为全站最高频主操作，用蓝底打破了该语法（且与 S10 的蓝 hover 叠加，蓝信号过载）。
- **learncc 参照**: design-system 4.8——主 CTA `dark:bg-white dark:text-zinc-900`，无彩色。
- **修法**: `replay.css:12` 主按钮改 `background: #fafafa; color: #09090b`，hover `#e4e4e7`；封面 fs-cta 已是此形态（theme-learncc.css:63），正好对齐。
- **验收**:
  - [ ] 播放/下一题按钮为白底黑字，与封面 CTA 同款
  - [ ] 蓝 demo 语义（如 wrong 态）不受影响

### S12 🟡 数字无 tabular-nums，关键大数字非 mono
- **差距**: 全站 grep `tabular-nums` = 0。受影响: budget 计算器 34px 大数字（fs-bd-total，非 mono 非 tabular，1→10 时宽跳动）、步进计数 fs-dotnum「1/12」、quiz 进度 fs-ad-prog「1 / 8」、len 徽章（mono 栏内但未显式）。learncc「数字一律 tabular-nums」+ meta mono。
- **learncc 参照**: design-system 二 meta/small 行 + 4.4 计数徽章。
- **修法**: `components.css` 给 .fs-bd-total/.fs-bd-num/.fs-bd-eq 补 `font-family: ui-monospace,…; font-variant-numeric: tabular-nums`；.fs-dotnum/.fs-ad-prog 补 tabular-nums。
- **验收**:
  - [ ] budget 计算器从 9→10 时其余元素不位移
  - [ ] 步进计数宽度稳定

### S13 🟡 触达面积低于 44px 标准
- **差距**: fs-btn（4px 12px padding + 12.5px 字）实高约 25px；fs-bd-btn 34px；fs-dot 进度点不可点但无替代。移动端拇指操作播放/单步/重置困难。learncc 主 CTA 与汉堡按钮全部 `min-h/w-[44px]`。
- **learncc 参照**: design-system 5.5 触达与细节。
- **修法**: `replay.css` 加媒体查询 `@media (pointer: coarse) { .fs-btn { min-height: 44px; min-width: 44px; } }`；fs-bd-btn 同步。
- **验收**:
  - [ ] 手机模拟器（DevTools touch）下按钮 ≥44px
  - [ ] 桌面视觉不变

### S14 🟡 回放器加载无占位，布局跳动（CLS）
- **差距**: fs-replay div 初始高度 0，fetch JSON + build 完成后才撑开（head 41px + stage 数百 px）；ch8 顶部三连放 = 三次跳窗。learncc 可视化懒加载有 `min-h-[500px] animate-pulse` 骨架防跳动。
- **learncc 参照**: design-system 5.4——SSR 先出骨架占位防布局跳动。
- **修法**: `replay.css` 给 `.fs-replay[data-script]:not([data-ready])` 设 `min-height: 220px` + `animate-pulse` 式呼吸（复用 fs-breath 或新 keyframes）；`replay.js` build 前不清占位逻辑不变。
- **验收**:
  - [ ] 首次进 ch8 页滚动时无 ≥80px 的内容跳动
  - [ ] 剧本 fetch 失败时占位被错误信息替换（现有 fs-replay-err 不回归）

### S15 🟡 无「上一章」导航，下一章以引用块伪装
- **差距**: 8 章章尾只有 `> 下一章: […]` 单向引用；ch11 收官行连章节链接形态都不是。learncc 章节页有 `border-t pt-6 flex justify-between` 的上下章 nav，带 ±4px 箭头位移。
- **learncc 参照**: design-system 4.10 上下章 nav；5.1 箭头位移。
- **修法**: 新增 `.fs-prevnext` 样式（border-top 1px var(--lc-border) + pt-24px + 两端对齐）；8 章 md 章尾替换为左「← 上一章」右「下一章 →」双链接；ch11 右侧留空或放「改进提案 →」。
- **验收**:
  - [ ] 8/8 章出现双向 nav，视觉为分隔线 + 两端链接（非蓝底块）
  - [ ] hover 箭头位移 4px

### S16 🟡 代码块无文件名栏 / 无语言徽标
- **差距**: 全站 prose 代码块（ASCII 图、YAML、bash、剧本模板）是裸 pre。learncc 代码卡有 macOS 三点头部 + mono 文件名行（如 `s01_agent_loop/code.py`）+ 右上角语言徽标（sh 自动变绿 "terminal"）。ch4 的 ASCII 全景图、ch8 的 check_context 命令、ch9 的 agent_hint YAML 全部无文件身份。
- **learncc 参照**: design-system 4.3 代码卡 + 6.4「文件感」。
- **修法**: docsify 无文件名元数据，务实方案: 在 theme-learncc.css 给 pre 加右上角语言徽标需 JS 支持——可在 index.html 的 doneEach 钩子里按 `pre>code class="lang-*"` 注入徽标 span；文件名栏由各章 md 手写 `<div class="fs-codefile">skills/flow-deep/SKILL.md</div>` 置于关键代码块前（ch4 的 SKILL 架构图、ch8 的 check_context 命令、ch9 的 agent_hint 三处优先）。
- **验收**:
  - [ ] ```yaml/```bash 块右上角出现语言徽标（bash 可绿标 terminal）
  - [ ] ch4/ch8/ch9 三处关键代码块有文件名栏

### S17 ⚪ 阅读列宽 900px 宽于 learncc 768px 参照
- **差距**: `.markdown-section { max-width: 900px }`；learncc 阅读型主列 max-w-3xl = 768px。900px 下每行 ~45 汉字，处于可读上限；且无可视化专属窄列（learncc 可视化列 672px 居中）。
- **learncc 参照**: design-system 一——内容列 768px；可视化列 672px。
- **修法（可选二选一）**: A. 降到 768px（表格锚点表会变挤，需同步表格字号）；B. 保持 900px 但给 .fs-replay/.fs-funnel 加 `max-width: 720px; margin-inline: auto` 形成可视化窄列节奏。推荐 B。
- **验收**:
  - [ ] 组件区与正文有明显宽度差（若选 B）
  - [ ] 移动端无横向滚动

### S18 🟡 批判小节 / 锚点表无差异化样式
- **差距**: 8 章的「批判小节（局限与成本）」与「本章源码锚点表」都是普通 h2 + 内容，与正文节同权。learncc 对关键收束内容有专属形态（keyInsight italic quote、badge 语法）。批判小节是本教程的招牌结构，值得一个可识别的「收束样式」；锚点表 26 行（ch4）起，`file:line` 无 hover 辅助。
- **learncc 参照**: design-system 4.7 quote / 4.5 徽章形态（借用其「专属内容专属形态」原则）。
- **修法**: 批判小节 h2 前加固定 emoji-free 标识或 h2 追加 class（docsify 可用 `<h2 class="fs-critique">`），样式上给条目列表加左侧 2px amber 竖线；锚点表首列断言列宽锁定、`td code` 加 hover 提亮。最小做法: 只给两节 h2 下边框换虚线以示「附录性」。
- **验收**:
  - [ ] 8/8 章批判小节有可识别的统一样式（与普通节区分）
  - [ ] 锚点表样式 8/8 一致（现状已一致，改动后仍一致）

### S19 🟡 顶部组件「题注/lead-in」有无不一
- **差距**: ch7/ch8 每个组件前都有引导句（「把数字变成液位——」「**三条曲线, 同一个任务——**」）；ch4 顶部回放器（裸 div 紧贴金句）、ch5 fs-johari、ch6 fs-autodecide 三个首组件无任何题注直接出现，读者不知「这是什么、要不要玩」。
- **learncc 参照**: design-system 6.1——「每个 section 都是同一范式: 先给一句话再给可视化」。
- **修法**: ch4 回放器前补一句「先看一条典型流转（12 步，点击播放）——」；ch5 johari 前补「先玩 30 秒象限判定——」；ch6 autodecide 前补「先凭直觉判 8 题——」。统一句式: 动作邀请 +（组件名）+（步数/题数）。
- **验收**:
  - [ ] 8 章每个交互组件前 ≤40 字内有引导句
  - [ ] 引导句句式统一（含播放/题数提示）

---

## 二、逐章专项

### ch4 管道全景
- 无章专属结构缺口（顶部回放器题注缺口已并入 S19；剧本 schema 问题并入 C1/C2）。

### ch5 输入质量与思考规划
**B5-1 🟡 johari 与 autodecide 是两套平行 quiz 组件，样式家族分叉**
- **差距**: ch5 fs-johari 与 ch6 fs-autodecide 同为「出题→选择→反馈」quiz，却有两套平行 CSS（fs-jh-* vs fs-ad-*）与两套反馈结构（fs-jh-fb vs fs-ad-feedback），反馈色同为 emerald/amber 但类名、圆角、padding 各写一遍——双副本漂移风险正是本教程 ch7 自己批判的病。
- **learncc 参照**: design-system 四——组件同构复用（Card 基件派生一切卡）。
- **修法**: `components.css` 抽公共 quiz 基类（.fs-quiz-card/.fs-quiz-fb），johari/autodecide 两个 JS 只换数据不改皮；或最少让 fs-jh-* 复用 fs-ad-* 类名。
- **验收**:
  - [ ] 两 quiz 视觉并排对比无差（边框/圆角/反馈色/间距一致）
  - [ ] components.css 中 quiz 相关类只有一套

### ch6 评审与决策
**B6-1 🟡 autodecide 与 funnel 纵向紧贴，无分组呼吸**
- **差距**: fs-autodecide → 引导句 → fs-funnel 两个 12px 圆角容器间距仅 1.2em（≈19px），与段间距同值，两个大组件看起来黏成一块；learncc 模块间距 space-y-10（40px）/section 间 80px，「呼吸感靠大间距不靠分隔线」。
- **learncc 参照**: design-system 6.4——大间距承载分组。
- **修法**: `replay.css`/`components.css` 给 `.fs-replay + .fs-replay`、`.fs-autodecide + .fs-funnel` 这类相邻组件组合加 `margin-top: 2.2em`；或 md 中间插空行 + hr。
- **验收**:
  - [ ] ch6 顶部两组件间距 ≥2 倍段距
  - [ ] ch8 三连回放器同步受益（同类相邻组合）

**B6-2 ⚪ sunkcost 回放器章中引导偏弱**
- **差距**: ch6 第三组件（ch6-sunkcost）埋在 3.5 节中段，引导只有「对比实验: 同一份 plan 的两种审法——」一句，无「点击播放」类动作提示（ch7/ch10 惯例是括注「点击播放，N 步自动演示」）。
- **learncc 参照**: S19 的统一句式原则。
- **修法**: `ch6-review-and-decision.md:49` 引导句补「（点击播放，7 步自动演示）」。
- **验收**:
  - [ ] 引导句含步数与播放提示，与 ch7/ch10 句式一致

### ch7 并发执行
**B7-1 🟡 routing 回放器位置异常: 唯一嵌在「怎么用」节内的组件**
- **差距**: ch7 四部回放器中三部在 header 区/正文节，唯独 ch7-routing 被放在「怎么用（30 秒上手）」bullet 清单之后、`## 为什么` 之前——组件语义上属于「先路由」正文，位置却挂在速查节尾部，破坏了「怎么用=纯文字速查」的章内惯例（其余 7 章「怎么用」节均无组件）。
- **learncc 参照**: design-system 6.3——四标签区是固定区块，速查性内容与交互区不混排。
- **修法**: `ch7-concurrent-execution.md` 将 routing 回放器及其引导句下移到 `## 为什么` 内「### 先路由」小节首段之后（该节文字本就在讲它）。
- **验收**:
  - [ ] 「怎么用」节内无任何 fs-* 组件
  - [ ] 「先路由」小节内组件紧邻其解说文字

**B7-2 🟡 同章 5 个交互块无节奏分层**
- **差距**: ch7 是全站交互最密章（fs-budget + ch7-budget + ch7-routing + ch7-shards + ch7-panes），全部同级出现、间距同值、无「主/辅」标记。读者无法区分「本章主角计算器」与「补充演示」。learncc 用 section 头（mb-6 text-center h2+副标）给每个可视化分组定级。
- **learncc 参照**: design-system 6.1 section 范式。
- **修法**: 为每个组件块配 h3 级小节（如「### 液位计: 预算的另一种读法」），替代现有裸粗体句；至少给 ch7-budget 与 ch7-shards 两个主力演示配 h3，其余保持引导句级。
- **验收**:
  - [ ] ch7 侧栏 TOC（subMaxLevel 3）能看到 ≥2 个组件小节入口
  - [ ] 5 个组件块分组间距生效（B6-1 修法联动）

**B7-3 🟡 四部剧本无「回放对照」节**
- **差距**: ch4/ch8 有「### 回放对照: N 步 ↔ 协议」映射节，ch7 四部剧本（9/7/10/8 步）零映射——ch7-panes 的 pane 生命周期五阶段、ch7-shards 的勾销流程都值得「步 ↔ 正文要素」对照，目前只有零散文内提示。
- **learncc 参照**: 本站自立的 ch4/ch8 惯例（内容组织一致性）。
- **修法**: `ch7-concurrent-execution.md` 各组件就近补 2-4 行对照（shards: 步 3=勾销纪律、步 5=429 接管…），或统一在章尾加一节对照表。
- **验收**:
  - [ ] ch7 每部剧本至少有步级对照 2 条
  - [ ] 格式与 ch4 的「回放对照」节同款

### ch8 上下文工程
**B8-1 🟡 三连回放器的小节标题是裸粗体，进不了 TOC**
- **差距**: 顶部三个组件的分隔是「**三条曲线, 同一个任务——**」式粗体段落——不是 h3，docsify subMaxLevel:3 的侧栏 TOC 完全不显示，三部演示在导航里隐身；且粗体行与 ch7 的引导句、ch10 的引导句句式各异。
- **learncc 参照**: design-system 6.1 section 头范式（先一句话再可视化，且该范式承载在真实标题层上）。
- **修法**: `ch8-context-engineering.md:5,11,15` 三处粗体行升级为 h3（去掉首尾「——」），如 `### 三线分岔: 三条曲线同一个任务`；同步 ch10 两处（B10-1 联动）。
- **验收**:
  - [ ] ch8 侧栏出现 3 个组件小节项
  - [ ] 粗体伪标题在正文绝迹（grep `^\*\*.*——\*\*$` = 0）

**B8-2 ⚪ 回放对照仅覆盖 1/3 剧本**
- **差距**: 「### 回放对照: 10 步（接力细节） ↔ 协议」只映射 ch8-autohandoff；threelines（9 步）与 recovery（7 步）无对照——recovery 剧本的 75%/五件套/按序读三件套等细节其实最值得对表。
- **learncc 参照**: ch4/ch8 自立惯例的完整性。
- **修法**: `ch8-context-engineering.md` 在 recovery 剧本后补 3-5 行步对照（步 2=75% armed 阈值、步 3=五件套清单、步 6=必读文件顺序）。
- **验收**:
  - [ ] ch8 三部剧本均有步级对照
  - [ ] 对照引用的阈值数字与正文表一致（70/75）

### ch9 验证与迭代
**B9-1 🟡 全章无顶部「先动手看」，且「怎么用」不提组件**
- **差距**: ch9 两部回放器（redflags/track）分别埋在中段与后段；「怎么用（30 秒上手）」5 条 bullet 无一提及交互组件——8 章中 6 章的「怎么用」都有「上面的回放器/游戏/计算器……」指针，ch9 是惯例断裂点之一（ch10 同病）。红旗下场动画其实是本章最佳入口。
- **learncc 参照**: design-system 6.3「先看再做」渐进披露；S19 引导句惯例。
- **修法**: `ch9-verification-loop.md` 在「怎么用」末尾加一条「- 想先体感再读: 章中『红旗话术闸门』回放器（10 步）把 IL-2 的拦截演了一遍，『回弹轨道』（9 步）演示 keep/revert」；或把 redflags 前移至「应该可以是默认方言」节首。
- **验收**:
  - [ ] 「怎么用」含组件指针
  - [ ] 打开章节首屏滚动一屏内能遇到第一个交互组件（前移方案）

**B9-2 🟡 两部剧本无回放对照节**
- **差距**: redflags 10 步（八句话术中 4 句进闸）与 track 9 步（keep/revert 时序）无步对照；尤其 redflags 的「哪些话术进闸、哪些放行」值得对表 Rationalization Table。
- **learncc 参照**: ch4/ch8 惯例。
- **修法**: 各剧本后补 2-4 行对照（redflags: 步 3-6=四句红旗逐一被拦；track: 步 2=keep、步 3=revert 绿线不退）。
- **验收**:
  - [ ] ch9 两部剧本有步级对照
  - [ ] 对照与 iron-laws.md 话术清单一致

### ch10 跨会话记忆
**B10-1 🟡 组件置底 + 「怎么用」不提组件**
- **差距**: 两部回放器（compound/snowball）放在「管道端点」节之后、批判小节之前——全站唯一「组件在章末」的章；「怎么用」5 条 bullet 同样不提组件（与 B9-1 同病）。复利闭环动画是本章结论的具象化，沉在章末 200 行文字之后。
- **learncc 参照**: design-system 6.3 先看再做；ch4-ch8 的组件前置惯例。
- **修法**: `ch10-cross-session-memory.md` 的「怎么用」加组件指针一条；组件位置二选一: A. 前移 compound 到章首（与全站对齐），snowball 留章末作收束；B. 维持置底但在「怎么用」加「章末有两个回放器演示复利」指针。推荐 A。
- **验收**:
  - [ ] 「怎么用」含组件指针
  - [ ] 首屏一屏内遇到至少一个交互组件（方案 A）

**B10-2 🟡 两部剧本无回放对照节**
- **差距**: compound 10 步（0→2→4→6→8 条目）与 snowball 8 步（绿灰两线）无对照；文内只有一句「注意右侧面板的条目数」。
- **learncc 参照**: ch4/ch8 惯例。
- **修法**: 补对照各 2-3 行（compound: 步 3=首次沉淀 len=2↔Step 5 写端四步；snowball: 步 4=灰线真相↔不沉淀体系）。
- **验收**:
  - [ ] ch10 两部剧本有步级对照
  - [ ] 对照引用的 Step 编号与 auto-skill 机制节一致

### ch11 编排治理与质量自举
**B11-1 🟡 全章零交互组件（8 章唯一）**
- **差距**: ch11 没有任何 fs-* 组件——宪法四问（表格）、registry 分层、evals 三概念都是可交互化的天然素材（四问自测 quiz 最顺手）。作为机制篇收官章，阅读节奏从「读+玩」骤降为纯读。
- **learncc 参照**: design-system 6.3 认知递进「读→玩→看→深挖」——ch11 只有读。
- **修法**: 最小方案: 复用 autodecide 组件家族加一个 `.fs-quiz` 数据版「宪法四问自测」（4 题，选项=通过/不通过）；或退而求其次给 ch4 的十二关 flow 剧本做一个「宪法视角」重播引用（`data-script` 复用）。
- **验收**:
  - [ ] ch11 出现 ≥1 个交互组件
  - [ ] 组件样式复用现有家族（无新 CSS 家族）

**B11-2 ⚪ h1 缺副题，唯一破「主标题：副题」句式的章**
- **差距**: ch4-ch10 h1 均为「第 N 章 · 主题：副题」双段式，ch11 是「第 11 章 · 编排治理与质量自举」单段——目录与侧栏里该章标题长度骤短，信息密度不齐。
- **learncc 参照**: 全站自身 h1 惯例（ch4-ch10 七章一致）。
- **修法**: h1 补副题，如「第 11 章 · 编排治理与质量自举：给管道自己上的三道锁」。
- **验收**:
  - [ ] 8/8 章 h1 为「第 N 章 · 主题：副题」句式

**B11-3 ⚪ 批判小节条目缺粗体引导词**
- **差距**: ch4-ch10 批判小节每条以「**XX 是 YY**: 」粗体短语开头，ch11 四条全是平铺句（「宪法自检依赖自觉——」）——扫读时 ch11 的批判要点无法被粗体锚点捕获。
- **learncc 参照**: 本站 ch4-ch10 自立惯例。
- **修法**: `ch11-orchestration-governance.md` 批判四条各补粗体引导: 「**自觉级约束**」「**维护有成本**」「**覆盖是选择性的**」+ 第四条补「**双实例已验证**」类引导。
- **验收**:
  - [ ] ch11 批判小节 4/4 条有粗体引导词
  - [ ] 与 ch4-ch10 条目结构一致

---

## 三、一致性专项（13 部剧本横向对照）

范围: ch4–ch11 共 13 部（ch2-subagent 属原理篇不在本次审计，仅作旁证）。

**C1 🔴 2 部 v1 剧本混编，其中 ch8-autohandoff 全部 10 步无步骤标题**
- **差距**: ch4-pipeline 与 ch8-autohandoff 是仅有的 v1 schema（PROTOCOL.md:48-54 已自我登记「兼容模式」）。ch4-pipeline 的 annotation 是 `{title,desc}` 结构体、标题正常；ch8-autohandoff 的 annotation 是**纯字符串**，normalize 后 title 回退为英文角色名——旁白条粗体行显示「tool_result」「user」「assistant」，与 12 部 v2 剧本的中文步骤标题（「首批分发: 液面爬到 2」式）形成唯一断点。
- **learncc 参照**: PROTOCOL.md 字段纪律——「每步必有 title + desc，无哑动画」；v1 允许存在但应有 title 等价物。
- **修法**: `assets/scripts/ch8-autohandoff.json` 10 步补 `annotation: {title: "...", desc: "..."}` 结构化（title 从内容提炼 ≤12 字）；中期把两文件升 v2。
- **验收**:
  - [ ] ch8 页 autohandoff 回放器旁白条显示中文步骤标题（10/10 步）
  - [ ] PROTOCOL「已有剧本」表更新

**C2 ⚪ 步骤/剧本标题全半角标点混用**
- **差距**: ch4-pipeline 步骤标题用全角冒号（「入口：Complexity Gate 放行」），其余 12 部用半角「: 」（「容量告警: 边界实测 75%」）；剧本 title 同理（ch4 全角括号+书名号风格 vs ch7/ch10 半角冒号风格）。
- **learncc 参照**: learncc 中英混排策略——组件文案遵循统一半角 + 空格惯例（design-system 6.5 对照）。
- **修法**: `ch4-pipeline.json` 12 步标题与 title 的全角「：」改「: 」；全站以半角冒号+空格为剧本文案规范，写入 PROTOCOL.md 字段纪律。
- **验收**:
  - [ ] 13 部剧本 JSON 内无全角冒号（grep 「：」 ch*.json = 0）
  - [ ] PROTOCOL.md 增补标点规范一行

**C3 ⚪ 步进时长全站统一（1600ms），但偏离 learncc 参照系；无逐块 stagger**
- **差距**: 13/13 部剧本步进统一走引擎 BASE_MS=1600÷speed（0.5/1/2/4 四档）——**内部一致性达标，此项不是问题**；记录两件参照差: ①learncc 参照是 useSimulator 1200ms / useSteppedVisualization 2000ms，1600 居中可接受但属自定值，建议在 PROTOCOL 注明依据；②消息块入场 fs-blockin .35s 是同步单发，learncc 消息 chip 有 0.25s scale 入场 + layout 弹性，LOC 条有 0.05×index stagger——多块同步入场时本站略显机械。
- **learncc 参照**: design-system 5.3 播放器节奏全表。
- **修法（可选）**: `replay.js` applyStep 内 append 循环加 `style.animationDelay = i*60+'ms'` 即得逐块 stagger；PROTOCOL.md 补「步进 1600ms 定档说明」。
- **验收**:
  - [ ] ch4 第 11 步（双块追加）两块错峰入场 ≥60ms
  - [ ] PROTOCOL.md 有节奏定档记录

**C4 🟡 旁白长度方差 36–236 字（3–6 倍），无上限纪律**
- **差距**: 各部 desc 长度带: compound 36-57 / snowball 66-127 / ch4-pipeline 80-217 / recovery 105-236 / track 37-91。ch4 与 ch8-recovery 单步旁白 200+ 字，播放节奏 1.6s/步根本读不完，旁白条被撑成小作文；compound 又短到只有半句。PROTOCOL 只说「desc 讲 why」无长度带。
- **learncc 参照**: design-system 6.4「一句话机制 + 最小代码」密度纪律（旁白即组件的一句话机制）。
- **修法**: PROTOCOL.md 立规: desc 60–120 字为常态带、上限 160 字，超长内容移章内正文；ch4-pipeline（4 步超限）与 ch8-recovery（5 步超限）旁白瘦身，长解释下沉到「回放对照」节。
- **验收**:
  - [ ] 13 部剧本 desc 最大长度 ≤160 字
  - [ ] PROTOCOL.md 有长度带条款

**C5 🟡 回放器位置四种形态并存，无位置规范**
- **差距**: 横向对照——header 区紧随金句（ch4/ch5/ch6/ch7×2/ch8×3）｜章中（ch6-sunkcost、ch9×2）｜章末（ch10×2）｜全章无（ch11）。同是「机制演示」，落位由写作顺序偶然决定。
- **learncc 参照**: design-system 6.3——交互区是章节固定区块（四标签），位置由信息架构而非行文惯性决定。
- **修法**: 在 site/README 或 PROTOCOL 立位置规范: 「主演示（本章主角机制）→ header 区紧随金句；辅助演示 → 就近正文节；结论演示 → 允许章末但『怎么用』必须有指针（联动 B9-1/B10-1）」；按规范复核 8 章（ch10 的 compound 前移即合规）。
- **验收**:
  - [ ] 位置规范文档存在且 8 章逐一对号
  - [ ] 「章末组件必有怎么用指针」约束生效

**C6 🔴 金句锚点前缀三种形态并存（与 S3 联动）**
- **差距**: 同为「组件后的点睛句」: ch7×2 + ch10×1 用「点破: 」前缀段；ch8 用「**三线分岔的那一刻, 就是 flowkit 存在的理由。**」粗体独立句；ch6（「漏斗吞掉的不是问题…」）与 ch9（「绿线只进不退…」）是无标记裸段。三种形态视觉权重各异，金句识别靠运气。
- **learncc 参照**: design-system 4.7 keyInsight 形态——「…」引号包裹 + italic + secondary 色的统一金句件。
- **修法**: 与 S3 合并: 新增 `.fs-punch`（或复用 fs-callout 弱化版）样式，13 处点睛句统一为「点破: …」前缀 + 统一样式；裸段两句（ch6/ch9）补前缀。
- **验收**:
  - [ ] 全站「点破」句样式一致（grep 统计 ch6/ch7/ch8/ch9/ch10 共 ≥6 处）
  - [ ] 无前缀裸金句段残留

**C7 ⚪ 消息面板标题 messages[] 后缀三态**
- **差距**: 面板头命名——ch2/ch8-recovery 带「messages[]」后缀（「父代理 messages[]」）；ch4「主会话」、ch10-compound「knowledge-base 条目」无后缀；ch8-autohandoff 用引擎默认「messages[]」。同一 UI 件三种命名法，且 ch10 的「knowledge-base 条目」实际是把消息面板当列表面板用、语义已漂移。
- **learncc 参照**: design-system 4.4——消息 chip 区头部 `messages[]` 标签是固定形态。
- **修法**: 立命名规则: 真消息面板必带「XX messages[]」；ch4 改「主会话 messages[]」；ch10-compound 建议在 PROTOCOL 增补 list 类面板说明或改用 lanes 面板表达条目增长。
- **验收**:
  - [ ] 13 部剧本面板标题符合单一命名规则
  - [ ] PROTOCOL.md 增补面板命名条款

**C8 🟡 多回放器同章自动播放叠加，无错峰/总控**
- **差距**: 每部回放器独立 IntersectionObserver（threshold 0.35 + 400ms 延迟）进视口即自动播放。ch8 顶部三部纵向堆叠、ch7 全章五块——快速滚动时 2-3 部同时步进、同时闪烁，动效互相打架。learncc 的同屏动画只有一处循环（MessageFlow）且刻意注释防多 timer 竞态。
- **learncc 参照**: design-system 5.3——唯一循环动画原则 + 5.2 whileInView once。
- **修法**: `replay.js` initAll 侧加简单仲裁: 全局同时播放上限 1（后进视口的等前一部位播完/或暂停前者）；最简实现: 播放前 `document.querySelectorAll('.fs-replay').forEach(r=>r._fsPause?.())`。
- **验收**:
  - [ ] ch8 快速滚动任一时刻至多 1 部回放器在播
  - [ ] 手动点播不受仲裁限制（点谁谁播）

---

## 四、汇总表

| 章 | 专属条目 | 系统性适用 | 关联一致性项 | 高优条目 |
|---|---|---|---|---|
| ch4 管道全景 | 0（缺口并入 S19/C1/C2） | S1-S19 全量 | C1 C2 C3 C4 C5 C7 | S 系 6 条 |
| ch5 输入与规划 | B5-1 | S1-S19 | C5 | — |
| ch6 评审与决策 | B6-1 B6-2 | S1-S19 | C6 C8 | — |
| ch7 并发执行 | B7-1 B7-2 B7-3 | S1-S19 | C5 C6 C8 | — |
| ch8 上下文工程 | B8-1 B8-2 | S1-S19 | C1 C4 C6 C8 | C1 |
| ch9 验证与迭代 | B9-1 B9-2 | S1-S19 | C4 C5 C6 | — |
| ch10 跨会话记忆 | B10-1 B10-2 | S1-S19 | C4 C5 C6 C7 | — |
| ch11 编排治理 | B11-1 B11-2 B11-3 | S1-S19（无组件项不适用） | C5 | — |

**计数**: 系统性 S1-S19 = 19 条；章专属 B = 17 条；一致性 C = 8 条。**总计 44 条**。
**优先级分布**: 🔴高 8（S1 S2 S3 S4 S5 S6 C1 C6）｜🟡中 24｜⚪低 12。

---

## 五、已达标项（修法时勿误伤）

- 步进时长 13/13 部统一（引擎级保证），speed 四档与 learncc 同规格
- 「怎么用（30 秒上手）」「批判小节（局限与成本）」「本章源码锚点表」三个 h2 节名 8/8 章一致
- lane 标题命名风格统一（三列状态名式）；lane 四态色语义（queued 灰/running 蓝/done 绿/failed 红）与 learncc 状态色阶吻合
- 组件深表面阶梯成立: 页面 #09090b < 卡 #131316 < 面板 #17171c < 可视化/代码区 #101014，「可视化区最深」规则内部自洽
- reduced-motion 覆盖完整（replay/funnel/lanes/hero/cruise/呼吸动词全兜）；组件初始化失败隔离（try/catch 逐组件）；timer 生命周期统一挂 root._fsClear
- 空态虚线语法已在 fs-fn-stream 落地（learncc border-dashed 语义）
- quiz 反馈语义色（emerald 对 / amber 错）方向正确，仅需收敛类名（B5-1）
- docsify 锚点表 td code 已有底色 pill 感（#26262c 底），仅字色待调（S7）
