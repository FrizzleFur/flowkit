# 第 11 章 · 编排治理与质量自举：给管道自己上的三道锁

> **机制篇 · 第 11 章** · I · 质量自举 · A · 编排与治理

*Three Locks on Itself*

`5 anchors` · `71 行` · 组件 — · 约 5 分钟

<div class="fs-callout">

**一句话机制**: 管道自己也需要被管——设计宪法防它膨胀成暴君，能力注册表防它重复造轮子，evals 回归网防它悄悄退化。这是「管别人验证的体系」给自己上的三道锁。

**机制定位**: 面向 flowkit 本体的演进者——加 Stage 先过宪法四问，写能力先查能力注册表，改 skill 必跑 evals 回归网; 三道锁各防一种死法。

</div>

## 怎么用（30 秒上手）

- 你在给 flowkit 加新 Stage/新强制步骤 → 先过宪法四问，答案写进 plan（可追溯，非走形式）
- 你在写新能力 → 先查 `skills/flow-deep/references/capability-registry.md`——已有覆盖就不新建; 新建则注册
- 你改了 skill 本体 → 跑 evals（`evals/README.md`）确认机制没退化

## 为什么：三道锁各防一种死法

### 锁一: 设计宪法——防「接管过度」

重型引擎最大的内在风险不是功能不足，而是**持续膨胀到剥夺用户控制**（`skills/flow-deep/SKILL.md:33-48`）。宪法四问在每次新增关卡前强制自检:

| 问 | 防什么 |
|---|---|
| 1. 必要性——已有纪律覆盖不了吗? | 防重复建设 |
| 2. 可拆性——能降级为按需启用吗? | 防强制面扩大 |
| 3. 可跳过性——有 `--no-xxx` 逃生阀吗? | 防用户被流程劫持 |
| 4. 控制权——在帮用户决策还是替用户决策? | 防暴君化 |

配三条铁律: 编排层（决定调用什么）与纪律层（被调用的复用能力）职责不混; 宁做「registry 里默认不启用的条目」不默认塞管道; **任何「强制不可跳过」的 Stage 必须写清 why，否则默认可跳过**——这条直接决定了你在[第 4 章](ch4-pipeline-overview.md)看到的「为什么有的 Stage 标注『不可跳过』有的标 `--no-xxx`」。

> 宪法的启发源头: skill 应 small / composable / adaptable，不应「接管流程」（owning the process）——治理对象不是用户，是管道自己。

### 锁二: 能力注册表——防「重复造轮子」

`references/capability-registry.md` 是能力的事实清单: L1 管道必需（缺失报错）/ L2-L5 按需能力，Stage 0 扫描 `~/.claude/skills/` 与它交叉比对生成「当前会话可用能力矩阵」。它解决的问题是组合膨胀后的两个暗病:

- **重复建设**——新写的功能其实 registry 里早有（四问第 1 问的数据源）
- **能力遗漏**——装了但没人知道该用（Stage 2 第 6 维「覆盖审计」遍历 registry 找被遗漏的适用能力）

registry 自己也会腐化——所以有 REC-4「registry 显式图化」与 L2 断言的一致性检查（人类改漏的，机械检查兜底——这正是[第 7 章](ch7-concurrent-execution.md)两处「≤4」残留给的教训）。

### 锁三: evals 回归网——防「悄悄退化」

`evals/README.md` 开头自己承认了那个空位: 「flowkit 管别人验证已经很强……唯独不验证 skill 本体」。evals 补的就是这个位: **skill 的回归测试**——改了 SKILL.md 后确认机制行为没变（loop 契约、结构断言、lint 规则），开发期工具不进 Stage 流程。

诚实划界（本站第 1 章埋的线在这里收）: evals 是**回归网**（防退化），不是能力基准（测「有多好」）——它不回答「flowkit 比裸 Claude Code 好多少」这个问题，那是 BFCL/GAIA 类外部基准的事。教程叙事同样受此约束: 我们讲「机制存在且不退化」，不讲未经基准检验的「效果更优」。

## 批判小节（局限与成本）

- **自觉级约束**: 宪法自检依赖自觉——四问写在 SKILL.md 里，跳过它没有机械拦截（evals 的 L 规则能抓部分结构违规，抓不住「这次没问」）
- **维护有成本**: registry 的能力图谱与实际安装状态漂移时，交叉比对会产生「幽灵能力」（注册了但不存在）——integrity-check 类体检工具是缓解而非根治
- **覆盖是选择性的**: evals 契约测的是「写下来的行为」，写错的行为测不出来（第 6 章的 README 图腐化就是——图和 evals 都在，错的是共识本身）

## 本章源码锚点表

| 断言 | 锚点 |
|---|---|
| 宪法四问与三铁律全文 | `skills/flow-deep/SKILL.md:33-48` |
| registry 层级结构与交叉比对 | `skills/flow-deep/references/capability-registry.md` 目录节（L1 起） |
| Stage 0 能力发现机制 | `skills/flow-deep/SKILL.md:99` |
| evals 定位「skill 的回归测试」 | `evals/README.md` 开头导语 |
| 文档腐化双实例（≤4 残留） | `skills/flow/SKILL.md:394`; `skills/flow/references/agent-dispatch.md:24` |

> 至此机制篇收官。教程之外，研究还产出了对 flowkit 本体的[改进提案](../propositions.md)——REC 式，附触发条件，不达条件不实施: 治理哲学一以贯之。
