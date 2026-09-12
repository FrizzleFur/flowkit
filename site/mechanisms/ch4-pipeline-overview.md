# 第 4 章 · 管道全景：从 Stage -1 到 5.8 的一条龙

> **一句话机制**: flow-deep 是十二道关串成的一条流水线——每道关存在的原因，都是一种被实测踩过的漂移; 过了关你拿到的不是「感觉做完了」，是证据表上的 `DONE`。

<div class="fs-replay" data-script="assets/scripts/ch4-pipeline.json"></div>

## 怎么用（30 秒上手）

- 命令就一句: `/flow-deep <任务表述>`——没有预设参数时十二关全开，这是它与 `/flow` 的根本区别（`skills/flow-deep/SKILL.md:146-154`）
- 想先看管道会怎么走再决定跑不跑: `/flow-deep --dry-run <任务>`（只跑到 Stage 3 的计划，不执行）
- 单关逃生阀: 几乎每关都有 `--no-xxx`（`--no-panel` 跳面板、`--no-recall` 跳召回、`--no-think` 跳深度思考……完整清单见 `skills/flow-deep/SKILL.md:710-721` 参数速查）
- 但有三关标注**不可跳过**: Stage 0（摸牌）、Stage 0.5（立约）、Stage 5（验收）——砍掉任何一处，管道就失去存在意义
- 上面的回放器走完了一条典型流转（12 步），下文逐关讲每步为什么存在

## 为什么：逐关走查十二关

### 先把全景图摆正

先解决一个数数问题: SKILL.md 里 Stage 编号有 15 个（-1 到 5.8 含小数），为什么叫「十二关」？看核心架构图（`skills/flow-deep/SKILL.md:132-143`）的数法——**主链上非括号的节点恰好 12 个**，括号里的 1.5 / 5.5 / 5.7 是条件关（条件触发、参数控制、自动触发），不占主链名额:

```
入口区          立约区           输入质量区        思考规划区
┌─────────┐   ┌──────────┐   ┌───────────┐   ┌─────────────────┐
│ S-1 召回 │ → │ S0 能力   │ → │ S0.5 契约  │ → │ S1 优化 → [S1.5] │ → S2 深度思考 ─┐
└─────────┘   │ S0 摸牌   │   └───────────┘   └─────────────────┘               │
              └──────────┘                                                       │
评审区 ←──────────────────────────────────────────────────────────────────────────┤
┌──────────────────────────┐   执行区              验证与沉淀区                    │
│ S3 规划(确认点)           │   ┌──────────────┐   ┌──────────────────────────┐   │
│  → S3.5 独立审查          │ → │ S4 执行路由   │ → │ S5 验证 → [S5.5] → [S5.7]│   │
│  → S3.6 面板评审          │   │ (串行/多agent/ │   │  → S5.8 沉淀             │   │
│  → S3.7 代码细化          │   │  Workflow)    │   └───────────┬──────────────┘   │
└──────────────────────────┘   └──────────────┘               │                  │
                                     ↑                         │                  │
                                     └── 失败按类型回退 ←───────┘（执行偏差→S4 / plan 错→S3 / 目标不清→S0.5）
```

一条速记表（每关一行，锚点供深挖; 后续各章按支线展开，本章只讲主干）:

| 关卡 | 防什么漂移 | 过了会怎样 | 锚点 |
|---|---|---|---|
| S-1 经验召回 | 同一场景从零开始 | 命中经验全文加载，入契约 Relevant History | `flow-deep/SKILL.md:233-254` |
| S0 能力发现 | 中途才发现缺工具 | 可用能力矩阵，预定 5.5/5.7 形态 | `flow-deep/SKILL.md:212-231` |
| S0.5 目标契约 | 高效执行但偏离目标 | 六字段立约，3/4/5 全程回看 | `flow-deep/SKILL.md:256-274` |
| S1 Prompt 优化 | 垃圾进垃圾出 | 优化表述成为后续输入 | `flow-deep/SKILL.md:276-289` |
| [S1.5 需求探索] | 需求信息缺口 | Grilling 或选项式补齐，入 findings | `flow-deep/SKILL.md:291-305` |
| S2 深度思考 | 拍脑袋规划 | 六维结论+技能匹配，入 findings | `flow-deep/SKILL.md:307-359` |
| S3 确定性规划 | 幻觉代码混进 plan | 五件套落盘+质量自检+用户确认点 | `flow-deep/SKILL.md:361-405` |
| S3.5 独立审查 | 沉没成本偏差 | 三态裁决，NOTES 级选择性采纳 | `flow-deep/SKILL.md:406-429` |
| S3.6 面板评审 | 单视角盲区+决策疲劳 | Auto-Decide 滤掉 80%，只留品味决策 | `flow-deep/SKILL.md:431-476` |
| [S3.7 代码细化] | plan 无法直接派发 | agent_hint 编译层，无 placeholder | `flow-deep/SKILL.md:478-485` |
| S4 执行路由 | 编排成本错配+429 风险 | 选后端再执行，Spot-check 勾销 | `flow-deep/SKILL.md:487-586` |
| S5 目标验证 | 幻觉完成 | 证据表三列，三态收口 | `flow-deep/SKILL.md:587-613` |
| [S5.5 迭代优化] | 盲目重试 | keep/revert 有记忆迭代 | `flow-deep/SKILL.md:615-628` |
| [S5.7 Ralph] | 迭代用尽仍不达标 | Stop Hook 强制持续 | `flow-deep/SKILL.md:630-652` |
| S5.8 经验沉淀 | 经验孤岛（只出代码） | 验证通过后分流入库，回喂 S-1 | `flow-deep/SKILL.md:654-687` |

下面逐关讲透三件事: **为什么存在、防什么漂移、过了会怎样**。

### 入口与立约: Stage -1 / 0 / 0.5

**Stage -1（跨会话经验召回）**——存在理由: auto-skill 虽是常驻协议，但它的读取靠「话题切换」判断，任务相关经验可能漏载。管道层在每次启动时强制做一次针对性匹配——从任务表述抽 3-8 个关键词，对双库索引做匹配，不管 auto-skill 读没读过都重新查一遍（`skills/flow-deep/SKILL.md:233-254`）。

防的漂移是「上次踩过的坑这次再踩一遍」: 没有这关，每个会话都是失忆重启。过了这关，命中条目全文加载进当前会话，并在 Goal Contract 里增加 `Relevant History` 字段记录来源与一句话精华——后续规划直接站在旧经验上。命中已读条目会去重，不重复占上下文。逃生阀 `--no-recall`。

**Stage 0（Superpowers 前置检查 + 能力发现）**——存在理由: 环境能力是动态的，管道得先知道本场有哪些牌可打。两件事: 按「必需依赖」表逐项硬检查（L1），再扫描 `~/.claude/skills/` 与能力注册表交叉比对，生成「当前会话可用能力矩阵」（L2-L5）。

这关藏着一条值得记住的实测教训: 关键能力检测（auto-iterate / ralph-loop / prime-agent）**必须用给定的确定性命令**（`test -f`、settings.json 字段读取、`which`），禁止用目录猜测等替代方法——2026-08-26 实测不同检测方法曾得出相反结论（`skills/flow-deep/SKILL.md:212-231`）。「检测能力」这件事本身也会出错，所以检测方法本身被钉死。

过了这关产出能力矩阵，其中 `iterate_available` / `ralph_loop_available` 两个标志直接预定了 Stage 5.5 / 5.7 走完整模式还是降级模式——入口摸的牌，末尾才兑现。必需依赖缺失会报告并询问是否继续，不静默。不可跳过。

**Stage 0.5（Goal Contract 目标契约）**——最贵的漂移是「高效执行但偏离用户真正目标」: 做了很多事，没做你真正要的事。所以在优化/思考/规划全部开始**之前**先立约，六字段: Objective / Success Criteria / Constraints / Non-goals / Verification Plan / Execution Strategy（`skills/flow-deep/SKILL.md:256-274`）。

两个字段的用意值得单独说: **Non-goals** 明确划掉相邻任务，是范围蔓延的解药——「重构认证」不等于「顺手把登录 UI 也改了」; **Verification Plan** 在开工前就写好「怎么证明达标」（命令、检查点、人工确认项）——Stage 5 验证的就是这份清单，等于把验收标准前置到了开工前。

过了这关，契约写进 `spec.md` 或 findings.md 开头，Stage 3/4/5 全程回看。目标中途变化怎么办？回到 0.5 改契约再继续，后续以新契约为准——改约的通道是明门，不是潜规则。不可跳过（低风险小任务可用最小契约: 1 个 Objective + 1-3 条 Success Criteria + Verification Plan）。

### 输入质量: Stage 1 / 1.5

**Stage 1（Prompt 优化）**——垃圾进垃圾出的防线设在管道入口: 用 prompt 技能对任务表述评分与优化，优化版作为后续所有阶段的输入（`skills/flow-deep/SKILL.md:276-289`）。有一处自我克制的细节: 评分 ≥8/10 时会提示「原始表述已够好」并询问是否跳过——优化本身也有成本，不是为优化而优化。逃生阀 `--no-prompt`。

**Stage 1.5（需求探索，条件关）**——不是所有任务都值得探索，探索方式也不该只有一种。双路径分流（`skills/flow-deep/SKILL.md:291-305`）: 主干明确（有实现路径/技术选型/明确边界）走轻量 Grilling，一次一问、深度优先; 模糊想法（3+ 不确定项或明确度 <7）走选项式，3-4 个选项含推荐。

防的是两种误用: 主干明确也逐项确认，把用户问爆; 模糊想法被开放式追问拖进 choice architecture 陷阱——用户在你给的框架里思考，而不是想清楚自己要什么。探索结果并入 findings.md，喂给 Stage 2。

### 思考与规划: Stage 2 / 3

**Stage 2（深度思考，强制全开）**——Sequential Thinking 走六维: 任务分解→依赖分析→风险评估→资源需求→执行策略→**能力规划**（`skills/flow-deep/SKILL.md:311-335`）。第 6 维是 flow-deep 的特色: 拿 Stage 0 的能力矩阵对每个 Phase 匹配适用能力，并做覆盖审计——遍历所有可用能力，检查有没有被遗漏的适用者。价值在于: 缺技能在思考期暴露，而不是执行到一半才发现。

匹配到 2+ 技能时有确认钩子: AskUserQuestion 列出每个技能及适用原因，用户确认或调整（「TDD + code-review + 并行，全部启用？」）——匹配是推断，拍板权在用户。

图表输出有个工程现实的细节: Mermaid 代码块 + ASCII 字符画**双输出**（`skills/flow-deep/SKILL.md:342-349`）——excalidraw 这类图形工具在终端渲染不了，CLI 环境的用户可见性得靠字符画兜底。另有三角色讨论（按任务类型选三个最相关角色、两轮讨论、综合最佳方案），全部结论入 findings.md。

**Stage 3（确定性规划）**——产出是 plan 文件不是代码，探索纪律**只读**: Glob/Grep/Read 理解结构，不改任何东西。五件套落盘（task_plan / findings / progress / spec / STATE.md），按 plan-quality Checklist 自检，然后到用户确认点。

这关的设计故事值得记: 2026-09-09 官方文档核实 `ExitPlanMode` 审批弹窗属 permission prompt、无任何配置或 flags 可抑制，且 bypass 会话中 Plan Mode 只读封锁本不强制——于是默认反转: 不进 Plan Mode，审批由「plan 落盘 + 质量自检 + 对话内确认点 + Stage 3.5/3.6 双审查」多道关承担（`skills/flow-deep/SKILL.md:361-405`）。规划纪律没变，把关从 harness 弹窗移回 skill 内——批准权始终在用户手里，`--plan-mode` 仍可显式进沙箱。

过了这关，STATE.md 创建并启动 next_action 链——此后每关完成都更新「当前位置」，会话断线后能从这里精确恢复（机制深读见[第 8 章](ch8-context-engineering.md)）。

### 评审三板斧: Stage 3.5 / 3.6 / 3.7

**Stage 3.5（Plan Review 独立 Agent 审查，强制）**——要消除的是「沉没成本偏差」: 第一个 Claude 花了时间想方案，就不愿意推翻它——这是人类工程师也逃不掉的认知偏误。解法是用**全新上下文**的独立 Agent，以 Staff Engineer 角色审 6+3 维（架构/边界/安全/性能/假设/可执行性 + SDD 三项），它没有这包袱（`skills/flow-deep/SKILL.md:406-429`）。

返回三态: APPROVED 直进 3.6; APPROVED_WITH_NOTES 选择性采纳、更新 plan 后继续; NEEDS_REVISION 退回 Stage 3。半自动——报告呈用户等确认，裁决权不在 Agent。

**Stage 3.6（多角色面板评审，默认启用）**——Design Review Board 心智: 8 角色目录按深度选 1（quick）/ 3（basic，默认）/ 5（advanced）个，并行只读评审; 综合时重叠发现（2+ Agent 提到）升高优，角色间分歧标 DISAGREEMENT（`skills/flow-deep/SKILL.md:431-476`）。

它的第二重价值是**决策疲劳治理**: Auto-Decide Layer 按六原则逐一判定，约 80% 常规发现自动裁决（静默入 findings，可追溯），用户界面只剩 Taste Decisions 和阻塞项——通常少于 5 条而不是 20+。最终 Approval Gate 三选: APPROVE_ALL / SELECTIVE_ADOPT / REVISE_PLAN。逃生阀 `--no-panel`。

与 3.5 的分工一句话: 3.5 是广度优先的快速 sanity check（对标原生 `/review`），3.6 是深度优先的专业维度评审（对标 `/code-review <level>`）——单次快速 vs 分级多智能体，两层不是重复建设。

**Stage 3.7（代码级细化，条件关）**——plan 到 Agent 指令之间的「编译层」: 按 writing-plans 规范产出 agent_hint（type / subagent / files / tdd / depends_on），bite-sized 粒度、No Placeholders（`skills/flow-deep/SKILL.md:478-485`）。非代码任务（纯分析/研究/文档）自然跳过——条件关的「条件」本身也是成本控制。

### 执行: Stage 4

**Stage 4（Execution Router 智能执行路由）**——核心认知: Stage 4 ≠ 固定 multi-agent。先按条件选后端: 单文件单点强顺序依赖走当前会话串行; 2+ 独立子任务走 multi-agent; 多维审查、fan-out、loop-until-dry 走 Workflow——且 Workflow 前必须过 Fit Gate，说明「为什么它比串行或 multi-agent 更合适」（`skills/flow-deep/SKILL.md:487-505`）。编排成本与收益要匹配，重编排本身不是目的。

并发有硬约束: 有效并发 = 主会话（恒 1 路）+ 运行中 subagent + 其他活跃会话，同一条消息并发 agent **默认 ≤ 3** 防 429/1302——实测 4 并发+主会话触发、6 并发必触发; 2026-09-11 从 2 上调至 3（`skills/flow-deep/SKILL.md:507`）。触发后暂停分发、主 Agent 接管关键路径、退避恢复。

执行中的纪律还有三件（都有实测教训背书）:

- **Spot-check 三项**: 每 Phase 完成后查文件存在 / `git log` 有新提交 / 测试通过——Agent 的「我做完了」要快速核对（`:545-552`）
- **完成即总结即收**: Agent 完成通知到达即总结验收、不复用就 TaskStop 收本体——mailbox 型 agent 完成后静默 idle 不退出，panel 五席未清是实测教训（`:554-562`）
- **退回 Plan 协议**: 遇到意外第一反应是「plan 哪里假设错了」而非「让我直接修」; 执行偏差就地修，plan 假设有误走六步 Fallback，同一 Phase 2 次 Fallback 退回 Stage 2（`:568-585`）

### 验证与沉淀: Stage 5 / 5.5 / 5.7 / 5.8

**Stage 5（Goal Verification，不可跳过）**——铁律: No completion claims without fresh verification evidence，禁止 "should work" / "probably"。验证的不只是命令通过，而是**逐条核对 Stage 0.5 契约的 Success Criteria**，输出「标准 × 证据 × 状态」三列表（`skills/flow-deep/SKILL.md:587-613`）。

完成态只有三种: `DONE`（所有标准均有新鲜证据）/ `PARTIAL`（剩余项、原因、下一步明确列出）/ `BLOCKED`（需要用户输入、权限、外部系统）。任一 Fail 不能 DONE——按失败类型回退: 执行偏差回 Stage 4 最小修复、plan 假设错误回 Stage 3 更新计划、目标或标准不清回 Stage 0.5 改契约。注意回退目标精准到病因，不是一律从头再来。

**Stage 5.5（自主迭代优化，条件关）**——`--iterate N` 或 Stage 5 有未达标项时进入: 每轮一个聚焦变更→机械验证→通过 keep 失败 revert。渐进式 Guard（前 1/3 仅 verify / 中期轻量 / 后期全量）承认一个事实: 全量 guard 上得太早会扼杀方向探索（`skills/flow-deep/SKILL.md:615-628`）。

**Stage 5.7（Ralph Loop 强制持续，条件关）**——5.5 迭代用尽仍不达标时的外层包裹: Stop Hook 拦截会话退出，注入一次性固定 prompt（LLM 每轮自行从 progress.md 读最新状态），达标输出 completion promise 才放行。与 5.5 的二分: 5.5 是应用逻辑层（怎么有纪律地迭代），5.7 是会话控制层（只是不让停）——两层不混淆，没有 5.5 的 5.7 只是无结构的「继续试」（`skills/flow-deep/SKILL.md:630-652`）。

**Stage 5.8（跨会话经验沉淀）**——闭环的写端。触发条件卡得很死: 只在 Goal Verification 为 DONE 时触发——**失败方案不沉淀**，否则知识库会变成误导库（`skills/flow-deep/SKILL.md:654-687`）。从 Success Criteria + 执行结果 + 关键决策提炼可复用经验，按「下次能帮用户省时间吗」判断价值，分流 knowledge-base（通用流程/模板）与 experience（技能踩坑/参数），询问用户同意后写入并更新 `_index.json`。

它和 Stage -1 构成跨会话读写闭环: 这次任务的沉淀，是下次任务的召回。管道首尾相接，不是一条直线。

### 管道的三条回路

把十二关连起来看，会发现它不是单条直线，而是三条回路叠在一条主链上:

1. **失败回退回路**（尾→头）: Stage 5 按病因回退（偏差→S4 / plan 错→S3 / 目标不清→S0.5），Stage 4 内部 Fallback 两次退回 S2——错误不是被掩盖，而是被送回它诞生的那一关
2. **条件关回路**（尾→尾）: S5 不达标 → S5.5 迭代 → 仍不达标 → S5.7 强制持续——验证失败自动加码，而不是自动放行
3. **记忆回路**（头↔尾）: S-1 读、S5.8 写、STATE.md 全程记账——单次任务的管道，靠这条回路变成跨会话的系统

### 回放对照: 12 步 ↔ 十二关

顶部回放器的 12 步对应关系（可边播边对照）:

| 步 | 关卡 | 步 | 关卡 |
|---|---|---|---|
| 1 | 入口（Complexity Gate 放行） | 7-8 | S3.5 独立审查（call + 三态返回） |
| 2 | S-1 召回 + S0 能力矩阵 | 9 | S3.6 面板（Auto-Decide + Taste） |
| 3-4 | S0.5 契约 + 用户修约 | 10 | S3.6 Approval Gate（SELECTIVE_ADOPT） |
| 5 | S2 六维思考 | 11 | S4 路由 + 并发分发（≤3） |
| 6 | S3 落盘 + 确认点 | 12 | Spot-check + S5 证据表 + S5.8 沉淀 |

剧本刻意省略了两处真实分支: 用户批准 plan 的确认往返（第 6 步后）、Stage 5 失败时的回退路径——它演示的是最常见的主干，不是全貌。

### 为什么敢叫「全量」: 两道自我约束

十二关不是堆出来的。入口处 Complexity Gate 会做执行级确认: 单文件低风险任务提示降级 `/flow`，用户坚持就只保留 Goal Contract + Minimal Plan + Verification（`skills/flow-deep/SKILL.md:191-194`）——重型引擎自己也要防杀鸡用牛刀。

更深一层，设计宪法要求每次新增 Stage 前过四问: 必要性（已有纪律能否覆盖）/ 可拆性（能否降为按需启用）/ 可跳过性（有没有 `--no-xxx` 逃生阀）/ 控制权（是帮用户决策还是替用户决策）; 三条铁律之一是「强制 Stage 必须写清 why」（`skills/flow-deep/SKILL.md:33-48`）。关卡数量本身被治理着——每道关对应一种实测漂移，不是多多益善。

## 批判小节（局限与成本）

- **约定级而非沙箱级**: 十二关写在 SKILL.md 里，约束的是「遵循 skill 的会话」——执行者不读 skill，关卡就形同虚设。文档自身也会漂移（并发上限 2026-09-11 上调 2→3 后，个别文档残留旧表述，以 `flow-deep/SKILL.md:507` 与 multi-agent 为准）——这正是 evals 回归网存在的原因（详见[第 11 章](ch11-orchestration-governance.md)）
- **全链成本客观存在**: 规划/双审查/验证本身消耗上下文与时间，Context Guard 的存在（Stage/Phase 边界 70% 阈值检测，`skills/flow-deep/SKILL.md:156-174`）就是系统自己承认这一点——它在管道内部盯着管道自己的开销（机制深读见[第 8 章](ch8-context-engineering.md)）
- **无交互环境要降级**: 子代理/headless/Ralph 场景没有 AskUserQuestion 通道，所有决策点统一走三步降级（取推荐默认值→偏离留痕→确认点汇呈报）——2026-09 三臂行为 evals 发现三个执行者各自发明了三种降级后才收编为协议（`skills/flow-deep/SKILL.md:178-186`）
- **回放剧本是教学简化**: 12 步压缩了真实流转（省略确认往返与失败分支），演示主干而非全貌; 各关的完整协议在 references/ 下还有十几份文件，本章只是地图

## 本章源码锚点表

| 断言 | 锚点 |
|---|---|
| 十二关主链定义与条件关括号数法 | `skills/flow-deep/SKILL.md:132-143` |
| 设计宪法四问与三铁律 | `skills/flow-deep/SKILL.md:33-48` |
| 与 /flow 的核心差异清单 | `skills/flow-deep/SKILL.md:146-154` |
| Complexity Gate 执行级确认 | `skills/flow-deep/SKILL.md:191-194` |
| 环境降级协议三步 | `skills/flow-deep/SKILL.md:178-186` |
| Stage 0 确定性检测（实测教训） | `skills/flow-deep/SKILL.md:212-231` |
| Stage -1 强制召回与 Relevant History | `skills/flow-deep/SKILL.md:233-254` |
| Goal Contract 六字段 | `skills/flow-deep/SKILL.md:256-274` |
| Stage 1 评分 ≥8 提示跳过 | `skills/flow-deep/SKILL.md:276-289` |
| 需求探索双路径 | `skills/flow-deep/SKILL.md:291-305` |
| Stage 2 六维与能力覆盖审计 | `skills/flow-deep/SKILL.md:311-335` |
| Mermaid+ASCII 双输出 | `skills/flow-deep/SKILL.md:342-349` |
| Stage 3 确认点反转默认及依据 | `skills/flow-deep/SKILL.md:361-405` |
| Stage 3.5 沉没成本偏差理念 | `skills/flow-deep/SKILL.md:406-429` |
| Stage 3.6 Auto-Decide 与 Approval Gate | `skills/flow-deep/SKILL.md:431-476` |
| Stage 3.7 agent_hint 编译层 | `skills/flow-deep/SKILL.md:478-485` |
| Execution Router 路由表与 Fit Gate | `skills/flow-deep/SKILL.md:487-505` |
| 并发硬约束（当前 ≤3，2→3 演进） | `skills/flow-deep/SKILL.md:507` |
| Spot-check 三项 | `skills/flow-deep/SKILL.md:545-552` |
| Agent 清理适用全部分发点 | `skills/flow-deep/SKILL.md:554-562` |
| 退回 Plan 协议关键规则 | `skills/flow-deep/SKILL.md:568-585` |
| Stage 5 证据表与三态收口 | `skills/flow-deep/SKILL.md:587-613` |
| Stage 5.5 渐进式 Guard | `skills/flow-deep/SKILL.md:615-628` |
| Stage 5.7 Ralph 与 5.5 二分 | `skills/flow-deep/SKILL.md:630-652` |
| Stage 5.8 验证后沉淀（失败不沉淀） | `skills/flow-deep/SKILL.md:654-687` |

> 下一章: [输入质量与思考规划](ch5-input-and-planning.md)——进入第一条支线: Stage 0.5 的 Goal Contract 与 Stage 1 的 Prompt 评分如何联手挡住「垃圾进垃圾出」。
