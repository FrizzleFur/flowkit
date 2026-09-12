# 第 3 章 · 记忆与召回闭环

> **原理篇 · 第 3 章** · H · 跨会话记忆

*Forced Recall, Gated Distillation*

`~24 anchors` · `200 行` · 组件 — · 约 20 分钟

<blockquote class="fs-callout">
<p><strong>一句话机制</strong>: 会话天然失忆——任务结束，这次踩的坑与想通的方案就随上下文蒸发; auto-skill 用「召回-沉淀」闭环把教训变成资产: <strong>任务开始强制召回（Stage -1），验证通过才准沉淀（Stage 5.8）</strong>，一读一写之间，经验跨会话复利。</p>
<p>Memory Layer · 跨会话记忆（H 域）· Stage -1 强制召回 / Stage 5.8 验证后沉淀的双库闭环</p>
</blockquote>

## 30 秒看懂（闭环全景）

```
      ┌────────────────────────────────────────────────────────┐
      │                    （下一个任务启动）                     │
      ▼                                                        │
 [环节 1] 召回 ── Stage -1: 抽关键词 → 匹配双库 _index.json     │
      │            命中条目全文加载 → Relevant History 进契约    │
      ▼                                                        │
 [环节 2] 使用 ── 召回经验参与规划与执行（不再从零踩坑）          │
      │                                                        │
      ▼                                                        │
 [环节 3] 验证 ── Stage 5: 逐条成功标准配新鲜证据                │
      │            只有 DONE 才放行；非 DONE 一律不沉淀          │
      ▼            （失败方案入库 = 下次任务的误导源）            │
 [环节 4] 沉淀 ── Stage 5.8: 提炼 → 分流双库 → 询问用户          │
      │            → 写入条目 + 更新 _index.json                │
      │                                                        │
      └────── 经验落库，成为下一次环节 1 的召回候选 ──────────────┘
```

四环节一句话: **召回要强制（不靠运气）、使用要进契约（不靠自觉）、验证做闸门（防污染）、沉淀要过审（防垃圾）**。

这四环节恰好嵌在第 1 章管道的首尾: 环节 1 是 Stage -1（管道最前置的关卡），环节 3-4 复用 Stage 5 的验证结果并在 Stage 5.8 收口——**记忆闭环不是管道外的独立系统，而是管道两端的延长线**。

## 怎么用（30 秒接入）

- FlowKit 落位 `~/.claude/skills/` 后，auto-skill 双库（`knowledge-base/` + `experience/`）即自动生长——用着用着就有记忆，无需配置
- 走 `/flow-deep` 时闭环自动全开: 启动即召回（Stage -1），验证通过后主动询问沉淀（Stage 5.8）; 两端均可显式关闭（`--no-recall` / `--no-distill`）
- 走 `/flow` 时闭环降为对话层: auto-skill 的每回合被动循环仍在（CLAUDE.md 强制协议保底），但没有管道级的强制召回与验证后沉淀——又一个「同一条管道的两种裁剪」: **闭环的深度跟着任务的风险等级走**
- 沉淀永远先问再写: 你说「可以」，条目才落库——记忆库的所有权在用户

**看演示: 同一个坑的两种命运**（点击播放——
左边无召回重新踩坑, 右边召回后直取经验。差异不在能力, 在有没有先召回。）

<div class="fs-replay" data-script="assets/scripts/ch3-recall.json"></div>


## 为什么：把「学到的东西」变成跨会话资产

### 问题: 纪律可以管道化，积累不能

第 1 章的管道解决了单任务内的纪律（关卡防漂移），但有一个它管不到的盲区: **任务做完，教训蒸发**。这次发现的「spring 参数调 X 才不抖」、这次绕了三小时才找到的「先初始化再覆盖」，在会话结束后全部清零——下次同场景，从零开始再踩一遍。

auto-skill 的回答是给整个系统装一条跨会话 loop: 读端（召回）+ 写端（沉淀），中间由管道的验证关卡把门。

### 读端: auto-skill 的每回合被动召回

auto-skill 的第一个动作发生在任何任务开始之前: **Step 0.5 自举协议**（`skills/auto-skill/SKILL.md:16-36`）——首次触发时检查全局规则文件（如 `~/.claude/CLAUDE.md`）是否含「任务启动协议」，没有就自动追加一条「新任务必须先读取 auto-skill 的 SKILL.md」。协议的永久生效不依赖手动配置——记忆系统自己把自己焊进了启动流程。

此后每轮对话执行五步核心循环（`skills/auto-skill/SKILL.md:12-102`）:

1. **抽关键词**: 从当前消息抽 3-8 个核心名词（不读档，先轻后重）
2. **判话题切换**: 转折词（「另外/改成/换成」）/ 关键词差异 ≥40% / 用户要求改分类——三条件任一命中才算切了话题
3. **跨技能经验读取**: 只要本回合用了任何非 auto-skill 技能，**强制**读取该技能的 experience 条目（不受话题切换约束——用过必读）
4. **知识库读取**: 只在话题切换时才读 `knowledge-base/_index.json`，按关键词匹配分类（匹配到多少读多少）
5. **任务结束主动记录**: 判断价值，主动询问用户是否沉淀

注意第 3、4 步的不对称: **经验的读取是强制项，知识的读取是条件项**。因为经验绑定具体技能、命中即高相关; 知识库面大，靠话题切换做触发器省 token。配合「对话内缓存」（`last_keywords`/`last_topic_fingerprint`/`last_matched_categories`，`skills/auto-skill/SKILL.md:38-46`），非切换回合不重读索引——这是召回侧的成本控制设计。

### 读端补强: Stage -1 强制召回

被动循环有个漏: 话题切换判断是启发式，**可能漏载任务相关经验**。flow-deep 在管道层加了强制补充（`skills/flow-deep/SKILL.md:233-254`）:

- 每次启动从任务表述抽关键词，重新匹配双库索引——「不管 auto-skill 是否已读，都重新做一次针对性匹配」，命中去重不重复加载
- 召回结果写入 Goal Contract 的 `Relevant History` 字段（来源文件 + 一句话精华）——**经验进入任务契约**，后续规划必须参考，不靠模型自觉
- 召回清单同时写入 STATE.md，供会话恢复时复用

读端由此形成两层: auto-skill 管「对话中的连续性」，Stage -1 管「任务启动的确定性」。

### 闸门: 为什么必须验证通过才沉淀

写端的触发条件只有一种: **Stage 5 Goal Verification 判 DONE**（所有 Success Criteria 均有新鲜证据）。这不是仪式感——未经验证的「成功」可能是幻觉完成，把失败方案沉淀进库，等于给未来的每次召回埋一颗误导雷。验证闸门保证入库的都是「被证据背书过的做法」。

### 写端: Stage 5.8 验证后沉淀

Stage 5.8（`skills/flow-deep/SKILL.md:654-677`）的行为: 从 Goal Contract + 实际执行结果 + 关键决策中提炼可复用经验 → 按判断准则分流双库 → 主动询问用户 → 同意后写入条目并更新 `_index.json`。STATE.md 同步记录沉淀清单，供追溯。

沉淀维度按「经验属于谁」三分:

- **任务级**（这类任务的最佳实践流程）→ knowledge-base
- **技能级**（用 flow-deep/某 skill 时踩的坑）→ experience
- **不沉淀**: 一次性操作、纯概念、已记录过的重复内容

### 双库分工与隐私设计

| 库 | 存什么 | 检索面 |
|---|---|---|
| `knowledge-base/` | 通用流程、偏好、跨领域解法 | 分类 `keywords` 匹配 |
| `experience/` | 具体技能的踩坑、参数、模板 | `skill-id` 精确命中 |

双库分工的依据是**两类知识的检索面不同**: 知识靠话题找，经验靠技能找（`skills/auto-skill/SKILL.md:180-186`; `README.md:31`）。

隐私上这是一个「一个目录的两副面孔」设计: git 视角，仓库只含协议与骨架（`.gitignore:6-7` 显式忽略双库内容）; 运行时视角，`~/.claude/skills/auto-skill/` 下长出完整的个人记忆库。迁移设备时记忆数据不随 git 走、需单独拷贝或备份恢复（`docs/deploy-new-device.md` 前置认知表）——开源协议与私人记忆分离。

## 条目质量: 让记忆库不变垃圾场

闭环最大的隐形成本不是「召回不准」，而是**库里全是垃圾**。auto-skill 用三道闸防退化:

1. **省时间判据**: 核心问题只有一个——「这东西下次能让用户省时间吗」（`skills/auto-skill/SKILL.md:105-138`）。general 七该记三不该、experience 五该记三不该，把「纯概念解释」「不可复用结论」「一次性操作」挡在门外
2. **Evidence-backed 格式**: experience 条目含 Trigger（什么场景触发）/ Observation（观察到的事实）/ Outcome（验证效果）三字段（`skills/auto-skill/SKILL.md:155-176`）——经验从「结论」升级为「证据链」，召回时可以快速判断「这是验证过的，还是推测」
3. **陈旧度标注（REC-1）**: 条目记 `lastUpdated` + `subject_version`; 召回时距今 >90 天或版本不符，提示行必须附标注（「2026-07 记录，针对 v0.7.2，注意时效」）——**过期不静默**（`skills/auto-skill/SKILL.md:66`）。按过期经验当新知识用，会翻车

另有交叉授粉机制（REC-3，`skills/auto-skill/SKILL.md:94`）: 沉淀时可选记 `consumed_by` 并用 `[[条目名]]` 与既有条目互链，召回命中时顺带提示同族条目——目标是渐进长出条目关系图，打破经验孤岛。

## 闭环的工程延伸

### 完整性体检: integrity-check 与 brain-integrity loop

召回-沉淀闭环跑久了会积累物理损耗: 条目里的绝对路径断链、机器迁移后的 `/Users` 路径残留、`[[wikilink]]` 悬空、索引与磁盘不对称。两道防线:

- **integrity-check**（REC-2 落地，部署于用户全局技能目录，非 flowkit 仓内）: 对「Markdown 条目 + `_index.json` 索引召回」型知识库做只读体检，四类检查，附近似名候选，**只报告不修复**（修复必须人工确认）。历史首跑曾抓出 60 处旧用户名路径残留
- **brain-integrity loop**（flowkit 仓内 `evals/loops/brain-integrity-loop.md`）: 把体检变成永续监守——launchd/手动触发，确定性脚本零 LLM 成本，报告落盘，只报新增断链不重报旧闻。契约里立了基线: experience 40 条目 / knowledge-base 44 条目零断链零残留（2026-09-10 立档快照）

它在 Loops 层 signal 登记总表里登记了一条边: 双库健康报告 → 读给「L1 召回置信」用（`evals/README.md:43-58`）——**库的健康度直接影响召回结果的可信度**，所以体检不是运维洁癖，是召回质量的一部分。

### 组合巡检: /ai-cycle

> 组合实战案例——部署于用户环境的个人技能，非 flowkit 内置。

闭环管「单库的读写健康」，/ai-cycle 把视野拉到**项目组合层**: 扫描多仓轻量信号（git/mtime/STATE），回答三个问题——哪个项目卡住了（为什么）/ 哪些经验散落在仓里没进知识库 / 知识库哪些条目过期了。

设计宪法的取向值得注意: **轻量信号巡检而非全量重析**（读各仓最后一条 commit、STATE 的 status/next_action/blockers 字段，而非重新分析整个仓）——成本可控才能永不停止，与 brain-integrity 的「no-op 是有效 run」同一哲学。

三个问题里有两个直接作用于本章闭环:

- **经验回捞扫描**（对照各仓 findings 与知识库，发现未沉淀的可复用模式，按 auto-skill 判断准则提议入库，用户确认后才写入; 每仓每月上限 1 次，巡检历史防重复回捞）——给沉淀端补一条**主动巡检通道**，不只等任务结束的被动沉淀
- **知识库条目过期检测**——把 REC-1 的陈旧度从「召回时被动提示」升级为「巡检时主动盘点」

这是 auto-skill 闭环在组合维度的一次外推实践: 同一套「读-判-写」结构，作用对象从「一个技能库」变成「一组项目的记忆面」。

### 混合检索实测: rag-lab

> [实测] 来源: 个人项目仓 `AIPrj/rag-lab`（非 flowkit 内置）——对 auto-skill 式「关键词密集短条目」库做的双臂检索评测，25 查询，复跑数字一致。

auto-skill 召回是纯关键词 + 索引，一个自然的质疑是: 该不该换成向量检索？rag-lab 用双臂实测回答:

| 臂 | hit@1 | hit@3 | MRR |
|---|---|---|---|
| BM25（纯 python，中文 char-bigram，k1=1.5 b=0.75） | 0.880 | 0.960 | 0.921 |
| ZAI embedding-3（2048 维，余弦相似） | 0.920 | 0.960 | **0.933** |

数据读法:

- **关键词检索没那么弱**: 语料的 keywords 行本身就是为召回设计的，BM25 天然吃这个红利，基线 hit@3 已 0.96
- **向量的增益有限且有代价**: hit@1 +4.0pp（25 查询里 1 个查询的差别），代价是 API 依赖、2048 维向量缓存（约 7MB）、语料指纹失效后全量重嵌; 而 BM25 零依赖、毫秒级
- **两臂 miss 集合几乎不相交**: embedding 赢在「意图词与 keywords 不同字面」（如「日报周报怎么自动生成」——字面无「三源聚合」，语义能对齐）; BM25 赢在「低频精确词 + 主题近形干扰」（如「cron 七天自动过期的坑」——「过期」是低频 token，idf 直接锁定唯一记录该教训的条目，向量反而被「cron」主题引力拉走）

**结论: 混合而非替换**——BM25 为主 + embedding 重排 top-10 的最小可行混合，让 rare-token 查询靠词法保底、意图查询靠语义拉齐。这个结论与下一节的理论差距直接呼应。

顺带一提这份评测自身的工程纪律: 语料指纹（文件清单+每文件块数哈希）绑定 embedding 缓存——语料更新则指纹变、自动重嵌，保证数字不漂移; 复跑第二次数字完全一致（缓存命中 286/286，API 调用 0 次）。**评测也要可复现**，这与第 1 章「幻觉完成」的防线是同一种洁癖。

## 理论视角: 四分层与评分公式（差距即提案）

hello-agents 教程（[HelloAgents](https://github.com/jjyaoao/helloagents) 第 8 章）从认知科学给出记忆系统的理论框架，对照 flowkit 的工程现状:

先给闭环一个理论座标: hello-agents 的「Agent 自进化四类闭环」里（内建上下文闭环 / 技能资产化闭环 / 外部监督群体智能闭环 / 参数代码工作流自修改），**auto-skill 属于第二类——技能资产化闭环**: 把每次任务的经验沉淀为可检索资产，下次直接复用。第 2 章的三板斧管「单次长任务的上下文接力」（近于第一类），本章闭环管「跨任务的能力积累」——两条轴正交。

**记忆四分层对照**:

| 理论分层 | flowkit 工程对应 | 落地程度 |
|---|---|---|
| Working（工作记忆） | 对话内缓存（last_keywords/topic_fingerprint） | 有，回合粒度 |
| Episodic（情景记忆） | experience 库（技能使用的踩坑实录） | 有，Evidence-backed |
| Semantic（语义记忆） | knowledge-base（通用流程/偏好/解法） | 有，分类索引 |
| Perceptual（感知记忆） | — | 无（不感知多模态环境） |

**检索评分公式对照**: 理论上的记忆检索按 `相关性(词法 0.7 + 关键词 0.3) × 时间衰减 × (0.8 + 重要性 × 0.4)` 加权排序。flowkit 现状是纯关键词 + 索引召回，逐项看:

- **时间衰减**: 无连续衰减函数，但有 REC-1 的 90 天陈旧度标注——时间维度以「二值横幅」的粗粒度形态存在（过期提示，不参与排序）
- **重要性加权**: 无。所有命中条目平权加载（「匹配到多少读多少，不做优先级排序」）
- **词法与关键词混合**: rag-lab 实测恰好印证了这个方向——词法（BM25）与语义（embedding）各有 miss 面，混合优于单臂，而 flowkit 目前只有关键词单臂

这些差距不是缺陷清单，是**改进提案的坐标系**: 时间衰减与重要性加权如何以 prompt 内规则的最小形态进入召回排序、混合检索如何落地——见[改进提案（REC）](../propositions.md)。

## 批判小节（局限与成本）

- **召回质量押注在 keywords 上**: 无时间衰减、无重要性加权、无语义兜底——一条经验命不命中，取决于写条目时 keywords 想得全不全; 且这是纯人工成本（每条经验都要人想「未来会用什么词找到它」），写歪了没有反馈信号（漏召回是静默的）。rag-lab 证明了这条路「不弱」，也证明了它的 miss 面（意图词查询）真实存在
- **REC-3 交叉授粉落地率为零**: 部署库的 experience 索引中 `consumed_by` 字段计数为 0（2026-09 结构统计）——机制写了，习惯未跟上，条目关系图还停留在设想
- **索引对称依赖纪律**: `_index.json` 与磁盘条目的双向一致靠写入纪律维持，integrity-check 的存在本身就是「写路径会漂」的自白——体检是补救，不是免疫
- **评测口径要诚实**: rag-lab 的 25 条查询由库作者本人拟写，可能偏乐观地贴近 keywords 用词; 实测数字支撑方向判断（混合优于替换），不支撑精确排名

## 本章源码锚点表

| 断言 | 锚点 |
|---|---|
| 核心循环五步（含对话内缓存与话题切换判定） | `skills/auto-skill/SKILL.md:12-102`（缓存 :38-46; 切换判定 :52-56） |
| Step 0.5 自举协议（首次触发自动加固全局规则） | `skills/auto-skill/SKILL.md:16-36` |
| 闭环管道锚点为 flow-deep 独有（flow 无召回/沉淀引用） | `skills/flow/SKILL.md` 全文（负向核实）; `skills/flow-deep/SKILL.md:55` |
| Stage -1 强制召回 + Relevant History 进 Goal Contract | `skills/flow-deep/SKILL.md:233-254` |
| Stage 5.8 验证后沉淀（DONE 触发 + 双库分流） | `skills/flow-deep/SKILL.md:654-677` |
| 记录判断准则（省时间判据 + 该记/不该记） | `skills/auto-skill/SKILL.md:105-138` |
| Evidence-backed 条目格式（Trigger/Observation/Outcome） | `skills/auto-skill/SKILL.md:141-176` |
| 陈旧度标注 REC-1（90 天过期不静默） | `skills/auto-skill/SKILL.md:66`; 条目字段约定 :143 |
| 交叉授粉 REC-3（consumed_by + 互链） | `skills/auto-skill/SKILL.md:94` |
| 双库分工与存储路径 | `skills/auto-skill/SKILL.md:180-186`; `README.md:31` |
| 隐私设计（仓库骨架 vs 本地个人数据） | `.gitignore:6-7`; `docs/deploy-new-device.md` 前置认知表 |
| brain-integrity loop（双库监守契约 + 40/44 条目基线） | `evals/loops/brain-integrity-loop.md`; `evals/README.md:43-58` |
| integrity-check 四类检查（REC-2，仓外部署） | `~/.claude/skills/integrity-check/SKILL.md`（用户全局技能目录） |
| rag-lab 双臂数据与「混合而非替换」结论 | `AIPrj/rag-lab/report.md`（[实测] 仓外个人项目） |

<nav class="fs-prevnext">
<a class="fs-nav-prev" href="#/principles/ch2-context-three-axes"><span class="fs-arrow">←</span> 上一章 · 长时程三板斧</a>
<a class="fs-nav-next" href="#/mechanisms/ch4-pipeline-overview">下一章 · 管道全景 <span class="fs-arrow">→</span><br><small>单章看关卡，全图看流转: 十二关 Stage 如何串成一条流水线，本章的召回与沉淀正是它的首尾两端。</small></a>
</nav>
