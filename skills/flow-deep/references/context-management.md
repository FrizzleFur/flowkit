# Stage X: 上下文管理详细指令

> 本文件由 flow-deep SKILL.md 引用，在长时间运行时按需执行。

## STATE.md 活记忆

### 概念

STATE.md 是 flow-deep 管道的跨会话持久化文件，存放在 `<plan-dir>/STATE.md`（默认 `.plan/STATE.md`；多 feature 项目用 `.plan-feat-<name>/STATE.md` 隔离上下文）。它解决的核心问题: 当对话上下文被 `/clear` 或因 token 溢出重置时，flow-deep 能从精确位置恢复，而不是从头开始。

**Run ID 与 Workflow Name（借鉴 OTel workflow.run_id / workflow.name 语义）**: 每次工作流运行分配唯一 Run ID（如 `flow-deep-20260707-1430-pay-refactor`），用于：① 跨会话恢复时明确"这是哪个 run" ② Stage 5.8 经验沉淀时标注来源 run，便于回溯 ③ 多 feature 并行时（.plan-feat-<name>/）避免运行串台。这是文件层的命名空间，不依赖 OTel 基础设施——原生 OTel 属性面向配了 OpenTelemetry 后端的用户，skill 层只在 STATE.md 借鉴其"运行实例可追溯"的思路。

**设计借鉴**: 源自 GSD 的 STATE.md 模式 -- 一个精简的 (< 80 行) 活记忆文件。

### 文件模板

```markdown
# Flow-Deep State

## Task Reference
Run ID: flow-deep-[YYYYMMDD-HHMM]-[slug]  # 唯一运行标识（借鉴 OTel workflow.run_id；溯源+多feature隔离）
Workflow Name: [任务简短标识]  # 对应 OTel workflow.name
Task: [任务表述]
Plan Dir: .plan/  # 或 .plan-feat-<name>/（多 feature 项目，参见 planning-with-files）

## Current Position
Stage: [0-5 / completed]
Phase: [current-phase-id / null]
Status: [initializing / thinking / planning / executing / verifying / completed]
Last Updated: [YYYY-MM-DD HH:MM]

Progress: [N/M phases done, ~X%]

## Stage 2 Conclusions (compact)
**Core Decision**: [一句话核心结论]
**Phases**: [N phases, M parallelizable]
**Risk Top-3**: [risk-1, risk-2, risk-3]
**Skill Match**: [TDD / parallel / review / iterate]

## Phase Progress

| Phase | Description | Status | Key Decision |
|-------|-------------|--------|-------------|
| 1 | [desc] | completed | [decision or -] |
| 2 | [desc] | in_progress | - |
| 3 | [desc] | pending | - |

## Decisions Log
- [Stage/Phase] [decision]: [why] — [timestamp]

## Blockers / Concerns
- (none / or list active blockers)

## Session Continuity
Last Session: [YYYY-MM-DD HH:MM]
Stopped At: [what was happening]
Next Action: [specific action to resume — must be actionable without reading other files]
```

### 更新规则

| 触发时机 | 更新区块 | 注意事项 |
|----------|---------|---------|
| Stage 0-2 | (无 STATE.md) | 不创建文件。这些阶段快速且依赖对话上下文，中断时直接从对应 Stage 重做 |
| Stage 3 完成 | Current Position, Stage 2 Conclusions, Phase Progress | 首次创建 STATE.md |
| Stage 3.5 完成 | Phase Progress (Plan Review 结论) | 强制启用 |
| Stage 3.6 完成 | Phase Progress (Panel Review 结论) | 默认启用 |
| Stage 3.7 完成 | Phase Progress (agent_hints 摘要) | 仅代码任务触发 |
| Stage 4 每个 Phase 完成 | Current Position, Phase Progress, Decisions Log | 记录该 Phase 的关键决策 |
| Stage 5 完成 | Current Position (status), Blockers | 记录未通过项 |
| 执行后处理 | Current Position (completed), 清空 Next Action | 最终状态 |
| 暂停/中断 | Session Continuity | 必须写 Next Action |

### 恢复协议

当 flow-deep 启动时检测到 `.plan/STATE.md` 存在:

1. **读取** STATE.md 的 Current Position 和 Session Continuity
2. **展示** 给用户: "上次停在 Stage X Phase Y: [last action]。是否恢复?"
3. **恢复路径**:
   - Stage 0-2 中断 → 从中断的 Stage 重新开始 (这些阶段快速且依赖上下文)
   - Stage 3 中断 → 重新规划 (规划依赖思考上下文)
   - Stage 4 中断 → 从 STATE.md 的 Phase Progress 继续 (执行结果已 git commit)
   - Stage 5 中断 → 直接重新验证
4. **重新开始**: 备份 STATE.md → STATE.md.bak，重新走全流程

### 大小控制

STATE.md 必须 < 80 行。如果超过:
- Decisions Log 只保留最近 5 条 (完整记录在 findings.md)
- Blockers 只保留活跃项 (已解决的删除)
- Phase Progress 用表格而非列表

**原则**: STATE.md 是"读取一次即知当前位置"的摘要，不是详细档案。详细信息引用 task_plan.md / findings.md / progress.md。

---

## 触发条件

| 条件 | 检测方式 | 优先级 |
|------|---------|--------|
| System warning "context exceeds N%" | 系统提示 | P0 |
| 阶段完成后预估使用 > 70% | 人工判断 | P1 |
| Agent 返回 usage > 100K tokens | 工具返回 | P2 |

## 压缩矩阵

### Stage 2 输出压缩

| 内容 | 原始形式 | 压缩形式 | 压缩率 |
|------|---------|---------|--------|
| Sequential Thinking | 完整思考过程 | 最终结论 + 3 个关键 insight | 70% |
| Mermaid 图 | 完整代码 | 描述性摘要 + 关键节点 | 80% |
| 三角色讨论 | 两轮对话 | 综合方案（1-2 段） | 75% |

**压缩模板**:
```markdown
## Stage 2 摘要

**结论**: [一句话核心结论]

**子任务**: [N 个，M 个可并行]
- Task 1: [描述] → 可并行
- Task 2: [描述] → 依赖 Task 1
- ...

**技能匹配**:
- 代码实现 → TDD
- 独立模块 → 并行分发
- 完成后 → 代码审查

**风险**: [Top 3 风险]
```

### Stage 3.7 输出压缩

| 内容 | 原始形式 | 压缩形式 | 压缩率 |
|------|---------|---------|--------|
| 完整代码示例 | 每个 Phase 的完整代码 | agent_hint 摘要 | 90% |
| TDD 步骤 | 5 步详细描述 | 依赖关系图 | 60% |

**压缩模板**:
```yaml
agent_hints:
  phase-1:
    type: code-implementation
    subagent: voltagent-core-dev:backend-developer
    files:
      create: [auth.py]
      modify: [config.py]
      test: [test_auth.py]
    tdd: true
    depends_on: []
  phase-2:
    type: code-implementation
    subagent: voltagent-core-dev:backend-developer
    files:
      create: [gateway.py]
    tdd: true
    depends_on: [phase-1]
```

### Stage 4 中间结果压缩

| 内容 | 原始形式 | 压缩形式 | 压缩率 |
|------|---------|---------|--------|
| Agent 执行日志 | 完整输出 | 结果摘要 | 85% |
| 测试输出 | 全部测试结果 | 通过/失败统计 | 90% |
| 代码 diff | 完整 diff | 变更文件列表 + 功能描述 | 70% |

**压缩模板**:
```markdown
## Agent [name] 完成摘要

**状态**: ✅ completed
**耗时**: [duration]
**产出**:
- 创建: [file1, file2]
- 修改: [file3]
- 测试: [N passed, M failed]
**关键变更**: [一句话描述]
```

## 符号系统（快速压缩）

使用 `context-optimization` skill 的符号系统减少 token：

| 场景 | 原始 | 压缩后 |
|------|------|--------|
| 状态 | completed / in_progress / failed | ✅ / 🔄 / ❌ |
| 依赖 | A depends on B | A → B |
| 结论 | therefore / because | ∴ / ∵ |
| 风险 | security risk / performance issue | 🛡️ / ⚡ |

## 恢复检查点

STATE.md 优先于 checkpoint YAML。当 STATE.md 存在时，以其 Session Continuity 为恢复依据。

压缩后 STATE.md 必须同步更新，保持作为唯一恢复入口。仅当 STATE.md 不存在时，才使用以下最小状态：

```yaml
checkpoint:
  current_stage: [0-5]
  current_phase: [phase-id or null]
  task_plan_path: [.plan/task_plan.md]
  completed_phases: [phase-1, phase-2, ...]
  pending_phases: [phase-3, phase-4, ...]
  critical_findings: [finding-1, finding-2, finding-3]
  next_action: [具体动作]
```

## 与 /compact 的协作

当用户手动执行 `/compact` 时，flow-deep 应：

1. **暂停当前阶段**: 记录 checkpoint
2. **等待压缩完成**: 不要在压缩过程中执行新任务
3. **恢复执行**: 从 checkpoint 继续

## 避免压缩的内容

以下内容**不可压缩**（必须保持完整）：

1. `task_plan.md` 的 Phase 定义和完成标准
2. `agent_hint` 的 files/test/depends_on 字段
3. 当前正在执行的 Agent 的 prompt
4. Stage 5 验证的完整检查清单

## 示例：Stage 2 完成后压缩

**Before** (完整 Sequential Thinking 输出，~3000 tokens):
```
思考 1: 首先分析任务... [500 字]
思考 2: 识别依赖关系... [400 字]
思考 3: 评估风险... [600 字]
...
思考 15: 最终方案... [300 字]
```

**After** (摘要形式，~800 tokens):
```
## Stage 2 摘要

**结论**: 重构认证系统需 5 个 Phase，3 个可并行

**子任务**:
- auth-core: 核心逻辑 → 可并行 ✅
- token-mgr: Token 管理 → 可并行 ✅
- gateway: 网关集成 → 依赖 auth-core
- security: 安全审计 → 依赖全部
- docs: 文档更新 → 依赖全部

**技能匹配**: TDD(代码) + 并行(auth-core, token-mgr) + 审查(security)

**风险**:
1. 🛡️ JWT 密钥管理
2. ⚡ Token 刷新性能
3. 🏗️ 向后兼容

**Mermaid**: 依赖图已保存到 findings.md
**讨论**: 架构师/安全专家/性能工程师 → 综合方案见 findings.md
```

**压缩率**: ~73%
