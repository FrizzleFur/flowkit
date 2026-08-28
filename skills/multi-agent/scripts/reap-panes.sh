#!/bin/bash
# reap-panes.sh — 观察窗兜底回收（multi-agent pane 生命周期 · 清理端）
# 只清理登记表（/tmp/claude-watch-panes.reg）在册的观察窗，绝不触碰未登记 pane → 主 pane 天然安全。
# 回收条件（任一）：pane 已不存在（仅移除登记） / 目标文件已消失 / 文件静默 >180s。
# 可手动执行，也可挂 Claude Code Stop hook 每轮自动跑（任何意外都必须 exit 0，不阻塞会话）。
# 创建: mike, 2026-08-28

REG="${TMPDIR:-/tmp}/claude-watch-panes.reg"
[ -f "$REG" ] || exit 0

REAPED=0
: > "$REG.tmp"
while IFS='|' read -r pid label file ts; do
  [ -z "$pid" ] && continue
  ALIVE=$(tmux list-panes -a -F '#{pane_id}' 2>/dev/null | grep -Fx "$pid")
  if [ -z "$ALIVE" ]; then
    continue   # pane 已自行关闭 → 仅移除登记
  fi
  if [ "$file" = "⏳pending" ] && [ $(( $(date +%s) - ts )) -gt 180 ]; then
    tmux kill-pane -t "$pid" 2>/dev/null
    echo "reaped $pid ($label 超时未绑定)"
    REAPED=$((REAPED+1))
    continue
  fi
  if [ ! -f "$file" ]; then
    tmux kill-pane -t "$pid" 2>/dev/null
    echo "reaped $pid ($label 文件已消失)"
    REAPED=$((REAPED+1))
    continue
  fi
  M=$(stat -f %m "$file" 2>/dev/null || echo 0)
  if [ $(( $(date +%s) - M )) -gt 180 ]; then
    tmux kill-pane -t "$pid" 2>/dev/null
    echo "reaped $pid ($label 静默>180s)"
    REAPED=$((REAPED+1))
    continue
  fi
  echo "$pid|$label|$file|$ts" >> "$REG.tmp"
done < "$REG"
mv "$REG.tmp" "$REG"
[ "$REAPED" -gt 0 ] && echo "共回收 $REAPED 个观察窗"
exit 0
