#!/usr/bin/env bash
# support_bundle.sh — flowkit 一键诊断包（借鉴 deer-flow make support-bundle）
# 聚合环境/双仓/宪法状态到单文件报告，供用户贴 issue——报障信息完备度直接决定修复速度。
# 原则：只读；不打印任何 env 值（只打设置与否）；输出 stdout（> 重定向存档）。
#
# 用法：bash scripts/support_bundle.sh            # 打印到终端
#       bash scripts/support_bundle.sh > /tmp/bundle.md

set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SK="$HOME/.claude/skills"

echo "# flowkit support bundle"
echo "date: $(date '+%Y-%m-%d %H:%M:%S')  host: $(hostname -s)  os: $(uname -s $(uname -r 2>/dev/null || true) 2>/dev/null || uname -s)"

echo
echo "## 环境（版本即可，不含任何密钥）"
for c in git python3 claude node; do
  if command -v "$c" >/dev/null; then printf '%s: %s\n' "$c" "$("$c" --version 2>&1 | head -1)"; else echo "$c: MISSING"; fi
done
echo "env 设置（只看有无）: FLOWKIT_CONTEXT_WINDOW=$([ -n "${FLOWKIT_CONTEXT_WINDOW:-}" ] && echo set || echo unset)"

echo
echo "## 仓库状态"
git -C "$ROOT" log --oneline -1 2>/dev/null
echo "branch: $(git -C "$ROOT" branch --show-current 2>/dev/null)"
echo "dirty: $(git -C "$ROOT" status --porcelain 2>/dev/null | wc -l | tr -d ' ') 个文件"

echo
echo "## 安装状态（~/.claude/skills）"
for s in flow flow-deep multi-agent prompt auto-skill; do
  d="$SK/$s"
  if [ -L "$d" ]; then echo "$s: symlink -> $(readlink "$d")";
  elif [ -d "$d" ]; then echo "$s: 实目录（非链接——sync-check 会按内容比对）";
  else echo "$s: 缺失"; fi
done

echo
echo "## 双仓一致性（sync-check）"
bash "$ROOT/scripts/sync-check.sh" 2>&1 | head -15

echo
echo "## 宪法 lint（L1-L7）"
python3 "$ROOT/scripts/lint_flowkit.py" --root "$ROOT" 2>&1 | tail -25

echo
echo "## evals 快照存在性"
for f in evals/flow-deep/evals.json evals/flow-deep/benchmarks evals/trigger/results-eval-set-v1.json; do
  [ -e "$ROOT/$f" ] && echo "ok: $f" || echo "MISSING: $f"
done

echo
echo "--- bundle 完 —— 贴 issue 时整段复制即可；如含敏感路径请自行涂抹"
