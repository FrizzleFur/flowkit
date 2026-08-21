# Agent 分发方式（tmux 分屏优先，无 tmux 自动降级）

> 适用于 flow/flow-deep 所有阶段中需要使用 Agent 的场景。

首次使用 Agent 前，用 Bash 检测:

```bash
[ -n "$TMUX" ] && echo "IN_TMUX" || echo "NO_TMUX"
```

## CRITICAL 规则（环境自适应，双模式）

**IN_TMUX → tmux-split 团队模式**（可实时观察各 agent 分屏执行）:
  1. 记录主面板 MAIN_PANE=$(tmux display-message -p '#{pane_index}')
  2. TeamCreate 创建团队；每个 Agent 调用必须带 team_name 参数（与 TeamCreate 一致）
  3. 禁止 Agent(run_in_background: true) 或 Agent() 不带 team_name
  4. 无依赖的 Agent 在同一条消息中并行调用
  5. Agent 完成后立即清理: 不被复用 → SendMessage shutdown → 等 2s → 无响应则强制 kill pane（跳过 MAIN_PANE）

**NO_TMUX → 无分屏并发模式**（静默降级）:
  1. 无依赖的 Agent 在同一条消息中并行调用（普通 Agent 调用，不带 team_name，不用 TeamCreate）
  2. 并发数同样遵守规模档位硬约束（同一条消息 ≤ 4 防 429）
  3. Delegate 协调协议不变（Coordinator 不写业务代码）；无 pane 可管，清理步骤跳过
  4. 结果由 Agent 返回值直接汇总，无需 SendMessage 协调

> 为什么静默降级：tmux 只是可视化增强，不是能力前提。多数环境本就没有 tmux——提示安装会打断任务流
> 且收益有限。有则分屏观察、无则照常并发，用户无感。

## 工具调用模板

```javascript
// IN_TMUX:
MAIN_PANE=$(tmux display-message -p '#{pane_index}')
TeamCreate({ team_name: "task-team", description: "..." })
→ Agent({ name: "agent-1", team_name: "task-team", subagent_type: "...", prompt: "..." })
→ Agent({ name: "agent-2", team_name: "task-team", subagent_type: "...", prompt: "..." })

// NO_TMUX（静默降级）:
→ Agent({ name: "agent-1", subagent_type: "...", prompt: "..." })
→ Agent({ name: "agent-2", subagent_type: "...", prompt: "..." })
```

## Delegate 模式

主 Agent 是 Coordinator，不是 Implementor。不参与业务代码编写，专注于任务分配、进度追踪、异常处理、结果汇总。

> 详细协议见 `/multi-agent` SKILL.md 的 "Delegate 模式" 章节
