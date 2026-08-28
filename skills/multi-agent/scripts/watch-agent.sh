#!/bin/bash
# watch-agent.sh — 自杀式观察窗（由 spawn-pane.sh 启动于 pane 内，勿手动运行）
# 展示 agent 输出文件尾部；三重退出：
#   1. 目标文件 mtime 静默 >120s（agent 完成的免费代理信号）
#   2. 文件始终未出现且等待 >90s（spawn 失败/路径错）
#   3. 进程被 kill（reap-panes.sh / 手动）
# pane remain-on-exit off → 本脚本 exit 即 pane 自动回收
# 创建: mike, 2026-08-28

LABEL="${1:-agent}"
FILE="$2"
[ -z "$FILE" ] && exit 0
APPEAR_DEADLINE=$(( $(date +%s) + 90 ))

while :; do
  NOW=$(date +%s)
  if [ -f "$FILE" ]; then
    M=$(stat -f %m "$FILE" 2>/dev/null || echo 0)
    clear
    echo "── [$LABEL] 观察窗 · 完成后自动关闭 ──"
    tail -n 40 "$FILE" 2>/dev/null | cut -c1-160
    if [ $((NOW - M)) -gt 120 ]; then exit 0; fi
  else
    clear
    echo "── [$LABEL] 等待输出文件… ──"
    [ "$NOW" -gt "$APPEAR_DEADLINE" ] && exit 0
  fi
  sleep 5
done
