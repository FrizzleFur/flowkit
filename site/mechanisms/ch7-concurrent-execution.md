# 第 7 章 · 并发执行：multi-agent 的分片与治理

> **机制篇 · 第 7 章** · E · 执行与并发

*Parallel by Design, Budget by Default*

`27 anchors` · `248 行` · 组件 `budget` 计算器 + `replay`×4（budget 9 / routing 7 / shards 10 / panes 8）· 约 30 分钟

<div class="fs-callout">

**一句话机制**: 并发执行不是「多开几个 Agent」，是一套带预算的执行模型——主会话只当 Coordinator，任务切成互斥完备的分片，按并发预算分批派给命名 Agent，完成一个验收一个回收一个; 预算被 429 实测钉死，超了就限流给你看。

**机制定位**: Stage 4 Execution Router 的 multi-agent 后端——执行模型四要素，加一条被 429 实测钉死的并发预算线。

</div>

### 计算器与液位计: 并发预算的两种读法

<div class="fs-budget"></div>

把数字变成液位——同一套预算规则的另一种读法，看液面从 1 爬到安全顶格 3、在红旗处碰 4 临界、429 落地骤降回 2、再退避恢复稳 3 的全过程（点击播放，9 步自动演示）:

<div class="fs-replay" data-script="assets/scripts/ch7-budget.json"></div>

**液面碰 4 的瞬间就是限流的瞬间。**

**步 ↔ 机制对照**: 步 1-3 液面爬到 3 ↔ 有效并发公式（主会话 1 + 运行中 subagent + 其他活跃会话）与 ≤3 安全档; 步 4 满配碰 4 ↔ 「1 主 + 3 sub 已是 4」的危险临界——实测 4 并发 + 主会话触发 429 的那条线; 步 5-6 骤降回 2 与退避窗口 ↔ 处置三步（暂停分发 / 主 Agent 接管关键路径 / 退避恢复）; 步 7-9 恢复爬升稳 3 ↔ 退避间隔后回到安全顶格，「预算是液位不是配额」即计算器三档判定的读表结论。

## 怎么用（30 秒上手）

- 说一句话就能触发: 「fan out subagents」「派团队深挖」「每个都深挖、别漏掉任何东西」——只读任务走 Fast Path 直接分发（`skills/multi-agent/SKILL.md:40-50`）
- 在 flow-deep 里不用手动调: Stage 4 Execution Router 判断「2+ 独立子任务」才选 multi-agent 后端，单文件任务直接串行（`skills/flow-deep/SKILL.md:487-505`）
- 想调规模: 档位表 small(1-2) / medium(3，默认) / large(>3 必须分批每批 ≤3)（`skills/multi-agent/SKILL.md:142-150`）
- 写入型任务（改代码/改配置）自动走 Full Path: Step 0-5 完整流程，协作式方案经用户确认后才分发（`skills/multi-agent/SKILL.md:47-50`）
- 上面的计算器就是本章主角之一: 拖动数字，看有效并发怎么被三路计数吃掉、什么时候变红

## 为什么：执行模型的四要素

先把全景摆正。multi-agent 的执行模型可以拆成四个要素，加一条贯穿的预算线:

```
┌──────────────────────────────────────────────────────────────┐
│                     主会话 = Coordinator                      │
│         分配 · 追踪 · 协调 · 汇总（不写业务代码）              │
└──────┬───────────────┬───────────────┬───────────────┬───────┘
       │ ①分发          │ ②分片          │ ③批次          │ ④验收
       ▼               ▼               ▼               ▼
  Agent(name)      互斥且完备       同消息 ≤3        逐项勾销
  tmux 自动分屏    按信息源/独立    前批 60% 滚动    完成即总结即收
  (NO_TMUX 静默     性切分          补发下批         TaskStop 收本体
   降级无分屏)
       └───────────────┴───────┬───────┴───────────────┘
                             ▼
          并发预算 = 主会话(恒 1) + 运行中 subagent + 其他活跃会话
                     （429/1302 实测钉顶，超了全员限流）
```

下面逐要素讲透: 为什么这样设计、防什么病、踩过什么坑。但四要素之前还有一个前置动作——路由。

### 先路由: 一句话委托不做方案评审

用户说「fan out subagents」「派团队深挖」这类一句话委托时，期待的是**立刻派出**，不是先看一份方案评审。所以 multi-agent 分发前先做一次风险路由（`skills/multi-agent/SKILL.md:40-50`）:

| 通道 | 适用 | 流程 |
|---|---|---|
| Fast Path | 只读/低风险: 调研、信息收集、代码审查、多源比对 | 轻量上下文 → 分片 → 一行预告（告知式）→ 直接分批分发 → 清单核对 |
| Full Path | 写入/高风险: 写代码、改配置、跨系统重构 | Step 0-5 完整流程（项目上下文 → 角色匹配 → 协作式方案 + 用户确认 → 执行） |

路由的判定标准是**任务性质**（只读 vs 写入），不是触发词本身——同一句 "fan out subagents"，对调研任务是 Fast Path，对改代码任务是 Full Path。和 tmux 检测一样，路由判定也要求显式锚点: 分发前在回复中写出 `路由判定: 只读 → Fast Path`，未判定就分发属于流程违规（`skills/multi-agent/SKILL.md:44-46`）。

下面的演示把这条岔路画了出来——任务先过复杂度闸门，再决定走轻量管道还是全量管道:

<div class="fs-replay" data-script="assets/scripts/ch7-routing.json"></div>

**判定标准是任务性质（可回滚 vs 重要/不可逆），不是触发词——两条分支是同一条管道的两种裁剪，命令只差几个参数，差的全是防错关卡。**

**步 ↔ 机制对照**: 步 2 闸门判定 ↔ 「任务性质（只读 vs 写入）而非触发词」的判定标准; 步 3-4 小改滑入 flow、大工程滑入 flow-deep ↔ Fast Path / Full Path 两条通路; 步 5-6 两条分支的内部形态 ↔ flow 的轻量站与 flow-deep 的强制关; 步 7 汇合 ↔ 同一条管道的两种裁剪。

Fast Path 省的是流程摩擦，**不是安全预算**: 六步里预信任照样跑、并发照样 ≤3、429 退避规则同样生效（`skills/multi-agent/SKILL.md:52-65`）。它省掉的是 Step 0 全扫描——项目规范以「必读路径」写进 Agent prompt，让 agent 自己读 CLAUDE.md，主 Agent 不预读全文; 方案只做一行告知式预告，不阻塞等确认:

```
分片分发: [A 模块调研] [B 数据源核对] [C 历史提交考古] → 3 agent 单批（并发 ≤3）
```

预告为什么是告知式而不阻塞？因为 fan-out 场景里用户用一句话交出的就是全部分片授权——再逐项确认方案，等于把 Fast Path 拖回 Full Path。但这条优惠只发给只读任务: 读取错了顶多多读一遍，写错了要回滚。写入型任务必须过完整的方案确认，这就是「任务性质」而非「触发词」做判定标准的深层原因。

### 要素一 · 分发形态: 命名 Agent 与 tmux 分屏

**named-only 原则**（2026-08-31 用户裁定）: tmux 内一律用 `Agent(name=...)` 命名分发——harness 自动给命名 agent 分配 pane，且 pane 是**独立 Claude Code 进程、真交互 UI**: 工具调用实时滚动，零脚本零解析成本（`skills/multi-agent/SKILL.md:258-262`）。

这条原则是用一次退役换来的。旧版为 unnamed 异步 agent 定制了一套「观察窗体系」（spawn-pane.sh / watch-agent.sh / reap-panes.sh）——本质是 tail transcript 的二手摘要，生命周期管理复杂度高、价值却低。2026-08-31 整体退役，脚本留存备查但主流程不再引用（`skills/multi-agent/SKILL.md:276`）。教训一句话: **可视化要挂在真进程上，不要为二手摘要造基础设施**。

两个容易被忽略的工程细节:

- **pane 几何约束**: 单窗 pane ≥4 时每个都很窄（实测 6 pane 每行仅约 14 字符）——pane 只是过程可视化，**主会话总结才是主要信息通道**（`skills/multi-agent/SKILL.md:264`）。这直接决定了后文「完成即总结即收」纪律的物理依据。
- **tmux 两级检测**: ①`[ -n "$TMUX" ]`; ②为空时沿 PPID 祖先链找 tmux 进程。第二级存在是因为 background job 会丢 `$TMUX`——「变量为空」不等于「不在 tmux」（2026-08-24 实测; 2026-08-28 又修掉了 list-panes 探测在「有 server 但不在 tmux」会话里的误判）（`skills/multi-agent/SKILL.md:106`）。

检测后必须在回复中**显式写出判定行**（`执行模式判定: IN_TMUX → tmux-split` 或 `NO_TMUX → no-split`）才能分发——**跳过检测 ≠ NO_TMUX**，未判定就按降级启动属于流程违规。这条规则的出身是 2026-08-21 的一次实测踩坑: 跳过检测直接降级启动两个审计 agent，分屏可观察性丢失且启动后不可逆（`skills/multi-agent/SKILL.md:217-228`; `skills/flow/references/agent-dispatch.md:5-11`）。

不在 tmux 怎么办？**静默降级**为无分屏并发——不提示安装、不要求重试，Delegate 协议与规模档位全部照旧。设计立场: tmux 是可视化增强，不是能力前提（`skills/multi-agent/SKILL.md:280-290`）。

### 要素二 · 角色分工: 主会话是 Coordinator 不是 Implementor

Delegate 模式一句话: 主 Agent 的职责是任务分配、进度追踪、依赖协调、结果汇总; **禁止**自己写业务代码、绕过 TaskList 直接操作文件、抢占编辑同一文件（`skills/multi-agent/SKILL.md:317-329`）。

为什么这么严？因为主会话一旦下场写代码，就同时失去两样东西: 协调者的全局视野（谁卡了、谁该续派看不见了），和仲裁者的中立性（自己和 Agent 改同一文件，冲突矩阵直接失效）。Agent 间交接因此全部经由主会话中转——文件交接要主 Agent 确认，TaskList 交接靠状态检测，SendMessage 承担即时协调。

并行必然有冲突，所以有预案。冲突解决矩阵覆盖五类: 文件冲突（主 Agent 审差异选版本）、设计冲突（主 Agent 裁决并通知适配）、依赖冲突（重新排序）、进度阻塞（重试或降级）、崩溃循环（单 agent 连续 2 次崩溃 → 主 Agent 串行接管，不再重生）（`skills/multi-agent/SKILL.md:346-354`）。

「完成即收」还有一个例外通道——**多阶段续接裁决门**: Phase 间复用空闲 agent 可省重建开销，但必须先过裁决门，避免与完成即收纪律打架。已确认还有下阶段任务 → 完成通知到达时不收本体，SendMessage 续派复用原 pane; 确认不复用 → 立即 TaskStop（`skills/multi-agent/SKILL.md:330-344`）。绝对禁止两条: 不管已有 pane 直接新建（面板越开越多），或全部 TaskStop 再重建（浪费资源）。

### 要素三 · 分片策略: 互斥完备 + digs deep

fan-out 的验收口号是 **nothing missed**，而它的前提在分发之前: 把任务分解为**互斥且完备**的分片——按模块 / 数据源 / 风险维度 / 文件区间切，显式列出分片清单。理由是条铁逻辑: **分片有遗漏，汇总必有遗漏**（`skills/multi-agent/SKILL.md:57`）。切分依据是信息源与独立性: 两个子任务读不同的源、互不依赖，才能并行; 有依赖就得进同一片或排先后。

每个 fan-out Agent 的 prompt 里写死 **digs deep 三要点**（`skills/multi-agent/SKILL.md:67-73`）:

| 要点 | 内容 | 防什么 |
|---|---|---|
| 穷尽分片 | 扫描分片内全部对象，不抽样; 分片外线索报告不展开 | 抽样调查伪装成全面扫描 |
| 证据锚点 | 结论必须带 file:line / URL / 数据出处，无锚点显式标「推测」 | 无依据断言混进汇总 |
| 深挖优先 | 宁可单个问题挖到根因，不要广而浅的清单 | 清单式伪交付 |

汇总侧的验收落点是**逐项勾销**: 每个 agent 返回后对照分片清单逐项核对，未覆盖或证据不足 → SendMessage 补查该分片，全部勾销才算完成（`skills/multi-agent/SKILL.md` Fast Path 清单「汇总核对」条目，:64-65——该清单存在重复编号残留，引用按条目内容定位，勿按序号）。顺带一提，digs deep 三要点在 SKILL.md 里有两份内嵌副本，2026-08-28 审查专门标记了「改一处须同步另一处」的双份漂移风险——多副本问题在本仓无处不在，本章末尾还会回到它。

### 分片勾销: 一次 fan-out 的完整生命周期

先动手看——三张分片卡怎么从「待分派」走到「已验收勾销」，中间那张撞了 429 的卡又怎么被主会话接管救回来（点击播放，10 步自动演示）:

<div class="fs-replay" data-script="assets/scripts/ch7-shards.json"></div>

注意左列那张「验收清单」卡：它从分发前就钉在那里——分片清单即验收清单，nothing missed 不是汇总时才想起来核对，是清单从第一步就挂在泳道里，等三张分片卡逐张走来被勾销。

**步 ↔ 机制对照**: 步 1 母任务拆片 ↔ 互斥且完备切分（分片有遗漏，汇总必有遗漏）; 步 3 与步 8 勾销 ↔ 逐项勾销纪律; 步 4-5 撞 429 与接管重派 ↔ fallback 预案（主 Agent 接管关键路径）; 步 6 滚动补发 ↔ 前批 ≥60% 滚动补发规则; 步 9-10 汇总验收全勾销 ↔ nothing missed 的验收落点。

写入型分发还有两道前置。**预信任 cwd**: named agent 的 pane 是独立 claude 进程，启动时对 cwd 做 workspace trust 检查，未信任路径会弹「Yes, I trust this folder」阻塞等待——N 个 agent 卡 N 个 pane（2026-09-01 FDNote worktree 实测）。派发前必跑 `pretrust-cwd.sh`，出口输出必须出现在回复里（三个合法出口，回复里找不到任何出口输出即为违规）（`skills/multi-agent/SKILL.md:229-256`）。**权限与作用域自检**: 派发会写文件的 agent 前扫描写入作用域（additionalDirectories 之外的路径先处理再派发）、确认权限模式——后台 subagent 的授权等待没有面板提示，比弹给主会话更难发现（`skills/flow-deep/SKILL.md:526-533`）。

Agent prompt 本身有六段模板: 任务 / 项目上下文 / 文件边界（可编辑 / 只读 / 禁止三列）/ 接口约定 / 深度要求 / 完成标准（`skills/multi-agent/SKILL.md:356-384`）——分片边界与验收标准在派发那一刻就写死，不靠事后追认。

### 要素四 · 批次调度与生命周期: 不让批次空转

large 档（>3 agent）的调度规则是**滚动补发**: 必须分批、每批 ≤3，**前批完成 ≥60% 即可发下批**，不必等整批收齐; 单 agent 失败自动重试（`skills/multi-agent/SKILL.md:150`）。配合「完成即收」纪律，单个 agent 完成的瞬间预算就被释放——批次是滚动的流水线，不是齐进齐出的闸门。

**完成即总结即收**（强制纪律，2026-08-31 用户写死）: 每个命名 agent 的完成通知到达时，立即依次执行，不得攒批拖延、不得为看 pane 效果挂机不收（`skills/multi-agent/SKILL.md:266-274`）:

1. **主会话总结该 agent 进度**——成果验收（结论 / 改动文件 / 是否越界），不允许「完成了但主会话无声无息」
2. **`TaskStop(name)` 收 agent 本体**——pane 随之自动回收。teammate 完成后进程常驻 mailbox 不退出，「任务完成」不等于「pane 会自己关」; 跳过这步就 pane 泄漏（实测 dev:1.2/1.3 挂了 7 分钟无人收）
3. **`tmux list-panes` 验证 pane 消失**

这条纪律的坑深在「不收也没人报错」: agent 完成后静默 idle，pane 挂着，任务看似照常推进——直到 pane 越积越多。且它不因通道而豁免——Fast Path 的路由表里写明「named agent 收尾同样执行『完成即总结即收』纪律」（`skills/multi-agent/SKILL.md:49`）: 省流程摩擦的通道，不省生命周期管理。

清理因此做成三层: 即时清理（completed 且不复用 → TaskStop）/ Phase 间孤儿清理 / 全局清理（全部完成 → TaskStop 全部本体 → 倒序 kill pane），适用范围明确覆盖 **Stage 0-5 全部分发点**——含 Stage 3.5 plan-reviewer、Stage 3.6 面板这类评审型 agent，非仅 Stage 4 执行 agent。这一条适用范围的扩展本身有实测血案: panel 五席评审返回后 idle 未清——规则原来挂在 Stage 4 语境 + 「kill pane」措辞掩盖了 agent 本体清理，两因叠加未触发（`skills/flow-deep/SKILL.md:554-562`）。

把泄漏全程做成动画——正是 panel 五席评审的真实剧本: 五席 spawn、三席返回后 idle 无人收、pane 挂进泄漏带、巡检发现后逐席 TaskStop 救回:

<div class="fs-replay" data-script="assets/scripts/ch7-panes.json"></div>

**泄漏不是报错，是静默——不收没人报错，任务看似照常推进，pane 越积越多; 治理动作也只有那一句「验收即收，不攒批拖延」。看最后一步的对照: 后返回的两席随到随收，存活归零、回收 5、泄漏带清空——zero-leak 不是运气，是纪律执行的体感。**

**步 ↔ 机制对照**: 步 3 评审返回 idle ↔ 「完成 ≠ pane 会自己关」（teammate 完成后常驻 mailbox 不退出）; 步 4-5 泄漏与巡检 ↔ `tmux list-panes` 验证与 7 分钟无人收实测; 步 6-8 逐席 TaskStop 到存活归零 ↔ 完成即总结即收三步与三层清理（panel 五席教训）。

Phase 之间还有 **Spot-check 三项**快速确认: 报告的文件是否存在、`git log` 是否有新提交、测试是否通过——Agent 的「我做完了」要快速核对（`skills/flow-deep/SKILL.md:545-552`）。

### 并发预算与 429 防护

回到章首的计算器。**有效并发 = 主会话（恒占 1 路）+ 运行中 subagent 数 + 其他活跃 Claude 会话数**（`skills/multi-agent/SKILL.md:153-158`; `skills/flow-deep/SKILL.md:507`）。

注意两个容易混淆的计数口径: 「同一条消息并发 agent ≤3」数的是 **subagent 分发数**; 「有效并发」数的是**全部在跑的请求方**。默认满配（1 主 + 3 sub）时有效并发已经是 4——这就是计算器把 4 标成「危险」的原因: 它是实测雷区的临界点。

实测触发史（全部有日期背书）:

| 事件 | 结果 |
|---|---|
| 6 并发（2026-08-21） | 触发 429 |
| 4 并发 + 主会话同时持续工具调用（2026-08-24） | 同样触发限制 |

所以规范不是拍脑袋定的安全边际: 上限从 ≤2 起步（2026-08 校准），2026-09-11 用户决策上调至 ≤3（`skills/flow-deep/SKILL.md:507` 硬约束标注）。配套降档规则: 存在其他并行会话（tmux 多 tab / 多项目）时，subagent 降为 1 或串行; 分发前先确认无其他活跃 claude 会话。

官方口径补齐背景（`skills/multi-agent/SKILL.md:153-155`）: 限制对象是「同一时刻处理中的请求数」（账户+模型维度）; GLM Coding Plan 按套餐建议并发项目数 Lite 1 / Pro 1-2 / Max 2+; 错误码 1302 = 账户并发达限（降并发 / 加队列）、1305 = 平台过载（退避重试）。

触发 429/1302 后的处置三步（计算器红色档位给的就是这套）:

1. **暂停分发新 agent**——已跑的交给平台限流重试，不死等
2. **主 Agent 用 Bash / grep / Tavily 接管关键路径**——不让整条流水线停摆
3. **退避恢复**——恢复分发需退避间隔，禁止固定间隔高频重试（官方明确反对）

并为每个 agent 准备 fallback（API Error / 超时 → 主 Agent 接管），防单点卡死。上面计算器的三档判定——≤3 安全、=4 危险临界、≥5 必然限流——就是这套实测史的直观化: 拖到 5 以上，处置建议弹出来的时候，就是真实事故里你该做的事。

### 演进线与文档腐化: 一个值的多次漂移

并发上限这个数字，本身就是本仓最好的「约定级配置」教材。它的演进线:

```
≤2（2026-08 校准）──→ ≤3（2026-09-11 上调，commit 6d0310a）
                          │
                          ├─ 同步了 6 文件 13 处副本
                          │  （multi-agent SKILL/README、flow-deep:507、
                          │   codex-compat、示例）
                          └─ 仍漏了两处:
                             flow/SKILL.md:394        「同消息并行 ≤ 4」
                             flow/references/agent-dispatch.md:24
                                                      「同一条消息 ≤ 4 防 429」
```

`skills/flow/SKILL.md:394` 与 `skills/flow/references/agent-dispatch.md:24` 至今残留旧值「≤4」——一次刻意执行的 13 处同步，还是漏了 2 处。这不说明执行不认真，说明**多副本必然漂移**是结构性的: 同一个事实写在 N 个地方，第 N+1 次修改就有概率漏掉一处。所以本教程的引用纪律是: 并发上限以 `skills/flow-deep/SKILL.md:507` 与 multi-agent SKILL.md 为准，引用前实读——腐化实例本身就是「SC5 锚点复核纪律」存在的理由。也所以 lint 的 L2 断言做 registry 一致性、L5 做引用完整性: 人类改漏的，机械检查兜底（详见[第 11 章](ch11-orchestration-governance.md)）。

顺带两处引用陷阱（本章写作时即遵守）: multi-agent Fast Path 清单存在重复编号（两个「汇总核对」，:64-65），引用按条目内容定位而非序号; 2→3 上调的 commit（6d0310a）发生在 v1.8.0 发版之后，CHANGELOG 的 Unreleased 段尚未收录——以 git 历史与 SKILL.md 实读为准。

## 批判小节（局限与成本）

- **协调成本是真实开销**: 分片、命名、pretrust、勾销、TaskStop——这一套对 2 个子任务的任务可能比串行还慢。Execution Router 的存在（Stage 4 ≠ 固定 multi-agent）就是系统自己承认: 并行收益要先抵掉协调成本（`skills/flow-deep/SKILL.md:487-505`）
- **pane 可视化的天花板**: pane ≥4 时每行约 14 字符，基本不可读——可视化只对「确认 agent 活着、在干什么」有意义，深度信息仍靠主会话总结（`skills/multi-agent/SKILL.md:264`）
- **预算是套餐相关的活数**: Lite/Pro/Max 套餐口径不同，高峰期还有账户级动态限流——≤3 是当前环境的经验值，不是普适常数，换环境要重新实测（`skills/multi-agent/SKILL.md:153-155`）
- **纪律依然依赖执行**: 「完成即收」「判定行」「pretrust 出口」全是约定级检查，靠回复中的显式锚点事后审计——执行者不写判定行，违规只能靠人翻记录发现

## 本章源码锚点表

| 断言 | 锚点 |
|---|---|
| Fast/Full 风险路由，判定标准是任务性质 | `skills/multi-agent/SKILL.md:40-50` |
| Fast Path 六步（省流程摩擦不省安全预算） | `skills/multi-agent/SKILL.md:52-65` |
| 判定行显式锚点（跳过检测 ≠ NO_TMUX） | `skills/multi-agent/SKILL.md:44-46, :217-228` |
| 分片互斥完备（nothing missed 前提） | `skills/multi-agent/SKILL.md:57` |
| 汇总核对逐项勾销（重复编号陷阱 :64-65） | `skills/multi-agent/SKILL.md:64-65` |
| digs deep 三要点 + 双份漂移注记 | `skills/multi-agent/SKILL.md:67-73` |
| tmux 两级检测（$TMUX + PPID 链） | `skills/multi-agent/SKILL.md:106` |
| 规模档位表 small/medium/large | `skills/multi-agent/SKILL.md:142-150` |
| large 档前批 ≥60% 滚动补发 | `skills/multi-agent/SKILL.md:150` |
| 并发预算公式 + 实测史 + 官方口径 | `skills/multi-agent/SKILL.md:153-158` |
| pretrust 预信任（2026-09-01 实测 + 出口表） | `skills/multi-agent/SKILL.md:229-256` |
| named-only 原则 + 观察窗退役 | `skills/multi-agent/SKILL.md:258-262, :276` |
| pane 几何约束（主会话总结是主通道） | `skills/multi-agent/SKILL.md:264` |
| 完成即总结即收三步（7 分钟泄漏实测） | `skills/multi-agent/SKILL.md:266-274` |
| 无分屏静默降级 | `skills/multi-agent/SKILL.md:280-290` |
| Delegate 模式（Coordinator 非 Implementor） | `skills/multi-agent/SKILL.md:317-329` |
| 多阶段续接裁决门 | `skills/multi-agent/SKILL.md:330-344` |
| 冲突解决矩阵五类 | `skills/multi-agent/SKILL.md:346-354` |
| Agent Prompt 模板六段 | `skills/multi-agent/SKILL.md:356-384` |
| Execution Router 后端路由表 + Fit Gate | `skills/flow-deep/SKILL.md:487-505` |
| 规模档位 + 硬约束（2→3 上调标注） | `skills/flow-deep/SKILL.md:507` |
| 分发前置自检（作用域 + 权限模式） | `skills/flow-deep/SKILL.md:526-533` |
| Spot-check 三项 | `skills/flow-deep/SKILL.md:545-552` |
| Agent 与 Pane 三层清理（panel 五席教训） | `skills/flow-deep/SKILL.md:554-562` |
| 判定行规则（agent-dispatch 侧） | `skills/flow/references/agent-dispatch.md:5-11` |
| 文档腐化实例一（残留 ≤4） | `skills/flow/SKILL.md:394` |
| 文档腐化实例二（残留 ≤4） | `skills/flow/references/agent-dispatch.md:24` |

> 下一章: [上下文工程](ch8-context-engineering.md)——并发让会话变多、任务变长，上下文怎么不被撑爆: STATE.md 活记忆与 Auto Handoff 的接力机制。
