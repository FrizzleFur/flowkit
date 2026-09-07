#!/bin/bash
# watch-agent.sh — 自杀式观察窗（由 spawn-pane.sh 启动于 pane 内，勿手动运行）
# 展示 agent 输出的可读摘要；三重退出：
#   1. 目标文件 mtime 静默 >120s（agent 完成的免费代理信号）
#   2. 文件始终未出现且等待 >90s（spawn 失败/路径错）
#   3. 进程被 kill（reap-panes.sh / 手动）
# pane remain-on-exit off → 本脚本 exit 即 pane 自动回收
# 内容源（2026-08-31 修正）: output_file 是 JSONL transcript 机器格式，直接 tail 只会
#   显示每条 JSONL 的 metadata 头（parentUuid/agentId/...，cut -c1-160 恰好截不到正文）
#   ——用户看到的是「JSON 瀑布」而非子 agent 真实内容。现经 python3 解析为
#   「role + 内容摘要」行（tool_use 显工具名）；解析失败/无 python3 → 降级状态行。
# 创建: mike, 2026-08-28 | JSONL 解析层: mike, 2026-08-31

LABEL="${1:-agent}"
FILE="$2"
[ -z "$FILE" ] && exit 0
APPEAR_DEADLINE=$(( $(date +%s) + 90 ))

while :; do
  NOW=$(date +%s)
  if [ -f "$FILE" ]; then
    M=$(stat -f %m "$FILE" 2>/dev/null || echo 0)
    SUMMARY=$(python3 - "$FILE" <<'PYEOF' 2>/dev/null
import json, sys
try:
    lines = open(sys.argv[1], encoding='utf-8', errors='replace').read().splitlines()
except Exception:
    sys.exit(1)
out = []
for ln in reversed(lines):
    if len(out) >= 18:
        break
    try:
        o = json.loads(ln)
    except Exception:
        continue
    msg = o.get('message') or {}
    role = str(msg.get('role') or o.get('type') or '?')
    c = msg.get('content')
    text = ''
    if isinstance(c, str):
        text = c
    elif isinstance(c, list):
        parts = []
        for b in c:
            if not isinstance(b, dict):
                continue
            t = b.get('type')
            if t == 'text':
                parts.append(b.get('text', ''))
            elif t == 'tool_use':
                parts.append('[tool:%s]' % b.get('name', '?'))
            elif t == 'tool_result':
                parts.append('[tool_result]')
        text = ' '.join(parts)
    text = ' '.join(text.split())
    if text:
        out.append('%-9s %s' % (role[:9], text[:150]))
out.reverse()
print('\n'.join(out))
PYEOF
)
    clear
    echo "── [$LABEL] 观察窗 · 完成后自动关闭 ──"
    if [ -n "$SUMMARY" ]; then
      printf '%s\n' "$SUMMARY"
    else
      SZ=$(stat -f %z "$FILE" 2>/dev/null || echo '?')
      NL=$(wc -l < "$FILE" 2>/dev/null | tr -d ' ')
      echo "(尚无可读摘要: 等待文本内容或解析失败) size=${SZ}B msgs=${NL}"
    fi
    if [ $((NOW - M)) -gt 120 ]; then exit 0; fi
  else
    clear
    echo "── [$LABEL] 等待输出文件… ──"
    [ "$NOW" -gt "$APPEAR_DEADLINE" ] && exit 0
  fi
  sleep 5
done
