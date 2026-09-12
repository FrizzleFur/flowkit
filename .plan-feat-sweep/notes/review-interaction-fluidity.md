# 交互性与网页流畅性 · 严苛评审报告

> 2026-09-12 | 评审人: 主会话（严苛模式） | 对标: learncc（learn.shareai.run, Next.js+framer-motion+tailwind）
> 证据等级: 〔CDP〕行为探针实测 / 〔computed〕浏览器计算样式 / 〔code〕源码实读 file:line / 〔audit〕机械对账（reconciliation.md）
> 总口径: **只读评审, 零改动**; 全部改进项均在零依赖零构建红线内给等价实现路径

---

## 一、总评（不客气的结论）

| 维度 | 本站 | learncc | 定级 |
|---|---|---|---|
| 交互反馈一致性 | 5/10 | 8/10 | **C+** |
| 动效与流畅性 | 4.5/10 | 8/10 | **C** |
| 可达性（键盘/触达） | 3/10 | 7/10 | **D+** |
| 播放器行为正确性 | 4/10 | 7.5/10 | **C-** |

**结构性诊断（比所有单条问题都重要）**: 本站的顺滑感短板不是「缺几个组件」，而是**缺一个统一的 motion/交互基础设施层**。learncc 的顺滑来自体系: hover 走 tailwind `transition-colors` 统一语法、入场走 framer-motion `whileInView+once` 统一引擎、节奏走 useSimulator 单一定档。本站的动效是**逐组件手工点缀**（fs-pagein 一处、fs-arrow 一处、fs-jh-pop 一处、grid3-card 两张有过渡一张没有）——每处手感各不相同，缺一处就硬跳。修单条不修体系，下批组件还会重演。

**元发现（质量风险的另一种形态）**: 审计快照与实况已漂移——C8 描述的「ch8 顶部三部堆叠」实为三处分散布局; gap 两文件自计数与逐条枚举差 ±2; 「~17 条挂账」实为 37 条。**凡引用旧审计结论，一律以对账时点实测为准**。

---

## 二、活体实锤（本次 CDP 行为探针新证据，静态审计给不出的）

### F1 〔CDP〕多回放器同时播放——P0
实验: 重载 ch8 → 首帧只暴露 r2（自动播放确认 暂停）→ r2 播放中暴露 r1 → **t2 时刻实测 r1=暂停 且 r2=暂停（双开）**。
根因: `replay.js:519` 的 `if (!st.playing)` 检查的是**自身**闭包状态（只防 400ms 窗口内的自我竞态），不是其它回放器——即**当前代码不存在任何跨回放器仲裁**。多部同时步进、同时闪烁，这是「流畅性」的最大单点伤害。
修法（零构建, ~10 行）: `initAll` 层全局互斥——auto/manual 播放前遍历 `.fs-replay` 调其它实例的暂停; 叠加 pause-on-exit: 离开视口（threshold 反向）2s 内停。
验收: ①强制帧法复测——任一时刻至多 1 部处于播放 ②滚出视口的播放器 ≤2s 内回到「播放」态 ③手动点播不受限 ④reduce-motion 不回归。

### F2 〔code+CDP〕播放器无 pause-on-exit——P1
播放中的回放器滚出视口后 timer 继续走完（本实验全程可观测: r2 在视口外把 10 步播完才停）。读者注意力已在下一屏，动画在看不见的地方自顾自走——既是注意力错位也是电量浪费。learncc 播完即停 + 单循环动画自调度，无此问题。
验收: 离开视口即暂停（保留进度），回到视口不自动续播（避免 F1 复发）。

### F3 〔CDP〕键盘可达性为零——P0（可达性硬伤）
活体确认 `:focus-visible` 规则全站零命中（styleSheets 实扫 false）。Tab 遍历全部控件（播放/单步/重置/速度档/quiz 按钮）无任何焦点指示——键盘用户完全失明。learncc 有浏览器默认焦点环兜底，我们还把 outline 依赖丢了。
修法: 主题层一段全局 `:focus-visible`（2px ring 双层: 外 `--lc-blue` 1px offset + 表面同色）+ replay/quiz 控件逐类核对。
验收: Tab 遍历 ch6（组件最密页）每个可交互元素均有可见焦点环; 鼠标点击不出现焦点环。

### F4 〔computed〕卡面 hover 手感三态并存——P1
实测（ch8+README 采样 94 个控件/卡）: 按钮/链接层 60/60 有过渡（fs-btn .15s + 基础主题贡献）——这一层**达标**; 但卡面层三种手感并存: grid3-card 两张 0.15s、**一张 0s**; fs-callout/fs-codecard 0s。0s 的非交互卡不算缺陷，**缺陷在「同类件不同手感」**: 三张并排导览卡两张渐变一张瞬跳，肉眼可辨。
根因模式: transition 声明写进了 `:hover` 块内 → **移出瞬间无回弹过渡**（进有出无，半程过渡）。
修法: 统一 hover 基础设施——主题层一段 `transition: border-color .15s ease, background-color .15s ease, color .15s ease` 作用于卡/按钮/链接三类基础件（声明在常态而非 hover 态）; 清点所有 `:hover` 块内声明 transition 的写法。
验收: 同页面同类卡 computed transitionDuration 全等; hover-in/out 双向均有过渡（强制帧前后 computed 对比）。

### F5 〔audit+CDP 复核〕审计条目 C8 部分成立、H4/S14/S2/S10/S11/C1/R1/P2 全部成立
- C8「叠加播放」**成立**（F1 实锤），但描述里的「ch8 顶部三部堆叠」布局已漂移（现为 719/7014/8139 三处分散——冲突场景变为「相邻两部先后入视口」）。
- 控件语法五连〔audit 证实, 本次未逐项复测〕: 按钮蓝 hover（replay.css:12）、主播放钮蓝底（:14）、封面/导览卡 hover 跳蓝（theme-learncc.css:128, replay.css:154）、path 章卡无 hover（pathview.css:26 无 :hover）、速度档原生 select（replay.js:326）——在 zinc 深色体系里蓝底蓝 hover 是「体系外的声音」，用户说的「不对的地方」很大一部分在这里。

---

## 三、对照 learncc 差距矩阵

| # | 维度 | learncc 基线（design-system 实测值） | 本站现状 | 差距定级 |
|---|---|---|---|---|
| 1 | hover 语法 | 全站 150-200ms transition-colors; 边框提亮一档 zinc-800→zinc-400/30 | 控件层有过渡; 卡面三态并存; 5 处 hover 跳蓝（体系外色） | **P0**（视觉统一性） |
| 2 | 入场动效 | framer whileInView+once 全覆盖; stagger 0.05s×index; easeOut 族 | 仅 fs-pagein 一处 .35s; 无 stagger; 无体系 | **P1** |
| 3 | 播放器节奏 | 步进 1200ms/speed 四档链式; 播完即停; 唯一循环动画防多 timer | 步进/速度档达标（13 部统一）; **无仲裁**（F1 实锤）+ 无 pause-on-exit（F2） | **P0** |
| 4 | 加载防跳动 | SSR 骨架 min-h-[500px] + animate-pulse | 回放器零占位，初始化前高度为 0 → 长页滚动跳动〔audit S14〕 | **P1** |
| 5 | 键盘可达性 | 浏览器默认焦点环兜底 | :focus-visible 零（F3 活体） | **P0** |
| 6 | 触达 | 主 CTA/汉堡 min-44px + tap-highlight transparent | tap-highlight ✓ 达标; 44px 无（grep 零命中）〔audit C2/S13〕 | P2 |
| 7 | 步进错峰 | 消息 chip stagger + layout 弹性重排 | applyStep 双块 append 无 animationDelay〔audit C3, code 实读〕 | P1 |
| 8 | 速度档控件 | 分段控件（border p-0.5） | 原生 `<select>`（质感断裂） | P1 |
| 9 | 章尾导航 | 上一章/下一章双卡 + 箭头位移（group-hover translate-x-1） | 原理篇双卡 ✓; **机制篇 8 章仍蓝底 blockquote 单向**〔audit S15〕——同站两范式 | P1 |
| 10 | 大表格 hover | 行 hover 反馈（体系内） | tr:hover 零命中〔audit H5〕 | P2 |
| 11 | 批判小节收束 | （learncc 无对应物, 本站自定标准） | 8 章普通 h2+列表, 无收束样式〔audit S18〕 | P2 |
| 12 | 步级 stagger 定档 | 节奏参数集中（useSimulator 单点） | 无 PROTOCOL 定档记录〔audit C3/C4/C5〕 | P2（文档层） |

---

## 四、改进清单（每条自带验收，全部零构建等价实现）

### P0（不修则「不如 learncc」的体感成立）

| # | 改进 | 修法（等价路径） | 验收 | 规模 |
|---|---|---|---|---|
| P0-1 | 播放器仲裁 + pause-on-exit | replay.js: initAll 挂全局注册表; auto/manual 播放前 pause 其它; IO 反向回调 2s 内 stop; （F1/F2 一并修） | 强制帧法: 任一时刻 ≤1 部播放; 离视口 ≤2s 停; 手动点播不受限 | ~15 行 JS |
| P0-2 | hover 去蓝 + 统一 hover 基建 | 主题层一段统一 `transition`（常态声明）作用于卡/按钮/链接; 七处蓝 hover（replay.css:12,14 / theme:128 / replay.css:154 / pathview.css:26 等）改 zinc 提亮语法（边框一档 zinc-400/30） | ①grep 蓝 hover 零命中 ②同类卡 transitionDuration 全等 ③hover-out 有回弹（computed 双向） | ~20 行 CSS |
| P0-3 | :focus-visible 基建 | 主题层全局规则 + 双层 ring（外圈 --lc-blue 1px offset-2, 内圈表面同色 2px）; replay/quiz/funnel 全控件核对 | Tab 遍历 ch6 全控件有焦点环; 鼠标点击无环 | ~15 行 CSS |

### P1（体系缺口，补齐后接近 learncc 质感）

| # | 改进 | 修法 | 验收 | 规模 |
|---|---|---|---|---|
| P1-1 | 入场动效体系 | 通用 `data-fx` 标注 + 一个共享 IO once 引擎（~40 行, replay.js 同款 API）+ CSS .35s 淡入/位移; 章卡 stagger 用 :nth-child delay; reduce-motion 全兜 | 全站块级元素入视口一次性入场; 同组错峰 ≥60ms; reduce-motion 零动画 | ~70 行 |
| P1-2 | 回放器骨架防 CLS | CSS: `.fs-replay[data-script]:not([data-ready]) { min-height: 420px; 动画脉动 }` | ch8 慢网模拟滚动无 ≥80px 跳动; fs-replay-err 不回归 | ~8 行 CSS |
| P1-3 | 速度档分段文本组 | replay.js select → 四档 button 组（active 白底黑字, follow learncc） | 四档并排; active 反转; 键盘可达（依赖 P0-3） | ~25 行 JS |
| P1-4 | 机制篇章尾双卡统一 | 8 章 `> 下一章:` → fs-prevnext 双卡（原理篇同款） | 8/8 章双卡; 箭头 hover ±4px | 8 章 md + 0 CSS |
| P1-5 | 步进错峰 + PROTOCOL 定档 | applyStep append 加 animationDelay ≥60ms; PROTOCOL 增节奏条款（步进 1600ms/错峰 60ms/播完即停） | 双块同步出现归零; PROTOCOL 有定档节 | ~5 行 + 文档 |

### P2（打磨层, 排 P0/P1 之后）
触达 44px + coarse 指针（C2/S13）; 表格行 hover（H5）; 批判小节收束样式（S18）; 圆角阶梯收敛（S8）; PROTOCOL 治理条款族（C2 标点/C4 长度带/C5 位置规范/C7 面板命名）; ch4/5/6 首组件引导句（S19）; 机制篇 fs-quote-soft 收尾（S6）; 代码块文件名栏三处（S16）。

### 明确不做
- 不引入 framer-motion/任何动画库（零依赖红线）; 不逐处手补动效（重回基建缺失老路）; 不做 FPS 级优化（无证据支撑必要）。

---

## 五、遗留局限与补测义务

1. **帧率未测**: 后台 tab rAF 节流, FPS 级流畅性结论未取得。若需: 用户把 Chrome 切前台（或授权 AppleScript 自动化）跑一轮帧采样——预期不是瓶颈（动效均为 transform/opacity 类），优先级低。
2. **:hover 态 computed 未采**: 后台 tab 无真实悬停; hover 差距以 CSS 规则实读为准（行号已给）。
3. P0-1/P0-2/P0-3 修复后必须用本报告的强制帧法回归复测（实验脚本可复现）。
