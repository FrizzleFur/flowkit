# F3 · CSS 风格对齐审计报告（learncc zinc 基准）

> 审计者: CSS 审计 agent | 日期: 2026-09-12 | 方法: docsify@5.0.0 dark.css / search.min.js 逐规则比对 + 全站静态 grep
> 基准: `assets/theme-learncc.css` 色板（bg #09090b / card #18181b / border #27272a·#3f3f46 / text #fafafa·#a1a1aa·#71717a / accent #3b82f6）
> 加载序: dark.css (CDN) → theme-learncc.css → replay.css → components.css（search 插件样式为运行时注入，晚于全部 link）

## 结论速览

- 审计项: **21** | 修复: **14 处**（全部落在 theme-learncc.css，+51/-5 行）| 对齐无偏差: 5 | 遗留观察: 2
- 最大发现: **正文链接颜色特异性失守**——dark.css 用 `.markdown-section a`(0,1,1) 定色，theme 用裸 `a`(0,0,1) 覆盖，正文链接实际一直是 docsify 橙红 `#ea6f5a`
- 渲染复验（CDP）由主会话执行，本报告为静态判定

## 一、theme-learncc.css 覆盖漏元素（审计域①）

| # | 元素 | dark.css/插件现状 | 判定 | 处置 |
|---|---|---|---|---|
| 1 | 正文链接 `a` | `.markdown-section a { color:#ea6f5a; font-weight:600 }` (0,1,1) | **偏差·高危**（裸 `a` 压不过，全站正文链接橙红残留） | ✅ 补 `.markdown-section a`/`:hover` 同形覆盖（蓝/浅蓝 hover） |
| 2 | 分割线 `hr` | `.markdown-section hr { border-bottom:1px solid #eee }` | **偏差**（亮线刺眼） | ✅ 补 `border-bottom: var(--lc-border)` |
| 3 | 表格边框 | `td,th { border:1px solid #ddd }` + `tr { border-top:1px solid #ccc }` | **偏差**（theme 只改了 border-bottom，#ddd 竖线/亮行线残留） | ✅ 表格段前置 `td,th,tr { border:none }` 清零（注释标明顺序敏感） |
| 4 | `p.tip` | 亮底 `#f8f8f8` + `#f66` 红条/圆点/code `#efefef`/em `#c8c8c8`，特异性 (0,2,1) | **偏差**（theme `.tip` (0,2,0) 压不过；md 暂未用 tip，防御修复） | ✅ 同形 `.markdown-section p.tip*` 全套 → card 底/blue 条 |
| 5 | `p.warn` | `background: rgba(234,111,90,.1)` 橙红底 | **偏差**（同上防御修复） | ✅ → `rgba(245,158,11,.08)` amber |
| 6 | 搜索关键词高亮 | dark.css `.search .search-keyword { color:#ea6f5a }` | **偏差** | ✅ → `#93c5fd` |
| 7 | 搜索结果分隔线 | search.min.js 运行时注入 `.matching-post { border-bottom:1px solid #eee }`（晚于 theme，需更高特异性） | **偏差** | ✅ `.search .results-panel .matching-post` (0,3,0) 压过 |
| 8 | 搜索结果链接 hover | dark.css `.search a:hover { color:#ea6f5a }` | **偏差** | ✅ → `#93c5fd` |
| 9 | 搜索清除按钮 svg | 注入 CSS 无色规则（默认黑 fill） | 小偏差 | ✅ 补 `fill: var(--lc-text3)` |
| 10 | 打印样式 | dark.css 仅 `@media print { 侧栏类 display:none }`，深底白字直接打印不可读 | **偏差**（功能级） | ✅ 补完整 print 反转段（纸面配色 + cover/侧栏/角标隐藏） |
| 11 | h5/h6 | `h6 { color:#777 }` 亮灰；md 实测未用 h5/h6（grep `#####` 零命中） | 防御级 | ✅ 并入 `h1-h6` 选择器 |
| 12 | em/斜体 | dark.css 无 em 专项色（tip 内 em 除外，见#4） | **对齐**（继承 text2 正确） | 不改 |
| 13 | ol/ul 标记 marker | 无专项规则，marker 继承 li 色（theme 已覆盖 text2） | **对齐** | 不改 |
| 14 | kbd/sub/sup/details/iframe | `kbd{border:#ccc}`、`iframe{border:#eee}` 亮色存在但全站 md 零使用（grep 证实） | 不触发 | 记录不修 |
| 15 | prism token 色 | dark.css 内置暗色 token 调色板（`placeholder/.variable → #3d8fd1` 系） | **对齐**（theme `pre>code` 的 !important 仅作继承基准，不杀 token span 色） | 不改 |

## 二、dark.css 基底残留冲突（审计域②）

| # | 项 | 现状 | 判定 | 处置 |
|---|---|---|---|---|
| 16 | 侧栏收起按钮 | 三横线 `var(--theme-color,#ea6f5a)` 橙红 + 底块 `rgba(63,63,63,.8)` | **偏差**（可见 UI 元素） | ✅ `transparent` 底 + 三横线 `var(--lc-text3)` |
| 17 | cover h1 字重 | `section.cover h1 { font-weight:300 }` (0,1,2) 压过 theme 裸 h1:700 | 偏差（主标题纤细，与 zinc 粗标题意图相悖） | ✅ `.cover .cover-main h1` 补 `font-weight:700` |
| 18 | sidebar 站名字重 | `.sidebar>h1 { font-weight:300 }` | 偏差（同上） | ✅ 补 `font-weight:600` |
| 19 | 标题锚点 `#` | `.anchor span { color:#c8c8c8 }` | 小偏差（hover 态装饰偏亮） | ✅ → `var(--lc-text3)` #71717a |
| 20 | sidebar 宽度 300px | learncc 实测无宽度基准数据 | **对齐存疑** | 遗留观察（无据不盲改） |
| 21 | 链接字重 600 | dark.css `.markdown-section a` 附带 font-weight:600，learncc 无实测字重基准 | 对齐存疑 | 遗留观察（颜色已修，字重待主会话 CDP 对照 learncc 实测后定） |

## 三、章节行内样式（审计域③）

grep `style=`/`span`/`color` 于 11 章 md + 三辅文: **零命中**。md 中 class= 清单仅 7 类组件容器（fs-replay×5 / fs-switch / fs-johari / fs-budget / fs-autodecide / fs-hero×2），样式全由 replay.css + components.css 承载，二者已对齐 zinc（2026-09-12 重制版）无旧色。**判定: 无亮色残留。**

## 四、封面与辅文（审计域④）

- `_coverpage.md`: 无行内样式；`fs-hero`/`fs-hero-hint` 走 replay.css（#71717a/#a1a1aa 对齐）；cover 渐变终端 `#172554` 为任务明示豁免（hero 深蓝）
- `anchors.md` / `about.md` / `propositions.md` / `_sidebar.md` / `README.md`: 纯 markdown 结构（标题/表格/引用/链接），表格将走修复后的 zinc 卡片表格。**判定: 对齐。**
- 附带发现（未修，超出风格域）: dark.css 的 `.cover .cover-main p:last-child a` 蓝底主按钮规则因 `_coverpage.md` 结构（末个 p 是 `fs-hero-hint`，无 a）不命中任何按钮 → 封面两个 CTA 均为白描边样式，无蓝底主按钮。属交互设计决策，交主会话定夺

## 五、旧色残留扫描（审计域⑤）

全站（css/md/html/js，排除 report-learncc-patterns.html 独立报告）grep `#0f62be|#f5f7fa|#dfe3ea|#eaf2fc`: **零命中**。`#3b82f6` 系（fs-chip-user、fs-sw-chip、fs-btn-primary 等）与 `#172554`（fs-hero-on）均为任务明示豁免的合法存在。**判定: 通过。**

## 修复记录（全部在 site/assets/theme-learncc.css，+51/-5）

| 行域 | 修改 |
|---|---|
| L13 | `h1,h2,h3,h4` → `h1,h2,h3,h4,h5,h6`（h6 #777 亮灰校准） |
| L24 | `.sidebar > h1` 补 `font-weight:600` |
| L38-40 | 表格段新增 `td,th { border:none }` + `tr { border:none }`（清 dark.css #ddd/#ccc 残留，注释标明顺序敏感） |
| L52-56 | `.tip/.warn` 段整段替换为 `p.tip*` 同形覆盖四条 + `p.warn` amber 底 |
| L56 | `.cover .cover-main h1` 补 `font-weight:700` |
| L67-97 | 文末追加「dark.css 基底残留校准」段: 正文链接×2 / hr / anchor span / sidebar-toggle×2 / search×4 / @media print 全套 |

## 遗留项（交主会话）

1. **sidebar 宽度**（#20）: 300px 维持，需 learncc 实测宽度基准后决定
2. **正文链接字重**（#21）: 暂保留 dark.css 的 600，CDP 对照 learncc 后定夺（400/500/600）
3. **封面主按钮**: 蓝底主 CTA 因选择器不命中而失效（见四·附带发现），属设计决策非风格残留
4. 渲染复验: 本报告全部为静态判定，建议 CDP 逐页过 ch4（表格+replay）/ ch6（autodecide）/ ch7（budget）/ 封面（hero 动画）/ 搜索面板
