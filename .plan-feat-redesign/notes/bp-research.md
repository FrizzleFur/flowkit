# 交互式教程站设计模式调研（bp-research）

> 调研日期：2026-09-12 ｜ 调研方式：web-access skill（WebFetch 后端被网络策略拦截，降级 curl 直连 + Python 正文提取；Google 系站点直连不可达，用 WebSearch 补充）。除特别标注外均为一手抓取。
> 服务对象：flowkit docsify 零构建教程站（11 章 markdown + 原生 JS 交互组件）。

---

## 一、范式盘点表

| 站点 | 组织范式 | 核心交互 | 读者留存机制 | 证据来源 |
|---|---|---|---|---|
| learn.svelte.dev | **REPL 驱动分步**（4 大部→分组→单步 exercise，一步一特性） | 左文右编辑器双栏；多文件 tab；右上 solve 逃生阀（无练习步禁用）；Vim mode | 步骤极细粒度、递进式（"Later exercises build on earlier ones"）；推荐线性但可菜单跳转不强制；localStorage 进度持久化；solve 防卡死 | 一手抓取首页+目录+页面脚本 grep 到 `localStorage.getItem` |
| react.dev/learn | **双轨制**：Tutorial: Tic-Tac-Toe（项目式 learn-by-doing）+ 概念循序渐进（Quick Start→Describing the UI→…），开头显式分流 | 页内 live editor（Reload/Clear/Fork→CodeSandbox）；长代码 "Show more" 折叠；Challenge 块 + Show solution 折叠（单课实测 4 个 Challenge） | 先看成品再学（"check out the finished game before continuing"）；挑战+隐藏答案；心理安全文案（"If the code doesn't make sense yet… don't worry"） | 一手抓取 /learn 与 /learn/tutorial-tic-tac-toe；HTML grep Challenge/Solution |
| The Rust Book（原版） | **纯线性章节书**（章→节，零交互） | 无（代码高亮而已） | 靠内容质量；官网主动导流交互版 | 一手抓取 doc.rust-lang.org/book/（"Want a more interactive learning experience? …quizzes, highlighting, visualizations: rust-book.cs.brown.edu"） |
| Brown 交互版 Rust Book | 线性章节书 + **原位 quizzes/可视化注入** | 章内嵌 quiz：错后可重试或看答案，鼓励 retry until 100%，看过答案即锁定；文本 highlight/✏️ 标注；Aquascope 编译期/运行期可视化 | 形成性评估低风险重试；可视化建立 ownership 心智模型；**quiz 数据→misconception→文本修订**的研究闭环 | 一手抓取 rust-book.cs.brown.edu；引用 OOPSLA 2024 "Profiling Programming Language Learning"（Distinguished Paper）+ OOPSLA 2023（SIGPLAN Research Highlight） |
| MDN Learn | **课程化分层**（Getting started / Core / Extension），显式定位"beginner → comfortable，不是 expert" | "Test your skills"（高频、单点）vs "Challenges"（低频、综合项目）两级练习；MDN Playground（代码块 Play 按钮→可编辑+Reset），允许自备 CodePen/JSFiddle | 练习频率分级设计；starter code + 底部 solution；MDN Curriculum + Educators 页（可被教学采用） | 一手抓取 Learn_web_development 主页 |
| web.dev/learn | 课程化 units→lessons，活动量外显（"22 activities • 1 quiz"） | 单元末 quiz 门槛（"must answer all questions correctly to pass"） | 期末测验达标 + Google Developer Program badge/pathway 外部激励 | WebSearch（直连被网络阻断）：web.dev/learn/html、/learn/quizzes/html |
| javascript.info | **线性长滚动三部曲**（语言/浏览器/附加），Part→chapter→lesson，"More…" 折叠扩展组 | 每课内嵌 sandbox（"click the Play button in the right-top corner of the box"）；tasks 带 importance 标记 + 隐藏 solution | 重要性星级帮读者取舍；任务即练习；**形态最接近 docsify 的参照系**（静态站、无构建、CDN） | 一手抓取首页+hello-world+variables（页面实测 importance×6、solution×6） |
| hello-algo.com | mkdocs 纯静态线性章节（中文圈标杆） | 三卖点「动画图解、一键运行」：预生成动画/GIF 可视化 + 13 语言代码 tabs + 一键运行 | 高质量可视化+平滑学习曲线；零构建理念同款——证明纯 markdown 站不靠游戏化也能 130k stars | 一手抓取 GitHub README + API（stargazers_count=130,030，2026-09-12 实测） |
| Brilliant.org | **problem-first**（先谜题后讲解，"does not explain concepts at the beginning"）+ 高频交互节奏 | 拖拽/点选/滑杆微交互；进度地图；streak/每日目标 | 交互密度+游戏化；但被评"lightly interactive"、"no less dry than a textbook"，偏 supplement 而非系统教材 | WebSearch：brilliant.org/faq、Nibble 评测、Reddit r/learnmath、Brighterly、Trustpilot |
| Explorable Explanations（explorabl.es） | **探索驱动 sim**（读者操纵参数看涌现结果），社区/运动形态 | 交互模拟器；每件作品独立工程 | "learning through play" 宣言（"reunite play and learning"）；代表作 Nicky Case 等 | 一手抓取 explorabl.es |

**范式小结**：
- 讲概念 → 线性长滚动（javascript.info / hello-algo / Rust Book）+ 页内练习增强即可成立；
- 教语法 → REPL/沙盒分步（svelte）最有效但工程最重；
- 两类读者 → 双轨分流（react.dev），比强制单一入口好；
- 检验理解 → 原位 quiz 形成性评估（Brown），门槛式期末测验可选（web.dev）；
- 讲机制/涌现 → sim 探索（explorabl.es），成本最高，按需少量。

---

## 二、「读得下去」的机制（含公开依据）

1. **主动学习有效**：Freeman et al. 2014 PNAS 元分析（225 项研究）：主动学习组考试成绩 +6%，纯讲授不及格率高 1.5 倍（33.8% vs 21.8%）；Theobald 2020 后续：主动学习把弱势群体通过率差距缩小 45%。→ 练习/挑战/quiz 内嵌不是装饰，是留存核心。
2. **quiz 数据驱动内容迭代**：Brown 版根据 quiz 错误模式修订教材文本并发表论文（OOPSLA 2024 Distinguished Paper）。→ quiz 组件应记录作答（哪怕只存 localStorage），为改稿提供输入。
3. **进度可视化降低不确定性**：NN/g（Sherwin 2014）"visibility of system status" 十大启发式；动态进度指示提升满意度与等待容忍。→ 侧栏完成标记/进度条有 UX 依据。
4. **首屏承载关键内容**：NN/g 眼动（Fessenden 2018，13 万次注视、n=120）：57% 视线时间在首屏以上、74% 在前两屏。→ 每章开头放摘要/地图，长滚动必须有节奏锚点（图表/交互/小结）。
5. **逃生阀防卡死**：svelte solve 按钮、MDN 底部 solution、react.dev "don't worry" 文案。三家不约而同。→ 挑战必须带低成本出路。
6. **成品先行**：react.dev 先给可玩的成品再拆解。→ 建立目标感是章节开头的强钩子。

---

## 三、可移植性分级（docsify 纯 markdown + 原生 JS/CSS，零构建）

约束解释：允许 CDN 引入现成插件（docsify 生态常规用法）；引入打包器/重依赖视为违规。

### HIGH（等价实现，插件/少量代码即可）
| 模式 | docsify 等价路径 |
|---|---|
| 线性长滚动 + 侧栏 TOC | docsify 原生（`_sidebar.md` + collapse 菜单） |
| 上一页/下一页步进 | docsify-pagination（npm v2.10.1 实测存在） |
| 标签分区（读/玩/深挖、多语言代码） | docsify-tabs（MIT，master 分支实测） |
| 折叠深挖/答案块 | 原生 `<details>/<summary>`（markdown 兼容，零 JS） |
| 任务 + importance 标记 + 隐藏 solution | markdown + CSS + details（javascript.info 形态） |
| 原位 quiz | 本仓已有 `site/assets/interactive/constquiz.js`（延续）；Brown 规则（重试至全对、看答案即锁定）用 localStorage 即可实现 |
| 进度打点/侧栏完成标记 | docsify hook（`mounted`/`each`）+ localStorage + sidebar 渲染标记（svelte 同款存储方案） |
| 关键内容前置/首屏摘要 | 纯写作规范，零代码 |
| 代码高亮 + 复制按钮 | docsify 内建 Prism + docsify-copy-code |

### MEDIUM（可做，需设计投入）
| 模式 | docsify 等价路径 |
|---|---|
| 双栏 文+操 | CSS grid 容器 + markdown 内嵌 HTML；移动端折叠为上下 |
| 内联可运行示例 | iframe `srcdoc` 沙盒（JS 类内容＝javascript.info sandbox 等价）；注意转义与安全 |
| challenge + 断言检查器 | 自研 JS checker（console 断言级）+ 通过后 localStorage 记录解锁 |
| 简单可视化 | 手写 SVG/canvas 小部件；**更划算的变体是 hello-algo 式预生成动画/GIF（该路线本身算 HIGH）** |
| 文本标注/highlight | selection API + localStorage；价值密度低，缓做 |
| 期末 knowledge-check 汇总页 | quiz 组件复用，成本在题目编写 |

### LOW（不建议在零构建下追求）
| 模式 | 原因 |
|---|---|
| REPL 级编辑器+实时编译（svelte 同款） | 需在浏览器内置整包编译器；Monaco 体积大、CodeMirror CDN 可行但仍是重投入 |
| 编译期语义可视化（Aquascope 类） | 研究级工具，非站点工程问题 |
| 账号/云同步进度/badge 体系 | 需后端；localStorage 进度已覆盖本场景 |
| 服务端判题/作业提交 | 需后端 |
| 复杂 sim explorable | 每件独立工程（explorabl.es 模式），按需单点外包时间 |

---

## 四、反模式清单

1. **强制线性锁章节**（上节未完成不能进下节）——头部站点全部允许自由跳转（svelte "可以经菜单跳转"、react.dev 双轨自选）；锁进度只制造挫败。依据：一手行为 + Nielsen "user control and freedom" 启发式。
2. **动效滥用**——NN/g（Harley 2014, "Animation for Attention and Comprehension"）：只对"必须注意并行动"的元素做动效；同站另有 "Animations are Distracting!" 专文。自动轮播/入场动画干扰阅读。
3. **游戏化过用**（streak/徽章/排行榜）——NN/g "Video Game Engagement vs Addiction" 指出游戏机制过用滑向成瘾设计；hello-algo 130k stars 证明技术教程留存可以完全不靠游戏化。
4. **谜题先行无脚手架**——Brilliant 的 problem-first 被用户评 "no less dry than a textbook"（Reddit r/learnmath）、"lightly interactive"（Brighterly 评测）。安全用法是 Brown 式「章节后置的形成性 quiz」而非门槛；若谜题先行，前置知识必须已在文中给出。
5. **付费墙/登录墙打断学习流**——Brilliant 免费段后强制订阅是 Trustpilot 常见投诉点。教程站应无账号可用，进度 localStorage 即够。
6. **一次性倾倒最终代码**——react.dev 反例做法：分步重构 + Show more 折叠 + "看不懂没关系" 心理安全文案；最终代码在开头的「先看成品」是预览不是要求理解。
7. **关键内容埋三屏以后**——NN/g 57%/74% 眼动数据；无小节锚点的长滚动在 fold 后注意力断崖。
8. **quiz 形同虚设**——看过答案还能无限重试（Brown 特意锁定），或把 quiz 当进入门槛而非形成性评估（Brown 是重试至 100% 的低风险设计，且经研究迭代）。
9. **交互组件不可重置/丢工作区**——MDN Playground 专门提供 Reset；svelte 用 localStorage 持久化。交互组件必须可重置、可恢复。

---

## 五、优先级参考（针对 flowkit 11 章 docsify 站）

**P0（性价比最高，先做）**
1. 每章开头摘要卡 + 关键内容前置（写作规范，零代码）
2. 进度打点 + 侧栏完成标记（localStorage，svelte 同款）
3. challenge/quiz 统一组件：以现有 `site/assets/interactive/constquiz.js` 扩展两形态，采用 Brown 规则（重试至全对、看答案锁定、记录作答）
4. `<details>` 式「深挖/答案」折叠规范化（零 JS）

**P1（第二批）**
5. docsify-tabs 做「多语言代码/读-玩分区」
6. docsify-pagination 上下步进
7. iframe srcdoc 内联可运行示例（挑 2-3 个价值最高的章节试点）

**P2（有富余再做）**
8. 可视化走 hello-algo 式预生成动画/GIF 路线（比运行时 sim 便宜一个量级）
9. 期末 knowledge-check 汇总页

**明确不做**：REPL、账号体系、运行时重型 sim、badge/排行榜。

---

## Sources

- [learn.svelte.dev](https://learn.svelte.dev/)（一手抓取）
- [react.dev/learn](https://react.dev/learn) / [Tutorial: Tic-Tac-Toe](https://react.dev/learn/tutorial-tic-tac-toe)（一手抓取）
- [The Rust Book](https://doc.rust-lang.org/book/) / [Brown 交互版](https://rust-book.cs.brown.edu/)（一手抓取）
- [MDN Learn web development](https://developer.mozilla.org/en-US/docs/Learn_web_development)（一手抓取）
- [web.dev/learn/html](https://web.dev/learn/html) / [web.dev HTML quiz](https://web.dev/learn/quizzes/html)（WebSearch 摘要）
- [javascript.info](https://javascript.info/)（一手抓取）
- [hello-algo](https://www.hello-algo.com/) / [GitHub repo](https://github.com/krahets/hello-algo)（一手抓取 README + API）
- [Brilliant.org FAQ](https://brilliant.org/faq/) / [r/learnmath 讨论](https://www.reddit.com/r/learnmath/comments/vvb3s9/is_brilliantorg_worth_it/) / [Brighterly 评测](https://brighterly.com/blog/is-brilliant-org-worth-it/) / [Nibble 评测](https://nibble-app.com/blog/is-brilliant-worth-it)
- [Explorable Explanations](https://explorabl.es/)（一手抓取）
- Freeman et al. 2014, [Active learning increases student performance in STEM, PNAS](https://www.pnas.org/doi/10.1073/pnas.1319030111)；Theobald et al. 2020, [PNAS](https://www.pnas.org/doi/10.1073/pnas.1916903117)
- NN/g: [Scrolling and Attention (2018)](https://www.nngroup.com/articles/scrolling-and-attention/) / [Progress Indicators (2014)](https://www.nngroup.com/articles/progress-indicators/) / [Animation for Attention and Comprehension](https://www.nngroup.com/articles/animation-usability/) / [Engagement vs Addiction](https://www.nngroup.com/videos/video-game-engagement-vs-addiction/)
- Crichton & Krishnamurthi, OOPSLA 2024（经 Brown 版一手页面引用）
- docsify 插件: [docsify-tabs](https://github.com/jhildenbiddle/docsify-tabs)（一手抓取 README）、docsify-pagination（npm registry 实测 v2.10.1）
