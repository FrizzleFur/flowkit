# 第 2 章 · 长时程三板斧——概念与工程的三对映

> **一句话机制**: 长任务会撞上 context rot——上下文越满质量越差; hello-agents 把解法归纳为「三板斧」（Compaction / 结构化笔记 / 子代理），而 flowkit 仓里早有三个机制在跑同样的活——本章给工程穿上概念的鞋，也用工程细节反过来检验概念。

## 怎么用（30 秒上手）

本章是原理篇，无可跑命令——用一张速查表代替体验。任务出现下列症状时，对号入座:

| 症状 | 理论名（hello-agents ch9.2.3） | flowkit 工程实现 | 一句话差异 |
|---|---|---|---|
| 上下文将满、任务还要跑很久 | **Compaction**（压缩接力） | **Auto Handoff**（75% 实测自动交接） | 不压缩对话历史，落盘结构化状态后换窗 |
| 关键信息散落对话历史、怕丢 | **Structured note-taking**（结构化笔记） | **planning-with-files**（.plan 三件套） | 笔记不是辅助习惯，是管道一等公民 |
| 调研要读海量材料、主上下文装不下 | **Sub-agents**（子代理凝练摘要） | **multi-agent**（分发 + tmux 分屏） | 摘要不是承诺是账单——逐项勾销分片清单 |

三者合称「长时程上下文工程」: 共同的敌人是 context rot，共同的思路是**不让上下文的历史长度等于任务的物理长度**。

想直接看机制的完整拆解（STATE.md 五字段、交接五件套逐项、检测脚本参数），跳[机制篇第 8 章](../mechanisms/ch8-context-engineering.md); 本章负责「为什么是这三个」的坐标系。

## 为什么：给工程穿上概念的鞋

### flowkit 有工程，无名分

[第 1 章](ch1-agent-loop-and-pipeline.md)讲了 FlowKit 怎么把裸循环升级成管道。但管道再好，也有一个绕不开的物理约束: **单会话的上下文窗口是有限的**。README 说得直白——「长任务最大的敌人是 context rot：上下文越满质量越差，直到 auto-compact 粗暴压缩或直接溢出」（[仓库 README](https://github.com/FrizzleFur/flowkit)）。

context rot 之所以发生，有两层原因。其一是**注意力稀释**: 上下文越长，早期指令与关键结论被中间大量工具输出冲淡，模型的「注意力预算」被摊薄，质量随长度下滑。其二是**自感失灵**: 模型自己感知不到上下文占了多少——它不知道自己「快满了」，也就无从谈起主动节省。这两层决定了三板斧的设计形态: 要么主动换窗（对映一）、要么把关键信息外置（对映二）、要么把消耗转移出去（对映三）。

flowkit 对这个问题有三个工程答案: Auto Handoff、planning-with-files、multi-agent。它们各自演进、各自有实测数据，但文档里一直没有一个统一的理论坐标系。直到对照 hello-agents 第 9 章的「长时程三板斧」才发现: **三个机制全都有理论对应物，只是没有名分**。

本章做的事就是三对映——每一对讲「同一问题的两种表述: 理论名分 vs 工程实现」。读法提示: 每对先看理论怎么定义问题，再看工程怎么落地，最后看两者在哪一点上分叉——分叉处往往是工程学到的、理论还没写的教训。

```
   同一敌人: context rot（上下文越满质量越差）

   ┌─ 压缩接力 ──── Compaction ←────→ Auto Handoff（75% 自动交接）
   │
   ├─ 结构化笔记 ─ Structured note-taking ←→ planning-with-files（.plan 三件套）
   │
   └─ 子代理隔离 ─ Sub-agents ←────→ multi-agent（分发 + tmux 分屏）
```

### 对映一: Compaction ↔ Auto Handoff——接力，但不靠压缩对话

**理论表述**: Compaction 的思路是「压缩接力」——上下文快满时，把对话历史压缩成摘要，用「摘要 + 关键任务状态」开一个新窗口继续工作。它解决的是「继续本会话」和「从头再来」之间的断层。

**工程表述**: flow-deep 的 Auto Handoff 走的是另一条路。触发依据是 `scripts/check_context.py` 从会话 transcript 读到的 API usage 真值（脚本头注释原话: 「取 mtime 最新的 transcript 的最后一条 usage，四项之和即当前 context 占用 token 数……这是 Claude Code 自身汇报的准确值，非估算」）。armed 状态下实测到 75% 即执行完整交接: 五件套 + HANDOFF.md 落盘，tmux 新窗口 spawn 续接会话，旧会话输出移交报告后收尾（`skills/flow-deep/references/context-management.md:178` 起）。

两个关键差异，让 Auto Handoff 不是教科书式的 Compaction:

1. **交接物不是「压缩后的历史」，是「预先结构化的状态」**。HANDOFF.md 的模板注释写明设计原则: 「不复制五件套内容，只引导新 agent 按序去读——重复内容会随进度过期，路径引用不会」（`skills/flow-deep/references/context-management.md:221`）。理论版 Compaction 靠模型现场摘要（事后、有损）; 工程版把任务状态在演进过程中**持续**结构化落盘，交接时只递一份「读什么、从哪继续」的指引——这是对「摘要必有损」的一个工程回答。
2. **触发不靠模型自感，靠脚本实测**。flow-deep 的容量检测注释直接点破: 「模型无法自感 context 占用，必须脚本实测」（`skills/flow-deep/SKILL.md`「上下文管理」节）。这就是为什么阈值表能精确分层: 70% 未 armed 弹窗四选项、75% armed 自动交接——「75% 留出写文件与 spawn 的余量; auto-compact 在窗口边界才触发，本协议始终跑在它前面」。

整个交接在四个时间点上接力:

```
  旧会话                                     新会话
  ───────                                    ───────
  ① 75% 实测（Stage/Phase 边界）
        │
  ② 五件套 + HANDOFF.md 落盘
        │
  ③ tmux new-window spawn ──────────────▶  ④ HANDOFF.md 即初始 prompt
     输出移交报告后收尾                        按序读 STATE.md 等三件套
     （会话不自杀，旧窗口                        从 Next Action 精确恢复
      由用户手动关闭）
```

「会话不自杀」这个细节值得停留一下: Claude Code 没有安全自终止机制，所以旧会话的动作边界是「停止接收新任务 + 输出移交报告」，关闭旧窗口是用户的动作。工程协议对平台能力的边界要诚实到这个粒度。

容量检测的完整阈值分层（`skills/flow-deep/SKILL.md:157-174` 原表）:

| 检查点 | 阈值 | 动作 |
|--------|------|---------|
| Stage / Phase 边界（脚本实测） | > 70% | 弹窗四选项: 保存并继续 / 保存并交接 / 跳过 / 交接并记住自动 |
| Stage 2 后 | > 65% | 压缩 ST 输出为摘要 |
| Stage 3.7 后 | > 70% | 压缩代码级计划为 agent_hint 摘要 |
| Stage 4 每个 agent 后 | > 75% | 压缩中间结果 |
| 任意时刻 | > 85% | 警告用户，建议 `/compact` |

表里藏着分级哲学: 越往后（越接近执行与验证）的中间产物，容忍的占用阈值越高——因为越后面的内容离任务收尾越近，值得为它多忍一忍; 而边界点上的 70% 弹窗永远先于压缩发生，把「换不换窗」的选择权留给用户。

补一手: 狭义的 Compaction 在 flowkit 里也有对应物——**压缩矩阵**（Stage 2 输出压 70%、Stage 3.7 压 90%、Stage 4 中间结果压 85%，各有摘要模板，`context-management.md:264` 起）。两级策略的分工是: **弹窗决策先于压缩**——先问「要不要换窗（交接）」，用户选不换才按矩阵压缩续命。交接是「换一扇新窗」，压缩是「把现有窗户擦干净一点」，前者是长任务的主动选择，后者是继续本会话的兜底手段。

**交接的完整动作**（保存动作清单，`context-management.md:170` 起）: ① 更新 STATE.md（Next Action 必须具体可执行、不依赖读其他文件）; ② 更新 progress.md（完成项 + 证据路径）; ③ 更新 task_plan.md（Phase 状态标记）; ④ 刷新 findings.md 关键决策区，保证新会话单读文件即可还原决策脉络; ⑤ 若 Goal Contract 存在，核对 Success Criteria 与实际进度同步。注意这份清单本身就是「结构化笔记」——第一板斧的交接物，正是第二板斧的产物。

**接力的另一半: 恢复协议**（`context-management.md:103-115`）。新会话读 STATE.md 后不是无脑续跑，而是按中断 Stage 分路径恢复——因为**不同 Stage 对上下文的依赖度不同**:

| 中断位置 | 恢复动作 | 理由 |
|---|---|---|
| Stage 0-2 | 从该 Stage 重做 | 这些阶段快速且依赖思考上下文，文件里没有存档 |
| Stage 3 | 重新规划 | 规划依赖思考上下文 |
| Stage 4 | 从 Phase Progress 继续 | 执行结果已 git commit，文件有账 |
| Stage 5 | 直接重新验证 | 重跑验证比恢复验证现场便宜 |

这张表是「结构化笔记解决不了一切」的诚实承认: 笔记只能存住**结果**，存不住**思考过程本身**——所以恢复协议的智慧在于按「哪里还剩上下文」分流，而不是假装文件能还原一切。

护栏也值得记: `--handoff-max` 默认 3 代防无限接力环; 检测脚本自身失败（exit 2）时静默降级回压缩矩阵——「检测工具自身不能成为单点故障」。

### 对映二: 结构化笔记 ↔ planning-with-files——笔记是管道的一等公民

**理论表述**: Structured note-taking 的思路是——与其让关键信息淹在滚动的对话历史里，不如写成结构化笔记（文件），要用时读入、平时只占一个路径。上下文里常驻的是「指针」，不是「全文」。

**工程表述**: 这就是 planning-with-files 的 .plan 三件套——`task_plan.md`（任务与 Phase 定义）、`findings.md`（关键决策与研究结论）、`progress.md`（进度日志），外加 STATE.md 活记忆。它不是可选的好习惯，而是**管道的一个 Stage**: 双引擎的依赖矩阵里写着同一行「planning-with-files | Skill | Stage 3: 任务规划」（`skills/flow/SKILL.md:66`; `skills/flow-deep/SKILL.md:59`）。四份文件各司其职:

| 文件 | 职责 | 读它的时机 |
|---|---|---|
| STATE.md | 活记忆（< 80 行）: 位置、进度、Next Action | 恢复时第一个读 |
| task_plan.md | 任务拆解与 Phase 完成标准 | 恢复后定「接下来做什么」 |
| findings.md | 关键决策与 Plan/Panel Review 结论 | 还原「为什么这么做」 |
| progress.md | 逐阶段完成项与证据 | 核对「做到了哪一步」 |

STATE.md 的核心字段长这样（中文化节选，原文见 `context-management.md:41` 起的模板）:

```markdown
## Task Reference
Run ID: flow-deep-[YYYYMMDD-HHMM]-[slug]   # 唯一运行标识
Task: [任务表述]

## Current Position
Stage: [0-5 / completed]
Phase: [current-phase-id / null]
Progress: [N/M phases done, ~X%]

## Session Continuity
Stopped At: [最后的可执行动作]
Next Action: [具体、可立即执行、不依赖读其他文件]
Auto Handoff: [enabled / disabled]  # 交接偏好，跨代继承
```

注意 `Next Action` 的写法约束——「具体可执行、不依赖读其他文件」。这是笔记写手的同理心: 接手的新会话第一眼里最需要的东西，放在最显眼的地方，且零跳转即可动手。

工程版比理论版多出的四件事:

1. **大小纪律**: STATE.md 活记忆被硬性约束在 < 80 行（`skills/flow-deep/references/context-management.md:31`）——「读取一次即知当前位置」。超线时有明确的裁剪规则: Decisions Log 只保留最近 5 条（完整记录在 findings.md）、Blockers 只保留活跃项、Phase Progress 改用表格。原则一句话: 「STATE.md 是摘要，不是详细档案，详细信息引用其他三件」。笔记若无限膨胀，自己就会变成新的上下文负担——理论版笔记没有这条防线。
2. **更新节奏**: STATE.md 不是「想起来才写」，而是绑在管道边界上——Stage 3 完成才首次创建（之前不建文件，因为那几个阶段靠重做更快）、Stage 4 每个 Phase 完成更新、中断时必写 Next Action（`context-management.md:88` 起的更新规则表）。写入时机与管道生命周期咬合，笔记才不会烂。
3. **命名空间**: 多 feature 并行时用 `.plan-feat-<name>/` 目录隔离，flow-deep 启动时会主动检测并询问本次属于哪个 feature（`skills/flow-deep/SKILL.md:196`）。Run ID 借鉴 OpenTelemetry 的 `workflow.run_id` 语义——笔记不止记「做了什么」，还记「这是哪次运行做的」，运行实例可追溯。
4. **与对映一的咬合**: STATE.md 解决「断了怎么接」，Auto Handoff 解决「在最佳时机主动断」（README 原话）——结构化笔记正是接力时递出去的信物，HANDOFF.md 的「必读文件」清单第一条就是 STATE.md。两板斧不是并列关系，是一条链。

**诚实标注**: planning-with-files 是**同源生态 skill**——上游私有 skills 仓库所有，本仓库未收录其源码（README Pipeline 图注原话，`README.md:17`）。本仓锚定它的位置有两处: README「Pipeline 架构总览」图中的 Stage 3 节点，与上述双引擎依赖矩阵。

### 对映三: 子代理隔离 ↔ multi-agent——摘要是账单，不是承诺

**理论表述**: Sub-agents 的思路是「上下文防火墙」——把「大量读、大量试错」的子任务交给隔离子代理的独立上下文去做，烧的是子代理的窗口; 主上下文只收回一份凝练摘要（hello-agents 给出的约定是 1000-2000 token 量级）。

**工程表述**: multi-agent skill 用 `Agent(name=...)` + `SendMessage` 工具链分发团队，在 tmux 中自动获得分屏可视化，无 tmux 时静默降级为无分屏并发（`skills/multi-agent/SKILL.md` frontmatter）。分发前先过**风险路由**: 只读/低风险任务走 Fast Path（分片后直接分发），写入任务走完整方案确认（含 worktree 隔离选项——写入型子任务在独立工作区改码，避免踩踏主仓）。子代理读五十个文件，主会话只进一份摘要——防火墙语义一致。

顺带一个有意思的对照: hello-agents 给凝练摘要的约定量级是 1000-2000 token; flowkit 生态的实践更紧（本教程站的写作任务，各子 agent 返回即被要求 ≤ 350 token）。工程实践把「凝练」压得更狠，因为主会话的预算要留给裁决，不是留给转述。

工程版比理论版多出的两道关卡:

1. **验收——汇总核对（nothing gets missed）**: 凝练摘要在这里不是「信不信」的问题，而是对账——「每个 agent 返回后逐项勾销分片清单; 分片未覆盖或证据不足 → SendMessage 补查该分片，全部勾销才算完成」（`skills/multi-agent/SKILL.md:64`）。理论版的摘要是一份承诺; 工程版的摘要是一张要逐项核销的账单。这其实是 [第 1 章](ch1-agent-loop-and-pipeline.md)「无新鲜证据不宣布完成」铁律在子代理场景的同款应用。
2. **预算——并发公式**: 隔离不是免费的。有效并发 = 主会话（恒占 1 路）+ 运行中 subagent 数 + 其他活跃 Claude 会话数; subagent 同消息分发默认 ≤ 3（`skills/multi-agent/SKILL.md:155`）。这个公式由实测教训钉死: 6 并发触发 429（2026-08-21），4 并发加主会话持续工具调用同样触限（2026-08-24）。理论版讲隔离的收益，工程版必须同时管隔离的成本——预算公式就是隔离机制在真实 API 配额世界里的影子。

至于 tmux 分屏: 它解决的是隔离的副作用——子代理上下文看不见，执行就成黑箱。named agent 自动分得真进程真交互的 pane（工具调用与回传实时可观察），且 pane 故障只降级不阻塞（「tmux 只是可视化增强，不是能力前提」）。**隔离管上下文，分屏管信任**，两件事一个 skill 里各管各的。

### 三板斧怎么选: 取舍法则

三对映看完，回到开头的速查表——选择逻辑其实只有一个问题: **「这段上下文还需要吗? 需要以什么形态存在?」**

1. **任务还要跑很久、历史已经没用了** → 换窗（Auto Handoff）。历史的边际价值递减，但任务状态必须无损传递——所以交接物是结构化文件而非对话摘要。
2. **历史里有关键结论、以后还要反复引用** → 外置（planning-with-files 三件套）。把结论从「对话流」搬进「文件库」，上下文里只留路径指针。
3. **即将产生大量中间产物、但主上下文只需要结论** → 转移（multi-agent 子代理）。消耗发生在别人家窗口里，主上下文只收账单。

三条法则对应上下文的三种处置: **丢弃并接力 / 归档并引用 / 外包并验收**。实际长任务里三板斧是接力使用的，以本教程站的搭建流程为例:

1. **外包并验收**——三章写作任务分发给三个并行 subagent，每个 agent 只读自己需要的仓库文件与笔记（消耗在子上下文烧掉），返回带锚点的浓缩报告; 主会话逐项勾销分片清单
2. **归档并引用**——调研结论与章节任务书写进 `.plan-feat-site/` 的三件套（task_plan.md 管十一章总账、findings.md 存三路侦察笔记、progress.md 记批次进度），上下文里常驻的只是「去看哪个文件」的指针
3. **丢弃并接力**——会话跨过 75% 实测线时 Auto Handoff 换窗，新会话从 HANDOFF.md 进场、按序读 STATE.md 从 Next Action 恢复，写作不中断

三个机制在同一个任务里前后咬合: 子代理的结论落进笔记，笔记成为交接的信物，交接让分发得以继续。这就是「长时程上下文工程」作为统一上位词的含义——三板斧不是三个孤立技巧，是同一条预算管理链上的三段。

## 批判小节（局限与成本）

- **名分是事后赋予的**: 三个机制落地时并没有参照这套理论命名——对映是解释工具，不是设计依据。对映也不严丝合缝: Auto Handoff 不做对话摘要（狭义 Compaction 对应的是压缩矩阵），它更像「结构化笔记 + 接力」的组合拳; 把它硬套进 Compaction 格子，是教学方便而非架构事实。
- **三板斧都有成本**: 接力有代际上限（默认 3 代）——上限的存在本身就说明交接有损耗，不能无限续; 笔记需要每个 Stage/Phase 边界持续维护（STATE.md 更新规则），纪律断了对映一就失去信物; 子代理有协调开销与 429 预算，分屏本身也占系统资源。
- **理论侧仍有未吸收物**: hello-agents 的 GSSC 流水线（Gather→Select→Structure→Compress）与 ContextPacket 统一抽象（信息包带 relevance/timestamp/token_count 元数据）——Auto Handoff 的五件套是手工定义的交接物，尚无统一 packet 抽象与选择评分。这是机制篇[第 8 章](../mechanisms/ch8-context-engineering.md)深读时的改进输入，不是已经解决的问题。
- **对映本身有粒度损失**: 「三对映」强调相似性，代价是压缩了每个机制的个性——例如 multi-agent 的风险路由、worktree 隔离、429 退避这些细节在「子代理」概念格子里放不下。理论名分是入口不是全貌，读机制的实现细节，仍要回到源码锚点表。

## 本章源码锚点表

| 断言 | 锚点 |
|---|---|
| Auto Handoff 协议（75% 实测触发/tmux spawn/防失控护栏） | `skills/flow-deep/references/context-management.md:178` 起 |
| HANDOFF.md「不复制内容只引用路径」设计原则 | `skills/flow-deep/references/context-management.md:221` |
| 交接保存动作清单（五步，选项 a/b 分工） | `skills/flow-deep/references/context-management.md:170` |
| 恢复协议按中断 Stage 分路径 | `skills/flow-deep/references/context-management.md:103-115` |
| STATE.md 更新规则表（绑管道边界） | `skills/flow-deep/references/context-management.md:88` 起 |
| 压缩矩阵（Stage 2/3.7/4 分级压缩率与模板） | `skills/flow-deep/references/context-management.md:264` 起 |
| check_context.py 真值原理（transcript usage 非估算） | `skills/flow-deep/scripts/check_context.py:1-6` 头注释 |
| Context Guard 阈值分层与「模型无法自感」论断 | `skills/flow-deep/SKILL.md`「上下文管理」节（:157-174） |
| STATE.md 活记忆（< 80 行/Run ID/恢复锚点） | `skills/flow-deep/references/context-management.md:31`; `README.md`「STATE.md」节 |
| planning-with-files 依赖位（Stage 3: 任务规划） | `skills/flow/SKILL.md:66`; `skills/flow-deep/SKILL.md:59` |
| 多 feature 命名空间（.plan-feat-*/ 检测） | `skills/flow-deep/SKILL.md:196` |
| 「同源生态 skill，本仓未收录源码」标注 | `README.md:17`（Pipeline 架构总览图注） |
| 汇总核对（分片逐项勾销验收） | `skills/multi-agent/SKILL.md:64` |
| 并发预算公式（1 + subagent + 其他会话，默认 ≤ 3） | `skills/multi-agent/SKILL.md:155` |
| tmux 分屏 named-only 与静默降级 | `skills/multi-agent/SKILL.md:258-284`; frontmatter（:5） |
| Auto Handoff 通俗图解与四设计点 | `README.md`「Auto Handoff」节（:142-163） |

> 下一章: [记忆与召回闭环](ch3-memory-loop.md)——三板斧管的是单次长任务; 跨会话的经验怎么存、怎么召回，是 auto-skill 的闭环故事。
