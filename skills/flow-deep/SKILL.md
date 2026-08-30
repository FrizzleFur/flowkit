---
name: flow-deep
description: >
  当用户说 /flow-deep、深度编排、全量管道、这个任务很重要、要仔细处理、确保万无一失时使用此技能。
  完整管道：superpowers检查→Prompt优化→深度思考→规划→代码级细化→并发执行→验证，自动注入 TDD 和代码审查。
  当任务标注为复杂/重要/高风险、需要"深度分析"、或用户强调要认真处理时，都应使用此技能。
  简单任务、快速原型、单步操作不要使用，改用 /flow。
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - WebFetch
  - WebSearch
  - AskUserQuestion
  - Agent
  - SendMessage
  - TaskList
  - TaskCreate
  - TaskUpdate
  - TaskGet
  - EnterPlanMode
  - ExitPlanMode
---

# Flow Deep - 全量深度任务编排引擎

`/flow` 的深度版本，默认启用全部阶段，适用于复杂、重要、高风险任务。

## 设计宪法（Design Constitution）

> 灵感来自 Matt Pocock 的 skill 哲学：skill 应 small / composable / adaptable，不应"接管流程"（owning the process）到剥夺用户控制、使流程 bug 难以修复。重型引擎最大的内在风险是持续膨胀导致接管过度。

flow-deep 用以下自检守住"用户控制"。每次新增 Stage / 检查点 / 强制步骤前，逐条过一遍，并在 plan 或 PR 描述里显式记录回答（使自检可追溯，非走形式）：

1. **必要性** — 这个步骤解决的问题，是否无法用已有的可复用纪律（capability-registry 里的条目）覆盖？
2. **可拆性** — 它能否从强制 Stage 降级为按需启用的 model-invoked 纪律？
3. **可跳过性** — 用户是否有清晰的 `--no-xxx` 逃生阀？
4. **控制权** — 它是在帮用户决策，还是在替用户决策？

三条铁律：

- 编排层只做"决定调用什么、管理 Stage 间控制流"；纪律层做"被注入或被调用的复用能力"。两层职责不混（详见 `references/capability-registry.md` 的"层级二分"）。
- 宁可把能力做成 registry 里"可用但默认不启用"的条目，也不要默认塞进管道。
- 任何"强制不可跳过"的 Stage 必须在该 Stage 说明里写清 why，否则默认可跳过。

## 必需依赖

| 依赖项 | 类型 | 用于阶段 |
|--------|------|---------|
| `using-superpowers` | Skill | Stage 0: 前置检查 |
| `auto-skill` | Skill | Stage -1: 跨会话经验召回 + Stage 5.8: 经验沉淀 |
| `/prompt` | Skill | Stage 1: Prompt 优化 |
| Sequential Thinking | **MCP** (不是 Skill) | Stage 2: 深度思考 |
| `/mermaid` | Skill | Stage 2: Mermaid 可视化 |
| `planning-with-files` | Skill | Stage 3: 任务规划 |
| `/multi-agent` | Skill | Stage 4: 并发执行 |

**superpowers 技能依赖**（按任务类型自动匹配）:

| 依赖项 | 触发条件 | 用于阶段 | 调用方式 |
|--------|---------|---------|---------|
| `superpowers:brainstorming` | Stage 1.5 需求不明确时 | Stage 1.5: 需求探索 | 参考（不强制加载） |
| `superpowers:writing-plans` | 任务含代码实现 | Stage 3.7: 代码级细化 | Skill tool 加载 |
| `superpowers:test-driven-development` | 任务含代码编写/修改 | Stage 4: TDD 注入 | Agent 内 Skill tool 加载 |
| `superpowers:dispatching-parallel-agents` | 2+ 独立子任务可并行 | Stage 4: 并行分发 | Agent 内 Skill tool 加载 |
| `superpowers:requesting-code-review` | 代码实现完成后 | Stage 4: 代码审查 | Agent 内 Skill tool 加载 |
| `superpowers:verification-before-completion` | 所有任务完成后 | Stage 5: 完成验证 | Skill tool 加载完整规范 |

> **调用原则**: 标注 "Skill tool 加载" 的依赖，必须在对应 Stage 开始时通过 Skill tool 加载完整技能内容。
> "Agent 内加载" 指在 Agent prompt 中要求 Agent 自行调用 Skill tool，确保 Agent 获取完整规范（如 TDD 的 Iron Law）。

**质量保障依赖**（强制启用）:

| 依赖项 | 类型 | 用于阶段 |
|--------|---------|---------|
| `references/plan-quality.md` | Reference | Stage 3: Plan 质量标准 |
| `references/plan-review.md` | Reference | Stage 3.5: Plan Review |
| `references/panel-review.md` | Reference | Stage 3.6: 多角色面板评审 |
| `references/fallback-protocol.md` | Reference | Stage 4: 退回 Plan 协议 |

**迭代增强依赖**（参数控制）:

| 依赖项 | 触发条件 | 用于阶段 |
|--------|---------|---------|
| `auto-iterate` | `--iterate N` 或 Stage 5 验证失败 | Stage 5.5: 自主迭代优化 |
| `superpowers:systematic-debugging` | 遇到 bug 或测试失败 | Stage 5.5: 系统化调试 |
| `ralph-loop` 插件 | Stage 5.5 迭代用完仍未达标 | Stage 5.7: Ralph Loop 强制持续 |

**可选依赖**（长时间运行时按需启用）:

| 依赖项 | 触发条件 | 用途 |
|--------|---------|------|
| `context-optimization` | 上下文 > 60% | 自动压缩中间结果 |

**能力发现机制**: 除上表外，Stage 0 会扫描 `~/.claude/skills/` 并与 `references/capability-registry.md` 交叉比对，发现并注册所有已安装能力。详见 Stage 0 说明。

**注意**: Context7 等其他 MCP 服务不属于本管道必需依赖，仅在具体任务需要时按需调用。

### References 加载时序

> references 文件**按需读取**，不要在触发时一次性加载。详细加载时序表见 `references/context-management.md` 的 "References 加载时序" 章节。

关键路径: Stage 0 → capability-registry + STATE.md | Stage 3 → plan-quality + context-management（多仓任务加 multi-repo-toolchain） | Stage 4 → skill-routing + fallback-protocol

## 触发条件

**TRIGGER when user:**
- 显式调用 `/flow-deep <任务描述>`
- 请求深度编排："深度分析这个任务"、"用全量管道处理"
- 使用关键词：flow-deep、深度编排、全量管道、复杂任务深度分析
- 任务明确标注为复杂/重要/高风险

## 选型指南：何时用 flow-deep vs flow vs grill-me

> flow-deep 是重型管道，不是所有需求都该上。先判断入口，避免杀鸡用牛刀。完整决策依据见 `~/.claude/skills/flow/references/selection-guide.md`。呼应设计宪法——不接管流程。

**口诀**：小澄清 grill-me，大工程 flow-deep，中间 flow。拿不准问"做错了多难恢复"——难恢复就 flow-deep。

| 场景 | 入口 |
|------|------|
| 核心重构 / 支付 / 认证 / 对外 / 安全 | **flow-deep** |
| 中等特性（3-5 步、可回滚） | **flow** |
| 只想澄清、产出 design tree | **grill-me** |
| 方向都没定 | 自由对话 / brainstorming |

组合用法、三种误用、升级/降级信号 → 详见 `~/.claude/skills/flow/references/selection-guide.md`。交互式路由可用 `/ask-matt`（路由 mattpocock 体系，不覆盖 flow-deep）。

## 核心架构

```
Stage -1: 跨会话经验召回 → Stage 0: Superpowers 检查 (强制) → Stage 0.5: Goal Contract (目标契约)
  → Stage 1: Prompt 优化 (--no-prompt)
  → Stage 2: 深度思考 (全开: ST+Mermaid+三角色+技能匹配)
    → Stage 3: 确定性规划 (Plan Mode 强制 + plan-quality 标准)
      → Stage 3.5: Plan Review (独立 Agent 审查，强制)
        → Stage 3.6: 多角色面板评审 (--no-panel 可跳过)
          → Stage 3.7: 代码级细化 (条件触发)
            → Stage 4: Execution Router (串行 / multi-agent / Workflow)
              → Stage 5: Goal Verification (按目标契约逐条验证) → [Stage 5.5: 迭代优化 (--iterate N)] → [Stage 5.7: Ralph Loop 强制持续 (自动触发)] → Stage 5.8: 跨会话经验沉淀 (验证通过后)
```

## 与 /flow 的核心差异

- Stage 0 强制前置 + Stage 2 全开（ST+Mermaid+三角色+技能匹配）
- **Stage 3 Plan Mode 强制**（flow 中为 --strict-plan 默认启用，可 --no-strict-plan 禁用；flow-deep 不可禁用）
- Stage 3.5 Plan Review 强制启用（flow 中为可选 --plan-review）
- Stage 3.6 多角色面板评审（默认启用，--no-panel 可跳过）
- Stage 3.7 代码级细化 + Stage 4 TDD 注入 + 退回 Plan 协议 + Stage 5 不可跳过
- 更严格的阶段确认机制，无 --quick 预设
- STATE.md 跨会话恢复机制

## 上下文管理

> 详细策略见 `references/context-management.md`

**容量检测（Context Guard）**: 每个 Stage / Phase 完成点运行
`python3 ~/.claude/skills/flow-deep/scripts/check_context.py --threshold 70`
读取当前会话 transcript 的真实 usage 得到百分比（模型无法自感 context 占用，必须脚本实测；1M 窗口加 `--window 1000000`）。

| 检查点 | 阈值 | 动作 |
|--------|------|---------|
| Stage / Phase 边界（脚本实测） | > 70% | AskUserQuestion: 保存并继续 / 保存并交接（生成 HANDOFF.md 给下一个 agent）/ 跳过 |
| Stage 2 后 | > 65% | 压缩 ST 输出为摘要 |
| Stage 3.7 后 | > 70% | 压缩代码级计划为 agent_hint 摘要 |
| Stage 4 每个 Agent 后 | > 75% | 压缩中间结果 |
| 任意时刻 | > 85% | 警告用户，建议 `/compact` |

弹窗决策先于压缩：用户选「保存并继续」时先做 checkpoint（更新 STATE.md/progress.md/task_plan.md）再按压缩矩阵处理。同一 Stage 边界最多弹一次，选「跳过」则下个边界重新检测。保存与 HANDOFF.md 协议见 `references/context-management.md` 的「主动 Checkpoint 与 Handoff」。检测脚本失败（exit 2）时静默降级为原压缩矩阵，不阻塞管道。`--no-context-guard` 禁用。

STATE.md 活记忆（< 80 行）维护在 `.plan/STATE.md`，模板和恢复协议见 `references/context-management.md`。

## 执行流程

### 前置处理

1. **解析参数**: 从用户输入中提取 `--` 参数和任务表述
2. **复杂度闸门 (Complexity Gate)**: 判断任务是否真的适合全量 flow-deep（与选型指南分工：选型指南是用户入口决策，本闸门是入口后执行级确认——用户若已按选型指南选定，仅确认不重复判断）:
   - 若任务是单文件、单点、低风险、可逆改动 → 提示降级为 `/flow` 或轻量串行处理
   - 若用户坚持继续使用 `/flow-deep` → 仅保留 Goal Contract、Minimal Plan、Verification，不默认进入 Stage 2 全开、Plan Review、Panel Review 和 multi-agent
   - 若任务复杂、重要、高风险、跨模块、多步骤或需要审查/验证闭环 → 继续完整流程
3. **恢复检查**: 检查 `--plan-dir` (默认 `.plan`；多 feature 项目用 `.plan-feat-<name>/`) 下是否存在 `STATE.md`:
   - **多 feature 检测**: 若项目根有多个 `.plan-feat-*/` 目录，询问用户本次属于哪个 feature，用对应目录作为 `--plan-dir`（参见 planning-with-files 的 Plan Directory Strategy；feature 名来源：用户指定 > git 分支名 > 任务关键词）
   - 若存在 STATE.md → 读取 STATE.md，向用户展示上次中断位置，询问"恢复上次进度"还是"重新开始"
   - 若恢复 → 跳到 STATE.md 中记录的 `next_action` 对应的 Stage
   - 若重新开始 → 备份旧 STATE.md 为 `STATE.md.bak`，继续正常流程
4. **确认任务**: 向用户展示解析结果，确认任务范围、复杂度判断和参数配置

```
/flow-deep --plan-dir docs/plan 重构支付系统，支持多币种

解析结果:
  任务: 重构支付系统，支持多币种
  启用阶段: superpowers检查 → prompt优化 → 深度思考(全量) -> 规划 -> 并发执行
  规划目录: docs/plan/
  思考模式: Sequential Thinking (4K) + Mermaid + 三角色讨论
```

### Stage 0: Superpowers 前置检查 + 能力发现

**调用**: `using-superpowers` 技能

**行为**:
1. 调用 `Skill` tool 加载 `using-superpowers`
2. 按"必需依赖"表逐项检查（L1 硬检查）
3. **能力发现**（L2-L5 动态扫描）:
   a. 扫描 `~/.claude/skills/` 目录获取已安装 skills 列表
   b. 读取 `references/capability-registry.md` 获取已知能力索引
   c. 交叉比对，生成"当前会话可用能力矩阵"
   d. 未在 registry 中注册的新 skill 标记为"未知能力"（可被 Stage 2 考虑使用）
   e. **关键能力检测**: 显式检查以下能力并标记状态（每项用下方给定的确定性检测命令，禁止以目录猜测等替代方法——2026-08-26 实测不同检测方法曾得出相反结论）:
      - `auto-iterate` skill: `iterate_available: true/false` —— 检测 `test -f ~/.claude/skills/auto-iterate/SKILL.md`（影响 Stage 5.5 完整/降级模式）
      - `ralph-loop` 插件: `ralph_loop_available: true/false` —— 检测 `~/.claude/settings.json` 的 `enabledPlugins` 字段是否含 `"ralph-loop"`（影响 Stage 5.7 是否可用）
      - `prime-agent` CLI: `prime_available: true/false`（影响 C34 自动路由；检测 `which prime-agent` 成功 且 Provider Key 可用——以下三渠道任一**非空**即视为有 Key：`ZAI_API_KEY` 环境变量、settings.json env、`~/.prime/agent/auth.json` 含 zai api_key（2026-08-26 起凭证权威存储，settings.json 被并发重写不影响）；空字符串不算——2026-08-26 实测空值会传给 API 返回 401 而非报无 Key）
4. 向用户展示：必需依赖状态 ✓/✗ + 可用能力概览（含 iterate_available、ralph_loop_available 和 prime_available 状态；prime_available=false 时注明"security-audit/code-verification 将降级为原生 Agent"）
5. 如有必需依赖不可用，报告缺失项并询问用户是否继续

**不可跳过**

### Stage -1: 跨会话经验召回（Cross-Session Recall）

**调用**: auto-skill 的知识库/经验库读取机制

**核心理念**: flow-deep 每次启动时强制做一次针对性经验召回，确保任务相关历史经验一定被加载，不依赖 auto-skill 的被动话题切换判断。这是跨会话 loop 的"读"端。

**行为**:
1. 从用户任务表述抽取 3-8 个核心关键词（去重、统一大小写）
2. 读取 auto-skill 的 `knowledge-base/_index.json` 和 `experience/_index.json`
3. 用关键词匹配所有分类/技能的 `keywords` 字段（不做优先级排序，匹配到多少读多少）
4. 命中条目加载进当前会话（读对应 `.md` 文件全文）
5. 在 Stage 0.5 Goal Contract 中增加 `Relevant History` 字段，记录召回经验摘要（来源文件 + 一句话精华）
6. 向用户简报：召回了哪些经验条目，供后续规划参考

**与 auto-skill 的关系**:
- auto-skill 在会话开始时已被 CLAUDE.md 强制协议触发，但它的"话题切换"判断可能导致任务相关经验未被加载。
- Stage -1 是 flow-deep 层面的强制补充：不管 auto-skill 是否已读，都重新做一次针对性匹配。
- 命中已读条目去重，不重复加载。

**STATE.md 写入**: 记录召回的经验条目（文件路径列表），供恢复时复用。

**跳过条件**: `--no-recall`

### Stage 0.5: Goal Contract（目标契约）

在 Prompt 优化、深度思考和规划之前，先建立目标契约，防止高效执行但偏离用户真正目标。

**目标契约必须包含**:
- Objective：最终要达成什么
- Success Criteria：可观察、可验证的成功标准
- Constraints：约束、风险、不可触碰范围、需要保留的行为
- Non-goals：明确不做的相邻任务，避免范围蔓延
- Verification Plan：完成后如何证明达标（命令、检查点、人工确认项）
- Execution Strategy：串行 / multi-agent / Workflow 的初步判断（**多仓任务在此标注目标仓库清单**——触发 C36 双图路由）

**行为**:
1. 从用户原始任务中提取上述字段
2. 若 Objective 或 Success Criteria 不清晰，优先使用 AskUserQuestion 澄清，不直接进入 Stage 1
3. 将 Goal Contract 写入 `--plan-dir/spec.md` 或 findings.md 的开头，供后续 Stage 3/4/5 复用
4. 后续计划、执行和验证必须回看该契约；如果目标变化，回到 Stage 0.5 更新契约后再继续

**不可跳过**，但低风险小任务可使用最小 Goal Contract（1 个 Objective + 1-3 条 Success Criteria + Verification Plan）。

### Stage 1: Prompt 优化

**调用**: `/prompt <任务表述>`

**输入**: 用户的原始任务表述
**输出**: 优化后的任务表述（评分报告 + 优化版本）

**行为**:
- 使用 prompt 技能对任务表述进行评分和优化
- 将优化后的版本作为后续阶段的输入
- 如果评分 >= 8/10，提示用户原始表述已足够好，询问是否跳过
- 如果 `references/spec-template.md` 存在，在优化后按模板生成结构化 spec 写入 `--plan-dir/spec.md`（仅 3+ 步骤或有明确功能需求时）

**跳过条件**: `--no-prompt`

### Stage 1.5: 需求探索（条件触发）

**触发条件（双路径）**: Stage 1 完成后，按认知状态走两路（详见 needs-exploration.md）：
- **路径 A（主干明确）**: 任务表述含具体实现路径 / 技术选型 / 明确边界 → 轻量 Grilling（**不依赖 3+ 不确定项**，避免主干明确被跳过条件过滤、Grilling 沦为死代码）
- **路径 B（模糊想法）**: 3+ 不确定项 或 明确度 < 7 → 选项式

> 判断要点："主干明确"看有没有实现路径/技术选型，不是"不确定项少"。主干明确 + 细节未定仍属路径 A。

> 完整协议（含触发条件、行为步骤、AskUserQuestion 示例）见 `~/.claude/skills/flow/references/needs-exploration.md`

**核心行为**: 认知状态分流 →（主干明确走 Grilling 模式 / 模糊想法走选项式）→ 合并结果 → 记录到 findings.md

**追问要点**: 详见 `~/.claude/skills/flow/references/needs-exploration.md`。Grilling 模式（一次一问 + 深度优先 + facts vs decisions）适合已有主干的用户；选项式（3-4 选项含推荐）适合模糊想法。误用会问爆用户或落入 choice architecture 陷阱。

**跳过条件**: 既非主干明确（无实现路径 / 技术选型 / 明确边界），且不确定项 < 3 且所有明确度 >= 7（任务已足够清晰）

### Stage 2: 深度思考（强制启用）

#### 2a. Sequential Thinking

调用 Sequential Thinking MCP（默认 4K，`--think-hard` 升级为 10K），覆盖 6 个维度：
1. 任务分解 → 2. 依赖分析 → 3. 风险评估 → 4. 资源需求 → 5. 执行策略 → **6. 完整能力规划**

第 6 维（能力规划）升级说明：
- 输入：Stage 0 生成的"可用能力矩阵"
- 对每个 Phase：匹配适用能力（L2-L5），生成 `agent_hint.capabilities` 列表
- 执行覆盖审计：遍历所有可用能力，检查是否有被遗漏的适用能力
- 审计结果记录到 findings.md 的"能力覆盖审计"区块
- 详见 `references/capability-registry.md` 的"覆盖审计模板"

**默认匹配规则**（当对应能力可用时自动启用）:
- 代码实现 → TDD 工作流 (C10) + writing-plans (C11)
- 2+ 独立模块可并行 → dispatching-parallel-agents (C06)
- 实现完成后 → code-review (C12)
- 验证失败 → auto-iterate (C13) + systematic-debugging (C15)
- 安全审计 / 代码验证 → prime-agent (C34)，自动路由（见 skill-routing.md 的 C34 自动路由规则）

完成后展示思考结论并记录到 findings.md。**禁用**: `--no-think`

**技能匹配确认钩子**（第 6 维度完成后）:
- 如果第 6 维度匹配到 2+ 个 superpowers 技能，使用 AskUserQuestion 确认匹配结果
- 展示每个匹配到的技能及其适用原因，让用户确认或调整
- 问题示例: "分析匹配到以下技能: TDD(C10) + writing-plans(C11) + code-review(C12)。是否全部启用？"
- 用户可调整后再进入 Stage 2b

#### 2d. 结构化消歧（条件触发）

如果 `references/clarify-checklist.md` 存在且 `--plan-dir/spec.md` 存在，按 8 维消歧清单扫描 spec.md，识别 Partial/Missing 项，取 Top 5 向用户提问。每个回答增量写回 spec.md。详见 `references/clarify-checklist.md`。

#### 2b. Mermaid 可视化

生成任务结构的可视化图表。因 excalidraw 等图形工具在终端中不可渲染，输出规范遵循全局 CLAUDE.md Mermaid 图表规范（Mermaid 代码块 + ASCII 字符画双输出），确保用户在终端能直接看到图表结构。

**图表类型**（按需选择 1-2 类）:
- 任务分解图 / 依赖关系图 / 执行流程图

**可选增强**: 若需 SVG 持久化，通过 `node ~/.claude/skills/mermaid/render.mjs <file>` 保存。

**注意**: excalidraw 终端不可渲染，仅用于用户明确要求的高质量导出场景。

**禁用**: `--no-mermaid`

#### 2c. 三角色讨论

根据任务类型自动选择三个最相关角色，两轮讨论后综合最佳方案。结果记录到 findings.md。**禁用**: `--no-discuss`

### Stage 3: 确定性规划（Plan Mode 强制）

**遵循**: `planning-with-files` 模板格式 + `references/plan-quality.md` 质量标准

> **SDD 增强**: 如果 `--plan-dir/spec.md` 存在，基于 FR-xxx 和 US-xxx 组织 plan（生成 Coverage Matrix）；如果 `references/constitution-checklist.md` 存在，规划前执行 Constitution Gates 检查。

> flow-deep 定位为高风险任务，Stage 3 强制使用 Plan Mode（只读沙箱）确保设计质量。

**行为**:

**[Plan Mode 内部]** — 调用 `EnterPlanMode` 进入只读沙箱:
1. 用 Glob/Grep/Read 探索代码库，理解现有结构（**多仓/跨文件任务**：先按 `references/multi-repo-toolchain.md` 做环境与准备分档，探索优先 codegraph 定位、修改规划按 C36 四段式）
2. 基于优化后的表述和深度思考结论，设计实现方案
3. 将方案写入系统指定的 plan 文件（遵循 planning-with-files 模板 + plan-quality.md Checklist）

**[Plan Mode 边界]** — 调用 `ExitPlanMode` 提交 plan 供用户审批

**[Plan Mode 外部]** — 用户审批通过后:
4. 将审批通过的 plan 形式化为:
   - `task_plan.md` — 分阶段任务计划（写入 `--plan-dir` 指定目录）
   - `findings.md` — 研究发现（含思考/讨论结论）
   - `progress.md` — 执行进度追踪
5. 对生成的 plan 执行 plan-quality.md 中的 Quality Checklist 自检
6. 向用户展示质量评分，确认后进入 Stage 3.5

**规划要点**:
- 每个 Phase 应标注可否并行
- Phase 间的依赖关系要明确
- 每个 Phase 要有明确的完成标准

**STATE.md 写入**: 规划完成后，创建或更新 `.plan/STATE.md`:
- 记录 `current_stage: 3`、Phase 分解结果、Stage 2 核心结论
- 记录技能匹配矩阵摘要
- 设置 `next_action` 为 "Stage 3.6 多角色面板评审" 或 "Stage 3.7 代码级细化"（非代码任务）或 "Stage 4 智能执行"
- 详见 `references/context-management.md` 的 STATE.md 模板

**跳过条件**: `--no-plan`

### Stage 3.5: Plan Review — 独立 Agent 审查（强制）

**触发条件**: 强制启用（flow-deep 定位为高风险任务，Plan Review 不可跳过）
**参考文档**: `references/plan-review.md`

**核心理念**: 用独立 Agent（全新上下文）审查 plan，消除"沉没成本偏差"。

> **原生对标**: 对应 Claude Code 原生 `/review` 快速单次审查语义（单 Agent、广度优先 sanity check）。与 Stage 3.6（对应 `/code-review <level>` 分级多智能体审查）构成「单次快速 vs 分级多智能体」的二分心智模型。

**行为**:
1. 读取 Stage 3 生成的 task_plan.md 全部内容
2. 启动一个独立 Agent（subagent_type: general-purpose, name: plan-reviewer）
3. Agent 以 Staff Engineer 角色审查 6+3 个维度:
   - 架构合理性 / 遗漏边界情况 / 安全风险 / 性能影响 / Plan 假设验证 / 可执行性
   - [SDD] 如果 spec.md 存在: Coverage Gaps + Constitution Alignment + Cross-Artifact Consistency
4. Agent 返回审查报告（APPROVED / APPROVED_WITH_NOTES / NEEDS_REVISION）
5. **暂停，向用户展示审查报告** — 半自动: 等待用户确认
6. 用户决策:
   - APPROVED → 继续 Stage 3.6
   - APPROVED_WITH_NOTES → 选择性采纳建议，更新 plan 后继续
   - NEEDS_REVISION → 退回 Stage 3 修改 plan
7. 审查结果写入 findings.md 的 Plan Review 章节

**Agent Prompt 模板**: 详见 `references/plan-review.md`

### Stage 3.6: 多角色面板评审（默认启用）

**触发条件**: 默认启用（flow-deep 定位为高风险任务，多角色评审应默认开启）
**参考文档**: `references/panel-review.md`
**跳过条件**: `--no-panel`

**核心理念**: "Design Review Board"——多视角交叉验证，消除单角色盲区。与 Stage 3.5 的分工：3.5 是广度优先的快速 sanity check，3.6 是深度优先的专业维度评审。通过 **Auto-Decide Layer** 自动处理 80% 常规发现，只上浮 **Taste Decisions** 给用户。

> **原生对标**: 对应 Claude Code 原生 `/code-review <level>` 多智能体审查；`--panel-depth`（quick/basic/advanced）即 level 参数（工作量分级），与 Stage 3.5 的 `/review` 单次审查构成二分。

**行为**:
1. **角色选择**:
   - 读取 `references/panel-review.md` 中的角色目录（8 个角色）
   - `--panel-depth quick` 选 1 个（关键维度把关）/ `basic` 选 3 个（默认）/ `advanced` 选 5 个
   - 用户可通过 `--panel-roles "R02,R03,R06"` 覆盖自动选择（角色数不受档位限制）
2. **并行评审**:
   - 在同一条消息中并行启动 3-5 个 review Agent（general-purpose，不需要 tmux）
   - 每个 Agent 使用角色特定的 prompt 模板 + plan 内容 + 代码库上下文
   - 所有 Agent 是只读的——不修改任何文件，只返回审查报告
3. **综合分析**:
   - 收集所有评审结果
   - 识别重叠问题（2+ Agent 提到 → 高优先级）
   - 识别角色间分歧（标记为 `[DISAGREEMENT]` Taste Decision）
   - 按严重性排序
4. **Auto-Decide Layer**（6 原则判定，详见 `references/panel-review.md`）:
   - 对每个发现应用 P1-P6 决策原则
   - `AUTO_APPROVED` → 静默记录到 findings.md
   - `TASTE_DECISION` → 收集到待审列表（[CLOSE_APPROACH] / [YAGNI] / [SECURITY] / [IRREVERSIBLE] / [DISAGREEMENT]）
   - `BLOCKED` → 加入阻塞列表（CRITICAL 级问题）
5. **Final Approval Gate** — 只展示需要用户决策的内容:
   - Auto-Decide 摘要（按原则分组的统计）
   - Taste Decisions（每项含背景、来源、选项、推荐）
   - Blocked Issues（CRITICAL 级必须解决）
6. 用户决策:
   - APPROVE_ALL → 采纳全部建议 + Auto-Decide 结果 → Stage 3.7
   - SELECTIVE_ADOPT → 部分采纳（用户标注修改）→ Stage 3.7
   - REVISE_PLAN → 退回 Stage 3 修改 plan
7. 审查结果写入 findings.md 的 Panel Review 章节（含完整 Auto-Decide 记录，可追溯）

**STATE.md 写入**: 面板评审完成后:
- 更新 `current_stage: 3.6`，记录角色选择、Auto-Decide 统计和综合结论
- 设置 `next_action` 为 "Stage 3.7 代码级细化"

**新增参考**:
- `references/goal-contract.md` — Goal Contract 模板、模糊目标澄清问题、测试修复默认约束
- `references/workflow-script-patterns.md` — Review / Execution / Verification / Loop-until-dry Workflow 模式

### Stage 3.7: 代码级细化（条件触发）

**触发条件**: Stage 2 第6维（技能匹配）识别到 `code-implementation` 类型任务
**调用**: `superpowers:writing-plans`（通过 Skill tool 加载完整技能）
**跳过条件**: 任务不涉及代码实现（纯分析/研究/文档任务）
**读取**: `references/code-planning.md` — 输出格式、agent_hint 字段定义、TDD 步骤模板

> **注意**: 必须通过 Skill tool 加载 writing-plans 完整规范（包括 bite-sized 任务粒度、No Placeholders 规则、Self-Review checklist），而非自行简化。

### Stage 4: Execution Router（智能执行路由）

**核心理念**: Stage 4 不固定等于 `/multi-agent`。先根据 Goal Contract、task_plan.md 和并行收益选择执行后端，再启动执行。

**执行后端选择**:

| 条件 | 执行方式 |
|---|---|
| 单文件、单点、强顺序依赖或低风险改动 | 当前会话串行执行 |
| 2+ 独立子任务可并行，但不需要复杂控制流 | `/multi-agent` |
| 多维度审查、fan-out、loop-until-dry、发现→去重→验证→综合、或用户明确要求 Workflow | `Workflow` |
| 并行编辑同一仓库且存在冲突风险 | Workflow + worktree isolation，或退回串行 |

**Workflow Fit Gate**:
- 适合 Workflow：性能/安全/架构等多维审查、批量迁移、并行研究、独立验证、需要确定性 pipeline/parallel 控制流的任务
- 不适合 Workflow：简单单步修改、单文件错别字修正、需要连续人类判断的任务、编排成本明显高于收益的任务
- 选择 Workflow 前，必须说明为什么 Workflow 比串行或 `/multi-agent` 更合适；若用户未明确授权大规模编排，先征询确认

**默认调用**: `/multi-agent` 技能（注入 superpowers 技能指令）；当 Workflow Fit Gate 命中且用户授权时，使用 Workflow 作为执行后端。

**规模档位（与 Claude Code 原生 `/config` 动态工作流规模对齐）**: 选择 `/multi-agent` 时，按 multi-agent SKILL.md 的规模档位表设定并发代理数 —— small(1-2) / medium(2，默认安全上限) / large(3-4，必须分批每批 2)。**硬约束**（2026-08-24 二次校准，官方文档+两次实测）: 有效并发 = 主会话（恒 1 路）+ 运行中 subagent + 其他活跃会话，同一条消息并发 agent 默认 ≤ 2 防 429/1302（4 并发+主会话实测触发、6 并发必触发；GLM Coding Plan 套餐口径 Lite 1 项目 / Pro 1-2 / Max 2+）；触发后暂停分发新 agent、主 Agent 用 Bash/grep/Tavily 接管关键路径、退避恢复。

**行为**:
1. 读取 Goal Contract、task_plan.md 中的任务分解
2. 读取 Stage 3.7 生成的每个 Phase 的 `agent_hint`（定义见 `references/code-planning.md`）
3. 识别可并行的子任务组
4. 为每个子任务分配合适的 Agent 类型（`agent_hint.subagent`）
5. **根据技能路由规则为每个 Agent 注入对应指令**（`agent_hint.type` → 路由表）
6. 代码实现任务启用双 Agent TDD 模式（测试编写 Agent → 实现验证 Agent）
7. 并发启动 Agent 执行

#### Agent 分发方式（tmux 分屏优先，无 tmux 自动降级）

> 完整规则（含 CRITICAL 检查清单、工具调用模板、Delegate 模式）见 `~/.claude/skills/flow/references/agent-dispatch.md`

适用于 Stage 0~5 所有阶段。检测 `[ -n "$TMUX" ]` 并显式写出判定行后再分发（跳过检测 ≠ NO_TMUX）: Agent(name) 唯一命名并行分发（TeamCreate/team_name 已废弃）；在 tmux 且 pane 正常 → 自动分屏可视化；不在或 pane 故障 → **静默降级**为无分屏并发（不提示安装、不重试；Delegate 协议与规模档位不变）。

核心约束: Agent(name) 唯一命名 + 同消息并发 ≤ 4 + Delegate 协调不变 | IN_TMUX 且 pane 正常 → 自动分屏可视化 + 即时清理 pane；NO_TMUX 或 pane 故障 → 静默降级无分屏并发

#### 技能路由规则（详细指令见 references/skill-routing.md）

- 代码实现类 Agent → 注入 TDD 工作流指令（RED-GREEN-REFACTOR）
- 代码审查类 Agent → 注入 Spec 合规 + 代码质量审查指令
- 并行分发策略 + Agent 完成后清理流程 → 详见 `references/skill-routing.md`

#### 多阶段续接（Phase 间复用分屏）

Phase 间不应销毁 team，应复用空闲 Agent。检测 TaskList + tmux list-panes，然后: 空闲 Agent 够 → SendMessage 复用 | 不够 → 同 team 补充 | 过多 → 多余 shutdown | 孤儿面板 → kill-pane

#### Phase 间产出确认 (Spot-check)

每个 Phase 的 Agent 完成后，进入下一个 Phase 前做快速确认:
1. Agent 报告的创建/修改文件是否存在
2. `git log --oneline -3` 确认有新提交
3. 如有测试，确认测试通过

确认通过 → 更新 STATE.md。确认失败 → 标记为需修复，询问用户。

#### Agent 与 Pane 自动清理

> **适用范围（2026-08-28 补）**: 本节适用 **Stage 0-5 全部 agent 分发点**——含 Stage 3.5 plan-reviewer、Stage 3.6 面板等评审型 agent，非仅 Stage 4 执行 agent。任何「Agent completed 且不被复用」时点即应关闭。NO_TMUX 降级模式下清理对象是 **TaskStop 该命名 agent**（mailbox 型 agent 完成后静默 idle 不自动退出，「kill pane」仅为 tmux 附加动作，不能替代 agent 本体关闭）。实测教训：panel 五席评审返回后 idle 未清——规则挂在 Stage 4 语境 + pane 措辞掩盖 agent 本体清理，两因叠加未触发。

> 完整清理脚本（即时清理 + 孤儿清理 + 全局清理）见 `~/.claude/skills/flow/references/cleanup-procedure.md`

- 即时清理: Agent completed 且不被复用 → `TaskStop <name>`（NO_TMUX 唯一动作）/ shutdown → kill pane（IN_TMUX 附加）
- Phase 间孤儿清理: 检测残留 pane 并 kill
- 全局清理: 全部 Phase 完成 → TaskStop 全部（本体）→ 倒序 kill pane（TeamDelete 已废弃，无需调用）

#### Delegate 模式（主 Agent 协调协议）

主 Agent 是 Coordinator，不是 Implementor。专注于任务分配、进度追踪、异常处理、结果汇总。详见 `/multi-agent` SKILL.md。

#### 退回 Plan 协议（Stage 4 异常处理）

**核心理念**: 执行中遇到意外时，第一反应是"plan 哪里假设错了"，而不是"让我直接修"。

> 完整协议（含异常分类、Fallback 操作步骤、特殊情况处理）见 `references/fallback-protocol.md`

**关键规则**: 执行偏差 → 直接修复 | Plan 假设有误 → 触发 Plan Fallback（暂停→记录→分析→更新→确认→继续）| 同一 Phase 2 次 Fallback → 退回 Stage 2

**串行替代**: 当 `--no-multi` 时，在当前会话中按 task_plan.md 顺序逐步执行，每完成一个 Phase 更新 progress.md。

**STATE.md 写入**: 每个 Phase 的 Agent 完成后:
- 更新 `current_phase` 和 `completed_phases` 列表
- 记录该 Phase 的关键决策 (为什么选择 X 而非 Y)
- 更新 `progress` 百分比
- 设置 `next_action` 为下一个 Phase 或 "Stage 5 验证"
- 若上下文压力 > 75%，同时更新 `blockers` 并触发压缩

**跳过条件**: `--no-multi`

### Stage 5: Goal Verification（按目标契约完成验证）

**调用**: `superpowers:verification-before-completion`（通过 Skill tool 加载完整技能）

> 完整验证协议（含行为步骤、铁律、证据要求）见 `~/.claude/skills/flow/references/stage5-verification.md`

**铁律**: No completion claims without fresh verification evidence. 禁止 "should work"、"probably"。

Stage 5 不只验证命令是否通过，还必须逐条核对 Stage 0.5 Goal Contract 的 Success Criteria。最终总结前必须输出：

| Success Criteria | Evidence | Status |
|---|---|---|
| 来自 Goal Contract 的成功标准 | 命令输出 / 文件路径 / 测试结果 / 人工检查点 | Pass / Fail / Needs Review |

**完成状态只能使用**:
- `DONE`：所有 Success Criteria 均有新鲜证据证明通过
- `PARTIAL`：部分标准未完成，但剩余项、原因和下一步已明确列出
- `BLOCKED`：需要用户输入、权限、外部系统或需求确认

若任一 Success Criteria 为 `Fail` 或关键项为 `Needs Review`，不能声明 DONE，必须进入 Stage 5.5，或按失败类型回退：
- 执行偏差 → 返回 Stage 4 最小修复
- Plan 假设错误 → 返回 Stage 3 更新计划
- 目标或成功标准不清 → 返回 Stage 0.5 更新 Goal Contract

**STATE.md 写入**: 验证完成后设置 `current_stage: 5`，记录 Goal Verification 表。若全部通过: `status: completed`。若有失败: `next_action` 为 "Stage 5.5 迭代修复" 或对应回退 Stage。

**不可跳过**

### Stage 5.5: 自主迭代优化（参数控制）

**触发条件**: `--iterate N` 参数 或 Stage 5 验证结果中有未达标项
**调用**: `auto-iterate` skill（如果可用）；否则使用内置降级模式

> 完整协议（含参数构造、渐进式 Guard 策略、auto-iterate 集成、降级模式）见 `~/.claude/skills/flow/references/stage55-iteration.md`

**渐进式 Guard 策略**（推荐）: 早期冒烟测试 → 中期集成测试 → 后期全量测试。全量 guard 太早会扼杀创新方向探索。

**与 auto-iterate 集成**: 已安装 → 完整迭代协议（Guard 双检查、卡住策略、崩溃恢复） | 未安装 → 降级简化循环（分析→变更→commit→验证→keep/revert）

**每 5 轮迭代打印进度摘要，N 轮用完后打印最终总结**

**跳过条件**: 不使用 `--iterate` 参数且 Stage 5 全部达标

### Stage 5.7: Ralph Loop 强制持续（自动触发）

**触发条件**: Stage 5.5 迭代用完仍未达标 + Ralph Loop 插件已安装 + `--no-ralph` 未设置
**调用**: Ralph Loop 插件（Stop Hook 机制）
**参考**: `references/ralph-integration.md`

**核心理念**: Ralph Loop 通过 Stop Hook 拦截会话退出，注入一次性固定 prompt（含初始历史摘要 + 自主状态获取指令），在 auto-iterate 外层包裹"不达目的不罢休"的强制机制。每轮 Ralph 迭代内部仍使用 auto-iterate 的 keep/revert 协议，不是替代而是增强。LLM 每轮自行从 progress.md 读取最新状态。

**行为**:
1. 检查 Ralph Loop 插件可用性（Stage 0 已标记 `ralph_loop_available`）
2. 不可用 → 降级：提示用户手动启用或重启 auto-iterate
3. 可用 → 构造一次性固定 prompt（含初始 TSV 历史 + "自行从 progress.md 读取最新状态"指令）
4. 调用 `/ralph-loop` 启动循环，使用 `--completion-promise "FLOW_DEEP_COMPLETE"`
5. 每轮 Ralph 迭代: 执行 auto-iterate → 运行 Stage 5 验证 → 达标则输出 `<promise>`
6. 到达 `--ralph-max` 或达标 → 退出循环

**参数**:
- `--ralph-max N`: Ralph 总轮数（默认 10）
- `--no-ralph`: 禁用 Ralph Loop

**STATE.md 写入**: 启动时 `current_stage: 5.7` + `ralph_status: active`；每轮更新 `ralph_iteration`；完成时 `ralph_status: completed`

**跳过条件**: Stage 5.5 全部达标 | `--no-ralph` | Ralph Loop 插件未安装

### Stage 5.8: 跨会话经验沉淀（Cross-Session Distillation）

**触发条件**: Stage 5 Goal Verification 为 DONE（所有 Success Criteria 均有新鲜证据证明通过）
**调用**: auto-skill 的记录机制（第 5 步）

**核心理念**: 每次复杂任务不只产出代码/文档，还要把可复用经验沉淀回 auto-skill，形成跨会话 loop 的"写"端。只在验证通过后触发，避免把失败方案沉淀成误导。

**行为**:
1. 从 Goal Contract（Success Criteria + Constraints）+ 实际执行结果 + 过程中的关键决策中，提炼可复用经验
2. 按 auto-skill 记录判断准则分流:
   - 通用流程/决策逻辑/模板 → `knowledge-base/[category].md`
   - 某技能的踩坑/参数/配置/模板 → `experience/skill-xxx.md`
3. 判断价值: 这个经验下次能帮用户省时间吗？（满足 auto-skill "应该记录"准则才沉淀）
4. 主动询问用户是否记录本次经验（复用 auto-skill 第 5 步询问机制）
5. 用户同意后，按 auto-skill 条目格式写入并更新对应 `_index.json`

**沉淀维度参考**:
- 任务级经验（这类任务的最佳实践流程）→ knowledge-base
- 技能级经验（用 flow-deep/某 skill 时踩的坑）→ experience
- 不沉淀: 一次性操作、纯概念、已记录过的重复内容

**STATE.md 写入**: 记录本次沉淀的经验条目（文件路径 + 一句话摘要），供 `STATE.md.bak` 追溯。

**跳过条件**: `--no-distill` 或 Goal Verification 非 DONE

Stage 5 验证通过后的收尾工作:

1. **tmux 全局清理**（IN_TMUX 时）: shutdown 全部剩余 Agent → 倒序 kill 非 MAIN_PANE → 验证（TeamDelete 已废弃，无需调用）
2. 汇总所有 Agent 的执行结果
3. 更新 progress.md 和 task_plan.md 状态
4. **最终 STATE.md 写入**: 设置 `status: completed`，记录总结和后续建议，清空 `next_action`
5. 向用户展示最终结果和总结
6. 如有未完成的任务，提示后续步骤

## 使用示例

```
/flow-deep 重构认证系统

→ Stage 0: Superpowers 前置检查 ✓
→ Stage 0.5: Goal Contract（目标、成功标准、约束、验证计划）
→ Stage 1: Prompt 优化 → Stage 2: 深度思考 + 技能匹配(TDD+并行+审查)
→ Stage 3: Plan Mode → Stage 3.5: Plan Review → Stage 3.6: 多角色面板评审
→ Stage 4: Execution Router 选择 multi-agent（auth-core[TDD] + token-mgr[TDD]）
→ Stage 5: Goal Verification（逐条核对 Success Criteria）✓
```

```
/flow-deep 全面审查这个仓库的性能、安全和架构问题

→ Stage 0.5: Goal Contract 明确审查范围和成功标准
→ Stage 4: Execution Router 命中 Workflow Fit Gate
→ Workflow: Review Workflow（性能 / 安全 / 架构 fan-out → 去重 → 验证 → 综合）
→ Stage 5: Goal Verification 输出审查覆盖和证据表
```

## 参数速查

```
/flow-deep [options] <任务表述>

阶段: --no-prompt | --no-plan | --no-multi(串行) | --no-recall | --no-context-guard(禁用上下文容量检测弹窗)
思考: --think-hard(10K) | --no-think | --no-mermaid | --no-discuss | --no-skill-match
执行: --no-tdd | --tdd-dual | --no-review | --no-panel | --panel-roles "R01,R02" | --panel-depth quick|basic|advanced | --no-prime
迭代: --iterate N | --guard <cmd> | --ralph-max N | --no-ralph | --no-distill
调试: --dry-run(仅计划)
配置: --plan-dir <dir>（多 feature 用 .plan-feat-<name>/） | --agents <types> | --lang <zh|en>
```

## 注意事项

- Stage 0 不可跳过，Stage 2 默认全开（与 /flow 的核心区别）
- 每个阶段完成后向用户展示简报并确认，失败时不自动跳过
- ST 完成后将每一步 thought 排序展示

### 通用参数行为

`--dry-run` 仅预览 Stage 0-3 | `--agents <types>` 覆盖 Agent 类型 | `--lang <zh|en>` 输出语言 | `--no-tdd` 禁用 TDD | `--tdd-dual` 双 Agent TDD | `--no-review` 跳过代码审查 | `--no-prime` 禁用 prime-agent 自动路由（security-audit/code-verification 退回 Claude Code 原生）


