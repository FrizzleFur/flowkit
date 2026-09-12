# 差距矩阵 A —— 教程站前半部分（对照 learncc 设计体系六节）

> 审计人: gap-A agent（只读审计, 零代码修改）
> 基准: `.plan-feat-polish/notes/design-system.md`（learn.shareai.run 实测体系, 布局/排版/色彩/组件/交互/内容组织六节）
> 审计页: `_coverpage.md` · `README.md` · `path.md` · `about.md` · `anchors.md` · `propositions.md` · `principles/ch1-ch3.md`
> 差距承载文件: `site/assets/theme-learncc.css`（主题层）、`site/assets/interactive/{pathview,replay,components}.css`（组件）、章节 md（结构）
> 条目格式: 【差距描述｜learncc 参照｜修法｜验收标准】

---

## 〇、必修缺口（用户已圈, 先行落位）

### G1 · 语义色五态衍生系缺失 【高】
- **差距**: theme-learncc.css `:root` 只定义 5 个域实色（--lc-blue/emerald/amber/red/purple）, 无任何衍生态。整个站点只有「实色件」一态在用; pathview 徽章是描边灰 pill、无暗 badge 底/亮 badge、无边框 hover 态、无域色连接线。learncc 的「层语义四处贯穿」（节点/连接线/卡边框/badge 同色）只做到了色点一处。
- **参照**: design-system 三节 3.3「每层色有 5 个衍生态」: 实色件 / 亮 badge(100底+800字) / 暗 badge(900/30底+300字) / 边框态(/30→hover /60) / 连接线(/30); 附「层语义贯穿」注记。
- **修法**: theme-learncc.css `:root` 为 9 个域色各补衍生变量（以 A 域为例: `--dom-a-300:#93c5fd; --dom-a-90030:rgba(30,58,138,.35); --dom-a-border:rgba(59,130,246,.3)`; 其余 8 域同构, tailwind 300/900 色值可由 500 色系查表）; pathview.js 徽章行改用 `--dom-{k}-90030` 底 + `--dom-{k}-300` 字的实底 badge, 替换现描边式 `.fs-pv-badge`（pathview.css:21）。
- **验收**:
  - [ ] `:root` 内每域恰有 300 / 900/30 / border /30 三组衍生变量, 9 域全配
  - [ ] path 页徽章呈暗态实底: 底 = 域色 900/30、字 = 域色 300, 9 域逐一抽查无描边残留
  - [ ] G2 修完后轨道连接线呈 `域色 /30`, 卡片边框 hover 呈 `域色 /30→/60`

### G2 · ring 同色分层替代底色差 【高】
- **差距**: `.fs-pv-dot`（pathview.css:16）为 40px 描边圆（2px 域色边 + #18181b 底）, 直接叠在连接线与卡片间隙上, 与背景无隔离层; learncc 时间线节点是「实色圆 + ring-4 页底色环」, 靠 ring 切断连接线实现悬浮分层, 而非靠底色差。
- **参照**: design-system 四节 4.2「节点圆 `bg-{layer}-500 ring-4 ring-[var(--color-bg)] z-10`」; 三节 3.2 表面用法。
- **修法**: pathview.css `.fs-pv-dot` 改 `border:none; background:var(--dom-{k}); color:#fff; box-shadow:0 0 0 4px var(--lc-bg0); z-index:10; position:relative`（域色由 pathview.js 内联, 同现 `--fs-pv-dom` 机制）; 连接线（.fs-pv-line）z 层压到节点之下。
- **验收**:
  - [ ] 节点圆为域色实底 + 白字（非描边）
  - [ ] 圆点外缘有 4px 页底色（#09090b）环, 与连接线交叉处环带完整隔离连接线
  - [ ] 窄屏（480px 断点 30px 圆）ring 同步收窄至 3px, 不与卡片重叠

### G3 · hero-callout 金句锚点开场 【高】
- **差距**: ch1/ch2/ch3 正文开头只有普通 blockquote（且被主题染成 blue 系 #0f1a33 底）; learncc 的 prose 开场范式是 hero-callout——金句 + 一行机制定位, 渐变底 + 左侧 4px 双色竖条, 与普通引用是两档形态。首页 README 开场（blockquote 一句话定位）与 path.md 域色说明同样适用。
- **参照**: design-system 三节 3.6 hero-callout（渐变底 `#172554→#052e16` / 左 4px 竖条 `blue→emerald` / 文字 `#93c5fd`）+ 六节 6.4「prose 开头必是 hero-callout」。
- **修法**: theme-learncc.css 新增 `.markdown-section .fs-callout` 类（渐变底 + `border-left:4px solid;border-image:linear-gradient(180deg,#3b82f6,#10b981) 1` 竖条 + #93c5fd 文字 + 圆角 12px）; ch1-3 与 README/path.md 首个 blockquote 加 `class="fs-callout"`, 文案升级为「金句 + 一行机制定位」双行结构; 同时执行 T10（普通引用回归 indigo）拉开两档。
- **验收**:
  - [ ] ch1/ch2/ch3 开场第一屏出现渐变 callout: 底 `linear-gradient(135deg,#172554,#052e16)`, 左缘 4px blue→emerald 竖条, 文字 #93c5fd
  - [ ] 同屏的普通 blockquote 为 indigo 系（见 T10）, 两种引用形态肉眼可分
  - [ ] callout 内第一行金句 + 第二行「机制定位」（含 `Harness/Stage` 式定位词）, 暗色下对比度 ≥ 4.5:1

---

## 一、全站主题层（theme-learncc.css）

### T1 · 正文灰阶错档：全站正文用了 secondary 灰 【高】
- **差距**: `body` 与 `p, li, td, th` 均取 `--lc-text2`（#a1a1aa = zinc-400）。learncc 正文是 zinc-300（#d4d4d8）, zinc-400 只给 meta/辅助。当前三章长文（ch2/ch3 各 200 行）通体偏暗半档, 长文可读性受损, 四档灰阶坍缩成三档。
- **参照**: design-system 二节「body（prose p）0.9rem/1.7 #d4d4d8（zinc-300, 比 secondary 亮半档）…白/zinc-300/zinc-400/zinc-500 四档灰阶」。
- **修法**: theme-learncc.css `:root` 增 `--lc-text-body:#d4d4d8`; 第 12/17 行正文色（p, li, td, th 及 body）改 `var(--lc-text-body)`; `--lc-text2` 保留给 meta/blockquote/组件说明文字。
- **验收**:
  - [ ] computed style: 正文段落 color = rgb(212,212,216)
  - [ ] blockquote/组件 intro 文字仍为 #a1a1aa, 与正文同屏可辨半档差

### T2 · inline code 用蓝色, 与链接色撞 【高】
- **差距**: `p code / li code / td code` 一律 #93c5fd（blue-300）, 与正文链接（blue 系）同族——行内代码与超链接在段落里无法区分。learncc 刻意让行内代码是全站唯一 pink 强调色, 从灰底跳出且不占语义蓝。
- **参照**: design-system 三节 3.6「inline code 是 pink #be185d / dark #f9a8d4——全站唯一非语义强调色」。
- **修法**: theme-learncc.css 第 43/48/53 行的 code 字色 `#93c5fd → #f9a8d4`（底 #26262c 保留）; tip 内 code 同步。
- **验收**:
  - [ ] 正文行内 code 呈粉 #f9a8d4; 同段落链接仍为蓝系, 二者可区分
  - [ ] 锚点表（td code）路径列同样粉字, 打印样式（@media print）同步反转为 pink-700

### T3 · 圆角档漂移：10px 非体系档 【中】
- **差距**: 表格（theme:36）与 pre（theme:46）圆角 10px。体系圆角阶梯只有 6/8/12/full 四档, 「一切容器卡 12px」, 无 10px 档。
- **参照**: design-system 一节「圆角阶梯: 小件 6/8px, 容器 12px, 胶囊/圆点 full」。
- **修法**: theme-learncc.css 第 36/46 行 `border-radius:10px → 12px`。
- **验收**: [ ] computed style: table 与 pre 的 border-radius 均为 12px

### T4 · 表面自造色未收敛到 zinc 阶 【中】
- **差距**: `--lc-card:#131316`、组件面板 `#17171c`、表头 `#1a1a1e`、行线 `#1e1e22`、代码底 `#101014`、code 底 `#26262c`、len 徽章 `#2c2c34`——全部不在 zinc 阶上。learncc 表面只有三档: 页底 zinc-950 / 卡 zinc-900 / 提亮 zinc-800（+代码区 slate-900 #0f172a 或纯 zinc-950）。
- **参照**: design-system 三节 3.1/3.2「卡片 dark:bg-zinc-900（#18181b）…代码区永远更深（#09090b 或 #0f172a）」。
- **修法**: 全仓 site/assets/*.css 收敛映射: `#131316/#17171c → #18181b`; `#101014 → #0f172a`（代码/面板）; `#1a1a1e → #27272a/50` 或直接 #18181b; `#1e1e22 → #27272a`; `#26262c → #27272a`; `#2c2c34 → #3f3f46`。分两 commit: 先改变量值, 再 grep 残留。
- **验收**: [ ] grep `#131316|#17171c|#101014|#1a1a1e|#1e1e22|#26262c|#2c2c34` 于 site/ 下零命中; 页面暗色下无肉眼色阶断层

### T5 · 阅读列宽 900px 超体系层级 【中】
- **差距**: `.markdown-section { max-width:900px }`。体系宽度层级只有 672（可视化）/768（阅读列）/1280（页面壳）三档, 900px 不在档。
- **参照**: design-system 一节「内容列（阅读型）max-w-3xl = 768px」。
- **修法**: theme-learncc.css 第 30 行 `max-width:900px → 768px`。
- **验收**: [ ] 1280px 视口下正文列宽 768px; 表格与 pre 不溢出（保留既有 overflow 行为）

### T6 · h1 误带 border-b 【中】
- **差距**: `h1, h2` 一律加 border-bottom。learncc 只有 **h2** 有分隔线, 章题 h1 靠「徽章行 + 金句副标」的 header 组合建立身份, 不画线。
- **参照**: design-system 二节「h2 prose …+border-b 1px zinc-800」（仅 h2）。
- **修法**: theme-learncc.css 第 31 行选择器去掉 h1（配合 G3/G14 后章题区改由 header 组合承担）。
- **验收**: [ ] 章题 h1 下无横线; 每个 h2 下缘 1px #27272a 线保留

### T7 · h3 无半档降 【低】
- **差距**: h3 与 h1/h2 同为 #fafafa。体系 h3 是 zinc-200（#e4e4e7）, 比一级标题暗半档, 形成「标题内部」的层级。
- **参照**: design-system 二节「h3 prose #e4e4e7（比标题暗半档）」。
- **修法**: theme-learncc.css 新增 `.markdown-section h3 { color:#e4e4e7 }`（h4 同理 #d4d4d8, 15px/600）。
- **验收**: [ ] computed style: h3 = rgb(228,228,231), h4 字号 15px/600

### T8 · 数字缺 tabular-nums 【低】
- **差距**: 锚点表「行数/锚点引用」列、组件计数（fs-fn-count、len 徽章）等数字未设 `font-variant-numeric:tabular-nums`。体系要求数字统计一律 tabular + mono。
- **参照**: design-system 二节「meta/small …数字一律 tabular-nums」+ 六节 6.5。
- **修法**: theme-learncc.css 对 `td` 内 code 及组件计数类补 `font-variant-numeric:tabular-nums`（replay.css 的 .fs-lenbadge/.fs-fn-count 同步）。
- **验收**: [ ] anchors 表行数列多行数字纵向对齐; replay 计数跳动时列宽不抖

### T9 · hover 无 transition、侧栏行无表面反馈 【中】
- **差距**: 全站 hover 均为瞬时变色（无 transition 声明）; 侧栏项 hover 只变字色。体系交互全部 150-200ms transition-colors, 侧栏项 hover 有 `bg-zinc-800/50` 表面微亮。
- **参照**: design-system 五节 5.1「全部 150–200ms transition-colors/all…表面微亮 hover:bg-zinc-800/50」。
- **修法**: theme-learncc.css 给 `a、.sidebar ul li a、.markdown-section td、按钮组` 补 `transition:color .15s ease, background-color .15s ease, border-color .15s ease`; 侧栏项加 `padding:2px 10px; border-radius:6px;` + hover `background:rgba(39,39,42,.5)`。
- **验收**: [ ] DevTools 抽查链接/侧栏项 transition ≈150ms; 侧栏 hover 出现半透明底 + 6px 圆角

### T10 · 普通引用被染成 blue, 应回归 indigo 【中】
- **差距**: `blockquote` 现为 blue 系（#3b82f6 左线 + #0f1a33 底 + #93b4ff 字）。体系里 blue 渐变是 hero-callout 专属, 普通引用是 indigo 系（border #6366f1 / 底 rgba(99,102,241,.1) / 字 #c7d2fe）。两档引用混档, 且占用了 hero-callout 的色彩位。
- **参照**: design-system 三节 3.6「普通引用: indigo 系…」。
- **修法**: theme-learncc.css 第 32-33 行改 `border-left:3px solid #6366f1; background:rgba(99,102,241,.1); color:#c7d2fe`; 圆角 `0 8px 8px 0` 保留。与 G3 联动。
- **验收**: [ ] quote 左线 #6366f1、底 rgba(99,102,241,.1)、字 #c7d2fe; 与 fs-callout 同屏两档分明

### T11 · 链接色档位与下划线装饰 【低】
- **差距**: 链接用 #3b82f6（blue-500）无下划线装饰。体系暗色链接是 blue-400（#60a5fa）, 且带淡一档的下划线装饰色 + 2px offset。
- **参照**: design-system 三节 3.6「链接 #2563eb / dark #60a5fa, 下划线装饰色淡一档, underline-offset: 2px」。
- **修法**: theme-learncc.css 第 77 行 `color:#60a5fa`; 补 `text-decoration:underline; text-decoration-color:rgba(96,165,250,.4); text-underline-offset:2px`, hover 时 decoration-color 变主色。
- **验收**: [ ] 链接 #60a5fa 带细下划线（淡 40%）, offset 2px; hover 下划线变实

### T12 · hr 实色线 vs 两端消隐 【低】
- **差距**: hr 为实色 border。体系 hr 是「transparent → zinc → transparent」渐变消隐线。
- **参照**: design-system 三节 3.6「hr: linear-gradient(to right, transparent, zinc, transparent)」。
- **修法**: theme-learncc.css 第 81 行改 `border:none; height:1px; background:linear-gradient(to right, transparent, #3f3f46, transparent)`。
- **验收**: [ ] hr 两端淡出至页底色, 中段 #3f3f46

### T13 · 侧栏宽度、active 底块、色点图例 【中】
- **差距**: 侧栏为 docsify 默认 ~300px 宽; active 项只有右侧蓝线无背景块; 分组无色点图例。体系侧栏 224px（w-56）、active = `bg-zinc-800 + font-medium`、分组标题旁带域色点图例（「侧栏五分组=五层」的语义贯穿入口）。
- **参照**: design-system 一节「侧栏 w-56 = 224px」+ 四节 4.10「active=bg-zinc-100 dark:bg-zinc-800…分组标题+色点图例」。
- **修法**: theme-learncc.css `.sidebar { width:224px }`（含 toggle 偏移联动校准）; active 项加 `background:#27272a; font-weight:500; border-radius:6px`; _sidebar.md 分组行注入域色点（`<span class="fs-dot" style="--c:var(--dom-a)"></span>` 原理篇 A/B/C、机制篇 E/F/G/H 等, pathview DOMAINS 同源取色）。
- **验收**: [ ] 侧栏 224px 且 toggle 开合不错位; active 项有 zinc-800 圆角底块; 原理篇/机制篇分组行首见域色点

### T14 · 代码块无 chrome（三点头/文件名/语言徽标） 【中】
- **差距**: 全站 `pre` 为裸块。体系 prose 内代码卡带完整 chrome: macOS 三点头部 + mono 文件名（建立「文件感」）+ 右上角语言徽标（blue 徽标, sh 自动变绿标 "terminal"）。
- **参照**: design-system 四节 4.3「prose 内代码块…右上角语言徽标…sh 语言自动变绿标 + 文案 terminal」+ 六节 6.4「文件名建立文件感」。
- **修法**: 新增 `site/assets/interactive/codechrome.js`（注册 FlowSite.fns, doneEach 扫 `.markdown-section pre`）: 为每个 pre 包 `.fs-codecard` 头部（三点 `#ef4444/#f59e0b/#22c55e` 70% 透明 + 语言徽标）; 章内 ASCII 示意图 pre 由 md 侧标注 data-filename="示意图" 或按围栏 info string 取文件名; theme-learncc.css 配套 .fs-codecard 样式（rounded 12px, 头 border-b）。
- **验收**: [ ] 任意代码块头部出现三点（70% 透明）+ 语言徽标; bash 块徽标为绿色 "TERMINAL"; ch1 管道图带「示意图」标; reduce-motion 与打印样式不受影响

### T15 · 正文页切换无入场过渡 【低】
- **差距**: docsify hash 跳页后内容瞬现。体系所有区块有 whileInView 入场（x:30→0 + opacity, 0.4s）。pathview 已有 fade-up + 80ms stagger, 正文区块全无。
- **参照**: design-system 五节 5.2 入场动画表（时间线卡 0.4s/delay 0.1s; stagger 0.05s×index）。
- **修法**: theme-learncc.css 加一次性页面级淡入 `.markdown-section { animation: fs-pagein .35s ease } @keyframes fs-pagein { from { opacity:0; transform:translateY(8px) } }` + `@media (prefers-reduced-motion: reduce)` 关闭（ docsify 每页重挂 DOM, 动画自然重放, 无需 JS）。
- **验收**: [ ] 章间跳转正文 0.35s 淡入上移; 开启 reduce-motion 后无动画; 不与 pathview 入场叠加闪烁

---

## 二、_coverpage.md（封面）

### C1 · 次按钮（30 秒导览）无样式接管 【中】
- **差距**: 封面第二个 `<a>`（30 秒导览）未带类名, 落在 dark.css 默认描边按钮上, 与 fs-cta 的层次关系靠巧合而非设计; 且 hover 直接跳实色蓝边框 + 无 transition。
- **参照**: design-system 四节 4.8 按钮层级（主 CTA 黑白反转 / 次按钮边框式 + hover 表面微亮）+ 3.8「hover 边框 = 提亮一档」。
- **修法**: _coverpage.md 次按钮加 `class="fs-cta-ghost"`; theme-learncc.css 定义: 边框 `#3f3f46` + 底 rgba(255,255,255,.04)（与现 a 基样式合并）+ hover `border-color:#52525b; background:rgba(255,255,255,.08); transition:all .15s`——hover 提亮一档而非跳蓝。
- **验收**: [ ] 次按钮有专属类与样式; hover 边框 #3f3f46→#52525b 渐变 150ms, 不出现实色蓝
- 
### C2 · 双按钮缺 44px 触达高度 【低】
- **差距**: 封面按钮无 min-height。体系主 CTA 与可点件 `min-h-[44px]`。
- **参照**: design-system 五节 5.5「所有主 CTA min-h-[44px]」。
- **修法**: theme-learncc.css `.cover .cover-main a { min-height:44px; display:inline-flex; align-items:center }`。
- **验收**: [ ] 两按钮渲染高度 ≥44px, 移动端可点区达标

### C3 · 封面渐变含自造中间色 【低】
- **差距**: `.cover` 渐变 `#09090b→#10101a→#172554`, 中间色 #10101a 不在体系（实为 zinc-950 与 blue-950 之间的自造色）。体系 hero 是纯 zinc-950 底; 若保留渐变语言, 中间站应取体系内值。
- **参照**: design-system 三节 3.1/3.2 中性底色阶（#09090b/#18181b）。
- **修法**: theme-learncc.css 第 58 行中间站 `#10101a → #18181b`（zinc-900）, 保留「 zinc → blue-950」的纵深叙事。
- **验收**: [ ] computed background 中间停靠点为 rgb(24,24,27)

---

## 三、README.md（首页）

### R1 · 「30 秒导览」读者分流未卡片化 【中】
- **差距**: 首页三条读者路径是无容器列表。体系首页 Learning Path 为 `grid gap-3` 小卡密排（可点、hover 边框提亮）, 「先给一句话再给入口」的范式用卡承载。
- **参照**: design-system 一节「卡片网格 grid gap-3」+ 六节 6.1 分幕范式。
- **修法**: README.md 三条导览改为 `<div class="fs-grid3">` 三卡（每卡: emoji-free 标题行「学会用 / 懂原理 / 查答案」+ 一句说明 + 链接）; theme-learncc.css 定义 .fs-grid3（grid gap-12px, 卡 = zinc-900 底 + 1px 边 + 12px 圆角 + hover 边框 zinc-400/30 + transition 200ms）。
- **验收**: [ ] 首页导览呈 3 列卡（窄屏折 1 列）; hover 边框 30%→60% 提亮 200ms; 点击直达对应章

### R2 · 首页开场无金句锚点 【中】
- **差距**: 首页开头为普通 blockquote 一段定位语, 无「金句 + 机制定位」形态。首页是全站第一印象, 应是 hero-callout 的第二个落点（与 G3 同款组件, 页内落点独立验收）。
- **参照**: design-system 三节 3.6 + 六节 6.4。
- **修法**: README.md 开头 blockquote 加 `class="fs-callout"`, 文案改双行: 金句（如「讲的就是代码里发生的」）+ 一行定位（「docsify 零构建 · SC5 源码锚定 · 11 章」）。
- **验收**: [ ] 首页首屏出现渐变 callout（同 G3 验收三条）, 且位于「30 秒导览」标题之前

---

## 四、path.md（Learning Path）

### P1 · 轨道连接线不随域色 【中】
- **差距**: `.fs-pv-line` 恒为 #27272a 灰。体系时间线连接线 = `bg-{layer}-500/30`（下一项的层色）——「层语义贯穿」的第四处; path.md 文案自己宣称「轨道圆点与卡片徽章的颜色对应机制九域」, 连接线缺席。
- **参照**: design-system 四节 4.2「下方连接线 bg-{layer}-500/30（下一项的层色）」+ 附「节点/连接线/卡边框/badge 四处同色」。
- **修法**: pathview.js 渲染行时给 `.fs-pv-line` 内联 `background: <下章域色>33`（/30 透明度）; 与 G1 衍生变量合流。
- **验收**: [ ] 每段连接线呈上一节点域色的 30% 透明态; 9 域逐一抽查

### P2 · 章卡无 hover 态 【中】
- **差距**: `.fs-pv-card` 可点（含阅读链接）但无任何 hover 反馈。体系时间线卡 hover 边框提亮一档 + transition-colors。
- **参照**: design-system 四节 4.2「右卡 transition-colors hover:border-[--color-text-secondary]/30」。
- **修法**: pathview.css `.fs-pv-card { transition:border-color .15s ease } .fs-pv-card:hover { border-color:rgba(161,161,170,.3) }`。
- **验收**: [ ] hover 卡片边框 #27272a→zinc-400/30, 150ms; 移出还原

### P3 · 进度条轨道形态偏差 【低】
- **差距**: `.fs-pv-bar` 为 6px 高 + 1px 边框 + 4px 圆角 + #101014 轨底。体系卡内进度条 = h-1.5 无边框 + rounded-full + 轨 zinc-800。
- **参照**: design-system 四节 4.6「轨 h-1.5 overflow-hidden rounded-full bg-zinc-800, 条 rounded-full 实色」。
- **修法**: pathview.css `.fs-pv-bar { border:none; border-radius:9999px; background:#27272a }`（轨色随 T4 收敛）; `.fs-pv-fill` 圆角改 full; 配合 G1 可试「条色 = 该章域色」替代恒蓝。
- **验收**: [ ] 轨道无边框全圆角; 条与轨两端均为 full 圆;（若采域色条）第 7 章条为红系 #ef4444

---

## 五、principles/ch1-ch3.md（三章同构差距, 逐条落三章）

### H1 · 章节页 header 缺四步出场 【高】
- **差距**: 三章开头只有 `# 章题` + blockquote。体系章节页 header 是固定四步: ①徽章行（mono 版本/章号大牌 + 域色 pill 同行）→ ②英文金句副标（text-lg 灰）→ ③meta 行（LOC/锚点数, tabular-nums）→ ④金句 blockquote。当前章号、域归属、锚点密度（anchors.md 明明有数据）全部不可见, 每章第一屏信息密度塌缩。
- **参照**: design-system 六节 6.2「header.space-y-3 出场顺序」+ 附「数据即 UI」。
- **修法**: 三章 h1 下方插入 `<div class="fs-chheader">` 结构块: 徽章行 = `CH 0n` mono 大牌（`rounded-lg bg-zinc-800 px-3 py-1 font-mono text-lg font-bold`, 版本大牌形态）+ 域色 pill（九域, G1 变量）; 金句副标 = 每章一句英文（如 ch1 "One Pipeline, Two Trims"）; meta 行 = `~6 anchors` + `65 行` + 组件名（取 anchors.md 数据）; 原 blockquote 移为第 4 步（fs-callout 化, 见 G3）。theme-learncc.css 补 .fs-chheader 全套样式。
- **验收**:
  - [ ] ch1/2/3 首屏从上到下依次可见: 「CH 0n」mono 大牌 + 域色 pill → 英文金句 → meta 行（锚点数 tabular-nums）→ 渐变 callout
  - [ ] meta 行数字与 anchors.md 表逐章一致（ch1 ~6/ch2 ~25/ch3 ~24）
  - [ ] h1 无 border-b（联动 T6）

### H2 · 上下章导航弱形态 【中】
- **差距**: 三章尾部导航是一行 blockquote「> 下一章: [标题](链接)」; ch2/ch3 无「上一章」回链。体系是 border-t + justify-between 双卡、hover 时箭头 4px 平移的方向性微动效。
- **参照**: design-system 四节 4.10「上下章: border-t pt-6 flex justify-between…箭头 transition-transform group-hover:±translate-x-1」。
- **修法**: 三章尾部替换为 `<nav class="fs-chapternav">` 双链接（ch1 仅右卡）; theme-learncc.css 定义: border-t #27272a + pt-24px + 两端布局 + 文字 zinc-400→hover 白 + `::after` 箭头 `transition:transform .15s`, hover 时 `translateX(4px)`。
- **验收**: [ ] ch2/ch3 尾部左右双卡（左「上一章」右「下一章」）; hover 右卡箭头右移 4px、左卡箭头左移 4px; ch1 无左卡不塌布局

### H3 · replay 主播放钮用蓝实底, 违反「按钮无彩色」 【中】
- **差距**: `.fs-btn-primary` 为 blue 实底白字（replay.css:12, ch2 播放器使用）。体系全部按钮黑白反转、无彩色——彩色只属于语义层色与 badge, 不进按钮。
- **参照**: design-system 四节 4.8「主 CTA…黑白反转, 无彩色」。
- **修法**: replay.css `.fs-btn-primary { background:#fafafa; border-color:#fafafa; color:#09090b } .fs-btn-primary:hover:not(:disabled){ background:#e4e4e7; opacity:1 }`; 播放态可加 `aria-pressed` 后的 zinc-800 反转底以示区分。
- **验收**: [ ] 播放钮为白底黑字; hover 变 #e4e4e7; 全组件（replay/switch/budget/johari/autodecide）无蓝底按钮残留

### H4 · 速度档为 select 下拉, 非分段文本组 【低】
- **差距**: replay 速度档是原生 `<select>`。体系速度档是「分段文本组: rounded px-2 py-1, active 黑白反转, inactive 灰字」的一组按钮, 档位一眼可见。
- **参照**: design-system 四节 4.8「速度档（文本组）…active=黑白反转 / inactive=text-secondary」。
- **修法**: replay.js 第 324-328 行 select 改按钮组（0.5x/1x/2x/4x, active 类 = 白底黑字）; replay.css 补 `.fs-speedseg` 样式（rounded 6px 容器 border, 内按钮 px-2 py-1）。
- **验收**: [ ] 四档并排可见, active 档白底黑字; 切换即改 BASE_MS/speed 行为不变

### H5 · 章内大表格（阈值表/速查表）无行 hover 【低】
- **差距**: ch2 阈值分层表、恢复协议表、ch3 rag-lab 数据表等大表无 hover 行反馈。体系表行 hover 有 `#111113` 微亮。
- **参照**: design-system 三节 3.2「hover 表面: 表行 #111113」。
- **修法**: theme-learncc.css `.markdown-section tbody tr:hover td { background:rgba(39,39,42,.4); transition:background-color .15s }`。
- **验收**: [ ] ch2 容量阈值表 hover 行微亮; 与 T9 的 150ms 一致

---

## 六、about.md / anchors.md / propositions.md

### X1 · propositions 的 REC 编号无 token 徽章形态 【低】
- **差距**: 四条提案的「REC-P1…P4」以粗体行文。体系有现成「方角 token 徽章」形态（mono + 深底 + 4px 圆角）适合承载编号类 token。
- **参照**: design-system 四节 4.5 徽章形态 2「方角 token 徽章: rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-xs」。
- **修法**: propositions.md 四处 `REC-Pn` 改 `` `REC-Pn` `` 行内 code（T2 pink 化后自然获得徽章观感, 或 theme 加 `.fs-tokenbadge` 类）; 标题行结构不动。
- **验收**: [ ] 四个编号呈 mono 深底徽章; 与正文行内 code 观感一致不突兀

### X2 · anchors.md 表数字列缺 mono/tabular 【低】
- **差距**: 「行数/锚点引用」列为普通正文字。体系 meta 数字形态 = mono + tabular-nums（version 大牌与 len 徽章同源）。
- **参照**: design-system 四节 4.5 形态 2 + 二节 tabular-nums 规则。
- **修法**: anchors.md 表两列数字包行内 code（获得 mono）, 随 T8 得 tabular; 或 theme 给该表加 `td:nth-child(4,5) { font-family:mono; font-variant-numeric:tabular-nums }`。
- **验收**: [ ] 行数列 1964、59 等数字 mono 呈现且右对齐不抖

---

## 七、条目汇总表

| # | 页/层 | 条目 | 优先级 |
|---|---|---|---|
| G1 | 必修 | 语义色五态衍生系缺失 | 高 |
| G2 | 必修 | ring 同色分层替代底色差 | 高 |
| G3 | 必修 | hero-callout 金句锚点开场 | 高 |
| T1 | 全站主题层 | 正文灰阶错档（zinc-400→应 zinc-300） | 高 |
| T2 | 全站主题层 | inline code 蓝→pink（与链接撞色） | 高 |
| T3 | 全站主题层 | 圆角 10px 非体系档 | 中 |
| T4 | 全站主题层 | 表面自造色收敛 zinc 阶 | 中 |
| T5 | 全站主题层 | 阅读列宽 900→768 | 中 |
| T6 | 全站主题层 | h1 误带 border-b | 中 |
| T7 | 全站主题层 | h3/h4 无半档降 | 低 |
| T8 | 全站主题层 | 数字 tabular-nums 缺失 | 低 |
| T9 | 全站主题层 | hover 无 transition + 侧栏行无表面反馈 | 中 |
| T10 | 全站主题层 | 普通引用回归 indigo | 中 |
| T11 | 全站主题层 | 链接 blue-400 + 下划线装饰 | 低 |
| T12 | 全站主题层 | hr 两端消隐 | 低 |
| T13 | 全站主题层 | 侧栏 224px + active 底块 + 色点图例 | 中 |
| T14 | 全站主题层 | 代码块 chrome（三点/文件名/语言徽标） | 中 |
| T15 | 全站主题层 | 正文页入场淡入 | 低 |
| C1 | _coverpage | 次按钮样式缺失 + hover 跳蓝 | 中 |
| C2 | _coverpage | 按钮 44px 触达高度 | 低 |
| C3 | _coverpage | 封面渐变自造中间色 | 低 |
| R1 | README | 30 秒导览三卡化 | 中 |
| R2 | README | 首页开场金句锚点（fs-callout） | 中 |
| P1 | path.md | 连接线随域色 /30 | 中 |
| P2 | path.md | 章卡 hover 边框提亮 | 中 |
| P3 | path.md | 进度条轨道 full 圆角/去边框 | 低 |
| H1 | ch1-ch3 | 章节 header 四步出场 | 高 |
| H2 | ch1-ch3 | 上下章双卡导航 + 箭头位移 | 中 |
| H3 | ch1-ch3 | replay 主按钮黑白反转（去蓝底） | 中 |
| H4 | ch1-ch3 | 速度档 select→分段文本组 | 低 |
| H5 | ch1-ch3 | 大表格行 hover 微亮 | 低 |
| X1 | propositions | REC 编号 token 徽章 | 低 |
| X2 | anchors | 数字列 mono/tabular | 低 |

**统计**: 32 条 = 高 6（G1/G2/G3/T1/T2/H1）· 中 15 · 低 11
**依赖注记**: G3←T10（引用双色分档需同 commit）; G1←P1（连接线用衍生变量）; H1←T6/G1（header 用域色 pill, h1 去线）; T14 为新增 JS 文件, 其余均为 CSS/md 改动。
