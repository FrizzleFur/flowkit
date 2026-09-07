#!/usr/bin/env bash
# pretrust-cwd.sh - 派发 named agent 前预信任工作目录, 防 trust 弹窗卡住 pane
# 创建者: mike (2026-09-01, Claude Code 辅助)
#
# 背景: named agent 的 pane 是独立 claude 进程, 启动时对 cwd 做 workspace trust 检查,
#   未信任路径弹「Yes, I trust this folder」阻塞等待——N 个 agent 卡 N 个 pane。
#   信任记账在 ~/.claude.json 的 projects.<路径>.hasTrustDialogAccepted:
#   git 仓库按仓库根键控(worktree 复用主仓根), 非仓目录按启动目录, home 下不落盘。
#   官方认可手段即手改该字段(docs: "trust it by hand")。
#   --dangerously-skip-permissions 只免 permission prompt, 不免 trust 弹窗。
#
# 用法: pretrust-cwd.sh [路径...]   (缺省 $PWD)
#   NO_TRUST_PRESEED=1 时显式跳过(退出 0, 输出「预信任跳过」)
#
# 安全设计: 改前滚动备份(保留最近 3 份) → tmp+rename 原子写 → 只动目标键,
#   其余字段原样保留; 新建条目补标准最小字段集(照抄真实条目 schema)。
# 残余竞争: 主会话注入后、spawn 前 CC 进程若恰好回写 .claude.json 可能覆盖注入,
#   概率极低; 注入紧贴 Agent() 调用即为此意。

set -euo pipefail

if [[ "${NO_TRUST_PRESEED:-0}" == "1" ]]; then
  echo "预信任跳过: NO_TRUST_PRESEED=1"
  exit 0
fi

CFG="$HOME/.claude.json"
declare -a SEEDS=()

# 收集键位: 每个输入路径本身 + 其 git 仓库根(若有), 去重
for p in "$@"; do
  [ -d "$p" ] || { echo "警告: 路径不存在, 跳过: $p" >&2; continue; }
  rp=$(cd "$p" && pwd -P)
  SEEDS+=("$rp")
  # 主仓根键位: worktree 里 --show-toplevel 返回 worktree 自身(≠主仓根),
  # 须用 --git-common-dir(<主仓>/.git) 反推; 官方新模型按主仓根记账, 此键位才治本
  if common=$(git -C "$rp" rev-parse --git-common-dir 2>/dev/null) && [[ -n "$common" ]]; then
    [[ "$common" != /* ]] && common="$rp/$common"
    root=$(cd "$common/.." 2>/dev/null && pwd -P) || root=""
    if [[ -n "$root" && "$root" != "$rp" && -d "$root" ]]; then
      SEEDS+=("$root")
    fi
  fi
done

if [[ ${#SEEDS[@]} -eq 0 ]]; then
  echo "警告: 无有效路径可预信任" >&2
  exit 2
fi

# 键位去重在 python 内做(mapfile 是 bash4 特性, macOS 自带 3.2 不可用)
OUT=$(python3 - "$CFG" "${SEEDS[@]}" <<'PYEOF'
import json, os, sys, tempfile, glob, time

cfg, seeds = sys.argv[1], list(dict.fromkeys(sys.argv[2:]))  # 保序去重

try:
    with open(cfg) as f:
        data = json.load(f)
except FileNotFoundError:
    data = {}
except json.JSONDecodeError as e:
    print(f"错误: {cfg} 不是合法 JSON({e}), 不注入不覆盖", file=sys.stderr)
    sys.exit(2)

projects = data.setdefault("projects", {})
injected, skipped = [], []
for s in seeds:
    entry = projects.get(s)
    if isinstance(entry, dict) and entry.get("hasTrustDialogAccepted") is True:
        skipped.append(s)
        continue
    if not isinstance(entry, dict):
        entry = {
            "allowedTools": [], "mcpContextUris": [], "mcpServers": {},
            "enabledMcpjsonServers": [], "disabledMcpjsonServers": [],
            "hasClaudeMdExternalIncludesApproved": False,
            "hasClaudeMdExternalIncludesWarningShown": False,
        }
        projects[s] = entry
    entry["hasTrustDialogAccepted"] = True
    injected.append(s)

os.makedirs(os.path.dirname(cfg), exist_ok=True)
# 滚动备份: 保留最近 3 份
for i in (2, 1):
    src, dst = f"{cfg}.bak-pretrust-{i}", f"{cfg}.bak-pretrust-{i+1}"
    if os.path.exists(src):
        os.replace(src, dst)
if os.path.exists(cfg):
    import shutil
    shutil.copy2(cfg, f"{cfg}.bak-pretrust-1")
for old in glob.glob(f"{cfg}.bak-pretrust-*")[3:]:
    os.remove(old)

st = os.stat(cfg) if os.path.exists(cfg) else None
fd, tmp = tempfile.mkstemp(dir=os.path.dirname(cfg), prefix=".claude.json.tmp")
try:
    with os.fdopen(fd, "w") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    if st:
        os.chmod(tmp, st.st_mode)
    os.replace(tmp, cfg)
except BaseException:
    if os.path.exists(tmp):
        os.remove(tmp)
    raise

for s in injected:
    print(f"预信任注入: {s}")
for s in skipped:
    print(f"已信任跳过: {s}")
print(f"预信任完成: 注入 {len(injected)} 跳过 {len(skipped)}")
PYEOF
) || { echo "警告: 预信任脚本失败, 不阻塞派发——pane 弹 trust 弹窗时手动选 Yes" >&2; exit 3; }

echo "$OUT"
