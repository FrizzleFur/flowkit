# 第 5 章 · 输入质量与思考规划：先立约，再喂饱，后想清

> **一句话机制**: 「高效地做错事」是 Agent 最贵的失败模式——管道前三关联手拦它: Stage 0.5 把目标写死（Goal Contract），Stage 1 把话说到 AI 听得懂（乔哈里视窗 + 3S），Stage 2a 把任务想透（六维分解）; 三关共同守着一条底线——**垃圾进，垃圾出**。

<div class="fs-johari"></div>

> 上面的象限判定是**简化版直觉训练**（只练「这段话落在哪个象限」），不是完整评分——维度权重、场景检测、四级诊断见 `skills/prompt/SKILL.md`，本章只展开其中最有杠杆的两块: 第四象限与 3S。

## 怎么用（30 秒上手）

- 只想评一段 Prompt → `/prompt <内容>`（独立可用，输出 1-10 评分 + 四级问题诊断 + 优化重写版）
- 走 flow-deep → 三关全自动: Stage 0.5 立契约 → Stage 1 优化表述（评分 >= 8 会主动问你「原文已够好，跳不跳」）→ Stage 2a 六维思考（`--no-think` 可关，但默认强制）; Stage 1 的逃生阀是 `--no-prompt`
- 走 flow → ST 思考按需启用: `--think`（4K）/ `--think-hard`（10K）; Prompt 优化是 Stage 1 固定依赖
- 拿不准自己的表述哪里有问题 → 先玩上面的象限游戏，错的那些基本都栽在「第四象限没喂」

## 为什么: 三关拦在「动手」之前

先定位: 本章覆盖管道的最前端三关（全管道见[第 4 章](ch4-pipeline-overview.md)）——

```
Stage -1 → 0 → [0.5 立约] → [1 喂饱] → 1.5 探索 → 2a [想清] → 2b… → 3 规划 → …
                └────────── 本章覆盖 ──────────┘
```

[第 1 章](../principles/ch1-agent-loop-and-pipeline.md)讲过裸循环的第一种漂移——**目标漂移**: 做了很多事，但没做你真正要的事。它的病因不在执行端，而在输入端: 目标没说清、措辞让 AI 瞎猜、任务没拆透就动手。管道前三关就是按这三条病因逆序布防的:

```
Stage 0.5 Goal Contract ─→ Stage 1 Prompt 优化 ─→ Stage 2a 深度思考
   拦「目标错」               拦「话没说清」            拦「想得不全」
   写死要什么/不做什么         定位信息盲区并喂饱        六维分解+能力覆盖审计
```

顺序有讲究: 契约在措辞优化**之前**（`skills/flow-deep/SKILL.md:258`）——先知道「要达成什么」，才判断得了「这句话够不够好」; 思考在两者**之后**——分解一个含糊的目标，只会得到一堆含糊的子任务。

拿一句典型的模糊任务——「帮我把我们的下单服务优化一下」——过一遍三关的拦截点（以下为规则应用推演）:

| 关卡 | 拦截点 | 依据 |
|---|---|---|
| Stage 0.5 | 「优化」是模糊词 → 必须先问: 哪个维度（性能/可维护性/可靠性）？什么证据算完成？什么不许变？ | goal-contract.md 模糊词规则 |
| Stage 1 | 「我们的下单服务」触发 Q4 检测标识（限定词 + 内部系统）→ 服务拓扑、瓶颈数据、内部规范都是 AI 不知道的，需喂 | prompt/SKILL.md Q4 检测 |
| Stage 1 | 「优化一下」无格式无范围 → Specific 落 2-6 分档 | prompt/SKILL.md 3S 分级 |
| Stage 2a | 六维分解没有输入就无从谈起——上面两关不解决，这里只会产出「含糊的子任务」 | 本章论证 |

一句话撞三关，每一关都有具体的检测规则接住它——这就是「防线」与「期望」的区别。

## 第一道防线: 输入质量（Stage 1 · prompt 技能）

### 乔哈里视窗: 你的话落在哪个象限

prompt 技能把「用户知道什么 × AI 知道什么」切成四象限（`skills/prompt/SKILL.md:100-107`）:

| 象限 | 含义 | 正确姿势 |
|---|---|---|
| Q1 公共知识 | 双方都知道 | 直接描述即可，加复杂 Role 反而是过度设计 |
| Q2 AI 专业知识 | AI 比你懂 | 信任它，把问题描述清楚（堆栈/复现步骤）就够 |
| **Q4 独有知识** | **你知道、AI 不知道** | **必须「喂模式」，否则评分 ≤ 2/10** |
| Q3 探索创新 | 双方都不知道 | 协同探索，多轮协作而非一次性提问 |

判定的决策树很朴素（`skills/prompt/SKILL.md:300-310`）: 出现「我们公司/团队/本项目」等限定词、内部系统名、团队黑话、无定义的新造概念 → 大概率 Q4（检测标识见 `skills/prompt/SKILL.md:109-115`）。

顺带一提 Q2 的价值——它是四象限里唯一「信任不对称对你有利」的象限: 「修复这个 Swift 并发崩溃」，数据竞争的机理是成熟领域知识，AI 比你懂。你不必先成为并发专家，把堆栈和复现步骤描述清楚就够（上面组件的第四个案例）。**知道什么时候不用折腾，和知道什么时候必须喂，是同一枚硬币的两面。**

### 第四象限: 最大杀手与喂模式三法

Q4 之所以是「最大杀手」，在于它**静默失败**: 你以为 AI 懂（「XYZ 系统」「YYY 规范」对你不言自明），AI 实际上只能编。更麻烦的是输出往往**看起来很专业**——编造的术语解释在行文上毫无破绽，错误要等到落地才暴露。prompt 技能对此定了硬规则:

- Q4 未使用喂模式 → 总分封顶 2.0/10，Critical 级
- 正确使用喂模式 → 可提升至 7.0-8.5/10

（`skills/prompt/SKILL.md:116-118`）

喂模式三法（`skills/prompt/SKILL.md:324`）:

1. **举例法**——给正反示例（「这样不符合规范 / 这样符合」）
2. **定义字典**——把内部术语展开成定义（「XYZ 系统: 基于 Spring Boot 的内部微服务框架」）
3. **RAG**——接入内部知识库检索，让 AI 现场查

上面组件里的第一个案例（XYZ/YYY）就是技能自带的标准演示。原始表述 2.0/10，补上定义字典 + 正反示例后 8.5/10（`skills/prompt/SKILL.md:272-296`）——优化版长这样:

```markdown
审查我们公司的 XYZ 系统代码，确保遵循 YYY 规范。

**定义**:
- XYZ 系统：我们内部的微服务框架，基于 Spring Boot
- YYY 规范：内部代码规范，要求类名用 PascalCase，方法名用 camelCase

**示例**:
不符合规范: public class user_service { }
符合规范:   public class UserService { }
```

同一段话，喂与不喂隔着一条及格线——三行定义 + 两行示例，是整个评分体系里性价比最高的投入。

### 3S 原则: 「说清楚了没有」的量化标尺

象限解决「信息有没有」，3S 解决「表达好不好」（`skills/prompt/SKILL.md:120-126`）:

| 原则 | 含义 | 检测规则 |
|---|---|---|
| **Single** | 单任务聚焦 | 查「和/并/以及」连接词、多动词短语——多目标混杂是 Critical 级问题 |
| **Specific** | 明确详细 | 分级: 有格式+范围+示例 9-10 分; 有格式有范围 7-8 分; 都没有 2-6 分 |
| **Short** | 简洁扼要 | 冗余修饰、低信息密度 4-6 分 |

评分体系还有后半套——四场景加权（简单/复杂/第四象限/学习任务权重不同，Q4 场景下「示例/术语完整性」占 80%）、11 种问题四级诊断（Critical→Low）、多轮对话型的节奏四律（`skills/prompt/SKILL.md:128-196`）——它们决定「先修哪个」，但本章不展开: 对大多数失败案例，**先判象限、再喂模式、后过 3S**，已经能救回大半。

Stage 1 在管道里的完整行为（`skills/flow-deep/SKILL.md:276-289`）: 拿优化后的版本作为后续所有阶段的输入; 评分 >= 8 时提示「原始表述已足够好」并询问是否跳过; 若存在 spec-template，还会按模板生成结构化 spec 落盘——供 Stage 1.5 需求探索与 2d 结构化消歧复用。

输入侧还有一环追问机制值得一提: Stage 1.5 需求探索按认知状态走双路径（`skills/flow-deep/SKILL.md:291-305`）——主干明确（有实现路径/技术选型）走轻量 Grilling（一次一问）; 模糊想法（3+ 不确定项）走选项式（3-4 选项带推荐）。它接的是 Q3/模糊表述的兜底: 评分和喂模式解决「说出来的部分」，需求探索解决「没说出来的部分」。本章不展开，机制细节见 needs-exploration.md。

## 第二道防线: 思考规划（Stage 0.5 立约 + Stage 2a 六维）

### Goal Contract: 开工前把目标写死

Goal Contract 是六字段契约，在 Prompt 优化之前落盘（`skills/flow-deep/SKILL.md:256-274`）:

| 字段 | 内容 | 防什么 |
|---|---|---|
| Objective | 最终要达成什么 | 目标本身含糊 |
| Success Criteria | 可观察、可验证的成功标准 | 「做完了」没有判据 |
| Constraints | 约束、风险、不可触碰范围 | 执行中越界 |
| **Non-goals** | **明确不做的相邻任务** | **范围蔓延** |
| Verification Plan | 完成后如何证明达标（命令/检查点） | 验证无据可依 |
| Execution Strategy | 串行 / multi-agent / Workflow 初判 | 执行形态错配 |

三个工程细节值得注意:

- **模糊词先问再规划**——Objective 里出现「更好/优化/clean up/更好用」，必须先用 AskUserQuestion 澄清，不许直接进规划（`skills/flow-deep/references/goal-contract.md:34-44`）。追问模板很具体: 哪个维度最重要？什么证据让你信服它完成了？什么不许变？——并且偏好「2-4 个具体选项带推荐默认」，禁止「还有别的需求吗」这种开放式大问题
- **测试修复类任务有默认约束**——「修好测试」「让 npm test 过」这类任务，契约默认写入四条 Constraint: 不许跳过/删除/弱化失败测试来制造通过; 不许压错误藏失败; 先定位根因再改实现; 保持最小改动（`skills/flow-deep/references/goal-contract.md:46-60`）。这是契约最锋利的用法——**提前封死执行端最省事的作弊路径**
- **契约是后续所有 Stage 的回看锚点**——计划、执行、验证必须回看契约; 目标变了，回 Stage 0.5 更新契约再继续，而不是悄悄漂移。Stage 5 验证时把 Success Criteria 逐条转成验证表，任何一条缺证据，状态就不是 DONE（`skills/flow-deep/references/goal-contract.md:71-73`——这条闭环在[第 9 章](ch9-verification-loop.md)展开）

**不可跳过，但有逃生阀**: 低风险小任务可用最小 Goal Contract——1 个 Objective + 1-3 条 Success Criteria + Verification Plan（`skills/flow-deep/SKILL.md:274`）。契约的重量与任务的风险对齐。最小形态长这样（节选自模板，`skills/flow-deep/references/goal-contract.md:11-32`）:

```markdown
# Goal Contract
## Objective
[一句话: 什么最终状态应当为真？]
## Success Criteria
- [可观察、可验证的条件]
## Constraints
- [文件/行为/兼容性/安全/流程限制]
## Non-goals
- [不该做的相邻工作]
```

Execution Strategy 的初判也有一张速查表: 单文件低风险可回滚 → 串行; 多个独立实现任务 → multi-agent; 多维评审或确定性 fan-out → Workflow（`skills/flow-deep/references/goal-contract.md:62-69`）。

### Sequential Thinking 六维: 想透再动手

Stage 2a 调用 Sequential Thinking MCP（默认 4K，`--think-hard` 升级 10K），固定覆盖六个维度（`skills/flow-deep/SKILL.md:311-314`）:

```
1. 任务分解 → 2. 依赖分析 → 3. 风险评估 → 4. 资源需求 → 5. 执行策略 → 6. 完整能力规划
```

前五维是常规工程分解; **第 6 维是 flowkit 的加料**——能力规划: 输入 Stage 0 生成的「可用能力矩阵」，对每个 Phase 匹配适用技能，再做**覆盖审计**: 遍历全部可用能力，检查是否有被遗漏的适用项，审计结果落 findings.md（`skills/flow-deep/SKILL.md:316-321`）。防的是一种隐蔽遗漏: 任务分解本身没漏，但「本可以用的机制」没被想起来。

默认匹配规则举几个实例（当对应能力可用时自动启用，`skills/flow-deep/SKILL.md:323-328`）: 代码实现 → TDD 工作流; 2+ 独立模块可并行 → 并行分发; 实现完成后 → code-review; 验证失败 → auto-iterate + systematic-debugging。

第 6 维后还有一道**技能匹配确认钩子**: 匹配到 2 个以上技能时用 AskUserQuestion 展示清单让你确认或调整——「TDD(C10) + writing-plans(C11) + code-review(C12) 是否全部启用？」。匹配是推断，启用权在用户（`skills/flow-deep/SKILL.md:332-336`）。

思考不是白想: 六维结论与能力覆盖审计都**落盘 findings.md**（`skills/flow-deep/SKILL.md:320, :330`），成为 Stage 3 计划的直接输入——这也是 flowkit「文件优先于对话」的一贯打法（文件五件套的完整机制在[第 8 章](ch8-context-engineering.md)）。

flow 与 flow-deep 在这一关的差异: flow 侧 `--think` 启用同样的前五维，第 6 维技能匹配仅 `--deep` 时启用（`skills/flow/references/stage2-details.md:13-20`）——轻量管道默认不为能力审计付摩擦。

### 两道防线的分工

本章两段的边界至此清晰: **输入质量防线管「人对 AI 的表述」**（乔哈里定位盲区、喂模式补盲区、3S 卡表达下限）——它假设目标已明确，只修通道; **思考规划防线管「AI 对任务的理解」**（Goal Contract 把目标钉死成可验证的字段、六维把任务拆成有依赖有审计的结构）——它假设表述已合格，只修理解。Stage 0.5 编号在 Stage 1 之前而主题归入「思考」，正因为它约束的不是措辞而是**理解的第一输入: 目标本身**。两道防线都不是能力增强——AI 不会因为过了三关就变聪明，但「做错事」的概率结构被提前改写了。

## 批判小节（局限与成本）

- **评分是主观的**: prompt 技能自己承认——「主观性评分，仅供参考」，且以中文优化为主，英文 Prompt 评分可能有偏差（`skills/prompt/SKILL.md:330-334`）。它是体检不是法官
- **组件是简化版**: 站内象限游戏只练判定直觉，不含权重、诊断与重写——把「玩了游戏」当「会写 Prompt」是误读
- **契约是约定级约束**: Goal Contract 写在 SKILL.md 与 spec.md 里，约束的是「遵循管道的会话」，非沙箱强制——与[第 1 章](../principles/ch1-agent-loop-and-pipeline.md)对关卡的那条批判同源
- **六维不保证想全**: 4K/10K 思考是「有结构的深想」而非「必然穷尽」; 第 6 维的覆盖审计只能查「能力清单内」的遗漏，清单外的盲区它管不住
- **三关全在动手之前**: 它们拦的是「已知类型的输入病」; 执行中途需求变了，只有「回 Stage 0.5 更新契约」这一条软规则接着——所以才还需要下一章的评审关卡在过程中持续兜底
- **推演演示是理想路径**: 「一句话过三关」表展示的是规则命中，实际管道里三关并非总全部触发——评分够高可跳过 Stage 1、任务清晰可跳过 1.5。把它当 X 光片（看病灶在哪）用，别当必经流水账用

## 本章源码锚点表

| 断言 | 锚点 |
|---|---|
| 乔哈里四象限矩阵 + Q4 检测标识与处理规则（≤2.0 封顶 / 喂后 7.0-8.5） | `skills/prompt/SKILL.md:100-118` |
| 3S 原则表（Single 连接词检测 / Specific 分级 / Short 密度） | `skills/prompt/SKILL.md:120-126` |
| 场景加权 / 四级诊断 / 节奏四律（未展开的后半套） | `skills/prompt/SKILL.md:128-196` |
| Q4 场景下「示例/术语完整性」权重占 80% | `skills/prompt/SKILL.md:130-137` |
| Stage 1.5 需求探索双路径（Grilling / 选项式） | `skills/flow-deep/SKILL.md:291-305` |
| 喂模式三法（举例法/定义字典/RAG） | `skills/prompt/SKILL.md:324` |
| XYZ/YYY 标准演示（2.0 → 8.5，与站内组件同案例） | `skills/prompt/SKILL.md:272-296` |
| 象限判定决策树 | `skills/prompt/SKILL.md:300-310` |
| 评分主观性自认（Limitations） | `skills/prompt/SKILL.md:330-334` |
| Goal Contract 六字段 + 不可跳过 + 最小契约 | `skills/flow-deep/SKILL.md:256-274` |
| Stage 1 调用 /prompt、评分 >= 8 可跳过、spec 生成 | `skills/flow-deep/SKILL.md:276-289` |
| ST 六维 + 第 6 维覆盖审计 + 默认匹配规则 + 确认钩子 | `skills/flow-deep/SKILL.md:311-336` |
| 模糊目标澄清四问 / 测试修复默认约束 / 策略速查 / Completion Contract | `skills/flow-deep/references/goal-contract.md:34-44, :46-60, :62-69, :71-73` |
| flow 侧六维（第 6 维仅 --deep） | `skills/flow/references/stage2-details.md:13-20` |
| README 乔哈里图（用户侧速览版） | `README.md:165-181` |

> 下一章: [评审与决策](ch6-review-and-decision.md)——想得再透的 Plan 也是自己写的: 怎么用一个没写过方案的 Claude、八副专业眼镜和六条自动判定原则，接住思考规划的盲区。
