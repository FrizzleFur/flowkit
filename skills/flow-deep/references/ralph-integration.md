# Ralph Loop 集成规范 — Stage 5.7 强制持续层

> 由 flow-deep 调用。当 Stage 5.5 auto-iterate 迭代用完仍未达标时，自动启动 Ralph Loop 实现强制持续性迭代。

## 核心定位

```
Stage 5 验证失败
  → Stage 5.5 auto-iterate (结构化 keep/revert, N 轮)
    → 仍未达标 → Stage 5.7 Ralph Loop (强制持续)
      → Stop Hook 拦截退出 → 注入固定 prompt (含初始历史摘要)
        → LLM 自行读取最新状态 → auto-iterate (M 轮)
          → 达标 → 输出 <promise> → 退出循环
```

**与 auto-iterate 的关系**: Ralph Loop 不替代 auto-iterate，而是在其外层包裹一层"不达目的不罢休"的强制机制。每轮 Ralph 迭代内部仍使用 auto-iterate 的 keep/revert 协议。

## 触发条件（全部满足才触发）

1. Stage 5.5 auto-iterate 已执行完毕（N 轮用完）
2. 目标仍未达标（`status: partial` 或 `status: failed`）
3. `--no-ralph` 参数未设置
4. Ralph Loop 插件已安装（Stage 0 检测）

**不触发的情况**:
- Stage 5 全部达标（不进入 5.5，自然不进入 5.7）
- 用户使用 `--no-ralph` 显式禁用
- Ralph Loop 插件未安装 → 降级为手动模式（提示用户手动重启）

## Stage 0 检测增强

在 Stage 0 能力发现中增加 Ralph Loop 检测：

```yaml
ralph_loop_available: true/false  # 检查 ralph-loop 插件是否已安装
```

检测方式：
1. 检查 `~/.claude/plugins/cache/claude-plugins-official/ralph-loop/` 是否存在
2. 检查当前项目的 `.claude/settings.local.json` 中是否有 ralph-loop 的 hooks 配置
3. 标记 `ralph_loop_available` 状态，影响 Stage 5.7 是否可用

## Prompt 构造协议

Ralph Loop 的 stop-hook 每轮注入的是**启动时写入的固定 prompt**（从 `.claude/ralph-loop.local.md` 读取），不支持动态更新。因此我们采用**"一次性注入 + 自主读取最新状态"**策略：初始 prompt 包含完整的初始历史摘要，并内嵌"自行从 progress.md 读取最新数据"的指令。

### Prompt 模板（一次性写入，每轮注入同一份）

```markdown
# Flow-Deep Ralph Loop — 持续迭代直到达标

## 任务
{原始任务描述}

## 初始状态（启动 Ralph 时的快照）
- 已完成阶段: Stage 0-5 + Stage 5.5 auto-iterate ({N} 轮)
- 未达标项: {列出 Stage 5 中仍失败的验证项}

## 初始 auto-iterate 历史（启动 Ralph 前的完整记录）

| iteration | commit | metric | delta | status | description |
|-----------|--------|--------|-------|--------|-------------|
{完整 TSV 记录}

### 初始教训（启动时的分析）
- 成功方向: {哪些类型的变更产生了正向 delta}
- 失败方向: {哪些类型的变更导致 revert}
- 卡住模式: {连续 revert 的原因分析}
- 建议方向: {基于教训推荐的下一步}

## 自主状态获取（每轮必须执行）
你每轮收到的是同一份 prompt。要获取最新迭代状态，**必须执行以下步骤**:
1. `cat .plan/STATE.md` — 获取当前 Ralph 迭代编号、状态和未达标项
2. 读取 `.plan/progress.md` 的 "## Auto-Iterate Results" 区块 — 获取最新 TSV 记录
3. 分析最新 TSV 记录中的成功/失败模式，调整本轮策略
4. 不要重复已失败的方向，优先尝试未探索的方向

## 约束
- 遵循 auto-iterate 的 keep/revert 协议（每次只改一个，机械验证）
- 遵循 Iron Laws（IL-1 TDD / IL-2 Verification / IL-3 Debugging）
- 渐进式 Guard: 从轻量开始，逐步加严
- 每轮迭代结束后，更新 `.plan/STATE.md` 中的 `ralph_iteration` 和 `ralph_last_result`
- 不要在首轮就假设初始状态仍然正确——始终先读取最新状态

## 完成条件
当以下条件全部满足时，输出 <promise>{COMPLETION_PROMISE}</promise>:
{Stage 5 的验证标准列表}

每完成一轮 auto-iterate 后打印进度并继续。如果你已经穷尽了所有可能的方案，
输出 <promise>{COMPLETION_PROMISE}</promise> 并附上"部分完成"说明。
```

### Prompt 构造逻辑

```
1. 读取 .plan/progress.md 中的 auto-iterate TSV 区块
2. 提取完整历史（所有 keep/revert 记录）
3. 分析成功/失败模式:
   a. delta > 0 的变更类型 → 成功方向
   b. status = revert 的变更 → 失败方向
   c. 连续 3+ revert → 卡住模式
4. 从 STATE.md 提取当前状态（未达标项）
5. 从 task_plan.md 提取原始任务描述
6. 组装 prompt
```

### 历史摘要压缩策略

当 auto-iterate 历史超过 20 轮时，采用压缩策略：

| 历史轮数 | 压缩策略 |
|---------|---------|
| 1-10 轮 | 完整展示所有记录 |
| 11-20 轮 | 完整展示 + 添加趋势摘要 |
| 21-50 轮 | 只展示最近 10 轮完整 + 前面所有轮的汇总统计 |
| 50+ 轮 | 只展示最近 5 轮完整 + 分阶段汇总（前 1/3 / 中 1/3 / 后 1/3） |

## Completion Promise 设计

Completion Promise 是 Ralph Loop 的退出条件。设计原则：

1. **与 Stage 5 验证标准对齐**: promise 达成 = Stage 5 所有验证项通过
2. **可机械判定**: 不要模糊条件，用具体的验证命令输出
3. **允许"诚实部分完成"**: 穷尽方案后可以输出 promise，但必须附带说明

### 默认 Promise 文本

```
FLOW_DEEP_COMPLETE
```

### Promise 判定规则

```yaml
# Stage 5 验证项全部通过
all_stage5_checks_pass: true  # → 可输出 promise

# 已用完所有策略（连续 N 轮无改进）
exhausted_strategies: true    # → 可输出 promise（附部分完成说明）

# 用户手动中断（/cancel-ralph）
user_cancelled: true          # → 立即退出
```

## Ralph 迭代参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `ralph_max_iterations` | `--ralph-max` 或 10 | Ralph 总轮数（每轮包含一轮 auto-iterate） |
| `auto_iterate_per_ralph` | `--iterate` 值 或 3 | 每轮 Ralph 内 auto-iterate 的迭代次数 |
| `completion_promise` | `FLOW_DEEP_COMPLETE` | 退出承诺文本 |
| `ralph_prompt_file` | `.plan/ralph-prompt.md` | 动态 prompt 文件路径 |

## STATE.md 更新

Stage 5.7 启动时：
```yaml
current_stage: 5.7
ralph_status: active
ralph_iteration: 1
ralph_max: 10
next_action: "Stage 5.7 Ralph Loop 迭代中"
```

每轮 Ralph 完成时：
```yaml
ralph_iteration: N
ralph_last_result: "partial | achieved | failed"
ralph_improvement: "+X.X%"
```

Ralph 完成时：
```yaml
ralph_status: completed
status: completed | partial
```

## 执行流程

```
1. Stage 5.5 auto-iterate 完成但仍未达标
2. 检查 Ralph Loop 插件是否可用
   a. 可用 → 继续
   b. 不可用 → 提示用户手动重启，写入 STATE.md next_action
3. 构造一次性 Ralph prompt（含完整历史摘要 + 自主状态获取指令）
4. 将 prompt 写入 .plan/ralph-prompt.md
5. 调用 /ralph-loop 启动循环:
   如果 prompt 较短（< 10KB）:
     /ralph-loop "<prompt content>" --max-iterations {RALPH_MAX} --completion-promise "FLOW_DEEP_COMPLETE"
   如果 prompt 较长（>= 10KB，含大量 TSV 历史）:
     先将 prompt 写入临时文件，然后:
     /ralph-loop "$(cat .plan/ralph-prompt.md)" --max-iterations {RALPH_MAX} --completion-promise "FLOW_DEEP_COMPLETE"
     注意: macOS ARG_MAX 约 256KB，确保 prompt 不超限
6. Ralph Loop Stop Hook 接管会话控制
7. 每轮 Ralph 迭代（LLM 自主执行，无需 flow-deep 外部介入）:
   a. 读取 .plan/STATE.md 获取当前 Ralph 迭代编号
   b. 读取 .plan/progress.md 获取最新 TSV 记录
   c. 执行 auto-iterate（M 轮 keep/revert）
   d. 运行 Stage 5 验证
   e. 如达标 → 输出 <promise>FLOW_DEEP_COMPLETE</promise>
   f. 如未达标 → 同步更新 STATE.md（ralph_iteration, ralph_last_result）
   g. Stop Hook 拦截退出，注入同一份固定 prompt → 回到 a
8. 达标或到达 max_iterations → 退出循环
9. 进入执行后处理（tmux 清理等）
```

### 状态同步机制

Ralph Loop 维护 `.claude/ralph-loop.local.md`（Hook 自动更新 iteration），flow-deep 维护 `.plan/STATE.md`。LLM 在每轮迭代开始时负责同步：

```
每轮 Ralph 开始时:
1. 从 .claude/ralph-loop.local.md 读取 Hook 维护的 iteration 值（准确）
2. 更新 .plan/STATE.md 的 ralph_iteration = Hook 的 iteration 值
3. 更新 .plan/STATE.md 的 ralph_last_result = 上一轮的结果
4. 用 .plan/STATE.md 的值作为唯一来源（不直接使用 Hook 文件的值）
```

### /cancel-ralph 后的清理

用户执行 `/cancel-ralph` 时:
1. Ralph Hook 删除 `.claude/ralph-loop.local.md`
2. LLM 必须更新 `.plan/STATE.md`:
   - `ralph_status: cancelled`
   - `next_action: "Ralph Loop 被用户取消，检查当前状态决定后续"`
3. 不会自动进入执行后处理，需要 LLM 根据当前状态决定是继续手动迭代还是收尾

## 降级方案

当 Ralph Loop 插件不可用时：

```
方案 A（推荐）: 提示用户启用 Ralph Loop
  "Stage 5.5 迭代用完仍未达标。建议启用 Ralph Loop 继续迭代:
   /ralph-loop '继续优化直到达标' --max-iterations 10 --completion-promise 'FLOW_DEEP_COMPLETE'"
  → 用户手动启动

方案 B: 手动重启 auto-iterate
  → 读取 STATE.md，以当前状态为新 baseline
  → 启动新一轮 auto-iterate（重置计数器）
  → 写入 STATE.md next_action
```

## 与 flow SKILL.md 的接口

flow-deep SKILL.md 中 Stage 5.7 的描述：

```markdown
### Stage 5.7: Ralph Loop 强制持续（自动触发）

**触发条件**: Stage 5.5 迭代用完仍未达标 + Ralph Loop 插件已安装 + --no-ralph 未设置
**调用**: Ralph Loop 插件（Stop Hook 机制）
**参考**: `references/ralph-integration.md`

**核心机制**: Ralph Loop 通过 Stop Hook 拦截会话退出，注入一次性固定 prompt（含初始历史摘要 + 自主状态获取指令），LLM 每轮自行读取最新状态，强制继续迭代直到 Stage 5 验证全部通过或策略穷尽。

**参数**:
- `--ralph-max N`: Ralph 总轮数（默认 10）
- `--no-ralph`: 禁用 Ralph Loop

**跳过条件**: Stage 5.5 全部达标 | --no-ralph | Ralph Loop 插件未安装
```

## 注意事项

- Ralph Loop 是会话级机制，不是 Agent 级机制。它在主对话中运行，不在 tmux 分屏中。
- **固定 prompt 约束**: Ralph Hook 每轮注入启动时的固定 prompt，不支持动态更新。初始 prompt 必须内嵌"自行从 progress.md 读取最新状态"的指令。
- Completion Promise 只能在"Stage 5 全部通过"或"策略穷尽"时输出。不得为了退出循环而输出虚假 promise。
- Ralph Loop 启动后，用户可通过 `/cancel-ralph` 手动终止。
- **session_id 隔离**: Ralph Loop 的 stop-hook 有 session_id 隔离逻辑，只拦截启动 Loop 的会话。但如果在 tmux 分屏中运行 Stage 4 Agent，确保 Stage 4 Agent 不在同一项目中触发 Ralph Hook。
- **铁律适用**: Stage 5.7 中适用 IL-2（验证铁律）和 IL-3（调试铁律），见 `references/iron-laws.md` 引用规则表。
- Ralph Loop 启动前必须确保 Stage 4 的所有 tmux 分屏已清理完毕，避免 Hook 拦截到其他会话。
