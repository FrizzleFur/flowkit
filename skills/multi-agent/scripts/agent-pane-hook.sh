#!/bin/bash
# agent-pane-hook.sh — PreToolUse(Agent) 实验性兜底（全自动版）
# 在 Agent 工具调用前预开"待绑定"观察窗，解决"模型忘了调 spawn-pane.sh"的根因。
# 机制: 从 stdin JSON 取 cwd → 推导 tasks 目录 → 开一个 watch-pending 窗等待新输出文件出现并自动绑定；
#       模型随后正常调用 spawn-pane.sh 时会"领养"该 pending 窗（见 spawn-pane.sh）。
# 安全: 永远 exit 0、全路径容错、10s timeout —— 任何失败都不阻塞 Agent 工具。
# 注意: hooks 在会话启动时快照，修改后需新会话生效；嵌套 spawn 场景为实验范围（2026-08-28）。
# 创建: mike, 2026-08-28

IN=$(cat)
[ -z "$IN" ] && exit 0
CWD=$(printf '%s' "$IN" | /usr/bin/python3 -c "import sys,json;print(json.load(sys.stdin).get('cwd',''))" 2>/dev/null)
[ -z "$CWD" ] && exit 0

KEY=$(printf '%s' "$CWD" | sed 's|/|-|g; s|\.|-|g')
TASKS_BASE="/private/tmp/claude-501/$KEY"
[ -d "$TASKS_BASE" ] || exit 0
# tmux 判定：$TMUX 直判，否则沿 PPID 祖先链找 tmux（server 存在 ≠ 身在 tmux，2026-08-28）
_in_ancestor_tmux() {
  local p=$$
  while [ -n "$p" ] && [ "$p" != "1" ]; do
    p=$(ps -o ppid= -p "$p" 2>/dev/null | tr -d ' ')
    [ -z "$p" ] && return 1
    case "$(ps -o comm= -p "$p" 2>/dev/null)" in *tmux*) return 0;; esac
  done
  return 1
}
_in_ancestor_tmux || exit 0

DIR="$(cd "$(dirname "$0")" && pwd)"
MARK=$(date +%s)
REG="${TMPDIR:-/tmp}/claude-watch-panes.reg"

PANE=$(tmux split-window -h -d -P -F '#{pane_id}' -l 45% -c "$CWD" \
  "bash '$DIR/watch-pending.sh' '$TASKS_BASE' '$MARK'" 2>/dev/null)
[ -n "$PANE" ] || exit 0
tmux select-pane -t "$PANE" -T "⏳ agent-spawning" 2>/dev/null
echo "$PANE|⏳pending|$TASKS_BASE@$MARK|$(date +%s)" >> "$REG"
exit 0
