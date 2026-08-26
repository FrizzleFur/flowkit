#!/usr/bin/env bash
# sync-check.sh — 检查 flowkit 源仓库与 ~/.claude/skills 安装副本的漂移
#
# 背景: 两仓库各有先行的更新（方向不固定），曾发生三类漂移：
#   1. 并发口径（flowkit 先行，安装副本旧）
#   2. TeamCreate 废弃适配（skills 仓库 b310440 先行，flowkit 漏同步）
#   3. prime 修复（skills 仓库先行）
# 用法: 在任意目录执行 `bash scripts/sync-check.sh`；有漂移时退出码 1 并列出文件。
#
# 注意: 漂移方向需人工逐 hunk 判定（git log/diff 佐证），禁止盲目单向覆盖。

set -euo pipefail

FLOWKIT_SKILLS="$(cd "$(dirname "$0")/.." && pwd)/skills"
INSTALLED_SKILLS="$HOME/.claude/skills"
DRIFT=0

report() { echo "$1"; }

# 1. 双侧同名 skill 的文件级漂移
for src_dir in "$FLOWKIT_SKILLS"/*/; do
  name=$(basename "$src_dir")
  inst_dir="$INSTALLED_SKILLS/$name"
  if [ -d "$inst_dir" ]; then
    # 排除测试工作区（*-workspace）与系统文件
    diffs=$(diff -rq "$src_dir" "$inst_dir" 2>/dev/null \
      | grep -v -e '\.DS_Store' -e '-workspace' -e 'skill-snapshot' \
      | sed "s|.*$FLOWKIT_SKILLS/||; s|.*$INSTALLED_SKILLS/||" || true)
    if [ -n "$diffs" ]; then
      report "[漂移] $name:"
      echo "$diffs" | sed 's/^/    /'
      DRIFT=1
    fi
  else
    report "[仅在 flowkit] ${name}（安装副本缺失）"
    DRIFT=1
  fi
done

# 2. 仅在安装副本的 skill
for inst_dir in "$INSTALLED_SKILLS"/*/; do
  name=$(basename "$inst_dir")
  [ -d "$FLOWKIT_SKILLS/$name" ] || report "[仅在安装副本] ${name}（flowkit 缺失，可能是有意不纳管）"
done

if [ "$DRIFT" -eq 0 ]; then
  report "✓ 所有同名 skill 双仓库一致"
else
  report ""
  report "存在漂移：请逐 hunk 判定方向后同步（用 git log/diff 佐证哪侧更新），再分别 commit。"
  exit 1
fi
