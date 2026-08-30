# 新设备部署手册：FlowKit + 双图工具链 → 多仓项目（以 FDNote 为例）

> 适用场景：在另一台设备上从零部署 FlowKit 与 codegraph × serena 双图工具链，并接入既有多仓项目。
> 协议版（给 AI 读的精简六步）见 `skills/flow-deep/references/multi-repo-toolchain.md` 的「跨设备 bootstrap」节——**手册给人看，协议给 AI 看，两者同源**。
> 实测背书：2026-08-30 在 FDNote 工作区全量验证（半年旧 DB 兼容新 CLI / 增量 sync 19s / 跨仓四段式冒烟全通）。

## 前置认知：三样东西不随 git 走

| 类别 | 说明 | 处理 |
|---|---|---|
| 个人记忆数据 | auto-skill 的经验条目在 `~/.claude/skills/auto-skill/{knowledge-base,experience}/` 本地——flowkit 仓库里只有空骨架（隐私设计） | 从旧设备拷贝，或从私人备份仓恢复 |
| 密钥类 | `~/.prime/agent/auth.json`（prime-agent）、settings.json 的 env token | 本地文件，新设备重配 |
| codegraph DB | 两台设备代码已分叉，拷 DB = 引入陈旧索引 | **不迁移**——新设备本地重建（第 8 步，约 1 分钟） |

## 第一阶段：装 FlowKit（约 10 分钟）

```bash
# 1. clone 并就位（运行时位置是 ~/.claude/skills/）
git clone https://github.com/FrizzleFur/flowkit.git ~/flowkit
mkdir -p ~/.claude/skills
for s in flow flow-deep multi-agent prompt auto-skill; do
  cp -R ~/flowkit/skills/$s ~/.claude/skills/$s
done

# 2. 恢复个人记忆（二选一）
#    a) 从旧设备 rsync ~/.claude/skills/auto-skill/{knowledge-base,experience}/
#    b) 从私人备份仓恢复

# 3. Claude Code 配置：settings.json / 全局 CLAUDE.md
#    从私人配置仓恢复（含 enabledPlugins: serena、MCP 配置等）
```

**验证**：新设备 Claude Code 里 `/flow-deep` 能触发、serena 工具可用。

## 第二阶段：装工具链（约 5 分钟）

```bash
# 4. 环境检查（codegraph 硬约束）
node -v    # 必须 >= 20 且 < 25

# 5. 装 codegraph CLI
npm i -g @colbymchenry/codegraph
codegraph --version   # 应显示 1.6.x

# 6. serena：确认插件已启用（settings.json 的 enabledPlugins 含 serena@claude-plugins-official）
#    （可选）codegraph MCP 挂载让 agent 自动调用：codegraph install
```

## 第三阶段：接入多仓项目（以 FDNote 为例，约 5 分钟 + 同步时间）

```bash
# 7. 拉代码（双机策略：merge 不 rebase，功能新一代为准）
cd ~/Works/FDNote   # 新设备上的实际路径
for r in FDNotepad FDNotepadCore FDNotepadShared FDHandWriting FDProtoBuf FDAnalytics FDBug FDTextView Utils; do
  git -C $r pull --no-rebase
done

# 8. 建图（新设备首次 = 全量 init，4.6k 文件约 1 分钟）
cd ~/Works/FDNote
codegraph init .
codegraph status   # 验证：应显示 ~4600 files / 15 万+ nodes

# 9. serena 激活（FDNotepadCore 的 project.yml 已随仓提交；其他仓用路径激活 = 即注册即激活）
#    在 Claude Code 里: activate_project("<绝对路径>/FDNote/FDNotepadCore") 等

# 10. 冒烟验证（四段式）
codegraph query FDStackView        # 应定位到 FDNotepadShared 仓
#    serena: activate_project FDNotepadShared → find_symbol FDStackView
#    行号一致 = 部署成功
```

## 最容易踩的三个坑（实证）

1. **每次 pull/merge 后要 `codegraph sync .`**——另一台设备的提交不在本机索引里，DB 是本地投影，git 才是真相源
2. **serena 新仓激活后语言为空**——没有 `project.yml` 的仓激活后 LSP 不启动，编辑前先补 languages 配置（照 FDNotepadCore 的格式抄）
3. **跨仓切换时 serena 的可用工具集会变**——切仓后先确认所需工具还在，再下发编辑指令

## 双图协作要点（速查）

- **分工**：codegraph = 地图册（跨仓全局视野：谁调用谁、改这里影响哪）/ serena = 实时导航 + 施工队（单仓精确到函数，符号级编辑）
- **四段式**：codegraph 定位 → serena 实读 → serena 精改 → 诊断 + impact 复查
- **交接铁律**：codegraph → serena 只传「类名 + 文件名」，**不传行号**（地图册的行号可能是旧的；确切的行号让实时导航自己查）
- 详细协议：`skills/flow-deep/references/multi-repo-toolchain.md`
