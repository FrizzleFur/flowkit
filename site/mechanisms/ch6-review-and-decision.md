# 第 6 章 · 评审与决策：两个 Claude、八副眼镜与六条原则

> **机制篇 · 第 6 章** · D · 评审与决策

*Fresh Eyes, Fewer Blind Spots*

`16 anchors` · `252 行` · 组件 `autodecide` + `funnel` + `replay ch6-sunkcost`（7 步）· 约 25 分钟

**本章位置**: 管道评审区 · 机制篇第 3 站 · 上接[第 4 章 · 全景](ch4-pipeline-overview.md)与[第 5 章 · 输入闸门](ch5-input-and-planning.md) · 下一站[第 7 章 · 并发执行](ch7-concurrent-execution.md)

<div class="fs-callout">

**一句话机制**: 让一个没写过方案的 Claude 审方案（消沉没成本），让多副专业眼镜交叉看（消单视角盲区），再用六条原则的自动判定层滤掉 80% 常规裁决——用户只接住那几条真正值得「品味判断」的决策。

**机制定位**: 评审区三关展开的前两关（Stage 3.5 独立审查 / Stage 3.6 面板评审）+ Auto-Decide——回答「自己写的方案，凭什么自己检查自己可信」。

**本章你将看到**: 一个八案例的判定游戏（先玩再读）· 把「自己检查自己」拆成三层防偏误的完整推理 · 六原则判定链与一张真实文档腐化案例。约 25 分钟；组件可交互，全文可按标签跳读。

</div>

<div class="fs-autodecide"></div>

*判定游戏: 八个真实感发现，先凭直觉判 AUTO / TASTE / BLOCKED——读完本章再回来对答案，错的那些通常都栽在「顺序」和「例外条款」上。*

<div class="fs-tabsep" data-label="怎么用（30 秒上手）"></div>

- flow-deep 里你什么都不用做: Stage 3.5 强制启用、Stage 3.6 默认启用——评审自动发生，且两关都**暂停等你确认**（半自动，裁决权在你）
- 不想要面板评审: `--no-panel`（Stage 3.6 的逃生阀）; Stage 3.5 在 flow-deep 中**没有**逃生阀——高风险任务是它的定位
- 想控制评审强度: `--panel-depth quick|basic|advanced`（1/3/5 个角色），或 `--panel-roles "R02,R03,R06"` 精确点名（角色数不受档位限制）
- flow 侧（轻量管道）: `--plan-review` 手动启用 3.5; 满足条件（如改动影响 3+ 模块）会自动**建议**但不自动执行（`skills/flow-deep/references/plan-review.md:11-20`）
- 顶部判定游戏的玩法: 先凭直觉判，读完「机制」标签的六原则判定链再回来对答案

<div class="fs-tabsep" data-label="机制"></div>

## 为什么：把「自己检查自己」拆成三层

第 4 章过全景时给评审区留了三关（3.5 / 3.6 / 3.7）。本章展开前两关——它们回答同一个问题的三个递进层次: **自己写的方案，凭什么自己检查自己可信？**

| 层 | 机制 | 消什么 | 形态 |
|---|---|---|---|
| 独立性 | Stage 3.5 独立审查 | 沉没成本偏差（写方案的不愿推翻方案） | 1 个全新上下文的 Staff Engineer |
| 多元性 | Stage 3.6 面板评审 | 单角色盲区（一副眼镜看不全） | 3-5 个并行只读专家 Agent |
| 注意力 | Auto-Decide Layer | 决策疲劳（20+ 条发现全端给用户） | 六原则顺序判定，80% 自动裁决 |

三层各挡一种失效模式，缺一层就有一种「审查形同虚设」的姿势: 没有独立性，审查是自我背书; 没有多元性，审查是单一视角复读; 没有注意力治理，审查报告变成没人真读的长文。

### 第一层: Stage 3.5 ——「两个 Claude」消沉没成本

要消除的偏误很具体: 第一个 Claude 花了大量上下文思考并写出了 plan，它已经「投入」了——此时让它自审，它会倾向维护自己的方案。这是人类工程师也逃不掉的沉没成本偏差，LLM 同样不豁免。

解法是文档里那句直白的话: **「两个 Claude」模式——用新上下文消除思维惯性**（`skills/flow-deep/references/plan-review.md:4`）。启动一个全新上下文的独立 Agent，以 Staff Engineer 角色审查 plan 的 6+3 个维度——架构合理性 / 遗漏边界情况 / 安全风险 / 性能影响 / Plan 假设验证 / 可执行性，spec.md 存在时再加 SDD 三项（Coverage Gaps / Constitution Alignment / Cross-Artifact Consistency）（`skills/flow-deep/SKILL.md:406-429`）。

关键设计是**它没写过这个方案**——没有沉没成本，推翻方案的代价为零。为什么「全新上下文」是硬条件而不只是姿态？因为偏见住在上下文里: 原会话里那些「我已经想过了」「这个取舍是有理由的」的痕迹，本身就是审查时要被质疑的对象。带着它们审，等于让被告参与合议庭。

维度清单之外没有自由发挥空间——审查 Agent 拿到的是结构化任务（角色 + 维度 + 输出格式），报告按统一模板返回，审查结果写入 findings.md 的 Plan Review 章节留痕（完整 prompt 模板见 `references/plan-review.md`）。返回三态:

- `APPROVED` → 直进 Stage 3.6
- `APPROVED_WITH_NOTES` → 选择性采纳建议，更新 plan 后继续
- `NEEDS_REVISION` → 退回 Stage 3 修改

注意半自动定位: Agent 只出报告，**暂停展示、等用户确认**——裁决权不在 Agent 手里。

对比实验: 同一份 plan 的两种审法（点击播放，7 步自动演示）——

<div class="fs-replay" data-script="assets/scripts/ch6-sunkcost.json"></div>

**右侧新会话没有「我写的」包袱——这就是强制独立审查的全部理由。**

### 第二层: Stage 3.6 —— Design Review Board

3.5 消的是「自我偏袒」，但一个 Staff Engineer 再资深也只有一副眼镜。Stage 3.6 引入 Design Review Board 心智: 8 个专家角色目录（R01 架构 / R02 安全 / R03 性能 / R04 领域 / R05 运维 / R06 测试 / R07 前端 / R08 数据），各带五条专业审查维度（`skills/flow-deep/references/panel-review.md:42-53`）。

按工作量分三档（`--panel-depth` 即分级参数）: `quick` 选 1 个关键维度把关、`basic` 选 3 个（默认）、`advanced` 选 5 个; 自动选择按任务类型映射（安全敏感任务 basic 档 = Security + Architect + QA），也可 `--panel-roles` 覆盖（`panel-review.md:55-76`）。选中角色在同一条消息中**并行启动 3-5 个只读 Agent**——不修改任何文件，只返回审查报告; 单个 Agent 失败不阻塞其他评审，降级为部分评审（`panel-review.md:460-465`）。

每个评审 Agent 的 prompt 是结构化的三明治（`panel-review.md:90-118`）: 角色特定的五条专业维度在上，三条**通用维度**（遗漏边界情况 / 假设验证 / 可执行性）居中兜底，输出格式钉死为四段——审查结论（APPROVED / CONCERNS / BLOCKED）+ 专业维度发现（严重问题 / 建议改进 / 确认良好三档）+ **跨维度观察**。最后一段值得单独看: 它要求每个角色回答「从你的角度看，其他角色可能遗漏什么、与谁可能冲突」——综合分析的 `[DISAGREEMENT]` 标记，种子在这里就埋下了，而不是事后靠文本比对猜出来。

综合分析两步升维（`skills/flow-deep/SKILL.md:431-476`）:

- **重叠发现**（2+ Agent 提到同一问题）→ 合并后升高优先级
- **角色间分歧**（不同专业视角对同一决策意见相左）→ 标记为 `[DISAGREEMENT]`，交给用户

这两步是多视角的真正收益: 单 Agent 给不出的信息，恰恰是「三个专家都盯上了这处」和「安全专家与性能专家吵起来了」。

顺带一个执行细节: 面板 Agent 命名为 `panel-{role-id}`（如 `panel-architect`）、subagent_type 用 general-purpose、不需要 tmux 分屏（`panel-review.md:451-458`）——这些约定怎么嵌入更大的并发纪律（同消息并发上限、429 预算），是[下一章](ch7-concurrent-execution.md)的主题。

### 二分心智模型: 单次快速 vs 分级多智能体

两关为何不合并成一个「更强的评审」？源码里用原生命令对标讲清了分工（`skills/flow-deep/SKILL.md:413, :439`）: 3.5 对标原生 `/review`（单 Agent、广度优先 sanity check），3.6 对标原生 `/code-review <level>`（分级多智能体、深度优先专业维度）。参考文档里的五维对照表（`panel-review.md:30-38`）:

| 维度 | Stage 3.5 | Stage 3.6 |
|---|---|---|
| Agent 数量 | 1 个 Staff Engineer | 3-5 个专家角色 |
| 审查深度 | 广度优先，快速 sanity check | 深度优先，专业维度切入 |
| 目标 | 过滤明显问题 | 发现深层隐患 |
| 耗时 | 低（单 Agent） | 中（并行多 Agent） |
| 何时跳过 | flow-deep 中不可跳过 | `--no-panel` 可跳过 |

一句话: **先用一次便宜的单点检查拦住明显问题，再为值得的任务付出多角色并行的成本**。两层不是重复建设，是成本递进的漏斗——大量 plan 在 3.5 就该被打回，不值得动用五席面板。

### 第三层: Auto-Decide Layer —— 六原则判定链

面板综合分析可能产出 20+ 条发现。全部端给用户？那是决策疲劳的开端。Auto-Decide Layer 插在**综合分析与用户展示之间**（`panel-review.md:193-194`，借鉴 GStack /autoplan 的决策原则思路），目标: 自动处理约 80% 常规发现，只上浮 Taste Decisions——通常少于 5 条而非 20+。

批量模式: 20 条发现一次倒入——

<div class="fs-funnel"></div>

**漏斗吞掉的不是问题, 是你要做的 15 次决策。**

对每个发现按 P1-P6 **顺序判定，一旦命中立即分类，不再继续**（`skills/flow-deep/references/panel-review.md:192-278`）:

| 原则 | 触发 | 决策 | 典型例 |
|---|---|---|---|
| P1 行业标准优先 | 有明确行业最佳实践答案 | AUTO_APPROVED（自动采纳并记录） | 「缺少输入验证」「日志缺请求 ID」 |
| P2 风险阈值分级 | 按风险等级 | CRITICAL → BLOCKED; HIGH → TASTE; MEDIUM/LOW → AUTO | 数据泄露级 → 直接阻塞 |
| P3 已批决策一致性 | 与 Stage 2 / Stage 3 已确认决策冲突 | AUTO_APPROVED（保持已批，记录冲突） | 已定 Redis，QA 建议改 Memcached → 保持 |
| P4 YAGNI 标记上浮 | 前瞻性建议、无明确需求 | TASTE_DECISION `[YAGNI]` | 「为微服务化预留接口」 |
| P5 安全一律上浮 | 安全相关 MEDIUM 及以上 | TASTE_DECISION `[SECURITY]` | 「建议加 rate limiting」 |
| P6 可逆性评估 | 按影响面 | <3 文件 → AUTO; ≥3 文件 → TASTE `[IRREVERSIBLE]` | 跨模块接口变更 → 上浮 |

两条细则是判定链的灵魂，也是顶部判定游戏最容易判错的地方:

- **P2 的安全特例**: 安全相关发现不走 P1 自动采纳，统一先按 P2 分级; 其中 CRITICAL/HIGH 在 P2 即出结果，**MEDIUM 级安全特意不归 P2 的 AUTO，继续下走留给 P5 上浮**——安全事项的默认归宿是用户，不是静默
- **P6 的例外条款**: 数据库 schema、API 协议、公共接口签名变更，**不论文件数一律上浮**——判定游戏里「schema 变更只影响 2 个文件」那题，答案不是 AUTO 而是 TASTE，先读例外再数文件

顺序本身承载语义: P1 摆在最前因为行业标准答案最无争议; P5 排在 P4 之后却接住 P2 漏下的安全 MEDIUM——六条原则不是六票表决，是一条精心排布的短路电路。源码里的判定流程图（`panel-review.md:251-278`）值得原样看一遍:

```
每个发现
  │
  ▼
P1: 有行业标准? ──是──→ AUTO_APPROVED (记录)
  │否
  ▼
P2: 风险分级? ──CRITICAL──→ BLOCKED
  │             HIGH────→ TASTE_DECISION
  │             LOW/MED──→ AUTO_APPROVED
  │(安全相关 MEDIUM 级不走 AUTO，继续到 P5)
  ▼
P3: 与已批决策冲突? ──是──→ AUTO_APPROVED (保持原决策)
  │否
  ▼
P4: 是前瞻性建议? ──是──→ TASTE_DECISION [YAGNI]
  │否
  ▼
P5: 安全相关? ──是──→ TASTE_DECISION [SECURITY]
  │否
  ▼
P6: 影响面 >= 3 文件? ──是──→ TASTE_DECISION [IRREVERSIBLE]
  │否
  ▼
AUTO_APPROVED (默认通过)
```

拿三个发现实际走一遍链（正是判定游戏里的三题，可以先自己判再看答案）:

- **「采集脚本缺少输入验证」**: P1 命中——有明确行业最佳实践答案，一跳即出 AUTO_APPROVED。走得越靠前，自动化越安全。
- **「API 密钥可能出现在日志输出中」**: 安全相关，P1 对它**不适用**（安全问题不走 P1 自动采纳）→ 进 P2 分级，够 CRITICAL（数据泄露级）→ BLOCKED，直接阻塞。安全问题要么很重（阻塞），要么上浮，没有「静默自动修」这条出路。
- **「数据库 schema 变更影响 2 个文件」**: P1-P5 都不命中 → 到 P6，数文件 2 < 3 本可 AUTO，但例外条款「schema 变更不论文件数一律上浮」→ TASTE_DECISION `[IRREVERSIBLE]`。判错这题的人几乎都是先数了文件、漏读了例外。

判定只有三种出口: `AUTO_APPROVED` 静默记录进 findings.md（完整可追溯）、`TASTE_DECISION` 收进待审列表、`BLOCKED` 进阻塞列表（CRITICAL 必须解决）。走完所有原则都没命中，默认 AUTO_APPROVED——这条「默认通过」是刻意的: 拿不准要不要上浮的常规项，不配打断用户。

### Taste Decision 与 Final Approval Gate

上浮项有统一的可决策结构——五标签（`panel-review.md:280-288`）: `[CLOSE_APPROACH]`（两种可行方案都有道理）/ `[YAGNI]` / `[SECURITY]` / `[IRREVERSIBLE]` / `[DISAGREEMENT]`（角色间分歧），每条必含**背景、来源、选项、推荐**四要素。

最终 Approval Gate 只展示三块（`skills/flow-deep/SKILL.md:460-467`）: Auto-Decide 摘要（按原则分组的统计）、Taste Decisions、Blocked Issues。报告的骨架长这样（节选自 `panel-review.md:386-439` 的格式模板）:

```
## Panel Review — Final Approval Gate

### 角色参与情况
| 角色 | 结论 | 严重问题 | 建议 | 自动处理 |
|------|------|---------|------|---------|
| Architect | APPROVED | 0 | 2 | 2 |
| Security | CONCERNS | 1 | 1 | 1 |
| QA | APPROVED | 0 | 3 | 3 |

### Auto-Decide 摘要
| 决策类型 | 数量 | 说明 |
| AUTO_APPROVED (行业标准 P1) | N | [1-2 个示例] |
| **总计自动处理** | **N** | 已自动处理，无需人工审阅 |

### Taste Decisions — 需要你决定
#### TD-N: [标签] 标题
- **背景**: 为什么这个决策需要人工判断
- **选项**: A 方案（优/劣） vs B 方案（优/劣）
- **推荐**: 推荐选项及理由

### 你的决定:
- [ ] APPROVE_ALL  /  SELECTIVE_ADOPT  /  REVISE_PLAN
```

你在这个界面上做一次三选:

- `APPROVE_ALL` → 采纳全部，Taste Decisions 采用推荐选项
- `SELECTIVE_ADOPT` → 逐项标注调整
- `REVISE_PLAN` → 退回 Stage 3 修改 plan

报告本身也在治理决策疲劳（`panel-review.md:440-449`）: Taste Decisions 最多展示 8 条，超出按 `[SECURITY] > [DISAGREEMENT] > [IRREVERSIBLE] > [CLOSE_APPROACH] > [YAGNI]` 优先级截断; Blocked 超过 5 条只展示 CRITICAL; 完整报告（含所有 AUTO 详情与被截断项）写入 findings.md——**界面做减法，账本不删账**。

### 活教材: 一张已经腐化的 README 图

本章 P1-P6 的规则源只有一处: `skills/flow-deep/references/panel-review.md:192-278`。而 README 里的 Auto-Decide ASCII 图（`README.md:82-105`）是**旧版语义**，两处关键漂移:

| 位置 | README 旧图 | 正源 panel-review.md |
|---|---|---|
| P1 行业标准 | 「违反 → 自动修复 (AUTO_FIX)」 | AUTO_APPROVED（自动采纳并**记录**） |
| P5 安全优先 | 「安全相关 → **自动修复**」 | **一律上浮** TASTE_DECISION |

P5 的漂移最危险: 照旧图理解，安全问题会被「静默自动处理」而不打扰用户——恰好与该机制最重要的保守性设计**相反**。旧图里的 `AUTO_FIX` 出口在现行体系里根本不存在（三出口只有 AUTO_APPROVED / TASTE_DECISION / BLOCKED）。

这是「文档腐化」的活教材，三点教训: 其一，机制语义演进了（安全从可自动处理改为一律上浮），门面文档里的快照没跟上——多文档同步是所有流程系统的硬伤; 其二，阅读时**以最贴近执行的参考文档为准**（SKILL.md 引用的 references/），门面文档只作演进线索; 其三，这类漂移肉眼难发现，正是 evals 回归网与 lint 要接住的场景（详见[第 11 章](ch11-orchestration-governance.md)）。

<div class="fs-tabsep" data-label="本章源码锚点表"></div>

| 断言 | 锚点 |
|---|---|
| Stage 3.5 理念与三态流程 | `skills/flow-deep/SKILL.md:406-429` |
| Stage 3.5 原生对标 /review（二分） | `skills/flow-deep/SKILL.md:413` |
| 「两个 Claude」消除思维惯性 | `skills/flow-deep/references/plan-review.md:4` |
| flow 侧手动启用与自动建议 | `skills/flow-deep/references/plan-review.md:11-20` |
| Stage 3.6 全流程（角色/并行/综合） | `skills/flow-deep/SKILL.md:431-476` |
| --panel-depth 即 level 参数（二分） | `skills/flow-deep/SKILL.md:439` |
| Final Approval Gate 三块与三选 | `skills/flow-deep/SKILL.md:460-467` |
| 与 3.5 分工五维对照表 | `skills/flow-deep/references/panel-review.md:30-38` |
| 8 角色目录（R01-R08） | `skills/flow-deep/references/panel-review.md:42-53` |
| 三档深度与任务类型映射 | `skills/flow-deep/references/panel-review.md:55-76` |
| P1-P6 六原则（唯一规则源） | `skills/flow-deep/references/panel-review.md:192-250` |
| 顺序判定命中即停流程 | `skills/flow-deep/references/panel-review.md:251-278` |
| Taste Decision 五标签 | `skills/flow-deep/references/panel-review.md:280-288` |
| 报告生成规则（截断优先级与上限） | `skills/flow-deep/references/panel-review.md:440-449` |
| GStack /autoplan 借鉴来源 | `skills/flow-deep/references/panel-review.md:193-194` |
| README 旧版 ASCII 图（文档腐化对照） | `README.md:82-105`（P1 见 :90, P5 见 :94） |

<div class="fs-tabsep" data-label="批判小节（深挖: 局限与成本）"></div>

- **80/20 是设计目标不是保证**: 「自动处理约 80%」取决于发现项构成——安全密集型任务的上浮量可能远超 5 条，TD 上限 8 条的截断规则本身就是对这种方差的承认
- **判定原则是启发式而非定理**: P1「行业最佳实践」的认定依赖 Agent 判断，无外部基准核验; P6 的 3 文件线是明线，但例外条款覆盖的（schema / API 协议 / 公共签名）恰是最难量化的领域——线画得清楚，线的依据仍是经验
- **两层评审有交集成本**: 3.5 的六维与 3.6 的角色维度部分重叠，广度/深度分工缓解但不消除重复; 对小 plan 双重评审接近纯开销——`--no-panel` 与 flow 侧「建议不自动执行」的存在，就是系统对这份成本的自我坦白
- **Auto-Decide 不替代用户决策**: 参考文档把这句写进注意事项（`panel-review.md:460-470`）——它只过滤可自动处理的常规项，安全 / 不可逆 / 分歧一律上浮; 但「过滤」本身也是一次判断，漏判的上浮项无人工兜底可寻
- **只读承诺依赖执行纪律**: 评审 Agent 的只读性写在 prompt 与注意事项里，是约定级约束——与全站的关卡一样，约束的是遵循 skill 的会话

本章的改进提案（REC 式，附触发条件）见[改进提案](../propositions.md)——治理哲学一以贯之: 不达条件不实施。

<div class="fs-tabsep" data-end="1"></div>

<nav class="fs-prevnext">
<a class="fs-nav-prev" href="#/mechanisms/ch5-input-and-planning"><span class="fs-arrow">←</span> 上一章 · 输入质量与思考规划</a>
<a class="fs-nav-next" href="#/mechanisms/ch7-concurrent-execution">下一章 · 并发执行 <span class="fs-arrow">→</span><br><small>面板五席只是并行的一种形态: 怎么分发 agent、怎么分批防 429、怎么在 tmux 里看见每一个。</small></a>
</nav>
