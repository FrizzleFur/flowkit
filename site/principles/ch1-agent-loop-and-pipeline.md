# 第 1 章 · Agent Loop 与管道形态

> **原理篇 · 第 1 章** · A · 编排与治理

*One Pipeline, Two Trims*

`~6 anchors` · `78 行` · 组件 switch + replay ch1-gate（5 步）` · 组件 `switch` · 约 5 分钟

<blockquote class="fs-callout">
<p><strong>一句话机制</strong>: Agent 的本体是一个循环——感知→思考→行动→观察，直到任务完成; FlowKit 做的事，是把这个裸循环升级成一条<strong>带关卡的流水线</strong>。</p>
<p>Harness Layer · 编排与治理（A 域）· Stage -1 → 5.8 关卡管道，flow / flow-deep 是同一管道的两种裁剪</p>
</blockquote>

<div class="fs-switch"></div>

## 怎么用（30 秒上手）

- 任务中等复杂 → `/flow <任务>`（轻量管道，参数按需启用阶段）
- 任务复杂/重要/高风险 → `/flow-deep <任务>`（全量管道，所有关卡强制）
- 拿不准 → 用上面的开关面板感受差异: flow-deep 减去参数 = flow 的形态，**它们是同一条管道的两种裁剪**，不是两套系统

## 为什么：从裸循环到带关卡的流水线

### 裸循环能跑，但会漂

hello-agents 把 Agent 定义为「循环中自主调用工具的 LLM」——一个 `while True` 循环里，模型反复执行「思考→调工具→观察结果」，直到它认为该停了。这个定义干净，但实践中的问题是 README 说的那句大实话: **「Agent 能力很强但缺乏纪律性。它们跳过验证、忽略边界情况、用『应该可以』来宣布完成」**（[仓库 README](https://github.com/FrizzleFur/flowkit)）。

裸循环的三种典型漂移:

1. **目标漂移**——做了很多事，但没做你真正要的事
2. **幻觉完成**——宣布完成时拿不出证据
3. **无限调研**——用「再查一点」逃避「动手做」

### FlowKit 的回答: 在循环外面包关卡

FlowKit 不改循环本身（智能来自模型，编排只是 harness——这是 learn-claude-code「Bash is all you need」的同款认知），而是在循环的**关键节点插入强制关卡**:

<pre data-filename="示意图">Stage -1 经验召回 ─→ Stage 0.5 目标契约 ─→ Stage 3 计划+确认 ─→ Stage 5 目标验证
       ↑                                                              │
       └──────────── Stage 5.8 经验沉淀（喂给下一次任务）←─────────────┘</pre>

每个关卡对应一种漂移的解药:

| 漂移 | 关卡 | 机制 | 源码锚点 |
|---|---|---|---|
| 目标漂移 | Stage 0.5 Goal Contract | 开工前写死 Objective/成功标准/Non-goals | `skills/flow-deep/SKILL.md` Stage 0.5 节 |
| 幻觉完成 | Stage 5 Goal Verification | 逐条成功标准配新鲜证据，「should work」禁用 | `skills/flow-deep/SKILL.md` Stage 5 节 |
| 无限调研 | 「执行代替调研」冻结令 | 评审只评运行物，零新增论证文档 | 组合实战先例（wordsVerb 案例） |

### 双引擎的分工

- **flow**（`skills/flow/SKILL.md:5`）: 「优化→思考→规划→执行」四段管道，`--quick/--think/--mermaid` 等参数**按需启用**阶段（`skills/flow/SKILL.md:31`）——快，适合可回滚的中等任务
- **flow-deep**（`skills/flow-deep/SKILL.md:132-135`）: 全量十二关（Stage -1 → 5.8）**强制全开**——重要任务用摩擦换确定性

选择逻辑一句话: **做错了多难恢复，就上多重的关卡**。可回滚的小改动用 flow 是效率; 不可逆的大工程用 flow-deep 是保险。

这条选择逻辑，演示出来是一条分岔路（点击播放，5 步自动演示）——

<div class="fs-replay" data-script="assets/scripts/ch1-gate.json"></div>

## 批判小节（局限与成本）

- **关卡不是免费的**: flow-deep 全程的规划/审查/验证本身消耗上下文与时间——小任务上重管道是纯开销（这就是 Complexity Gate 存在的原因: flow-deep 自己也会劝退不适配的任务）
- **纪律依赖执行**: 关卡写在 SKILL.md 里是「约定级」约束，非沙箱强制——它约束的是「遵循 skill 的会话」，不能防住不读 skill 的执行者
- **评估口径要诚实**: flowkit 的 evals 是**回归网**（防机制退化）而非能力基准（测「有多好」）——详见[第 11 章](../mechanisms/ch11-orchestration-governance.md)与改进提案

## 本章源码锚点表

| 断言 | 锚点 |
|---|---|
| flow 四段管道与参数按需启用 | `skills/flow/SKILL.md:5, :31, :65-77` |
| flow-deep 十二关全量架构 | `skills/flow-deep/SKILL.md`「核心架构」节（:132-135） |
| 依赖矩阵（哪些 Stage 用哪些 skill） | `skills/flow/SKILL.md:65-75`; `skills/flow-deep/SKILL.md:54-55, :99` |
| 「缺乏纪律性」问题定义 | `README.md`「为什么造这个轮子」节 |

<nav class="fs-prevnext">
<span></span><a class="fs-nav-next" href="#/principles/ch2-context-three-axes">下一章 · 长时程三板斧 <span class="fs-arrow">→</span><br><small>长任务为什么会断线，以及三个上下文工程机制怎么接住它。</small></a>
</nav>
