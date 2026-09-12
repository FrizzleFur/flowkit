# flowkit 机制原理教程站（flowsite）— 任务计划

**Goal:** docsify 交互教程站**全量版**（2026-09-12 用户裁定加量: 原理篇 3 章 + 机制篇 8 章 + 交互 5 件全做）+ 反哺提案，落 flowkit 仓内
**上游:** spec.md（SC1-SC5）+ 三路侦察 notes/（R1 hello-agents / R2 learncc / R3 flowkit-map）
**Architecture:** 站点 = site/（docsify: index.html + markdown 章 + assets/interactive/ 组件 + assets/scripts/*.json 剧本）; 反哺 = proposals/*.md（REC 式）; README 挂链一处

---

## Phase A: 骨架与基准（主会话亲做——全站风格地基）
**可否并行:** 否（地基）
**依赖:** 无

### Task A1: docsify 骨架
**Files:** Create: `site/index.html`（docsify 壳: CDN 引用/中文侧边栏/封面/搜索插件）/ `site/_sidebar.md`（两篇结构导航）/ `site/_coverpage.md` / `site/README.md`（站点首页: 定位/读者画像/30 秒导览）
**验证:** python3 -m http.server 本地起 + curl index.html 200; sidebar 含全部一期章

### Task A2: 交互组件库五件（用户裁定全做）
**Files:** Create: `site/assets/interactive/replay.js`+`replay.css`（剧本回放器: data-script 属性加载 JSON, Play/单步/0.5-4x 调速, 追加式步进, annotation 旁白——R2 simulator 模式原生 JS 化 ~120 行）/ `autodecide.js`（判定游戏: 8-10 案例卡, 读者判 AUTO/TASTE/BLOCKED, 规则源 panel-review.md P1-P6）/ `switch-panel.js`（flow vs flow-deep 参数开关→实时渲染 Stage 序列）/ `budget429.js`（并发预算计算器: 1+subagent+其他会话, ≥3 变红, 公式锚 flow-deep 规模档位节）/ `johari.js`（乔哈里 Prompt 评分演示: 本地规则简化版, 标注与真实 /prompt 的差异）
**验证:** node --check 五件 + 组件在基准章内实际可用（已达成）（docsify 运行时加载）

### Task A3: 基准章（原理篇第 1 章）
**Files:** Create: `site/principles/ch1-agent-loop-and-pipeline.md`
**内容:** 一句话机制→30 秒体验→怎么用侧栏→为什么主体（Agent Loop 状态机[hello-agents 概念] × flowkit 管道形态实例锚点）→批判小节→SC5 锚点表。**此章定全站风格基准**
**验证:** SC5 锚点 ≥5 处且写作时实读源文件; 含一个内嵌交互

## Phase B: 三章并行（agent，对照基准章）
**依赖:** Phase A

### Task B1: 机制篇枢纽「管道全景」章
agent 写作; 管道 Stage 步进剧本 JSON（Stage -1→5.8 全流转配 annotation）; SC5 锚点 ≥8
### Task B2: 原理篇「长时程三板斧」章
上下文工程三板斧命名对映（Compaction↔Auto Handoff / 结构化笔记↔planning-with-files / 子代理↔multi-agent）; Auto Handoff 交接剧本 JSON; SC5 ≥6
### Task B3: 原理篇「记忆与召回闭环」章
auto-skill 召回-沉淀闭环 + rag-lab 混合检索结论联动（标注为实测案例）; SC5 ≥6

## 十一章总账（S1 补丁, 2026-09-12）

| 章 | 文件 | 标题 | 覆盖(R3 域) | 组件落位 | 批次 |
|---|---|---|---|---|---|
| 原理1 | principles/ch1-agent-loop-and-pipeline.md | Agent Loop 与管道形态 | 总起 | switch-panel | A3 ✓ 已交付 |
| 原理2 | principles/ch2-context-three-axes.md | 长时程三板斧 | F | （引用 ch8 深读） | B2 |
| 原理3 | principles/ch3-memory-loop.md | 记忆与召回闭环 | H | — | B3 |
| 机制4 | mechanisms/ch4-pipeline-overview.md | 管道全景（枢纽） | 全域串联 | replay: Stage 流转剧本 | B1 |
| 机制5 | mechanisms/ch5-input-and-planning.md | 输入质量与思考规划 | B+C | johari | B'' |
| 机制6 | mechanisms/ch6-review-and-decision.md | 评审与决策 | D | autodecide | B' |
| 机制7 | mechanisms/ch7-concurrent-execution.md | 并发执行 | E | budget429 | B' |
| 机制8 | mechanisms/ch8-context-engineering.md | 上下文工程 | F 深读 | replay: Auto Handoff 剧本 | B' |
| 机制9 | mechanisms/ch9-verification-loop.md | 验证与迭代 | G | — | B'' |
| 机制10 | mechanisms/ch10-cross-session-memory.md | 跨会话记忆 | H 深读 | — | B'' |
| 机制11 | mechanisms/ch11-orchestration-governance.md | 编排治理与质量自举 | A+I | — | 主会话（C 前亲写） |

分篇对账（S1c）: sidebar 两篇仅**导航分组**，章节内容采 R3 §5 单主干+章内双轨（怎么用侧栏/为什么主体）——不推翻 R3 判断，取其防重复理由。

## 章节任务书模板（S2 补丁——B 阶段每章套用）

- 目标文件: 上表路径（与 _sidebar.md 一致）; 结构对照基准章 ch1: 一句话机制 → 30 秒体验 → 怎么用侧栏 → 为什么主体 → 批判小节 → 源码锚点表(锚点数下限见任务) → 下章链接
- **SC5 复核纪律**: R3 行号是 2026-09-12 快照——落笔前对每处锚点 `sed -n` 实读复核; 已知陷阱: flow/SKILL.md:394 残留旧值「≤4」（当前规范 ≤3, 勿引旧值）; multi-agent/SKILL.md:55-70 有重复编号条目
- **D2 规则源唯一性（S3）**: Auto-Decide 规则以 skills/flow-deep/references/panel-review.md 为唯一源; README ASCII（:82-105）为旧版语义（P5 写成自动修复, 与正源相反）——只作演进线素材并显式讲差异
- 剧本 JSON: site/assets/scripts/<章>-<slug>.json, schema {title, steps:[{role:user|assistant|tool_call|tool_result|system, content, annotation}]}; 章 md 内 `<div class="fs-replay" data-script="assets/scripts/...json"></div>`（组件库已有勿重写）; annotation 为教学旁白
- 篇幅 150-300 行; 中文无 emoji; 语气对照 ch1（工程诚实不营销）; 组件 div 直接嵌入勿自写 JS

## Phase B: 三章并行（B1/B2/B3, 套任务书模板）
- B1 机制4 管道全景: 十二关各一段+枢纽图+replay Stage 流转剧本（8-12 步）; 锚点 ≥8
- B2 原理2 长时程三板斧: Compaction↔Auto Handoff / 结构化笔记↔planning-with-files / 子代理隔离↔multi-agent 三对映+「理论名分」叙事; 锚点 ≥6
- B3 原理3 记忆闭环: auto-skill 召回-沉淀循环+integrity-check 巡检联动+rag-lab 混合检索案例（标注实测）; 锚点 ≥6

## Phase B': 机制篇续章（B4/B5/B6）
- B4 机制6 评审与决策: Plan Review 二分心智+面板+Auto-Decide（组件落位+P1-P6 讲解, 规则源纪律见模板）; 锚点 ≥6
- B5 机制7 并发执行: 分屏分发/流水线批次/429 预算（组件落位+当前值与演进线）; 锚点 ≥6
- B6 机制8 上下文工程: STATE.md 五字段/交接五件套/HANDOFF（replay Auto Handoff 剧本）; 锚点 ≥6

## Phase B'': 机制篇收官（B7/B8/B9）
- B7 机制5 输入质量与思考规划: prompt 评分（johari 落位+完整体系指路）/Goal Contract/ST 六维; 锚点 ≥6
- B8 机制9 验证与迭代: Goal Verification 证据表/auto-iterate/退回 Plan 协议; 锚点 ≥6
- B9 机制10 跨会话记忆: Stage -1/5.8 闭环细节+portfolio 档案实践; 锚点 ≥6

## Phase B''': 机制11 编排治理与质量自举（主会话亲写——宪法章最贴近治理本体）
设计宪法四问/三铁律/能力 registry/覆盖审计/evals 诚实划界; 锚点 ≥6

## Coverage: SC1=Phase A/B/B'/B''（11 章全量）/ SC2=C1 / SC3=A2 五件 / SC4=C2 / SC5=A3 起+终验抽查 10 处
## 质量自检: 精确 9 / 完整 9.5（全量）/ 可验证 9 / 依赖 9 / 影响可控 9.5 → **9.2**
## 面板裁剪: 沿用先例（内容型任务, 3.5 审查+SC5 终验兜底）
## 依据记录: ST 4 步见对话; 2026-09-12 用户裁定「加量全做」覆盖首版克制方案; 施工分批 A→B→B'→B'' 流水（每批 ≤3 agent）

## 审查采纳记录（2026-09-12 site-reviewer NEEDS_REVISION）
S1 章节总账+分篇对账 / S2 任务书模板 / S3 D2 规则源唯一性 + 建议 1-5（Pages/CDN/SC3 钉值/C1 标注/笔误）全采纳; Phase A 免改照常收尾。B 阶段任务书即上述模板实例化。
