#!/bin/bash
# watch-pending.sh — 待绑定观察窗（由 agent-pane-hook.sh 预开，实验性）
# 轮询 tasks 基目录，等待 hook 触发时刻之后新出现的 *.output 文件（最长 90s），
# 一旦出现即转正为常规观察窗（复用 watch-agent.sh 的三重自杀逻辑）。
# 超时未出现 → 静默退出（pane 自动回收），无残留。
# 创建: mike, 2026-08-28

BASE="$1"
MARK="$2"
[ -d "$BASE" ] || exit 0
DEADLINE=$(( $(date +%s) + 90 ))

while [ $(date +%s) -lt $DEADLINE ]; do
  FOUND=$(find "$BASE" -name '*.output' -newermt "@$MARK" -not -path '*/.*' 2>/dev/null | head -1)
  if [ -n "$FOUND" ]; then
    exec bash "$(dirname "$0")/watch-agent.sh" "agent(自动绑定)" "$FOUND"
  fi
  sleep 3
done
exit 0
