# 第 9 章 · 验证与迭代：不达证据不罢休

> **机制篇 · 第 9 章** · G · 验证与迭代

*No Evidence, No Done*

`29 anchors` · `231 行` · 组件 `replay`×2（redflags 10 / track 9）· 约 30 分钟

<div class="fs-callout">

**一句话机制**: 「完成」不是一个形容词，是一张三列表——每条成功标准、一份新鲜证据、一个状态; 拿不出证据就沿三条路回退，回退修不完就进有纪律的 keep/revert 迭代，迭代用尽还有一层「不让你停」的强制持续——整套机制把「宣布完成」从 LLM 的口头禅变成可审计的工程动作。

**机制定位**: 验证区的完整操作闭环——Stage 5 证据表三态收口，Fail 后回退三路分诊，修不完进 Stage 5.5 keep/revert 迭代，迭代用尽还有 Stage 5.7 Ralph 强制持续兜底。

</div>

## 怎么用（30 秒上手）

- flow-deep 里你什么都不用做: Stage 5 不可跳过，验证自动逐条核对 Goal Contract 的 Success Criteria（`skills/flow-deep/SKILL.md:613`）
- flow 侧有逃生阀: `--no-verify` 可跳过（`skills/flow/references/stage5-verification.md:29-32`）——但跳过的代价由你自负
- 想让它自己修到达标: `--iterate N` 启用 Stage 5.5; 即使不用参数，Stage 5 出现未达标项也会自动触发（默认 3 轮）
- 迭代用完仍未达标: **双引擎在这里分叉**——flow-deep 自动进入 Stage 5.7（只要装了 ralph-loop 插件且未设 `--no-ralph`）; flow 侧需要 `--ralph` 显式启用（`skills/flow/SKILL.md:170`; `skills/flow-deep/SKILL.md:632`）——轻量管道把强制持续的开关交还给你，全量管道默认替你摁下
- 执行中发现 Plan 走不通: Fallback 协议是半自动的——Claude 分析并建议退回，**你确认后才退**（`skills/flow-deep/references/fallback-protocol.md:143-148`）
- 看演示: 本章有 2 个可交互动画——「红旗话术闸门」回放器（10 步）演 IL-2 话术逐一进闸被拦，「回弹轨道」（9 步）演 keep/revert 时序与 Guard 渐进三档，播放按钮即演

## 为什么：从「应该可以」到证据表

### 「应该可以」是 Agent 的默认方言

FlowKit 的 README 开篇就给出了这个项目存在的问题定义: **「Agent 能力很强但缺乏纪律性。它们跳过验证、忽略边界情况、用『应该可以』来宣布完成」**（[README.md:21](https://github.com/FrizzleFur/flowkit/blob/main/README.md)）。

注意这不是一个假想的稻草人。`iron-laws.md` 的 Rationalization Table 逐句收录了八句真实的红旗话术（`skills/flow-deep/references/iron-laws.md:50-62`），前几句是:

| 红旗话术 | 为什么这是绕过 | 正确做法 |
|---|---|---|
| 「代码看起来应该能工作」 | 「看起来」不是证据 | 运行它，展示输出 |
| 「逻辑上是对的」 | 逻辑推理无法替代运行验证 | 运行实际测试 |
| 「上一轮已经验证过了」 | 上一轮的验证不覆盖本轮的变更 | 每次变更后重新验证 |
| 「大概通过了」 | 「大概」不是验证结果 | 100% 通过或 0% 通过，没有中间态 |

这些话术的共性是: **把「推理」冒充成「运行」**。LLM 对代码的理解是符号层面的——它「看到」逻辑自洽，但这与「程序在真实环境里跑出了预期输出」是两件事。Iron Laws 的 IL-2（验证铁律）用一句话封死这条路: **No completion claims without fresh verification evidence**——没有新鲜的验证证据就不宣布完成，禁止 "should work"、"probably"、"seems to"（`skills/flow-deep/SKILL.md:593`; `skills/flow-deep/references/iron-laws.md:40-48`）。

有一个细节值得玩味: flowkit 的 evals 把「无 should work 式表述」本身写成了 eval 任务的验收条件（`evals/flow-deep/workspace/iteration-2/eval-1-research/cwd/.plan/task_plan.md:189`）——验证纪律不是只用来验证产出的，**验证纪律自己也被验证**。

这些话术在文字里读是修辞课，放进流水线里看才是纪律。下面这条泳道动画演示同一批话术走到 Stage 5 闸门口的下场——先放两张合规产出过闸，再看红旗话术逐一进闸被拦:

<div class="fs-replay" data-script="assets/scripts/ch9-redflags.json"></div>

注意被拦下的四句话术没有一句是谎言——它们甚至可能都是真的。闸门不放行的不是话术，是「无证据的完成宣称」: 证据表三列里 Evidence 栏空着的行，Status 就到不了 Pass。这正是下一节要把「完成」变成一张表的原因。

**步 ↔ 机制对照**: 步 2-3 合规产出进闸放行（SC3 带新鲜证据 → 绿灯）; 步 5-9 四句红旗话术（rf1-rf4）逐一进闸被拦 ↔ Rationalization Table 的「把推理冒充成运行」; 步 10 对照收尾 ↔ Evidence 空着的行 Status 到不了 Pass。

### Stage 5: 把「完成」变成一张表

铁律要落地，需要一个具体格式。Stage 5（Goal Verification）规定: 最终总结前必须输出一张三列表（`skills/flow-deep/SKILL.md:595-599`）:

| Success Criteria | Evidence | Status |
|---|---|---|
| 来自 Goal Contract 的成功标准 | 命令输出 / 文件路径 / 测试结果 / 人工检查点 | Pass / Fail / Needs Review |

三个设计点:

1. **逐条核对，不是整体感觉**。标准的来源是 Stage 0.5 写死的 Goal Contract（见[第 5 章](ch5-input-and-planning.md)）——开工前「完成」长什么样已经白纸黑字，Stage 5 只负责对账。想临时发明一个更容易达标的「完成」，没有入口。
2. **证据必须新鲜**。「新鲜」的反面就是红旗话术里的「上一轮已经验证过了」——每轮变更都产生新的未验证面，旧证据对新变更无效。
3. **禁止制造绿色**。验证不过时，禁止放松成功标准、删除验证项、降低断言来「制造通过」; 放松只在契约本身确实变了时才合法，且必须从证据确认，不能凭感觉（`skills/flow/references/stage5-verification.md:27`）。失败先分诊: 真失败（修实现）/ 过期标准（更新契约并记录）/ 环境问题（修环境）。

操作层，Stage 5 调用 `superpowers:verification-before-completion` 技能执行六个动作（`skills/flow/references/stage5-verification.md:9-16`）: 检查所有 Phase 完成状态（附运行输出）→ 运行测试套件（**必须看到实际输出，不可使用 "should pass"**）→ 检查 lint 错误（同样必须看到输出）→ 确认审查问题已解决 → 向用户展示验证报告（每个验证项附实际命令输出）。注意动词全部是「看到」——不是「知道」，不是「推断」，是看到。

在 Phase 与 Phase 之间，还有一道更轻的确认防止漂移累积: **Spot-check 三项**——预期创建/修改的文件是否存在、`git log --oneline -3` 确认有新提交、相关测试是否通过（附运行输出）（`skills/flow-deep/references/iron-laws.md:63-67`; `skills/flow-deep/SKILL.md:546-551`）。三个问题十秒钟答完，但每个都指向一种真实失效: Agent 报告了没写的文件、声称提交了没提交的代码、测试「应该过」其实没跑。

**完成状态只有三种**（`skills/flow-deep/SKILL.md:601-604`）:

- `DONE`: 所有 Success Criteria 均有新鲜证据证明通过
- `PARTIAL`: 部分标准未完成，但剩余项、原因和下一步已明确列出
- `PARTIAL` 不是失败的委婉语，是诚实的中间态; `BLOCKED` 不是认输，是责任的转交——需要用户输入、权限、外部系统或需求确认时，把卡点显式交还给能解决它的人

### 失败不是终点站，是分诊台: 回退三路

证据表里出现 `Fail` 之后怎么办? 直觉答案是「再试一次」。FlowKit 的答案相反: **先分诊——错误发生在哪一层**（`skills/flow-deep/SKILL.md:606-609`）:

```
  证据表出现 Fail / 关键项 Needs Review
       │
       ▼
  问: 错在哪一层?
       │
  ┌────┼──────────────────┐
  ▼    ▼                  ▼
执行偏差          Plan 假设错误      目标/标准不清
(typo/lint/小遗漏) (API 不兼容/架构)  (Goal Contract 模糊)
  │                │                  │
  ▼                ▼                  ▼
返回 Stage 4      返回 Stage 3       返回 Stage 0.5
最小修复          更新计划           更新目标契约
```

「直接修」只对最左边那一路合法——typo、lint 错误、小断言差异这类不动架构的偏差。一旦判断是 Plan 假设错了（API 版本不兼容、依赖冲突、文件结构与预期不符），继续硬推就会产生连锁错误——后续步骤都建立在一个已失效的假设上。

**退回 Plan 的第一反应不是「怎么修」，而是「Plan 哪里假设错了」**。Fallback 协议把退回固化成六步（`skills/flow-deep/references/fallback-protocol.md:55-141`）: 暂停执行（不做任何「顺便」的修复）→ 记录状态（progress.md 写入 Fallback 条目: 原假设 vs 实际情况 vs 影响范围）→ 分析影响 → 只修改受影响的步骤 → 用户确认 → 从当前 Task 继续。其中两条纪律值得单独说:

- **熔断线**: 同一 Phase 触发 2 次 Fallback，建议退回 Stage 2 重新思考（`fallback-protocol.md:164`）——两次退回还在原地打转，说明不是计划细节错，是思考的输入就有问题
- **能力缺口视角**: 触发 Fallback 时除了问「Plan 哪里假设错了」，还要问「当前缺什么能力、怎么补齐」（`fallback-protocol.md:57`）——agent 卡住的修复几乎从不是「更努力」，而是补上缺失的工具/上下文/机械检查

### Stage 5.5: 有纪律的重试

分诊后回到 Stage 4/3/0.5 修完，或者验证只是「指标差一点」，就进入 Stage 5.5 自主迭代（完整协议在 `skills/flow/references/stage55-iteration.md`，由 flow/flow-deep 共享）。先立一个前提理念: **未达标的 plan 是合法中间态，不是错误**（`stage55-iteration.md:50`，呼应 planning-with-files 的 Completion Semantics）——所以迭代的默认动作既不是无限重试，也不是就此放弃。

它的核心是 **keep/revert 循环**: 每次只做一个聚焦变更 → 机械验证 → 通过则 keep，失败则 revert——迭代不是「多试几次」，是**结构化的试错**。

参数不用手填，从 Stage 5 的失败项自动构造（`stage55-iteration.md:14-25`）:

```yaml
scope: 未达标 Phase 涉及的文件 glob（从 task_plan.md 提取）
metric_name: Stage 5 中失败的验证指标名
verify_cmd: Stage 5 中使用的验证命令
baseline_value: Stage 5 验证输出的当前值
target_value: Stage 5 验证输出的目标值
direction: higher 或 lower（根据指标语义推断）
```

验证之外还有 **Guard 双检查**: Verify 问「目标指标改进了吗」，Guard 问「其他东西坏了吗」（`skills/flow-deep/SKILL.md:624`）——只看 Verify 会修好一处弄坏三处而不自知。

**渐进式 Guard 策略**: 早期冒烟测试 → 中期集成测试 → 后期全量测试（`skills/flow-deep/SKILL.md:622`; `stage55-iteration.md:27-33`）。原理: 全量 guard 太早会扼杀创新方向探索——前 1/3 迭代连方向都还没找对，跑全量测试是在用精调期的纪律惩罚探索期的试错。

**迭代用尽不是失败，是决策点**（`stage55-iteration.md:48-62`）。N 轮用完仍未达标时，按验证值趋势三选一:

| 情形 | 判定 | 动作 |
|---|---|---|
| 持续改善、接近 target | 收敛中 | 报告进度，询问用户是否追加 `--iterate` 或启用 Ralph |
| 停滞或震荡 | plan bug 假设 | **退回 Stage 3 重新规划**，而非暴力重试 |
| 恶化 | 方向错误 | 立即 revert 最后变更，退回 Stage 3 |

配套的铁律是那句最反直觉的话: **反复失败说明 plan 假设有误，不是意志力问题**（`stage55-iteration.md:60`）。机械续跑和机械放弃都是错的——趋势才是判断依据。

顺带一提，迭代运行中你随时可以插话纠正（「vendor 目录别动」「上次这类改动会导致 flaky」）——纠正写入 `.plan/loop-memory.md`，不打断当前轮，从下一轮开始生效。这条 on-the-loop 异步通道区别于全站其他阻断式确认点: in-the-loop 改变当前轮（停下等你），on-the-loop 改变未来轮（异步生效）; 且 durable-vs-oneoff 判别同样适用——只对本次任务有效的纠正不写 loop-memory（`stage55-iteration.md:64-74`）。

这条纪律画成一条曲线最好懂——轨道赌注: 每次迭代是一枚有界尝试——冲多高由你, 落在哪由机械验证说了算:

<div class="fs-replay" data-script="assets/scripts/ch9-track.json"></div>

**绿线只进不退: revert 的意义不是失败, 是失败不付费。**

**步 ↔ 机制对照**: 步 2-4 keep（验证绿）→ revert（验证红）→ 再 keep ↔ 结构化试错与「绿线只进不退」; 步 5-7 Guard 渐进 ↔ 冒烟 → 轻量集成 → 全量三档; 步 8 冲线 88 = target ↔ 参数从 Stage 5 失败项自动构造; 步 9 收尾 ↔ 轨道赌注的算术——落在哪由机械验证说了算。

### Stage 5.7: 不让你停（Ralph Loop）

如果 Stage 5.5 迭代用尽、且判定是「收敛中」或用户明确要强制继续，Stage 5.7 登场（`skills/flow-deep/SKILL.md:630-652`）。机制是 **Stop Hook 拦截会话退出**——每当模型想停下来，Hook 拦住，注入一份 prompt 强制继续。

两个工程细节撑起了整个设计（`skills/flow-deep/references/ralph-integration.md:43-91`）:

1. **一次性固定 prompt + 自主状态获取**: Ralph 的 stop-hook 每轮注入的是启动时写死的同一份 prompt，不支持动态更新。变通是「一次性注入 + 自主读取」——初始 prompt 内嵌指令，要求 LLM 每轮先 `cat .plan/STATE.md` 和读 progress.md 的 TSV 区块获取最新状态，再决定本轮策略。约束反而逼出了一条硬规则: **不要在首轮就假设初始状态仍然正确**。
2. **Completion Promise 退出信号**: 循环的退出条件是一段可机械判定的承诺文本（默认 `FLOW_DEEP_COMPLETE`）。每轮「auto-iterate → Stage 5 验证」后达标则输出 `<promise>`，Hook 见到信号才放行。三条判定规则里有一条专为诚实设计: **穷尽所有策略后可以输出 promise 退出，但必须附带「部分完成」说明; 不得为了退出而输出虚假 promise**（`ralph-integration.md:118-143, :269`）。

初始 prompt 里除了原始任务和未达标项，还带一份**启动时的教训分析**——从已有 TSV 历史提炼的成功方向、失败方向、卡住模式和建议方向（`ralph-integration.md:59-69`），让 Ralph 的第一轮不从零开始。而当循环拉长，历史本身的上下文成本要用压缩策略控制: 1-10 轮全量展示 / 11-20 轮加趋势摘要 / 21-50 轮只留最近 10 轮完整 + 前面汇总 / 50+ 轮只留最近 5 轮 + 分阶段汇总（`ralph-integration.md:107-116`）。

状态的一致性由双文件分工保证: Hook 维护 `.claude/ralph-loop.local.md` 里的迭代计数（准确），LLM 每轮开始把它同步进 `.plan/STATE.md`，之后以 STATE.md 为唯一来源（`ralph-integration.md:207-217`）。工程细节甚至考虑到了命令行参数上限——prompt 短于 10KB 直接传入，超长则先落盘再 `cat`，因为 macOS 的 ARG_MAX 约 256KB（`ralph-integration.md:187-193`）。

Ralph 与 auto-iterate 的关系是本章最容易混淆的点，OVERVIEW 用一张二分表讲透（`skills/flow-deep/OVERVIEW.md:111-122`）:

| | auto-iterate（Stage 5.5） | Ralph Loop（Stage 5.7） |
|---|---|---|
| 层级 | 应用逻辑层 | 会话控制层 |
| 做什么 | keep/revert 循环，metric 追踪，Guard 防回归 | Stop Hook 拦截退出，强制持续 |
| 有纪律吗 | 有——每次只改一个，机械验证 | 没有——只是「不让停」 |
| 有记忆吗 | 有——TSV 历史，卡住策略 | 没有——注入固定 prompt |

Ralph 插件本身不可用时走降级: 方案 A 提示用户手动启用（给出完整命令）; 方案 B 以当前状态为新 baseline 手动重启一轮 auto-iterate（`ralph-integration.md:228-242`）——强制持续层缺席时，退回「半自动持续」，与全站的降级思路一致。

一句话: **Ralph 是「不让你停」，auto-iterate 是「怎么迭代」**。Ralph 的每轮内部调用的仍是 auto-iterate 的 keep/revert 协议——没有 auto-iterate，Ralph 就退化为无结构的「继续试」。

把本章的四层机制叠起来，就是一条完整的「不达证据不罢休」链路:

```
  Stage 5 证据表（三态判定）
       │ DONE → 收工，进 Stage 5.8 沉淀
       │ Fail / 未达标
       ▼
  回退三路分诊（Stage 4 / 3 / 0.5）
       │ 修完仍差一点
       ▼
  Stage 5.5 auto-iterate（keep/revert × N 轮，Guard 渐进）
       │ N 轮用尽仍未达标
       ▼
  Stage 5.7 Ralph Loop（Stop Hook 强制持续 × M 轮）
       │ <promise> 或 --ralph-max
       ▼
  退出循环（达标 / 诚实部分完成）
```

## 批判小节（局限与成本）

- **强制持续是双刃剑**: Ralph 防住了「过早放弃」（下界），但无人值守时还有反向风险——「产出失控」（上界缺失）。参考文档为此补了一道**产出闸门**: 挂机跑 Ralph 前确认「产出速率 ≤ 评审速率」，自动产生的变更堆积快于人工 review 速度时应主动降速分段（`ralph-integration.md:266`）——但这是自觉级约束，非 Hook 强制
- **「新鲜」本身无法机械判定**: 时间戳可查，「证据是否覆盖了本轮变更的全部新面」仍需判断——铁律约束的是遵循 skill 的会话，与全站其他关卡一样是约定级而非沙箱级
- **Needs Review 的兜底是人**: 证据类型里「人工检查点」自动化不了，Stage 5 把它显式标出来是诚实，但也意味着 DONE 的成本里包含你的注意力
- **强制循环烧的是真金**: Ralph 默认上限 10 轮（`--ralph-max`，`skills/flow-deep/SKILL.md:647`），加上 `/cancel-ralph` 手动中断与诚实部分完成出口，三道泄压阀都在——但每轮都是完整的 auto-iterate + Stage 5 验证，token 账单不会说谎

## 本章源码锚点表

| 断言 | 锚点 |
|---|---|
| IL-2 铁律（禁 should work / probably） | `skills/flow-deep/SKILL.md:593`; `skills/flow-deep/references/iron-laws.md:40-48` |
| Rationalization Table 八句红旗话术 | `skills/flow-deep/references/iron-laws.md:50-62` |
| 证据表三列 + 完成状态三态 + 回退三路 | `skills/flow-deep/SKILL.md:595-609` |
| Stage 5 六步操作（必须「看到」实际输出） | `skills/flow/references/stage5-verification.md:9-16` |
| Never weaken assertions（禁制造绿色） | `skills/flow/references/stage5-verification.md:27` |
| 跳过条件（flow --no-verify / flow-deep 不可跳） | `skills/flow/references/stage5-verification.md:29-32`; `skills/flow-deep/SKILL.md:613` |
| 双引擎 Stage 5.7 触发分叉（--ralph 显式 / 自动） | `skills/flow/SKILL.md:170`; `skills/flow-deep/SKILL.md:632` |
| Spot-check 三项（Phase 间快速确认） | `skills/flow-deep/references/iron-laws.md:63-67`; `skills/flow-deep/SKILL.md:546-551` |
| 异常分类决策树（偏差 vs 假设有误） | `skills/flow-deep/references/fallback-protocol.md:10-30` |
| Plan Fallback 六步 + 能力缺口视角 | `skills/flow-deep/references/fallback-protocol.md:55-141`（缺口视角 :57） |
| 同 Phase 2 次 Fallback 退回 Stage 2 | `skills/flow-deep/references/fallback-protocol.md:164` |
| 合法中间态（未达标的 plan 非错误） | `skills/flow/references/stage55-iteration.md:50` |
| Stage 5.5 参数从失败项自动构造 | `skills/flow/references/stage55-iteration.md:14-25` |
| 渐进式 Guard（冒烟→集成→全量） | `skills/flow-deep/SKILL.md:622`; `skills/flow/references/stage55-iteration.md:27-33` |
| 迭代终止三情形 + plan bug 铁律 | `skills/flow/references/stage55-iteration.md:48-62` |
| on-the-loop 异步纠偏 + durable 判别 | `skills/flow/references/stage55-iteration.md:64-74` |
| Stage 5.7 行为（promise 信号 / --ralph-max 10） | `skills/flow-deep/SKILL.md:630-652`（:642-647） |
| Ralph 外层包裹定位 + 每轮流程 | `skills/flow-deep/references/ralph-integration.md:7-16, :178-205` |
| 一次性固定 prompt + 自主状态获取 | `skills/flow-deep/references/ralph-integration.md:43-91` |
| 初始教训注入（成功/失败/卡住模式） | `skills/flow-deep/references/ralph-integration.md:59-69` |
| 历史摘要压缩四档 | `skills/flow-deep/references/ralph-integration.md:107-116` |
| 状态同步双文件（STATE.md 为唯一来源） | `skills/flow-deep/references/ralph-integration.md:207-217` |
| ARG_MAX 10KB 分界 | `skills/flow-deep/references/ralph-integration.md:187-193` |
| Completion Promise 设计与判定 | `skills/flow-deep/references/ralph-integration.md:118-143`（虚假 promise 禁令 :269） |
| Ralph 插件降级两方案 | `skills/flow-deep/references/ralph-integration.md:228-242` |
| auto-iterate vs Ralph 二分表 | `skills/flow-deep/OVERVIEW.md:111-122` |
| 产出闸门（无人值守上界） | `skills/flow-deep/references/ralph-integration.md:266` |
| 「应该可以」问题定义（第一手） | `README.md:21`（Iron Laws ASCII 图 :51-76） |
| 验证纪律自身被 eval 验证 | `evals/flow-deep/workspace/iteration-2/eval-1-research/cwd/.plan/task_plan.md:189` |

> 下一章: [跨会话记忆](ch10-cross-session-memory.md)——验证通过不是终点，是沉淀的准入证: Stage 5.8 只在 Goal Verification 为 DONE 后触发，把这次任务的可复用经验写回记忆库，喂给下一次任务的 Stage -1。
