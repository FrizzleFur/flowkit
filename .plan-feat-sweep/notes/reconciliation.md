# 差距审计条目 vs 站点实况 —— 机械对账报告

> 对账人: reconciliation agent ｜ 日期: 2026-09-12 ｜ 方法: 只读 grep/read 逐条核对 site/ 实况（对 site/ 零修改）
> 输入: `.plan-feat-polish/notes/gap-A.md`（32 条）/ `gap-B.md`（44 条, 实际逐条枚举 42 条——文末自计「B=17」与清单「B=15」差 2, 以清单为准）
> 判定三态: done（修法目标形态已落地）/ partial（部分落地）/ not-done（无落地证据）
> 证据为文件:行号或 grep 实测; 标「需 CDP 复验」的条目规则存在但渲染效果未在浏览器验证, 不靠猜测判 done。

---

## 一、gap-A（教程站前半部分, 32 条）

| ID | 条目摘要 | 判定 | 证据 | 备注/验收标准 |
|---|---|---|---|---|
| G1 | 语义色五态衍生系缺失 | done | `theme-learncc.css:18-28` 11 色 × 5 态 token（-300/-900-30/-border-30/-border-60 齐全）; `pathview.css:28` 徽章暗态实底; `pathview.js:62-68` 注入 --fs-pv-dom 三变量 | 9 域逐一抽查渲染效果需 CDP |
| G2 | ring 同色分层替代底色差 | done | `pathview.css:22` 节点域色实底+`box-shadow:0 0 0 4px var(--lc-bg0)`+z-10; `:23` 连接线 z-0; `:55` 窄屏 ring 收窄 3px | 窄屏不与卡片重叠需 CDP |
| G3 | hero-callout 金句锚点开场 | done | `theme-learncc.css:72-75` .fs-callout（渐变底 172554→052e16 + 左 4px blue→emerald 竖条 + #93c5fd 字）; ch1:9-12/ch2/ch3/README/path.md 均已挂 `class="fs-callout"`（grep 13 个 md 命中） | 对比度 ≥4.5:1 需 CDP 复验 |
| T1 | 正文灰阶错档 zinc-400→zinc-300 | done | `theme-learncc.css:13` --lc-text-body:#d4d4d8; `:30,35` body 与 p/li/td 均用之; --lc-text2 保留给 meta/侧栏 | computed style 需 CDP |
| T2 | inline code 蓝→pink | done | `theme-learncc.css:100`（p/li code）、`:94`（td/th code）、`:119`（tip code）均 --lc-pink-300; `:174` 打印反转 #be185d（pink-700） | — |
| T3 | 圆角 10px→12px | done | `theme-learncc.css:87`（table）`:97`（pre）均 border-radius:12px | — |
| T4 | 表面自造色收敛 zinc 阶 | partial | 7 个自造色中 6 个 grep 零命中; 残留 1 处: `replay.css:151` `.fs-grid3-card` 仍 `background:#131316` | 验收: grep 七色全零命中——补净 :151 即可闭环 |
| T5 | 阅读列宽 900→768 | done | `theme-learncc.css:60` max-width:768px | 表格不溢出需 CDP |
| T6 | h1 误带 border-b | done | `theme-learncc.css:63` 仅 `.markdown-section h2` 带 border-bottom; h1 无线（`:31` 统一无 border 声明） | — |
| T7 | h3/h4 半档降 | done | `theme-learncc.css:65` h3 #e4e4e7（--lc-text-h3）; `:66` h4 15px/600 #d4d4d8 | — |
| T8 | 数字 tabular-nums | done | `theme-learncc.css:94`（td code）; `replay.css:31`（lenbadge）`:83-84`（fn-count）均 font-variant-numeric:tabular-nums | — |
| T9 | hover transition + 侧栏表面反馈 | done | `theme-learncc.css:33` a 150ms transition; `:46-48` 侧栏项 padding+6px 圆角+hover `var(--lc-surface-hover)` 半透明底 | DevTools 抽查需 CDP |
| T10 | 普通引用回归 indigo | done | `theme-learncc.css:68-69` border #6366f1 + rgba(99,102,241,.1) 底 + #c7d2fe 字 | 与 fs-callout 同屏分档需 CDP |
| T11 | 链接 blue-400 + 下划线装饰 | done | `theme-learncc.css:14` --lc-link:#60a5fa + deco rgba(96,165,250,.4); `:144-145` underline + offset 2px + hover decoration 变实 | — |
| T12 | hr 两端消隐 | done | `theme-learncc.css:148` linear-gradient(transparent, border2, transparent) | — |
| T13 | 侧栏 224px + active 底块 + 色点图例 | partial | 224px 四处联动 ✓（`theme-learncc.css:40-44,53-55`）; active 底块 ✓（`:48` bg var(--lc-border)+500 字重）; 色点图例以「侧栏顶部九域图例块」实现（`_sidebar.md:2-4`）, 未挂原理篇/机制篇分组行首 | 验收原文要求「分组行首见域色点」——现形态图例信息等价但位置不同; toggle 开合不错位需 CDP |
| T14 | 代码块 chrome（三点/文件名/语言徽标） | done | `index.html:41-73` codechrome 插件（三点 70% 透明 + data-filename 文件名 + sh→绿标 terminal）; `theme-learncc.css:103-114` .fs-codecard 全套; `ch1:38` `data-filename="示意图"` | 渲染效果需 CDP |
| T15 | 正文页入场淡入 | done | `theme-learncc.css:60-61` fs-pagein .35s; `:161-163` reduce-motion 关闭 | 不与 pathview 叠加闪烁需 CDP |
| C1 | 封面次按钮样式 + hover 跳蓝 | partial | `fs-cta-ghost` 类已挂（`_coverpage.md:10`）但样式仅 opacity .75→1（`replay.css:155-156`）; hover 仍跳蓝: `theme-learncc.css:128` `.cover .cover-main a:hover { border-color: var(--lc-blue) }` | 验收: hover 边框 #3f3f46→#52525b 150ms、不出现实色蓝——未达成 |
| C2 | 按钮 44px 触达高度 | not-done | grep `min-height:44` 全 assets/ 零命中 | 验收: `.cover .cover-main a` min-height:44px |
| C3 | 封面渐变自造中间色 #10101a | not-done | `theme-learncc.css:124` 渐变中间站仍 `#10101a` | 验收: 中间站改 #18181b |
| R1 | 30 秒导览三卡化 | partial | 三卡已落地（`README.md:10-14` fs-grid3 + fs-grid3-card × 3）; 但 hover 偏差: `replay.css:154` hover 边框跳蓝 #3b82f6 且无 transition, 非修法的「zinc-400/30 提亮 200ms」 | 验收: hover 边框提亮 + 200ms 过渡; 窄屏折 1 列需 CDP |
| R2 | 首页开场金句锚点 | done | `README.md:3-6` fs-callout 双行结构, 位于「30 秒导览」（:8）之前 | 渲染需 CDP |
| P1 | 连接线随域色 /30 | done | `pathview.js:74-79` 注入下一章域 --fs-pv-line-dom; `pathview.css:23` color-mix 30% 透明 | 9 域抽查需 CDP |
| P2 | 章卡 hover 边框提亮 | not-done | `pathview.css:26` .fs-pv-card 无 :hover 规则、无 transition | 验收: hover 边框→zinc-400/30, 150ms |
| P3 | 进度条 full 圆角/去边框/域色条 | done | `pathview.css:36` 轨 6px 无边框 9999px 圆角 var(--lc-border); `:37` 条 9999px + `var(--fs-pv-dom)` 域色 | — |
| H1 | 章节 header 四步出场 | partial | 四步信息齐: 徽章行（blockquote「> **原理篇 · 第 N 章** · 域」）、英文金句副标（斜体行）、meta 行（`` `~6 anchors` `` 行内 code）、金句 callout——ch1:3-12、ch2:5-9、ch3 同构, 机制篇 8 章同构。但未按修法用 `.fs-chheader` 组件（`replay.css:148` 定义后全站零使用, 死 CSS）, 徽章行实渲染为 indigo blockquote 而非「CH 0n mono 大牌 + 域色 pill」; meta 行数字无 tabular-nums（仅 td code 有） | 验收: mono 大牌+域色 pill 形态; meta 与 anchors.md 逐章一致 ✓（ch1 ~6/ch2 ~25/ch3 ~24 已核）; h1 无线 ✓ |
| H2 | 上下章双卡导航 + 箭头位移 | done | ch1:72-74 单右卡; ch2/ch3 尾部 fs-prevnext 左右双卡; `theme-learncc.css:82-84` .fs-arrow hover ±4px 位移 | — |
| H3 | replay 主按钮黑白反转 | not-done | `replay.css:14` `.fs-btn-primary` 仍 `background: var(--lc-blue)` 蓝底白字 | 验收: 白底黑字 + hover #e4e4e7; 全组件无蓝底按钮 |
| H4 | 速度档 select→分段文本组 | not-done | `replay.js:326-327` 仍 `<select>` + option 四档 | 验收: 四档并排、active 白底黑字 |
| H5 | 大表格行 hover 微亮 | not-done | grep `tr:hover` theme-learncc.css 零命中 | 验收: tbody tr:hover rgba(39,39,42,.4) + 150ms |
| X1 | REC 编号 token 徽章 | done | `propositions.md:6,13,21,28` 四处 REC-Pn 均已改行内 `` `REC-Pn` `` code（T2 pink 化后获徽章观感）; 另有 .fs-tokenbadge 类备选（`replay.css:157`） | — |
| X2 | anchors 数字列 mono/tabular | done | `anchors.md:7-14` 行数/锚点引用列已包行内 code（`` `65` `` `` `~6` ``）, 承接 td code 的 pink mono + tabular-nums（theme:94） | — |

**gap-A 小计**: done 22（G1 G2 G3 T1 T2 T3 T5 T6 T7 T8 T9 T10 T11 T12 T14 T15 R2 P1 P3 H2 X1 X2）｜ partial 5（T4 T13 C1 R1 H1）｜ not-done 6（C2 C3 P2 H3 H4 H5）= **33 条**

> 注: gap-A 原文文末自计「32 条 = 高 6 · 中 15 · 低 11」, 但其汇总表逐行枚举实为 33 条（低优实为 12 条: T7 T8 T11 T12 T15 C2 C3 P3 H4 H5 X1 X2）。本报告以逐条清单为准。

---

## 二、gap-B（机制篇 ch4-ch11, 逐条枚举 42 条）

### S 系列（系统性, 19 条）

| ID | 条目摘要 | 判定 | 证据 | 备注/验收标准 |
|---|---|---|---|---|
| S1 | 语义色五态衍生系 + token 化 | partial | 主体 token 化达成: `grep -c "var(--lc-"` replay.css=89、components.css=50（验收 >20 ✓）; `--lc-purple:#8b5cf6` ✓（theme:22）; 但 ①残 2 处裸 #3b82f6（`replay.css:149` fs-chheader .dom、`:154` grid3 hover）②ROLE_CLS 未拆: `replay.js:19` tool_call 与 tool_result 同映射 fs-chip-tool（emerald）, 无 amber 拆分 | 验收: 5 色裸 hex grep=0（现=2）; tool_call=amber（未达成） |
| S2 | ring 分层 + :focus-visible | not-done | grep `focus-visible` 全 assets/ 零命中; 无双层 ring box-shadow（fs-li-running 仅 border+badge 底, `replay.css:73`） | 验收: focus-visible ≥1; ch7-shards 双层 ring; Tab 遍历有焦点环 |
| S3 | hero-callout 8/8 章 | done | `.fs-callout` 挂载 13 个 md（8 机制章 + 3 原理章 + README + path, grep 全命中）; CSS 与规格逐项吻合（theme:72-75）; 普通说明性引用未被误升级（仍走默认 indigo blockquote） | 渐变渲染需 CDP |
| S4 | 章节 header 四步出场（机制篇） | partial | 8/8 章齐: 徽章行 blockquote + 英文副标斜体 + meta 行（如 `ch6:7` `` `16 anchors` · `236 行` · 组件… ``）+ callout; 但 ①徽章行非专用组件形态（同 gap-A H1）②meta 行数字无 tabular-nums | 验收: tabular-nums 生效——未达成 |
| S5 | 正文灰阶 zinc-300 | partial | 正文/辅助两档已拆对: p/li/td=#d4d4d8、侧栏/时间戳=#a1a1aa ✓; 但组件题面仍亮正文半档: `components.css:9` fs-ad-finding/fs-jh-card 与 `:48` fs-jh-text 用 --lc-text-h3(#e4e4e7) | 验收: 组件内文字与正文同档——未达成 |
| S6 | 引用三档分工 | partial | 金句档 fs-callout ✓; 第三档 fs-quote-soft 已定义（theme:76-77）但全站 md 零使用; 机制篇 8 章「下一章」仍是蓝底 indigo blockquote（各章尾部 `> 下一章: […]`）; 原理篇已换 fs-prevnext | 验收: 「下一章」不再是蓝底引用块——机制篇未达成 |
| S7 | inline code pink 化 | done | 同 gap-A T2（theme:100,94,119 + print:174） | — |
| S8 | 圆角阶梯收敛 4/6/8/12/999 | not-done | 实测分布: 2px×2, 4px×4, 5px×4, 6px×5, 7px×2, 8px×12, 9px×1, 10px×7, 12px×11, 14px×1, 999px×1, 9999px×3——5/7/9/10/14px 全在 | 验收: 仅剩 4/6/8/12/999 五值 |
| S9 | 边框杂色清零 + var 化 | partial | #2c2c34 全站清零 ✓; var 化计数达标 ✓（S1 证据）; 但残留反馈色系 hex: `components.css:16-17`（#065f46/#92400e 边框）`:44`（#34d399/#fbbf24/#f87171 判定字）, `replay.css:109`（#fbbf24）`:117`（#92400e） | 验收原文两条均过（>20 与 #2c2c34=0）——按验收判 done 边缘; 因「全部 var 化」的修法精神未完, 记 partial |
| S10 | hover 中性提亮（去蓝化） | not-done | `replay.css:12` `.fs-btn:hover` 仍 `border-color: var(--lc-blue); color: var(--lc-blue-300)` | 验收: 次级按钮 hover 无蓝 |
| S11 | 主按钮黑白反转 | not-done | 同 gap-A H3（replay.css:14 蓝底） | 验收: 与封面 CTA 同款白底黑字 |
| S12 | 数字 mono + tabular | partial | .fs-bd-num/.fs-bd-eq（components.css:38,42）、.fs-dotnum（replay.css:44）、.fs-lenbadge（:31）、.fs-fn-count（:83-84）均有 tabular-nums; 但 `.fs-bd-total` 34px 大数字无 mono 无 tabular（components.css:41）; fs-ad-prog 无对应 CSS 规则（仅 JS 侧 autodecide.js:49 挂类名） | 验收: budget 9→10 无位移——需 CDP; 现有证据判 fs-bd-total 未修 |
| S13 | 触达 ≥44px | not-done | grep `pointer: coarse` 全 assets/ 零命中 | 验收: coarse 指针下 fs-btn/fs-bd-btn ≥44px |
| S14 | 回放器加载骨架防 CLS | not-done | 无 `.fs-replay[data-script]:not([data-ready])` 骨架规则（replay.css 全文无 min-height 占位） | 验收: ch8 滚动无 ≥80px 跳动; fs-replay-err 不回归 |
| S15 | 上下章双向 nav | partial | 原理篇 3 章 ✓（fs-prevnext 双卡）; 机制篇 8 章章尾仍 `> 下一章: […]` 单向 blockquote（逐章 tail 实证） | 验收: 8/8 章双向 nav——机制篇未达成 |
| S16 | 代码块文件名栏/语言徽标 | partial | 语言徽标+三点 ✓（index.html codechrome, sh 自动绿标 terminal）; 文件名栏仅 ch1 示意图 1 处, 修法点名的 ch4（SKILL 架构图）/ch8（check_context）/ch9（agent_hint）三处均无 data-filename | 验收: 三处关键代码块有文件名栏——未达成 |
| S17 | 阅读列宽 / 可视化窄列 | done | 采用方案 A: 768px（theme:60, 同 gap-A T5）; 方案 B 的可视化窄列不适用 | 移动端无横向滚动需 CDP |
| S18 | 批判小节/锚点表差异化样式 | not-done | grep `fs-critique` 零命中; 各章批判小节仍普通 h2+列表, 无 amber 竖线/虚线等收束样式 | 验收: 8/8 章批判小节有统一样式 |
| S19 | 组件题注 lead-in 统一 | partial | ch6-sunkcost 已补「（点击播放，7 步自动演示）」（ch6:61）✓; ch7/ch8 有 h3 小节+句式引导（ch7:21「点击播放，9 步自动演示」）✓; 但 ch4/ch5/ch6 首组件（callout 后直贴 `<div class="fs-replay|fs-johari|fs-autodecide">`）无 ≤40 字动作邀请句（ch4:16-17、ch5:16-17、ch6:16-17 实证） | 验收: 8 章每组件前 ≤40 字内有引导句——前三章首组件未达成 |

### B 系列（章专属, 15 条）

| ID | 条目摘要 | 判定 | 证据 | 备注/验收标准 |
|---|---|---|---|---|
| B5-1 | johari/autodecide quiz 双皮合一 | partial | 采用「选择器组合共享定义」: `components.css:9-13` fs-ad-*/fs-jh-* 容器脸/选项/反馈框同源声明, 视觉同源 ✓; 但两族类名仍并存（fs-jh-* 与 fs-ad-*）, 验收「quiz 相关类只有一套」字面未达 | 验收: 并排对比无差 ✓（同源声明保证）; 类名单一化未达 |
| B6-1 | 相邻组件分组呼吸间距 | not-done | grep `fs-replay + / fs-autodecide + / margin-top: 2.2` 零命中; 无相邻组件间距规则 | 验收: ch6 顶部两组件间距 ≥2 倍段距 |
| B6-2 | sunkcost 引导补步数/播放提示 | done | `ch6:61`「对比实验: 同一份 plan 的两种审法（点击播放，7 步自动演示）——」 | 与 ch7/ch10 句式一致 ✓ |
| B7-1 | routing 回放器移出「怎么用」 | done | `ch7:73` ch7-routing 现位于「### 先路由」（:60）节内、紧邻其解说; 「怎么用」（:29-36）节内无任何 fs-* 组件 | 两条验收均达成 |
| B7-2 | 同章 5 交互块节奏分层 | partial | h3 小节已建: 「### 计算器与液位计…」等 9 个 h3（ch7:17,60,87,102,112,126,140,164,189）, TOC 可见 ✓; 但分组间距（B6-1 修法联动）未落 | 验收: TOC 入口 ✓; 分组间距 ✗ |
| B7-3 | ch7 四部剧本步级对照 | done | 四部均有「**步 ↔ 机制对照**」就近段落: ch7:27（budget）、:77（routing）、:134（shards）、:160（panes）, 每部 ≥4 条步映射; 修法允许「就近补」形态（非 ch4 节标题式, 记格式偏差） | 验收: 每部 ≥2 条 ✓ |
| B8-1 | 裸粗体伪标题升级 h3 | done | grep `^\*\*.*——\*\*$` 零命中; ch8:17「### 三线分岔: 三条曲线同一个任务」等真实 h3 已建 | 侧栏 TOC 3 项可见 |
| B8-2 | ch8 三部剧本全覆盖对照 | done | `ch8:211-215`「### 回放对照: 三部剧本 ↔ 协议」含 autohandoff/threelines/recovery 三段步对照, 阈值数字 70/75 与正文一致 | — |
| B9-1 | ch9「怎么用」组件指针 | done | ch9「怎么用」末条:「看演示: 本章有 2 个可交互动画——『红旗话术闸门』回放器（10 步）…『回弹轨道』（9 步）…」 | 指针方案（非前移方案）达成 |
| B9-2 | ch9 两部剧本步对照 | done | `ch9:51`（redflags, 四句红旗进闸对照）、`:143`（track, keep/revert 时序对照） | 与 iron-laws 话术清单一致性需内容复核 |
| B10-1 | ch10 组件前置 + 指针 | done | compound 已前移章首（`ch10:19`, 位于 fs-callout 后、「怎么用」:27 之前——方案 A）; 「怎么用」末条含「看演示…章首…章末…」指针 | 首屏一屏内遇组件需 CDP |
| B10-2 | ch10 两部剧本步对照 | done | `ch10:23`（compound, 0→2→4→6→8 条目对照 Step 编号）、`:199`（snowball, 绿灰两线对照） | Step 编号与机制节一致 ✓ |
| B11-1 | ch11 补交互组件 | not-done | 全章无 fs-* 交互组件（仅 fs-callout 静态块）; 站点已显式声明豁免:「本章无可运行动画——治理是判断题不是演示题」（ch11 怎么用末条） | 验收「≥1 组件」未达成; 属**有意设计豁免**——挂账时建议尊重或由用户复核豁免决定 |
| B11-2 | ch11 h1 补副题 | done | `ch11:1`「第 11 章 · 编排治理与质量自举：给管道自己上的三道锁」 | 8/8 章「第 N 章 · 主题：副题」句式齐 |
| B11-3 | ch11 批判条目粗体引导 | done | 批判小节 3/3 条有粗体引导（「**自觉级约束**」「**维护有成本**」「**覆盖是选择性的**」）, 与 ch4-ch10 条目结构一致; 注: 章节重写后批判条目 4→3, 原第 4 条（双实例验证）已并入正文/锚点表 | — |

### C 系列（一致性专项, 8 条）

| ID | 条目摘要 | 判定 | 证据 | 备注/验收标准 |
|---|---|---|---|---|
| C1 | v1 剧本 annotation 结构化 | done | ch4-pipeline 已升 v2（version:2, 步带顶层 title/desc, 如「入口：Complexity Gate 放行」）; ch8-autohandoff 10/10 步 annotation 补 {title,desc} 结构（「Stage 边界容量检测」等中文标题）; PROTOCOL.md:52-53「已有剧本」表已同步（ch4=v2, ch8=v1 兼容模式注记） | 三条验收全达成 |
| C2 | 全半角标点统一 | not-done | 步骤 title 全角冒号仍存: ch4-pipeline「入口：Complexity Gate 放行」、ch7-shards「汇总验收：逐项核对清单」、ch8-autohandoff 剧本 title; grep「：」命中 5 个剧本文件; PROTOCOL 无标点规范条款 | 验收: grep「：」=0 + PROTOCOL 增补——均未达成 |
| C3 | 步进 stagger + 1600ms 定档说明 | not-done | `replay.js:461-465` applyStep append 循环无 animationDelay 错峰; PROTOCOL 无 1600ms 定档记录; （步进时长内部一致性本就达标, 此条为可选增强项） | 验收: 双块错峰 ≥60ms + PROTOCOL 记录——均未做 |
| C4 | desc 长度带纪律 | partial | 数字侧达标: 13 部剧本 desc 实测最大 90 字（原 ch4 217 字已瘦身）, 全部 ≤160 ✓; 但 PROTOCOL.md 无「60–120 常态带/上限 160」条款 | 验收: max ≤160 ✓; PROTOCOL 立规 ✗ |
| C5 | 回放器位置规范 | partial | 最偏差样本已归位: ch10-compound 前移章首（方案 A 落地）; 但位置规范文档不存在（PROTOCOL.md 与 site/README 均无「主演示→header 区/辅助→就近/结论→章末+指针」条款） | 验收: 规范文档存在且 8 章对号——文档未立 |
| C6 | 点睛句统一形态 | done | 修法的「点破: 」前缀路线未走, 改为统一「粗体独立句」形态, 全站 7 处一致: ch6:23、ch7:25/75/158、ch8:21、ch9:141、ch10:197; 「点破: 」前缀段落 grep 零命中（原 ch7×2+ch10×1 前缀已消） | 验收: 样式一致 ✓（≥6 处）+ 无前缀残留 ✓——两条均达成（形态为粗体句非 fs-punch 组件, 记路线偏差） |
| C7 | 消息面板命名规则 | not-done | ch4-pipeline 仍「主会话」（无 messages[] 后缀）; ch10-compound 仍「knowledge-base 条目」; ch2/ch8-recovery 带「messages[]」后缀——三态并存依旧; PROTOCOL 无命名条款 | 验收: 单一命名规则 + PROTOCOL 条款——均未达成 |
| C8 | 多回放器播放仲裁 | not-done | `replay.js:514-523` 各回放器独立 IntersectionObserver（threshold .35 + 400ms）进视口即自动播; 无全局互斥/`_fsPause` 仲裁逻辑（grep fsPause/仲裁 零命中） | 验收: ch8 快滚任一时刻 ≤1 部在播; 手动点播不受限 |

**gap-B 小计（逐条枚举 42 条口径）**: done 16 ｜ partial 13 ｜ not-done 13

---

## 三、汇总

### 计数

| 来源 | done | partial | not-done | 合计 |
|---|---|---|---|---|
| gap-A | 22 | 5 | 6 | 33（原文自计 32, 汇总表逐行实为 33） |
| gap-B | 16 | 13 | 13 | 42（原文自计 44, B 系清单实为 15 条非 17 条） |
| **总计** | **38** | **18** | **19** | **75** |

两份审计快照的文末自计数均与逐条清单有 ±1~2 的出入, 本报告一律以逐条清单为准。

### 总体结论

- **高优必修基本清账**: gap-A 高 6 条 = 5 done + 1 partial（H1）; gap-B 高 8 条 = 3 done（S3/S7·同T2/C1）+ 4 partial（S1/S4/S5/S6）+ 1 not-done（S2）——主题层五态 token、ring 分层、fs-callout、pink 化、剧本 v2 结构化均已落地。
- **未实施重灾区三类**: ①控件语法（S2 焦点环 / S8 圆角阶梯 / S10·S11·H3 按钮蓝底 / H4 select / H5 行 hover）②PROTOCOL 治理条款（C2 标点 / C3 定档 / C4 长度带 / C5 位置 / C7 命名）③机制篇结构收尾（S6+S15 下一章 nav / S16 文件名栏 / S18 批判小节样式）。

### 挂账清单（not-done + partial 共 37 条, 按优先级排序）

**高优先（6 条）**

| ID | 一句话 | 验收标准 |
|---|---|---|
| S2 | 全站无 :focus-visible, 状态件无 ring 分层 | grep focus-visible ≥1; ch7-shards 播放中分片卡双层 ring; Tab 遍历控件有焦点环 |
| S1 | ROLE_CLS 未拆 tool_call(amber)/tool_result(emerald); 2 处裸 #3b82f6 | replay.js:19 拆映射; replay.css:149,154 token 化 |
| S4 | 章节 header meta 行无 tabular; 徽章行非专用组件 | meta 行数字 tabular-nums; 徽章行组件化或修订验收口径 |
| S5 | 组件题面 #e4e4e7 仍亮正文半档 | fs-ad-finding/fs-jh-card/fs-jh-text 降 #d4d4d8 与正文同档 |
| S6 | 第三档引用（fs-quote-soft）零使用; 机制篇引用层级未收尾 | 「下一章」非蓝底引用块; 说明性引用按需挂 fs-quote-soft |
| H1(A) | 章节 header 未组件化（fs-chheader 死 CSS, 徽章行呈 indigo blockquote） | 徽章行 mono 大牌+域色 pill 落地（或删死 CSS 改口径）; meta 行 tabular |

**中优先（23 条）**

| ID | 一句话 | 验收标准 |
|---|---|---|
| S8 | 圆角阶梯 5/7/9/10/14px 未收敛 | grep 仅剩 4/6/8/12/999 五值 |
| S9 | 反馈色 hex 残留（#34d399 等 5 处, 验收字面已过） | 复核是否收编为 var 或以 badge 语义延伸口径豁免 |
| S10 | 次级按钮 hover 蓝化 | hover 表面微亮+文字提亮, 无蓝 |
| S11 | 主播放钮蓝底（同 gap-A H3） | 白底黑字 + hover #e4e4e7 |
| S12 | fs-bd-total 无 mono/tabular; fs-ad-prog 无规则 | 34px 大数字 mono+tabular; 9→10 无位移（CDP） |
| S13 | 触达面积无 coarse 指针适配 | @media(pointer:coarse) 按钮组 ≥44px |
| S14 | 回放器加载无骨架（CLS） | [data-script]:not([data-ready]) min-height 占位; fs-replay-err 不回归 |
| S15 | 机制篇 8 章仍「> 下一章:」blockquote | 8 章 fs-prevnext 双卡; hover 箭头 ±4px |
| S16 | ch4/ch8/ch9 缺文件名栏（徽标侧已 done） | 三处 data-filename 落地 |
| S18 | 批判小节无收束样式 | 8/8 章统一样式（amber 竖线或虚线 h2） |
| S19 | ch4/5/6 首组件缺动作邀请引导句 | 每组件前 ≤40 字引导（含播放/题数提示） |
| B5-1 | quiz 两族类名并存（视觉已同源） | 类名一族化, 或接受共享声明口径关账 |
| B6-1 | 相邻组件无分组呼吸间距 | .fs-replay+.fs-replay 等组合 margin-top ≥2.2em |
| B7-2 | 交互块分组间距未落（B6-1 联动; h3 已 done） | 同 B6-1 |
| C4 | desc 长度数字已达标, 仅剩 PROTOCOL 条款 | PROTOCOL 增「60–120 常态/上限 160」 |
| C5 | 位置规范文档未立（compound 前移已 done） | PROTOCOL/README 立位置规范并 8 章对号 |
| C8 | 多回放器同屏叠加播放 | 全局播放上限 1; 手动点播不受限 |
| T4 | fs-grid3-card 残 #131316（6/7 已清） | 补净后 grep 七色零命中 |
| T13 | 色点图例在侧栏顶部非分组行首（224px/active 底块已 done） | 分组行注入域色点, 或修订验收认可现形态 |
| C1(A) | 封面次按钮 hover 仍跳蓝 | hover #3f3f46→#52525b 150ms, 无实色蓝 |
| R1 | 首页导览卡 hover 跳蓝无过渡（三卡化已 done） | 边框 zinc 提亮 + 200ms transition |
| P2 | path 章卡无 hover 反馈 | hover 边框→zinc-400/30, 150ms |
| H3(A) | 同 S11（replay.css:14 蓝底主按钮） | 同 S11 |

**低优先（8 条）**

| ID | 一句话 | 验收标准 |
|---|---|---|
| H4 | 速度档仍 select | 分段文本组, active 白底黑字 |
| H5 | 大表格无行 hover | tbody tr:hover rgba(39,39,42,.4) + 150ms |
| C2(A) | 封面按钮无 44px 高度 | min-height:44px |
| C3(A) | 封面渐变中间色 #10101a | 中间站改 #18181b |
| C2(B) | 全角冒号 5 文件 + 无标点条款 | grep「：」=0 + PROTOCOL 标点规范 |
| C3(B) | 无逐块 stagger/定档说明（可选增强） | 双块错峰 ≥60ms + PROTOCOL 记录 |
| C7 | 面板命名三态并存 | 单一命名规则 + PROTOCOL 条款; ch4/ch10-compound 改名 |
| B11-1 | ch11 零交互组件（**站点已显式豁免**:「治理是判断题不是演示题」） | 建议用户裁决: 尊重豁免关账, 或补宪法四问 quiz |

### 需 CDP 复验清单（规则已存在, 渲染未验证, 勿凭本报告判「生效正确」）

G3（callout 对比度 ≥4.5:1）· T5（表格不溢出）· T9（transition 实测 150ms）· T13（toggle 开合不错位）· T14（代码卡渲染）· T15（入场动画+reduce-motion）· S12（budget 9→10 无位移）· S17（移动端无横向滚动）· B10-1（首屏一屏内遇组件）

---

*对账口径说明: 判定只依据站点文件实况（grep/read 实证）, 不采信任何文档自述; 「规则存在 ≠ 生效正确」, 纯视觉条目均已标注 CDP 复验要求。gap-A 自计 32/实际 33、gap-B 自计 44/实际 42, 均以逐条清单为准。*
