#!/bin/bash
# spawn-pane.sh — 为并行 subagent 开观察窗（multi-agent pane 生命周期 · 开启端）
# 用法: bash spawn-pane.sh <label> <output-file>
# 行为: 两级 tmux 检测 → split-window 启动自杀式 watcher → 写登记表 → pane 命名
# 降级: NO_TMUX → 全静默 exit 0（真不在 tmux，无需打扰，可视化增强不是能力前提）;
#       IN_TMUX 下 split 失败 / $TMUX_PANE 缺失 → 输出一行 WARN 到 stderr（失败留证据，2026-08-31：
#       "静默"的对象是不打断任务流，不是不可见——失败无证据则「好像不开分屏」查无实据）
# 关闭: watcher 三重自杀（静默120s/文件消失/被杀）→ remain-on-exit off 自动回收；
#       遗留由 reap-panes.sh 兜底（只清登记在册 pane，主 pane 天然安全）
# 创建: mike, 2026-08-28

LABEL="${1:?用法: spawn-pane.sh <label> <output-file>}"
FILE="${2:?缺少 output-file 参数}"
REG="${TMPDIR:-/tmp}/claude-watch-panes.reg"
DIR="$(cd "$(dirname "$0")" && pwd)"
WATCHER="$DIR/watch-agent.sh"

# ---- 两级 tmux 检测 ----
# ① $TMUX 直判；② $TMUX 空 ≠ 不在 tmux（background job 上下文失真，2026-08-24）。
#    但 server 存在 ≠ 身在 tmux——list-panes 探测在"非 tmux 会话 + 本机有 server"时误判（2026-08-28），
#    精确判定：沿 PPID 祖先链找 tmux 进程
_in_ancestor_tmux() {
  local p=$$
  while [ -n "$p" ] && [ "$p" != "1" ]; do
    p=$(ps -o ppid= -p "$p" 2>/dev/null | tr -d ' ')
    [ -z "$p" ] && return 1
    case "$(ps -o comm= -p "$p" 2>/dev/null)" in *tmux*) return 0;; esac
  done
  return 1
}
IN_TMUX=0
if [ -n "$TMUX" ] && tmux list-panes >/dev/null 2>&1; then
  IN_TMUX=1
elif _in_ancestor_tmux; then
  IN_TMUX=1
fi
[ "$IN_TMUX" = "1" ] || exit 0

# ---- 领养：PreToolUse hook 预开的 pending 观察窗（180s 内）直接绑定真实文件，不重复开窗 ----
if [ -f "$REG" ]; then
  PENDING=$(grep '|⏳pending|' "$REG" | tail -1)
  if [ -n "$PENDING" ]; then
    PP=$(echo "$PENDING" | cut -d'|' -f1)
    PTS=$(echo "$PENDING" | cut -d'|' -f4)
    ALIVE=$(tmux list-panes -a -F '#{pane_id}' 2>/dev/null | grep -Fx "$PP")
    if [ -n "$ALIVE" ] && [ $(( $(date +%s) - PTS )) -lt 180 ]; then
      tmux respawn-pane -k -t "$PP" "bash '$WATCHER' '$LABEL' '$FILE'"
      tmux select-pane -t "$PP" -T "$LABEL"
      grep -v "^$PP|" "$REG" > "$REG.tmp"; echo "$PP|$LABEL|$FILE|$(date +%s)" >> "$REG.tmp"; mv "$REG.tmp" "$REG"
      echo "pane=$PP label=$LABEL (adopted pending)"
      exit 0
    fi
    grep -v "^$PP|" "$REG" > "$REG.tmp"; mv "$REG.tmp" "$REG"   # 死的 pending 顺手清
  fi
fi

# ---- 开窗：宽窗横分 / 窄窗竖分，新 pane ≤45%，主 pane 不被挤扁 ----
# 锚定调用者所在 pane（$TMUX_PANE 由 tmux 注入）；缺失时 server 自选窗口，可能落到相邻窗口（已知怪癖 2026-08-28）
TARGET=""
if [ -n "$TMUX_PANE" ]; then
  TARGET="-t $TMUX_PANE"
else
  echo "[spawn-pane] WARN: \$TMUX_PANE 缺失, 观察窗可能落到相邻窗口而非当前窗 (label=$LABEL)" >&2
fi
W=$(tmux display-message -p '#{session_name}:#{window_index}')
WIDTH=$(tmux display-message -p '#{window_width}')
if [ "$WIDTH" -ge 100 ]; then
  PANE=$(tmux split-window -h -d -P -F '#{pane_id}' -l 45% $TARGET -c "$PWD" "bash '$WATCHER' '$LABEL' '$FILE'")
else
  PANE=$(tmux split-window -v -d -P -F '#{pane_id}' -l 45% $TARGET -c "$PWD" "bash '$WATCHER' '$LABEL' '$FILE'")
fi
if [ -z "$PANE" ]; then
  echo "[spawn-pane] WARN: split-window 失败, 观察窗未开 (label=$LABEL, target=${TARGET:-server 自选})" >&2
  exit 0   # 失败留证据但不打断分发主链路（2026-08-31）
fi

tmux select-pane -t "$PANE" -T "$LABEL" 2>/dev/null
tmux set-window-option -t "$W" pane-border-status top >/dev/null 2>&1
tmux set-window-option -t "$W" pane-border-format ' #{pane_index}: #{pane_title} ' >/dev/null 2>&1

mkdir -p "$(dirname "$REG")" 2>/dev/null
echo "$PANE|$LABEL|$FILE|$(date +%s)" >> "$REG"
echo "pane=$PANE label=$LABEL"
exit 0
