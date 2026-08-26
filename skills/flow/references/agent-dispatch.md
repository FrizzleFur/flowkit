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
