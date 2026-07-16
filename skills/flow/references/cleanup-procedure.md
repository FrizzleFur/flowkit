# Agent 与 Pane 清理流程

> 由 flow/flow-deep 共享。Stage 4 完成后执行三层清理。

## 崩溃循环检测与降级（执行中）

> 借鉴 Claude Code v2.1.202 对 agents 后台崩溃/重生循环的修复。skill 层无法改原生 worker，但可在编排层检测并降级，避免无限重生消耗资源。

**检测规则**: 同一个 Agent（按 name）连续崩溃/失败 **2 次**（API Error、超时、worker 异常退出），判定为崩溃循环，不再重生。

**判定崩溃的信号**:
- Agent 进程退出但 TaskList 显示其任务未 completed
- SendMessage 无响应且 pane 进程已退出
- 连续两次返回 API Error 或超时

**降级动作**:
1. 标记该 Agent 为 `degraded`，不再重试该分屏（避免崩溃/重生循环）
2. 主 Agent 串行接管其任务（用 Bash/grep/Tavily 等 fallback 推进，不死等）
3. 记录到 STATE.md 的 Blockers：`agent-[name]: 崩溃循环降级，主 Agent 接管`
4. 若降级导致 >30% 子任务无法并行，触发退回 Plan 协议（评估缩减并行度或改串行）

## 即时清理

TaskList 检测 Agent completed 且不被后续 Phase 复用:

```
SendMessage shutdown → 等 2s → 无响应则强制 kill pane（跳过 MAIN_PANE）
```

## 孤儿清理

Phase 切换前，检测进程已退出的残留 pane:

```bash
W=$(tmux display-message -p '#{session_name}:#{window_index}')
tmux list-panes -t "$W" -F '#{pane_index} #{pane_id} #{pane_current_command}' | while read idx pid cmd; do
  [ "$idx" = "$MAIN_PANE" ] && continue
  echo "$cmd" | grep -qiE 'claude|node' && continue
  tmux kill-pane -t "$pid" 2>/dev/null
done
```

## 全局清理

所有 Phase 完成后:

```bash
W=$(tmux display-message -p '#{session_name}:#{window_index}')
LAST=$(tmux list-panes -t "$W" -F '#{pane_index}' | tail -1)
for i in $(seq "$LAST" -1 0); do [ "$i" = "$MAIN_PANE" ] || tmux kill-pane -t "$W.$i" 2>/dev/null; done
[ "$(tmux list-panes -t "$W" | wc -l | tr -d ' ')" = "1" ] && echo "清理完成" || echo "警告: 仍有残留面板"
```

最后执行 `TeamDelete` 清理团队文件。

## 执行后全局清理（Stage 5 验证通过后）

shutdown 全部剩余 Agent → 倒序 kill 非 MAIN_PANE → 验证只剩主面板 → TeamDelete
