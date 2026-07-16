---
name: flow
description: >
  当用户说 /flow、复杂任务、多步骤任务、编排、先优化再规划再执行时使用此技能。
  将复杂任务拆分为"Prompt优化→深度思考→规划→并发执行"管道，支持 --quick/--think/--mermaid/--discuss 等参数。
  当任务涉及 3 个以上步骤、用户提到"编排"或"flow"、或需要组合多个技能时，都应使用此技能。
  简单单步任务不要使用。深度版用 /flow-deep。
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
  - TeamCreate
  - TeamDelete
  - SendMessage
  - TaskList
  - TaskCreate
  - TaskUpdate
  - TaskGet
  - EnterPlanMode
  - ExitPlanMode
---

# Flow - 复杂任务编排引擎

将多个技能串联为"优化 → 思考 → 规划 → 执行"的完整管道，通过参数灵活控制每个阶段。

## 触发条件

**TRIGGER when user:**
- 显式调用 `/flow <任务描述>`
- 请求处理复杂任务："帮我处理这个复杂任务"、"这个任务比较复杂"
- 请求编排式执行："先优化再规划再执行"、"从优化到执行"
- 使用关键词：flow、编排、管道、复杂任务流程
- 任务描述明确涉及多步骤、多角色、或需要拆分执行

**AUTO-DETECT:**
- 用户描述的任务涉及 3 个以上步骤
- 用户提及多个技能的组合使用（如"先 /prompt 再 plan 再 multi-agent"）

## 选型指南：何时用 flow vs flow-deep vs grill-me

> flow 是轻量编排。更轻用 grill-me，更重用 flow-deep。完整决策依据、组合用法、误用案例见 `references/selection-guide.md`。

**口诀**：小澄清 grill-me，大工程 flow-deep，中间 flow。拿不准问"做错了多难恢复"。

| 场景 | 入口 |
|------|------|
| 中等特性（3-5 步、单模块、可回滚） | **flow** |
| 核心重构 / 支付 / 认证 / 对外 / 安全 | **flow-deep** |
| 只想澄清、产出 design tree | **grill-me** |
| 方向都没定 | 自由对话 / brainstorming |

升级/降级信号、组合用法、三种误用 → 详见 `references/selection-guide.md`。交互式路由可用 `/ask-matt`（路由 mattpocock 体系，不覆盖 flow/flow-deep）。

## 必需依赖

| 依赖项 | 类型 | 用于阶段 |
|--------|------|---------|
| `/prompt` | Skill | Stage 1: Prompt 优化 |
| `planning-with-files` | Skill | Stage 3: 任务规划 |
| `/multi-agent` | Skill | Stage 4: 并发执行 |

**可选依赖**（按需启用）:

| 依赖项 | 类型 | 启用条件 |
|--------|------|---------|
| `/mermaid` | Skill | `--mermaid` 或 `--deep` |
| Sequential Thinking | **MCP** (不是 Skill) | `--think` / `--think-hard` 或 `--deep` |
| `/flow-deep` | Skill | `--code-plan` (Stage 3.6 需要 flow-deep 的 code-planning.md) |

**superpowers 技能依赖**（通过参数启用）:

| 依赖项 | 触发条件 | 用于阶段 | 调用方式 |
|--------|---------|---------|---------|
| `superpowers:brainstorming` | Stage 1.5 需求探索时（可选） | Stage 1.5: 需求探索 | 参考（不强制加载） |
| `superpowers:writing-plans` | `--code-plan` | Stage 3.6: 代码级细化 | Skill tool 加载 |
| `superpowers:test-driven-development` | `--tdd` | Stage 4: TDD 注入 | Agent 内 Skill tool 加载 |
| `superpowers:dispatching-parallel-agents` | `--deep` 或自动检测 | Stage 4: 并行分发 | Agent 内 Skill tool 加载 |
| `superpowers:requesting-code-review` | `--review` | Stage 4: 代码审查 | Agent 内 Skill tool 加载 |
| `superpowers:verification-before-completion` | 默认启用 | Stage 5: 完成验证 | Skill tool 加载完整规范 |

> **调用原则**: 标注 "Skill tool 加载" 的依赖，必须在对应 Stage 开始时通过 Skill tool 加载完整技能内容，而非使用简化版指令。Agent 内加载指在 Agent prompt 中要求 Agent 自行调用 Skill tool。

**迭代增强依赖**（参数控制）:

| 依赖项 | 触发条件 | 用于阶段 |
|--------|---------|---------|
| `auto-iterate` | `--iterate N` 参数 | Stage 5.5: 自主迭代优化 |
| `superpowers:systematic-debugging` | 遇到 bug 或测试失败 | Stage 5.5: 系统化调试 |
| `ralph-loop` 插件 | `--ralph` 参数 | Stage 5.7: Ralph Loop 强制持续 |

## 核心架构

```
用户输入 (任务表述)
    │
    ▼
┌─────────────────────┐
│ Stage 1: Prompt 优化  │  --no-prompt 跳过
│   调用 /prompt 技能    │
└─────────┬───────────┘
          │ 优化后的任务表述
          ▼
┌─────────────────────┐
│ Stage 1.5: 需求探索   │  条件触发（3+ 不确定项时）
│   AskUserQuestion    │  参考 superpowers:brainstorming
└─────────┬───────────┘
          │ 明确后的任务表述
          ▼
┌─────────────────────┐
│ Stage 2: 深度思考     │  --think / --think-hard / --mermaid / --discuss
│   (可选预处理)        │  默认跳过，按需开启
└─────────┬───────────┘
          │ 深度分析结论
          ▼
┌─────────────────────┐
│ Stage 3: 确定性规划    │  --no-plan 跳过
│   EnterPlanMode(默认) │  --strict-plan 默认启用
│   + plan-quality 标准 │  --precise-plan 强制精确
│   planning-with-files │  --plan-dir 自定义目录
└─────────┬───────────┘
          │ task_plan.md / findings.md / progress.md
          ▼
┌─────────────────────┐
│ Stage 3.5: Plan Review│  --plan-review 启用（半自动）
│   独立 Agent 审查     │  --deep 时建议启用
│   (两个 Claude 模式)  │
└─────────┬───────────┘
          │ 审查报告 + 用户确认
          ▼
┌─────────────────────┐
│ Stage 3.6: 代码级细化 │  --code-plan 启用
│   superpowers:       │  需 flow-deep 依赖
│   writing-plans      │
└─────────┬───────────┘
          │ TDD 细化后的 plan
          ▼
┌─────────────────────┐
│ Stage 4: 并发执行     │  --no-multi 跳过(改为串行)
│   /multi-agent       │  含退回 Plan 协议
│   (异常→退回Stage3)  │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Stage 4.5: Agent 清理│  IN_TMUX 时执行
│   tmux + TeamDelete  │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Stage 5: 完成验证     │  --no-verify 跳过
│   verification       │  默认启用
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Stage 5.5: 迭代优化   │  --iterate N 启用
│   auto-iterate       │  验证失败时触发
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Stage 5.7: Ralph Loop│  --ralph 启用（参数触发）
│   Stop Hook 强制持续  │  Stage 5.5 用完仍未达标时
└─────────┬───────────┘
          │
          ▼
      执行结果
```

**Mermaid 输出规范**: 输出 Mermaid 代码块后，应紧接着输出 ASCII 字符画版本。

> 轻量编排引擎。如需全量深度管道（含 superpowers 前置检查 + 强制深度思考），请使用 `/flow-deep`。

## 参数速查

```
/flow [options] <任务表述>

阶段控制:                          思考增强:
  --no-prompt   跳过 Stage 1         --think         Sequential Thinking (4K)
  --no-plan     跳过 Stage 3         --think-hard    Sequential Thinking (10K)
  --no-multi    跳过 Stage 4(串行)    --mermaid       Mermaid 图可视化
                                    --discuss       三角色讨论
Plan 质量:                          superpowers 技能:
  --strict-plan  Stage 3 进入       --code-plan   Stage 3.6 代码级细化
                 Plan Mode (默认开)  --tdd         Agent 注入 TDD
  --no-strict-plan 禁用 Plan Mode   --review      代码审查
  --precise-plan 强制精确 Plan       --compact     上下文 >60% 压缩
  --plan-review  Stage 3.5 审查
                 (两个 Claude 模式)
迭代增强:                           配置:
  --iterate N     Stage 5.5 迭代     --plan-dir <dir>  规划目录（多 feature 用 .plan-feat-<name>/）
  --guard <cmd>   迭代防回归         --agents <types>  Agent 类型
  --ralph         Stage 5.7 Ralph    --lang <zh|en>    输出语言
  --ralph-max N   Ralph 轮数(默认10) --dry-run         仅计划不执行
  --no-verify     跳过 Stage 5

预设 (互斥):
  --quick     ≡ --no-prompt --no-plan --no-multi
  --standard  完整三步流程（默认）
  --deep      ≡ --think --mermaid --discuss (+ 自动建议 --plan-review) (+ superpowers: dispatching-parallel-agents)
```

## 执行流程

### 前置处理

1. **解析参数**: 从用户输入中提取 `--` 参数和任务表述
2. **能力检测**: 检查 `~/.claude/skills/auto-iterate/SKILL.md` 是否存在，标记 `iterate_available: true/false`（影响 Stage 5.5 使用完整模式还是降级模式）
3. **确认任务**: 向用户展示解析结果，确认任务范围和参数配置

```
/flow --think --plan-dir docs/plan 重构支付系统，支持多币种

解析结果:
  任务: 重构支付系统，支持多币种
  启用阶段: prompt优化 → 深度思考 → 规划 → 并发执行
  规划目录: docs/plan/
  思考模式: Sequential Thinking (4K)
```

### Stage 1: Prompt 优化

**调用**: `/prompt <任务表述>`

**输入**: 用户的原始任务表述
**输出**: 优化后的任务表述（评分报告 + 优化版本）

**行为**:
- 使用 prompt 技能对任务表述进行评分和优化
- 将优化后的版本作为后续阶段的输入
- 如果评分 >= 8/10，提示用户原始表述已足够好，询问是否跳过

**跳过条件**: `--no-prompt`

### Stage 1.5: 需求探索（条件触发）

**触发条件**: Stage 1 完成后，优化后的任务表述中存在 3+ 不确定项或明确度 < 7 的关键决策点。

> 完整协议（含触发条件、行为步骤、AskUserQuestion 示例）见 `references/needs-exploration.md`

**核心行为**: 识别不确定项 → 评分明确度 → 主动追问 → 合并结果 → 记录到 findings.md

**追问要点**: 问题要具体（"支持哪些币种？" 而非 "还有其他需求？"），每个问题提供 3-4 选项含推荐默认值。

**跳过条件**: 不确定项 < 3 或所有不确定项明确度 >= 7

### Stage 2: 深度思考（可选）

**输入**: 优化后的任务表述

根据启用的参数执行不同的预处理：

#### --think / --think-hard

调用 Sequential Thinking MCP 进行结构化思考（6 个维度：任务分解、依赖分析、风险评估、资源需求、执行策略、Superpowers 技能匹配），完成后展示结论并记录到 findings.md。详见 `references/stage2-details.md`。

**技能匹配确认钩子**（第 6 维度完成后）:
- 如果第 6 维度匹配到 2+ 个 superpowers 技能，使用 AskUserQuestion 确认匹配结果
- 问题示例: "分析匹配到以下技能: TDD + 代码审查 + 并行分发。是否全部启用，还是选择性启用？"
- 用户可调整匹配结果后再进入 Stage 3

#### --mermaid

使用 mermaid 技能可视化任务结构（任务分解图 / 依赖关系图 / 执行流程图）。因终端无法渲染图形工具，输出遵循全局 CLAUDE.md Mermaid 图表规范（Mermaid 代码块 + ASCII 字符画双输出）。详见 `references/stage2-details.md`。

#### --discuss

三角色讨论模式，根据任务类型自动匹配角色，经两轮讨论后综合形成最佳方案，结果记录到 findings.md。详见 `references/stage2-details.md`。

### Stage 3: 确定性规划

**遵循**: `planning-with-files` 模板格式 + `references/plan-quality.md` 质量标准

> 注意: `--strict-plan` 模式下，Plan Mode 内部无法调用 Skill tool，因此手动遵循 planning-with-files 的模板格式组织 plan 内容，而非调用该 skill。

#### --strict-plan 模式（默认启用）

**核心理念**: 进入 Claude Code 的 Plan Mode（只读沙箱），强制"先想后做"纪律。Plan Mode 中只能探索代码库和写 plan 文件，不能编辑代码，确保设计质量。

**启用条件**: 默认启用（`--standard` 和 `--deep` 预设自动包含）
**跳过条件**: `--quick` 预设 或 `--no-plan`

**行为**:

**[Plan Mode 内部]** — 调用 `EnterPlanMode` 进入只读沙箱:
1. 用 Glob/Grep/Read 探索代码库，理解现有结构
2. 基于优化后的表述和深度思考结论，设计实现方案
3. 将方案写入系统指定的 plan 文件（遵循 planning-with-files 模板 + plan-quality.md Checklist）

**[Plan Mode 边界]** — 调用 `ExitPlanMode` 提交 plan 供用户审批

**[Plan Mode 外部]** — 用户审批通过后:
4. 将审批通过的 plan 形式化为:
   - `task_plan.md` — 分阶段任务计划（写入 `--plan-dir` 指定目录）
   - `findings.md` — 研究发现
   - `progress.md` — 执行进度追踪
5. 对生成的 plan 执行 plan-quality.md 中的 Quality Checklist 自检
6. 向用户展示质量评分，确认后进入 Stage 3.5

**Plan Mode 的约束**（系统级强制）:
- 可以: Read、Glob、Grep、AskUserQuestion、写 plan 文件
- 不可以: Edit、Write（项目文件）、Bash、修改代码库

**为什么默认启用**:
- Plan Mode 的审批环节（ExitPlanMode）确保 plan 质量，比单纯靠"自律"更可靠
- 只读沙箱防止"边想边改"的冲动，强制先完成设计再动手
- 用户可以在审批时直接修改 plan，比事后修正成本低得多

#### 非 strict-plan 模式（--quick 时）

不进入 Plan Mode，直接用 `planning-with-files` 生成 plan 文件。适用于简单任务或已明确方案的场景。

**规划要点**（两种模式通用）:
- 每个 Phase 应标注可否并行
- Phase 间的依赖关系要明确
- 每个 Phase 要有明确的完成标准
- **确定性要求**（`--precise-plan` 或 `--deep` 时强制）:
  - 精确文件路径（创建/修改的具体文件）
  - 行号范围或函数签名
  - 变更内容描述（禁止 placeholder）
  - 验证条件（命令 + 预期输出）
  - 详见 `references/plan-quality.md`

**质量评分**: 生成 plan 后按 plan-quality.md 的评分标准自检，>= 8/10 合格

**跳过条件**: `--no-plan`

### Stage 3.5: Plan Review — 两个 Claude 审查模式（可选）

**触发条件**: `--plan-review` 参数启用，或 `--deep` 时自动建议
**参考文档**: `references/plan-review.md`

**核心理念**: 用独立 Agent（全新上下文）审查 plan，消除"沉没成本偏差"——第一个 Claude 花了很多时间想方案，心理上不愿推翻，而审查 Agent 没有这个包袱。

**行为**（半自动模式）:
1. 读取 Stage 3 生成的 task_plan.md 全部内容
2. 启动一个独立 Agent（subagent_type: general-purpose, name: plan-reviewer）
3. Agent 以 Staff Engineer 角色审查 6 个维度:
   - 架构合理性 / 遗漏边界情况 / 安全风险 / 性能影响 / Plan 假设验证 / 可执行性
4. Agent 返回审查报告（APPROVED / APPROVED_WITH_NOTES / NEEDS_REVISION）
5. **暂停，向用户展示审查报告** ← 半自动: 等待用户确认
6. 用户决策:
   - APPROVED → 继续 Stage 3.6
   - APPROVED_WITH_NOTES → 选择性采纳建议，更新 plan 后继续
   - NEEDS_REVISION → 退回 Stage 3 修改 plan
7. 审查结果写入 findings.md 的 Plan Review 章节

**自动建议条件**（不自动执行，仅提示用户）:
- 改动影响 3+ 模块
- 涉及技术选型
- 有安全/数据风险
- plan 包含 5+ Phase

**跳过条件**: 不使用 `--plan-review` 参数且未接受建议

### Stage 3.6: 代码级细化（可选）

**触发条件**: `--code-plan` 参数启用时
**调用**: `superpowers:writing-plans`
**依赖声明**: 读取 `~/.claude/skills/flow-deep/references/code-planning.md`（agent_hint 格式、TDD 步骤模板）。需要用户已安装 `/flow-deep` skill，否则该功能不可用，应提示用户安装 flow-deep 后重试。

**行为**: 对每个含代码实现的 Phase 细化为 TDD 步骤（每步 2-5 分钟，含完整代码，无 placeholder）

**默认**: 跳过。仅 `--code-plan` 时启用。

### Stage 4: 并发执行

**调用**: `/multi-agent` 技能（可选注入 superpowers 技能指令）

**行为**:
1. 读取 task_plan.md 中的任务分解
2. 识别可并行的子任务组
3. 为每个子任务分配合适的 Agent 类型
4. **按需注入技能指令**（详细指令见 `references/skill-routing.md`）:
   - `--tdd`: 代码实现 Agent 注入 TDD 工作流
   - `--review`: 代码实现完成后触发审查
   - `--deep`: 启用 `dispatching-parallel-agents` 并行分发
5. 生成可执行的 Agent Teams 方案
6. 并发启动 Agent 执行

#### Agent 分发方式（tmux 分屏优先，全阶段通用）

> 完整规则（含 CRITICAL 检查清单、工具调用模板、Delegate 模式）见 `references/agent-dispatch.md`

核心约束: tmux-split 唯一模式 → TeamCreate + team_name → 禁止 run_in_background → 完成后即时清理

**串行替代**: 当 `--no-multi` 时，在当前会话中按 task_plan.md 顺序逐步执行，每完成一个 Phase 更新 progress.md。

#### 退回 Plan 协议（Stage 4 异常处理）

**核心理念**: 执行中遇到意外时，第一反应是"plan 哪里假设错了"，而不是"让我直接修"。

> 完整协议（含异常分类、Fallback 操作步骤、特殊情况处理）见 `references/fallback-protocol.md`

**关键规则**: 执行偏差 → 直接修复 | Plan 假设有误 → 触发 Plan Fallback（暂停→记录→分析→更新→确认→继续）| 同一 Phase 2 次 Fallback → 退回 Stage 2

**跳过条件**: `--no-multi`

### Stage 4.5: Agent 与 Pane 清理

> 完整清理脚本（即时清理 + 孤儿清理 + 全局清理）见 `references/cleanup-procedure.md`

Stage 4 完成后执行三层清理: 即时清理（Agent completed → shutdown → kill pane）→ 孤儿清理（残留 pane）→ 全局清理（倒序 kill + TeamDelete）

### Stage 5: 完成验证

**调用**: `superpowers:verification-before-completion`（通过 Skill tool 加载完整技能）

> 完整验证协议（含行为步骤、铁律、证据要求）见 `references/stage5-verification.md`

**铁律**: No completion claims without fresh verification evidence. 禁止 "should work"、"probably"。

**跳过条件**: `--no-verify`

### Stage 5.5: 迭代优化（条件触发）

**触发条件**（满足任一即触发）: `--iterate N` 参数 或 Stage 5 验证未达标（自动触发，默认 3 轮）

> 完整协议（含参数构造、渐进式 Guard、auto-iterate 集成、降级模式）见 `references/stage55-iteration.md`

**调用**: `auto-iterate` skill（如果可用）；否则使用内置降级模式（分析→变更→commit→验证→keep/revert）

**跳过条件**: 不使用 `--iterate` 参数且 Stage 5 全部达标

### Stage 5.7: Ralph Loop 强制持续（参数触发）

**触发条件**: `--ralph` 参数启用 + Stage 5.5 迭代用完仍未达标 + Ralph Loop 插件已安装
**调用**: Ralph Loop 插件（Stop Hook 机制）
**参考**: `~/.claude/skills/flow-deep/references/ralph-integration.md`

**核心理念**: Ralph Loop 通过 Stop Hook 拦截会话退出，注入一次性固定 prompt（含初始历史摘要 + 自主状态获取指令），在 auto-iterate 外层包裹"不达目的不罢休"的强制机制。

**行为**:
1. 检查 Ralph Loop 插件是否已安装（前置处理中已标记）
2. 不可用 → 提示用户安装 Ralph Loop 插件
3. 可用 → 构造一次性 prompt（含初始 TSV 历史 + "自行从 progress.md 读取最新状态"指令）
4. 调用 `/ralph-loop` 启动循环，使用 `--completion-promise "FLOW_COMPLETE"`
5. LLM 每轮自行读取 progress.md 获取最新迭代状态，执行 auto-iterate，运行 Stage 5 验证
6. 达标输出 `<promise>` 或到达 `--ralph-max` → 退出循环

**参数**:
- `--ralph`: 启用 Ralph Loop（flow 中为参数触发，非自动触发）
- `--ralph-max N`: Ralph 总轮数（默认 10）
- `--no-ralph`: 禁用（仅在与其他参数组合时有用）

**跳过条件**: 未使用 `--ralph` | Stage 5.5 全部达标 | Ralph Loop 插件未安装

1. **tmux 全局清理**（IN_TMUX 时）: shutdown 全部剩余 Agent → 倒序 kill 非 MAIN_PANE → TeamDelete
2. 汇总所有 Agent 的执行结果
3. 更新 progress.md 和 task_plan.md 状态
4. 向用户展示最终结果和总结
5. 如有未完成的任务，提示后续步骤
6. **触发 Stage 5 完成验证**（若 Stage 5 未执行则在此触发；`--no-verify` 可跳过）

## 使用示例

> 详细示例（标准流程 / 深度分析 / Plan Review 场景 / 常用参数组合）见 `references/usage-examples.md`

**快速参考**:
```
/flow --think --mermaid --plan-dir docs/plan 重构支付系统
→ Stage 1: 优化 → Stage 2: 思考+Mermaid → Stage 3: 规划 → Stage 4: 并发执行
```

### 通用参数行为

- **`--compact`**: 当上下文使用率 >60% 时，自动压缩中间结果（Sequential Thinking 输出摘要化、代码级计划保留 agent_hint 摘要）
- **`--agents <types>`**: 指定 Agent 类型（逗号分隔），覆盖 Stage 4 自动匹配的 subagent 类型。例如 `--agents backend-developer,security-auditor`
- **`--lang <zh|en>`**: 设置所有用户面向消息的输出语言。默认 `zh`
- **`--dry-run`**: 执行 Stage 1-3 后停止，不进入 Stage 4/5。用于预览计划输出
- **`--no-strict-plan`**: Stage 3 不进入 Plan Mode，直接用 planning-with-files 生成 plan（适用于简单任务或已明确方案的场景）

## 注意事项

- 每个阶段完成后，向用户展示简报并确认是否继续
- 如果某个阶段失败，不要自动跳过，而是报告错误并询问用户
- 三角色讨论中的角色选择应基于任务类型自动匹配，但允许用户调整
- Mermaid 图应聚焦于任务结构和依赖关系，不要过度美化
- 规划文件应使用 planning-with-files 的模板格式，保持兼容性
- **Plan 质量**: Stage 3 生成的 plan 应满足 `references/plan-quality.md` 的 Checklist，特别是 `--precise-plan` 或 `--deep` 时
- **退回 Plan 纪律**: Stage 4 中遇到 Plan 假设有误时，不要"硬推"就地修复，而应触发 Fallback 协议（详见 `references/fallback-protocol.md`）
- **Plan Review 半自动**: 审查 Agent 只输出报告，不自动修改 plan。用户确认后才继续
