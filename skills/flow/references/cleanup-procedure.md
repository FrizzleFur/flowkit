# Agent 与 Pane 清理流程

> 由 flow/flow-deep 共享。Stage 4 完成后执行三层清理。

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
