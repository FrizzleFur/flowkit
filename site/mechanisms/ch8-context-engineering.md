# 第 8 章 · 上下文工程：从容量检测到断点恢复的操作闭环

> **机制篇 · 第 8 章** · F · 上下文工程

*Hand Off Before You Rot*

`20 anchors` · `254 行` · 组件 `replay`×3（threelines 9 / autohandoff 10 / recovery 7）· 约 30 分钟

**本章位置**: 横切层 · 上下文工程（贯穿全程）· 承[第 7 章 · 并发执行](ch7-concurrent-execution.md)的并发现场 · 启[第 9 章 · 验证与迭代](ch9-verification-loop.md)

<div class="fs-callout">

**一句话机制**: 上下文工程在 flow-deep 里是一套五层操作闭环——锚定（STATE.md 活记忆）、检测（脚本实测容量）、决策（四选项弹窗）、处置（压缩续命或交接换窗）、恢复（新会话直达断点）; 整套体系的出发点是一个物理事实: **模型感知不到自己的上下文占了多少**。

**机制定位**: 上下文工程的工程细节层——理论坐标系见[原理篇第 2 章](../principles/ch2-context-three-axes.md)，本章每个操作都能对回主源 context-management.md。

</div>

### 三线分岔: 三条曲线同一个任务

<div class="fs-replay" data-script="assets/scripts/ch8-threelines.json"></div>

**三线分岔的那一刻, 就是 flowkit 存在的理由。**

[原理篇第 2 章](../principles/ch2-context-three-axes.md)已经给了这套机制理论名分——Compaction、结构化笔记、子代理的「三板斧」坐标系，讲清了「为什么是这三个」。本章进入工程细节: 检测脚本怎么拿到真值、压缩矩阵何时压什么、交接的五件套逐项怎么落盘、新会话怎么从断点直达。主源是 `skills/flow-deep/references/context-management.md`（flow-deep 的「Stage X: 上下文管理详细指令」），本章每个操作都能在其中逐条对到。

## 怎么用（30 秒上手）

这套机制默认自动运行，用户日常能碰到的是四个参数与一个弹窗:

- 什么都不做 → 每个 Stage/Phase 边界自动跑容量检测，实测超 70% 弹窗问你（四选项见下文）
- `--no-context-guard` → 关闭整套检测（长任务等于对 context rot 裸奔，不推荐）
- `--handoff-max N` → 交接接力上限，默认 3 代
- `--no-auto-handoff` → 退出自动交接状态（会话中口头关闭等效）
- 1M 窗口模型 → 检测命令加 `--window 1000000`（默认按 200K 窗口算百分比）

「接力细节」回放器演了一条完整链路: 边界告警 → 选「交接并记住自动」→ 五件套保存 → HANDOFF 交接 → 新会话从 Next Action 恢复（10 步），下文逐层拆解每步为什么。

## 为什么：五层操作体系逐层拆解

### 地基事实: 模型不知道自己快满了

整套协议的第一块砖是一句论断: 「模型无法自感 context 占用，百分比必须来自脚本实测，不做『人工判断』式预估」（`context-management.md`「触发条件」节）。这不是谦虚，是事实——上下文占用是 API 层的计量数字，对话内的模型既看不到自己的 token 计数，也无法凭「感觉」估出还剩多少余量。所以一切检测必须外置给脚本。

触发信号分三级，优先级递减:

| 优先级 | 条件 | 检测方式 | 定位 |
|---|---|---|---|
| P0 | Stage/Phase 边界实测 > 70% | `scripts/check_context.py`（transcript usage 真值） | 主信号 |
| P1 | System warning "context exceeds N%" | 系统提示 | 兜底（出现时通常已晚） |
| P2 | Agent 返回 usage > 100K tokens | 工具返回 | 辅助 |

P0 是主动的、跑在问题前面的; P1 是被动的、窗口边界才响的。整个 Context Guard 的设计目标就是把决策点全部推到 P0 上。

### 锚定层: STATE.md 活记忆——一切机制的落点

后面所有操作（checkpoint、交接、恢复）读写的是同一份文件: `<plan-dir>/STATE.md`。它是一个硬性约束在 **< 80 行** 的活记忆（设计借鉴 GSD），「读取一次即知当前位置」。模板里有五个承重字段，各自回答一个恢复时必问的问题:

| 字段 | 回答的问题 | 恢复时怎么用 |
|---|---|---|
| Task Reference（Run ID） | 这是哪一次运行 | 多 feature 防串台; 经验沉淀时标注来源 |
| Current Position | 走到哪了 | 直接定位 Stage/Phase/Status |
| Phase Progress | 每个 Phase 什么状态 | Stage 4 中断续跑的对账依据 |
| Decisions Log | 为什么这么走 | 还原决策脉络（只留最近 5 条） |
| Session Continuity | 断了从哪接 | **Next Action 必须具体可执行、不依赖读其他文件** |

（模板另有两个辅助块: Stage 2 Conclusions 存核心结论压缩体，Blockers 存活跃阻塞项。）

三个操作纪律值得单独说:

1. **大小纪律**: 超 80 行时的裁剪规则是明确的——Decisions Log 只留最近 5 条（完整记录在 findings.md）、Blockers 只留活跃项、Phase Progress 用表格。原则原文: 「STATE.md 是『读取一次即知当前位置』的摘要，不是详细档案」。笔记若无限膨胀，自己就会变成新的上下文负担。
2. **更新节奏绑管道边界**: Stage 0-2 **不创建文件**——这几个阶段快速且依赖思考上下文，中断了直接重做比恢复便宜，这是「笔记不是万能」的诚实设计; Stage 3 完成才首次创建，此后每关完成、每次 Guard 保存、每次中断都按更新规则表维护。
3. **命名空间**: Run ID 形如 `flow-deep-YYYYMMDD-HHMM-slug`，借鉴 OpenTelemetry `workflow.run_id` 的「运行实例可追溯」语义但不依赖任何 OTel 基础设施——纯文件层约定。多 feature 并行时用 `.plan-feat-<name>/` 目录隔离，flow-deep 启动时检测到多个会主动询问本次属于哪个 feature。

### 检测层: Context Guard 容量检测——真值怎么来

每个 Stage/Phase 完成点运行一条命令:

```bash
python3 ~/.claude/skills/flow-deep/scripts/check_context.py --threshold 70
```

原理（脚本头注释）: Claude Code 的 transcript（`~/.claude/projects/<cwd-key>/<session>.jsonl`）里每条 assistant 消息自带 usage 字段，脚本取 mtime 最新 transcript 的**最后一条 usage**，四项之和（input + cache_read + cache_creation + output）即当前 context 占用 token 数，除以窗口大小得百分比——「这是 Claude Code 自身汇报的准确值，非估算」。

exit code 三态，各对应一条操作分支:

- `0` 正常 → 不打扰，继续管道
- `1` 超阈值 → 进入四选项弹窗（决策层）
- `2` 检测失败 → **静默降级**回原压缩矩阵，不阻塞管道——「检测工具自身不能成为单点故障」

两个工程细节防住真实坑:

- **并行多会话串扰**: 同 cwd 开多个 Claude 窗口时，mtime 最新的 transcript 未必是当前会话。输出带 `session=` 和 `first_msg=`（会话首条消息摘要）供核对，发现读错用 `--session` 纠偏。skill 被框架注入前导时 first_msg 显示的是环境信息，此时用两条信号判定: mtime 与检测时刻接近 + 连续两次采样 tokens_used 单调上升。
- **采样式限制**: 检测只发生在边界点，Stage 中间的 context 暴涨（比如一次超大文件读入）抓不到——由 P1 系统警告兜底。

超阈值后的完整动作分层（`skills/flow-deep/SKILL.md`「上下文管理」节原表）:

| 检查点 | 阈值 | 动作 |
|--------|------|------|
| Stage / Phase 边界（脚本实测） | > 70% | 四选项弹窗（见下） |
| Stage 2 后 | > 65% | 压缩 ST 输出为摘要 |
| Stage 3.7 后 | > 70% | 压缩代码级计划为 agent_hint 摘要 |
| Stage 4 每个 Agent 后 | > 75% | 压缩中间结果 |
| 任意时刻 | > 85% | 警告用户，建议 `/compact` |

表里藏着分级哲学: 越往后（越接近收尾）的中间产物容忍阈值越高——离终点越近的内容值得多忍一忍; 而边界点上的 70% 弹窗**永远先于压缩**，把「换不换窗」的选择权先交给用户。

### 决策层: 四选项弹窗——一次只问一个问题

实测超 70% 时 AskUserQuestion 弹出四选项，每个选项是一条完整的操作链:

| 选项 | 动作 | 语义 |
|------|------|------|
| a) 保存并继续 | 更新 STATE.md / progress.md → 按压缩矩阵处理中间结果 → 继续本会话 | 还想在本会话跑完，只要存档保险 |
| b) 保存并交接 | 更新五件套 → 生成 HANDOFF.md → 提示开新会话 | 主动换窗，避开 context rot |
| c) 跳过 | 仅记录本次跳过，不改文件 | 当前阶段收尾很快，不值得存档 |
| d) 交接并记住自动 | 执行 b 全部动作 → STATE.md 写入 `Auto Handoff: enabled` | 本次交接，且后续边界达到自动阈值免弹窗 |

三条配套规则让弹窗不变成骚扰:

- **节流**: 同一 Stage 边界最多弹一次; 选 c 后下个边界重新检测再问（阈值未降则再弹，但同一 Stage 不重复）。
- **无交互降级**: 子代理 / headless 场景没有 AskUserQuestion 通道，默认执行选项 a（可自主完成的最小破坏项），四选项文案与决策理由落盘 progress.md——原文要求「**不静默跳过、不杜撰用户选择**」。例外: 已 armed 时动作链本就无弹窗环节，非交互场景直接执行完整自动交接。
- **弹窗先于压缩**: 用户选 a 时也是先做 checkpoint 再按矩阵压缩——存档动作永远排在续命动作前面。

### 处置路线 A: 压缩矩阵——继续本会话的续命

选了 a（或检测 exit 2 降级），就进入压缩矩阵。三个压缩位各有模板，压什么、压成什么样都是约定好的:

| 压缩位 | 内容 | 压缩形式 | 压缩率 |
|--------|------|---------|--------|
| Stage 2 输出 | Sequential Thinking 完整思考 | 最终结论 + 3 个关键 insight | 70% |
| Stage 2 输出 | Mermaid 完整代码 | 描述性摘要 + 关键节点 | 80% |
| Stage 2 输出 | 三角色两轮讨论 | 综合方案 1-2 段 | 75% |
| Stage 3.7 输出 | 每个 Phase 的完整代码 | agent_hint 摘要（YAML） | 90% |
| Stage 3.7 输出 | TDD 五步详述 | 依赖关系图 | 60% |
| Stage 4 中间结果 | Agent 执行日志 | 结果摘要 | 85% |
| Stage 4 中间结果 | 测试全量输出 | 通过/失败统计 | 90% |
| Stage 4 中间结果 | 完整代码 diff | 变更文件列表 + 功能描述 | 70% |

其中 agent_hint 摘要是压缩后仍可直接派发的形态——文件清单、TDD 标志、依赖关系全保留:

```yaml
agent_hints:
  phase-2:
    type: code-implementation
    files: { create: [gateway.py], test: [test_gateway.py] }
    tdd: true
    depends_on: [phase-1]
```

配套一套符号系统加速书写（引用 context-optimization skill）: 依赖写 `A → B`、结论写 `∴`/`∵`，状态与风险用固定缩写——压缩后的文本仍保持机器可读的结构。

**不可压缩清单**是压缩的底线，四类内容必须完整: ① task_plan.md 的 Phase 定义与完成标准; ② agent_hint 的 files/test/depends_on 字段; ③ 当前正在执行的 Agent 的 prompt; ④ Stage 5 验证的完整检查清单。逻辑一致: 前四类都是**执行依据**——压缩它们省下的是 token，赔进来的是幻觉执行。

与手动 `/compact` 的协作也有约定: 暂停当前阶段记录 checkpoint → 等压缩完成不在压缩中执行新任务 → 从 checkpoint 恢复。极端场景（Stage 中间暴涨直接触发 auto-compact）本可配 PreCompact hook 兜底，但官方语义核实后发现不可行: PreCompact 的 stdout **不进入上下文**、模型没有 turn 响应——脚本只能做文件操作，不能指挥模型写 handoff，故默认不配，靠 75% 前置检测跑在 auto-compact 之前解决。

### 处置路线 B: 主动 Checkpoint 与交接——换一扇新窗

选项 b/d 与 armed 自动交接走的是同一条交接协议。先说自动状态的由来: 设计宪法自检第 4 条原为「只询问不自动交接」（2026-08-20），2026-08-28 修订为「弹窗但可记忆」——自动交接必须经用户显式选择（选项 d）进入，不做全局默认。控制权语义: **自动化的入口 = 用户做选择的时刻**。

进入 armed 状态有三种方式（弹窗选 d 为主入口; 续接会话从 STATE.md 继承; 会话中口头开启），退出随时（口头关闭或 `--no-auto-handoff`）。armed 后在 Stage/Phase 边界实测 ≥ 75% 时触发动作链:

1. 跳过弹窗，直接执行选项 b 全部保存动作（五件套 + HANDOFF.md）
2. `Handoff Count` +1; 达到上限（默认 3，`--handoff-max` 调整）不再 spawn，改为提示「接力已达上限，请人工接管」——防无限接力环
3. spawn 续接会话（见下）
4. 本会话输出移交报告（HANDOFF.md 路径 + 新窗口名 + 接力代数）后**停止接收新任务**。会话不自杀——Claude Code 无安全自终止机制，旧窗口由用户手动关闭

阈值分工 70/75 有精确理由: 「75% 留出写文件与 spawn 的余量; auto-compact 在窗口边界才触发，本协议始终跑在它前面」。

**保存动作清单**（选项 a/b 共同部分，b 多后两步）:

1. 更新 STATE.md: Current Position、Phase Progress、Session Continuity——Next Action 必须具体可执行、不依赖读其他文件
2. 更新 progress.md: 本阶段完成项 + 证据（文件路径/测试结果）
3. 更新 task_plan.md: Phase 状态标记
4. （仅 b）刷新 findings.md 关键决策区，保证新会话单读文件即可还原决策脉络
5. （仅 b）若 spec.md 存在，核对 Success Criteria 与实际进度同步——契约是交接时最有价值的东西

**spawn 的三个关键点**（tmux 优先，无 tmux 静默降级为打印命令、文件落盘即交付）:

- `CLAUDE_CODE_FORCE_SESSION_PERSISTENCE=1`（v2.1.172+）: 嵌套启动的 TUI 默认被排除在 `--resume` 之外，此变量保证续接会话可追溯
- `-c "$PWD"`: tmux 新窗口默认目录未必是当前 pane 的 cwd，显式锚定项目目录
- HANDOFF.md 即新会话初始 prompt，交互式窗口里权限提示可正常确认——这是选 tmux 而非 headless 的原因

**HANDOFF.md 本身**是一份刻意做薄的指引文件，设计原则写在模板注释里: 「**不复制五件套内容，只引导新 agent 按序去读——重复内容会随进度过期，路径引用不会**」。骨架四段: 任务一句话（详见 spec.md Goal Contract）/ 当前进度（已完成·进行中·未开始）/ 必读文件按序（STATE.md → task_plan.md → findings.md）/ 建议（技能匹配与未决 blocker）。模板尾行还有一句安全警告: 敏感信息勿写入——**本文件会成为新会话的 prompt**。

### 接力细节: 一次 Auto Handoff 的完整链路

<div class="fs-replay" data-script="assets/scripts/ch8-autohandoff.json"></div>

### 恢复协议: 闭环的另一半

新会话侧（无论 spawn 而来还是用户手动开的），flow-deep 启动时做恢复检查: 检测 `--plan-dir` 下是否存在 STATE.md，存在则读取并向用户展示上次中断位置，询问「恢复上次进度」还是「重新开始」（重新开始会把旧文件备份为 `STATE.md.bak`，不销毁）。若用户以 HANDOFF.md 开场，按其必读清单进入同一流程。

恢复不是无脑续跑，而是**按中断 Stage 分路径**——因为不同 Stage 对上下文的依赖度不同:

| 中断位置 | 恢复动作 | 理由 |
|---|---|---|
| Stage 0-2 | 从该 Stage 重做 | 快速且依赖思考上下文，文件里没有存档 |
| Stage 3 | 重新规划 | 规划依赖思考上下文 |
| Stage 4 | 从 Phase Progress 继续 | 执行结果已 git commit，文件有账 |
| Stage 5 | 直接重新验证 | 重跑验证比恢复验证现场便宜 |

这张表是对「结构化笔记解决不了一切」的诚实承认: 笔记存得住**结果**，存不住**思考过程本身**——恢复协议的智慧在于按「哪里还剩上下文」分流，而不是假装文件能还原一切。

两个收尾细节: HANDOFF.md 是一次性文件，恢复完成后可删除（STATE.md 才是持久锚点）; STATE.md 里的 `Auto Handoff: enabled` 随恢复带入续接会话——偏好跨代继承，防每代重复弹窗，用户随时可口头关闭。多会话串扰的最后一道防线: spawn 后旧会话不再做 Guard 检测，check_context.py 的 mtime 竞争由 first_msg 核对 + `--session` 纠偏兜底。

### 情景剧: 一次真实的断点与接手

<div class="fs-replay" data-script="assets/scripts/ch8-recovery.json"></div>

**看两面板 len: 新会话从 0 开始却无损继续——交接的是『状态』不是『历史』。**

### 回放对照: 三部剧本 ↔ 协议

autohandoff 的 10 步（接力细节）与本章各层的对应: 步 1-2 检测层（边界实测 + first_msg 核对）/ 步 3-4 决策层（四选项 + 选 d 的 opt-in 语义）/ 步 5 锚定层（五件套保存，Next Action 写法）/ 步 6-8 交接（HANDOFF 薄指引 + spawn + 移交报告）/ 步 9-10 恢复协议（按序读三件套 + 从 Next Action 直达断点 + 偏好继承）。剧本里的百分比、代数、命令均可对照上文协议逐项核对。

threelines 9 步对照: 步 1-3 三线同起点与 context rot（模型感知不到占用，质量随液位下滑）/ 步 4-5 断崖 413 自救与压缩台阶 ↔ auto-compact 的窗口边界触发与压缩矩阵「每次压缩都丢一块」/ 步 6-8 Context Guard 告警 → 交接旗 → 新会话质量回高位 ↔ 70/75 阈值分工、跑在 auto-compact 前面 / 步 9 三种结局即三条处置路线（不做 / 只压缩 / 主动交接）的分野。

recovery 7 步对照: 步 2 容量告警 ↔ 边界实测 75%（armed 动作链阈值）/ 步 3 主动 Checkpoint ↔ 保存动作清单的五件套落盘 / 步 5-6 新会话 B 从 HANDOFF 进入、按续接清单零重复劳动 ↔ 必读文件按序（STATE.md → task_plan.md → findings.md）/ 步 7 交接的是状态不是历史 ↔ Next Action 具体可执行、不依赖读其他文件。

## 批判小节（局限与成本）

- **检测是采样式的**: 边界点之外的 context 暴涨抓不到，P1 系统警告兜底时「通常已晚」; PreCompact hook 这条兜底路又被官方语义封死（stdout 不进上下文），目前防护依赖 75% 前置余量
- **约定级约束**: 协议写在 references 里，约束的是「遵循 skill 的会话」——执行者不更新 STATE.md，锚点就是旧的，恢复协议救不回来
- **交接有真实损耗**: `--handoff-max` 默认 3 代的上限本身就说明交接不能无限续; 每代新会话要重读三件套，固定成本客观存在
- **压缩率是约定不是实测**: 矩阵里的 70%/90% 是设计约定（文档示例里的 ~73% 是单例），没有系统性 evals 度量「压缩后质量损失了多少」——这是改进空间
- **改进输入（承接第 2 章）**: 五件套是手工定义的交接物，尚无 ContextPacket 式统一抽象（带 relevance/timestamp/token_count 元数据的信息包）与 GSSC 选择评分——理论侧的未吸收物是这套机制下一步演进的候选方向

## 本章源码锚点表

| 断言 | 锚点 |
|---|---|
| STATE.md 模板与五个承重字段 | `skills/flow-deep/references/context-management.md:43-86` |
| STATE.md 更新规则表（绑管道边界，Stage 0-2 不建文件） | `skills/flow-deep/references/context-management.md:88-101` |
| 大小控制（< 80 行与三条裁剪规则） | `skills/flow-deep/references/context-management.md:117-124` |
| Run ID 的 OTel 语义借鉴（零基础设施依赖） | `skills/flow-deep/references/context-management.md:37` |
| 恢复协议按中断 Stage 分路径 | `skills/flow-deep/references/context-management.md:103-115` |
| 触发条件三级（P0 脚本实测 / P1 系统警告 / P2 工具返回） | `skills/flow-deep/references/context-management.md:128-136` |
| 检测方法（exit code 三态 / first_msg 核对 / `--session` 纠偏） | `skills/flow-deep/references/context-management.md:143-155` |
| 四选项语义 + 节流 + 无交互降级（不杜撰用户选择） | `skills/flow-deep/references/context-management.md:157-168` |
| 保存动作清单五步（选项 a/b 分工） | `skills/flow-deep/references/context-management.md:170-176` |
| Auto Handoff 决议变更与动作链（armed 75% / 上限 3 代 / 会话不自杀） | `skills/flow-deep/references/context-management.md:178-193` |
| spawn 三关键点（PERSISTENCE 变量 / `-c "$PWD"` / tmux 选型理由） | `skills/flow-deep/references/context-management.md:195-209` |
| 阈值分工 70/75 与「跑在 auto-compact 前面」 | `skills/flow-deep/references/context-management.md:211` |
| HANDOFF.md「不复制内容只引用路径」设计原则与模板 | `skills/flow-deep/references/context-management.md:221-251` |
| 压缩矩阵三级（Stage 2 / 3.7 / 4）与模板 | `skills/flow-deep/references/context-management.md:264-340` |
| 不可压缩清单四类 | `skills/flow-deep/references/context-management.md:380-387` |
| PreCompact hook 官方语义（stdout 不进上下文，默认不配） | `skills/flow-deep/references/context-management.md:370-378` |
| Context Guard 阈值分层表与「模型无法自感」论断 | `skills/flow-deep/SKILL.md:156-174` |
| 启动恢复检查与多 feature 检测 | `skills/flow-deep/SKILL.md:195-199` |
| check_context.py 真值原理（transcript 最后一条 usage 四项之和） | `skills/flow-deep/scripts/check_context.py:2-16`（头注释） |
| Auto Handoff 通俗图解与四设计点 | `README.md:140-163` |

> 下一章: [验证与迭代](ch9-verification-loop.md)——上下文工程保证任务「不断线」; 任务「没做完就宣告完成」的问题，交给 Stage 5 的证据表与 auto-iterate 的 keep/revert 循环。
