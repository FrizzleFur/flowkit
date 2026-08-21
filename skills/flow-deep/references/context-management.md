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
| Context Guard 保存（选项 a/b） | Session Continuity, Phase Progress | 必须写 Next Action；选项 b 额外生成 HANDOFF.md |
| 执行后处理 | Current Position (completed), 清空 Next Action | 最终状态 |
| 暂停/中断 | Session Continuity | 必须写 Next Action |

### 恢复协议

当 flow-deep 启动时检测到 `.plan/STATE.md` 存在:

1. **HANDOFF 入口**: 若用户以 HANDOFF.md 内容（或"读 .plan/HANDOFF.md"）开场，按其指引进入下述流程；恢复完成后可删除 HANDOFF.md（STATE.md 才是持久锚点）
2. **读取** STATE.md 的 Current Position 和 Session Continuity
3. **展示** 给用户: "上次停在 Stage X Phase Y: [last action]。是否恢复?"
4. **恢复路径**:
   - Stage 0-2 中断 → 从中断的 Stage 重新开始 (这些阶段快速且依赖上下文)
   - Stage 3 中断 → 重新规划 (规划依赖思考上下文)
   - Stage 4 中断 → 从 STATE.md 的 Phase Progress 继续 (执行结果已 git commit)
   - Stage 5 中断 → 直接重新验证
5. **重新开始**: 备份 STATE.md → STATE.md.bak，重新走全流程

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
| Stage/Phase 边界脚本实测 > 70% | `scripts/check_context.py`（transcript usage 真值） | P0 |
| System warning "context exceeds N%" | 系统提示（出现时通常已晚，兜底信号） | P1 |
| Agent 返回 usage > 100K tokens | 工具返回 | P2 |

> 模型无法自感 context 占用，百分比必须来自脚本实测，不做"人工判断"式预估。

## 主动 Checkpoint 与 Handoff 协议（Context Guard）

> 目的：在 auto-compact / context 溢出**之前**，把进度锚定到文件系统，让下一个 agent 能无损续接。
> 与被动压缩的区别：压缩是"继续本会话"的续命手段；checkpoint 是"可控交接"的存档手段。两者互补，弹窗决策先于压缩。

### 检测方法

每个 Stage / Phase 完成点运行（Stage 3 起与下方「更新规则」表的 STATE.md 更新时机同步；Stage 0-2 边界单独执行，此时尚无 STATE.md）：

```bash
python3 ~/.claude/skills/flow-deep/scripts/check_context.py --threshold 70
```

- 原理：读取当前会话 transcript（`~/.claude/projects/<cwd-key>/<session>.jsonl`）最后一条 assistant 消息的 usage（input + cache_read + cache_creation + output），除以窗口大小。这是 Claude Code 汇报的真值，非估算。
- exit code：`0` 正常（不弹窗）| `1` 超阈值（进入弹窗）| `2` 检测失败（**静默降级**为原压缩矩阵，不阻塞管道）。
- 输出含 `session=` 和 `first_msg=`（会话首条消息摘要）——并行多会话时据此核对是否读对了会话。**注意**：skill 由框架注入前导时，first_msg 显示的是环境信息（如 "Base directory for this skill: ..."）而非任务本体，此时以两条信号判定：① `mtime` 与检测时刻接近（当前活跃会话持续写入）② 连续两次采样 tokens_used 单调上升。确认读错后用 `--session` 纠偏（接受纯文件名或绝对路径）。
- 1M 窗口模型加 `--window 1000000`。
- 限制：采样式检测，Stage 中间的 context 暴涨由 P1 系统警告兜底。

### 三选项语义（超阈值时 AskUserQuestion）

| 选项 | 动作 | 语义 |
|------|------|------|
| a) 保存并继续 | 更新 STATE.md / progress.md → 按压缩矩阵处理中间结果 → 继续本会话 | 还想在本会话跑完，只要存档保险 |
| b) 保存并交接 | 更新五件套（STATE/task_plan/findings/progress/spec，spec.md 存在时）→ 生成 HANDOFF.md → 提示用户开新会话 | 主动换窗口，避免 context rot |
| c) 跳过 | 仅记录本次跳过，不改文件 | 用户判断当前阶段收尾很快，不值得存档 |

**节流**：同一 Stage 边界最多弹一次；选 c) 后下个边界重新检测再问（阈值未降则再弹，但同一 Stage 不重复）。

**无交互降级**（子代理 / headless 场景 AskUserQuestion 不可用）：默认执行选项 a（保存并继续——可自主完成的最小破坏项），三选项文案与决策理由落盘到 progress.md 或执行日志，**不静默跳过、不杜撰用户选择**。HANDOFF.md 的交付同样以此为准：非交互场景以文件落盘为交付（终端展示仅交互场景执行）。

### 保存动作清单（选项 a/b 共同部分）

1. 更新 `<plan-dir>/STATE.md`：Current Position、Phase Progress、Session Continuity（Stopped At / **Next Action 必须具体可执行**，不依赖读其他文件）
2. 更新 `progress.md`：本阶段完成项 + 证据（文件路径/测试结果）
3. 更新 `task_plan.md`：Phase 状态标记（completed / in_progress / pending）
4. （仅选项 b）同步刷新 findings.md 关键决策区，保证新会话单读文件即可还原决策脉络
5. （仅选项 b）若 `spec.md` 存在（Goal Contract 所在，交接时最有价值），核对其中 Success Criteria 与实际进度是否同步

### HANDOFF.md 模板（选项 b 生成，写入 `<plan-dir>/HANDOFF.md` 并在终端展示全文）

> 遵循 claude-handoff 经验：**不复制五件套内容，只引导新 agent 按序去读**——重复内容会随进度过期，路径引用不会。

```markdown
# HANDOFF — flow-deep 衔接 prompt（Run ID: <run_id>）

你是接续上一个会话的 agent。上一个会话在 context <N>% 处主动 checkpoint。

## 任务
<任务一句话>（详见 .plan/spec.md Goal Contract）

## 当前进度
- 已完成: <Stage/Phase 列表 + 一句话结果>
- 进行中: <Phase + 停在哪一步>
- 未开始: <Phase 列表>

## 必读文件（按序）
1. .plan/STATE.md — 恢复锚点（Stage/Phase/Next Action）
2. .plan/task_plan.md — 后续 Phase 定义与完成标准
3. .plan/findings.md — 关键决策与 Plan/Panel Review 结论

## 建议
- 先读 STATE.md，按恢复协议从 Next Action 继续
- 建议技能: <按 agent_hint 匹配，如 TDD / code-review>
- 注意事项: <未解决的 blocker / 需要用户确认的事项>

（敏感信息勿写入——本文件会成为新会话的 prompt）
```

生成后提示用户：「已生成 `.plan/HANDOFF.md`。开新会话后粘贴该文件内容（或直接说『读 .plan/HANDOFF.md 按指引继续』）。」

### 与恢复协议的衔接

新会话从 HANDOFF.md 进入 → 被引导读 STATE.md → 走现有「恢复协议」（Stage 4 中断从 Phase Progress 继续）。HANDOFF.md 在恢复完成后可删除（一次性文件，STATE.md 才是持久锚点）。

### 设计宪法自检记录（2026-08-20 新增本协议时）

1. 必要性 ✓ — 替换不可靠的"P1 人工判断"；HANDOFF 生成无现有能力覆盖（claude-handoff 是立即后台交接且禁模型调用，语义不同）
2. 可拆性 ✓ — 协议落在 references + 脚本，不新增 Stage，挂在现有边界检查点
3. 可跳过性 ✓ — `--no-context-guard`；弹窗本身即询问
4. 控制权 ✓ — 只询问不自动交接；检测失败静默降级不阻塞

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
