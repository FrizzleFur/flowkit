# Install.md — flowkit 安装剧本（写给 coding agent 执行）

> 本文件是给 Claude Code / Codex 等 coding agent 的执行剧本（借鉴 deer-flow 形态）。
> 用户侧用法：clone 本仓后，对 agent 说「按 Install.md 装好 flowkit」即可。
> 人类读者：各步骤均可手动执行，命令自足。

## 目标

把 `skills/` 下 5 个 skill（flow / flow-deep / multi-agent / prompt / auto-skill）安装为 `~/.claude/skills/` 下的可用技能。

## 约束（停止边界）

- **只做安装，不做配置**：不写 `~/.claude/settings.json`，不注册任何 hook（用户自主决定）
- **冲突即停**：目标路径已存在**非本仓**的同名目录 → 停下报告，不覆盖、不删除
- **幂等**：重复执行安全——已是正确 symlink 则跳过；已是旧版 symlink 则更新指向
- **不动仓内容**：本仓文件一律只读

## 环境检测（先全部通过再动手）

```bash
test "$(uname)" = "Darwin" || test "$(uname)" = "Linux"   # macOS / Linux
command -v git >/dev/null && git --version
command -v python3 >/dev/null && python3 --version        # lint/脚本需要
command -v claude >/dev/null && claude --version          # Claude Code 宿主
```

任一缺失 → 报告缺项并停止（不自行安装系统依赖）。

## 步骤

### 1. 定位仓库

```bash
FLOWKIT_DIR="<本仓绝对路径>"        # 即包含本 Install.md 的目录
SKILLS_DIR="$HOME/.claude/skills"
mkdir -p "$SKILLS_DIR"
```

### 2. 逐 skill 安装（symlink 优先，复制兜底）

对 `flow` `flow-deep` `multi-agent` `prompt` `auto-skill` 逐个执行：

```bash
for s in flow flow-deep multi-agent prompt auto-skill; do
  src="$FLOWKIT_DIR/skills/$s"; dst="$SKILLS_DIR/$s"
  if [ -L "$dst" ] && [ "$(readlink "$dst")" = "$src" ]; then
    echo "skip: $s 已是正确链接"
  elif [ -e "$dst" ] && [ ! -L "$dst" ]; then
    echo "CONFLICT: $dst 已存在且非本仓链接——停止，交用户裁决"
  else
    ln -sfn "$src" "$dst" && echo "linked: $s"
  fi
done
```

出现 `CONFLICT` → 停止后续步骤，报告冲突清单。

### 3. 验证（成功判据，两条都必须过）

```bash
bash "$FLOWKIT_DIR/scripts/sync-check.sh"      # 判据1：双仓一致（✓ 所有同名 skill 一致）
python3 "$FLOWKIT_DIR/scripts/lint_flowkit.py" # 判据2：lint 无 error（exit 0；warning/info 为提示级）
```

### 4. 报告（固定格式，供用户与 agent 对齐）

```
== flowkit 安装报告 ==
日期: <YYYY-MM-DD HH:MM>
仓库: <FLOWKIT_DIR> @ <git HEAD 短哈希>
已安装: <skill 列表（linked/skip/update 标注）>
验证: sync-check=<✓/✗> lint=<exit code>
跳过/冲突: <清单或无>
下一步: 重启 Claude Code 会话后 /flow /flow-deep /MultiAgent /prompt 即可用；
        auto-skill 经验库为个人数据（gitignore），随用随沉淀
```

## 卸载

```bash
for s in flow flow-deep multi-agent prompt auto-skill; do
  [ -L "$HOME/.claude/skills/$s" ] && unlink "$HOME/.claude/skills/$s"
done
```

（只解除链接，本仓与个人数据不受影响。）
