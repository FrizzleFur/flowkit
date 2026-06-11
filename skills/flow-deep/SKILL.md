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

# Flow Deep - 全量深度任务编排引擎

`/flow` 的深度版本，默认启用全部阶段，适用于复杂、重要、高风险任务。

## 必需依赖

| 依赖项 | 类型 | 用于阶段 |
|--------|------|---------|
| `using-superpowers` | Skill | Stage 0: 前置检查 |
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

关键路径: Stage 0 → capability-registry + STATE.md | Stage 3 → plan-quality + context-management | Stage 4 → skill-routing + fallback-protocol

## 触发条件

**TRIGGER when user:**
- 显式调用 `/flow-deep <任务描述>`
- 请求深度编排："深度分析这个任务"、"用全量管道处理"
- 使用关键词：flow-deep、深度编排、全量管道、复杂任务深度分析
- 任务明确标注为复杂/重要/高风险

## 核心架构

```
Stage 0: Superpowers 检查 (强制) → Stage 1: Prompt 优化 (--no-prompt)
  → Stage 2: 深度思考 (全开: ST+Mermaid+三角色+技能匹配)
    → Stage 3: 确定性规划 (Plan Mode 强制 + plan-quality 标准)
      → Stage 3.5: Plan Review (独立 Agent 审查，强制)
        → Stage 3.6: 多角色面板评审 (--no-panel 可跳过)
          → Stage 3.7: 代码级细化 (条件触发)
            → Stage 4: 智能执行 (/multi-agent + TDD + 退回Plan协议 + Phase 间产出确认)
              → Stage 5: 完成验证 (强制) → [Stage 5.5: 迭代优化 (--iterate N)] → [Stage 5.7: Ralph Loop 强制持续 (自动触发)]
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

| 检查点 | 阈值 | 自动动作 |
|--------|------|---------|
| Stage 2 后 | > 65% | 压缩 ST 输出为摘要 |
| Stage 3.7 后 | > 70% | 压缩代码级计划为 agent_hint 摘要 |
| Stage 4 每个 Agent 后 | > 75% | 压缩中间结果 |
| 任意时刻 | > 85% | 警告用户，建议 `/compact` |

STATE.md 活记忆（< 80 行）维护在 `.plan/STATE.md`，模板和恢复协议见 `references/context-management.md`。

## 执行流程

### 前置处理

1. **解析参数**: 从用户输入中提取 `--` 参数和任务表述
2. **恢复检查**: 检查 `--plan-dir` (默认 `.plan`) 下是否存在 `STATE.md`:
   - 若存在 → 读取 STATE.md，向用户展示上次中断位置，询问"恢复上次进度"还是"重新开始"
   - 若恢复 → 跳到 STATE.md 中记录的 `next_action` 对应的 Stage
   - 若重新开始 → 备份旧 STATE.md 为 `STATE.md.bak`，继续正常流程
3. **确认任务**: 向用户展示解析结果，确认任务范围和参数配置

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
   e. **关键能力检测**: 显式检查以下能力并标记状态:
      - `auto-iterate` skill: `iterate_available: true/false`（影响 Stage 5.5 完整/降级模式）
      - `ralph-loop` 插件: `ralph_loop_available: true/false`（影响 Stage 5.7 是否可用）
4. 向用户展示：必需依赖状态 ✓/✗ + 可用能力概览（含 iterate_available 和 ralph_loop_available 状态）
5. 如有必需依赖不可用，报告缺失项并询问用户是否继续

**不可跳过**

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

**触发条件**: Stage 1 完成后，优化后的任务表述中存在 3+ 不确定项或明确度 < 7 的关键决策点。

> 完整协议（含触发条件、行为步骤、AskUserQuestion 示例）见 `~/.claude/skills/flow/references/needs-exploration.md`

**核心行为**: 识别不确定项 → 评分明确度 → 主动追问 → 合并结果 → 记录到 findings.md

**追问要点**: 问题要具体（"支持哪些币种？" 而非 "还有其他需求？"），每个问题提供 3-4 选项含推荐默认值。

**跳过条件**: 不确定项 < 3 或所有不确定项明确度 >= 7

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
1. 用 Glob/Grep/Read 探索代码库，理解现有结构
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

**行为**:
1. **角色选择**:
   - 读取 `references/panel-review.md` 中的角色目录（8 个角色）
   - 根据任务类型自动选择 3 个最相关角色（`--panel-depth basic`，默认）
   - `--panel-depth advanced` 选 5 个角色
   - 用户可通过 `--panel-roles "R02,R03,R06"` 覆盖自动选择
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

### Stage 3.7: 代码级细化（条件触发）

**触发条件**: Stage 2 第6维（技能匹配）识别到 `code-implementation` 类型任务
**调用**: `superpowers:writing-plans`（通过 Skill tool 加载完整技能）
**跳过条件**: 任务不涉及代码实现（纯分析/研究/文档任务）
**读取**: `references/code-planning.md` — 输出格式、agent_hint 字段定义、TDD 步骤模板

> **注意**: 必须通过 Skill tool 加载 writing-plans 完整规范（包括 bite-sized 任务粒度、No Placeholders 规则、Self-Review checklist），而非自行简化。

### Stage 4: 智能执行

**调用**: `/multi-agent` 技能（注入 superpowers 技能指令）

**行为**:
1. 读取 task_plan.md 中的任务分解
2. 读取 Stage 3.7 生成的每个 Phase 的 `agent_hint`（定义见 `references/code-planning.md`）
3. 识别可并行的子任务组
4. 为每个子任务分配合适的 Agent 类型（`agent_hint.subagent`）
5. **根据技能路由规则为每个 Agent 注入对应指令**（`agent_hint.type` → 路由表）
6. 代码实现任务启用双 Agent TDD 模式（测试编写 Agent → 实现验证 Agent）
7. 并发启动 Agent 执行

#### Agent 分发方式（tmux 分屏优先）

> 完整规则（含 CRITICAL 检查清单、工具调用模板、Delegate 模式）见 `~/.claude/skills/flow/references/agent-dispatch.md`

适用于 Stage 0~5 所有阶段。首次使用前检测 `[ -n "$TMUX" ]`，若不在 tmux 中则提示用户启动。

核心约束: tmux-split 唯一模式 → TeamCreate + team_name → 禁止 run_in_background → 完成后即时清理

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

> 完整清理脚本（即时清理 + 孤儿清理 + 全局清理）见 `~/.claude/skills/flow/references/cleanup-procedure.md`

- 即时清理: Agent completed 且不被复用 → shutdown → kill pane
- Phase 间孤儿清理: 检测残留 pane 并 kill
- 全局清理: 全部 Phase 完成 → shutdown 全部 → 倒序 kill → TeamDelete

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

### Stage 5: 完成验证

**调用**: `superpowers:verification-before-completion`（通过 Skill tool 加载完整技能）

> 完整验证协议（含行为步骤、铁律、证据要求）见 `~/.claude/skills/flow/references/stage5-verification.md`

**铁律**: No completion claims without fresh verification evidence. 禁止 "should work"、"probably"。

**STATE.md 写入**: 验证完成后设置 `current_stage: 5`，记录结果。若全部通过: `status: completed`。若有失败: `next_action` 为 "Stage 5.5 迭代修复"。

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

Stage 5 验证通过后的收尾工作:

1. **tmux 全局清理**（IN_TMUX 时）: shutdown 全部剩余 Agent → 倒序 kill 非 MAIN_PANE → 验证 → TeamDelete
2. 汇总所有 Agent 的执行结果
3. 更新 progress.md 和 task_plan.md 状态
4. **最终 STATE.md 写入**: 设置 `status: completed`，记录总结和后续建议，清空 `next_action`
5. 向用户展示最终结果和总结
6. 如有未完成的任务，提示后续步骤

## 使用示例

```
/flow-deep 重构认证系统

→ Stage 0: Superpowers 前置检查 ✓
→ Stage 1: Prompt 优化 → Stage 2: 深度思考 + 技能匹配(TDD+并行+审查)
→ Stage 3: Plan Mode → Stage 3.5: Plan Review → Stage 3.6: 多角色面板评审
→ Stage 4: multi-agent 并发执行（auth-core[TDD] + token-mgr[TDD]）
→ Stage 5: 完成验证 ✓
```

## 参数速查

```
/flow-deep [options] <任务表述>

阶段: --no-prompt | --no-plan | --no-multi(串行)
思考: --think-hard(10K) | --no-think | --no-mermaid | --no-discuss | --no-skill-match
执行: --no-tdd | --tdd-dual | --no-review | --no-panel | --panel-roles "R01,R02" | --panel-depth basic|advanced
迭代: --iterate N | --guard <cmd> | --ralph-max N | --no-ralph
调试: --dry-run(仅计划)
配置: --plan-dir <dir> | --agents <types> | --lang <zh|en>
```

## 注意事项

- Stage 0 不可跳过，Stage 2 默认全开（与 /flow 的核心区别）
- 每个阶段完成后向用户展示简报并确认，失败时不自动跳过
- ST 完成后将每一步 thought 排序展示

### 通用参数行为

`--dry-run` 仅预览 Stage 0-3 | `--agents <types>` 覆盖 Agent 类型 | `--lang <zh|en>` 输出语言 | `--no-tdd` 禁用 TDD | `--tdd-dual` 双 Agent TDD | `--no-review` 跳过代码审查


