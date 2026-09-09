# Agent 分发方式（tmux 分屏优先，无 tmux 自动降级）

> 适用于 flow/flow-deep 所有阶段中需要使用 Agent 的场景。

首次使用 Agent 前，用 Bash 检测，并在回复中显式写出判定行（`执行模式判定: IN_TMUX → tmux-split` 或 `NO_TMUX → no-split`）后再启动 Agent:

```bash
[ -n "$TMUX" ] && echo "IN_TMUX" || echo "NO_TMUX"
```

> 静默降级 ≠ 免检测：降级仅依据检测结果 NO_TMUX，跳过检测直接按降级分发属于流程违规。同会话首次分发前检测一次即可，后续分发沿用该判定。

## CRITICAL 规则（环境自适应，双模式）

**IN_TMUX 且 pane 正常 → tmux 分屏可视化模式**（可实时观察各 agent 分屏执行）:
  1. 记录主面板 MAIN_PANE=$(tmux display-message -p '#{pane_index}')
  2. Agent(name=...) 会话内唯一命名启动（TeamCreate/TeamDelete 已废弃勿用；team_name 参数已废弃，传了也被忽略）；tmux 中 subagent 自动分配 pane
  3. 无依赖的 Agent 在同一条消息中并行调用
  4. Agent 完成后立即清理: 不被复用 → SendMessage shutdown → 等 2s → 无响应则强制 kill pane（跳过 MAIN_PANE）
  5. pane 故障（respawn failed，如 Warp 环境 Device not configured）→ 按下面 NO_TMUX 模式继续，不阻塞任务

**NO_TMUX 或 pane 故障 → 无分屏并发模式**（静默降级）:
  1. 无依赖的 Agent 在同一条消息中并行调用（Agent(name=...) 唯一命名；当前版本 subagent 默认后台运行）
  2. 并发数同样遵守规模档位硬约束（同一条消息 ≤ 4 防 429）
  3. Delegate 协调协议不变（Coordinator 不写业务代码）；无 pane 可管，清理步骤跳过
  4. 结果由 Agent 返回值/完成通知直接汇总；SendMessage(to: name) 按需用于协调与复用

> 为什么静默降级：tmux 只是可视化增强，不是能力前提。多数环境本就没有 tmux——提示安装会打断任务流
> 且收益有限。有则分屏观察、无则照常并发，用户无感。

## 工具调用模板

```javascript
// IN_TMUX（自动分屏可视化）:
MAIN_PANE=$(tmux display-message -p '#{pane_index}')
→ Agent({ name: "agent-1", subagent_type: "...", prompt: "..." })
→ Agent({ name: "agent-2", subagent_type: "...", prompt: "..." })
→ SendMessage({ to: "agent-1", summary: "...", message: "..." })  // 按名寻址协调

// NO_TMUX 或 pane 故障（静默降级）: 调用形态相同，仅无 pane 可视化与 pane 清理
→ Agent({ name: "agent-1", subagent_type: "...", prompt: "..." })
→ Agent({ name: "agent-2", subagent_type: "...", prompt: "..." })
```

## Delegate 模式

主 Agent 是 Coordinator，不是 Implementor。不参与业务代码编写，专注于任务分配、进度追踪、异常处理、结果汇总。

> 详细协议见 `/multi-agent` SKILL.md 的 "Delegate 模式" 章节

## 权限与作用域（分发执行型 agent 前必读）

> subagent 完整继承主会话的权限模式与 allow/deny 规则（官方文档确认），但**不继承**主会话已批准的单次授权。理解以下机制可避免「subagent 启动后卡在权限确认上无人察觉」（2026-09-09 依据官方 permissions/sub-agents/permission-modes 文档核实）。

### 机制速览

| 机制 | 事实 |
|---|---|
| 权限模式继承 | subagent 继承主会话权限模式；父会话为 acceptEdits / bypassPermissions 时优先级最高，subagent 自身配置无法覆盖 |
| allow/deny 规则 | 会话级全局，主会话与全部 subagent 共用 |
| acceptEdits 自动接受 | 工作目录 + `permissions.additionalDirectories` 内的 Edit/Write（**含新建文件**），及 mkdir/touch/mv/cp/sed 等文件系统命令 |
| 作用域外路径 | 上述范围之外的路径（典型：项目同级新建文件夹、/tmp、~ 下其他目录），任何模式都弹提示 |
| 保护路径 | `.claude/`、`.git/` 等，任何模式都弹，allow 规则也无法预批准（仅 bypassPermissions 例外） |
| Bash 写盘 | 重定向按目标路径检查（作用域内随模式放行）；python 等解释器执行不在自动批准清单，需 allow 前缀规则（如 `Bash(python3:*)`） |
| 批准持久化 | 文件编辑类弹窗「don't ask again」仅会话内有效**不落盘**；Bash 类才落盘（每仓库 + 每命令）→ default 模式下每个新路径都会反复弹 |

### 作用域外写入前置处理协议

任务需要写工作目录 / additionalDirectories 之外（如新建项目同级文件夹）时，**在派发 subagent 前处理**，不要让 agent 带着未授权路径启动：

1. Stage 3 规划时提取写入路径清单，标记作用域外路径
2. 分发前向用户呈现清单与选项：
   - `/add-dir <路径>`（推荐）：会话内一次性扩域，之后该路径按当前权限模式自动处理
   - 项目 `.claude/settings.local.json` 写绝对路径规则（`//` 前缀 = 文件系统绝对路径，如 `Edit(//Users/x/new-dir/**)`）：跨会话持久
   - 修改规划：产物移到工作目录内
3. 用户未选择前不派发涉及该路径的 agent

### 分发 prompt 约定

- 写盘一律用 Write/Edit 工具，避免 Bash 重定向/解释器写盘（减少弹窗面，失败语义更清晰）
- 作用域外路径操作（如 mkdir 新同级目录）不安排进 agent prompt，先走前置处理协议

### 弹窗诊断对照表

| 现象 | 根因 | 处理 |
|---|---|---|
| 写项目内文件也弹 | 会话处于 default 模式（Plan 审批选了 manually approve，或会话早于 defaultMode 配置启动） | Shift+Tab 切 acceptEdits；新会话依赖 settings 的 `permissions.defaultMode` |
| 写新建的同级/外部目录弹 | 路径在作用域外 | `/add-dir` 或绝对路径 allow 规则 |
| 写 `.claude/`、`.git/` 下弹 | 保护路径，allow 也救不了 | 逐次人工批准；批量场景考虑 bypassPermissions（慎用） |
| Bash 命令弹 | 命令不在 allow 前缀且不在 acceptEdits 自动批准清单 | 弹窗批准（落盘持久）或补 allow 规则 |
