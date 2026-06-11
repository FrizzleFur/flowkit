# Agent 分发方式（tmux 分屏优先）

> 适用于 flow/flow-deep 所有阶段中需要使用 Agent 的场景。

首次使用 Agent 前，先用 Bash 检测:

```bash
[ -n "$TMUX" ] && echo "IN_TMUX" || echo "NO_TMUX"
```

若不在 tmux 中，提示用户先启动: `tmux new -s work`，然后重试。

## CRITICAL 规则

```
tmux-split 是唯一执行模式:
  1. 第一步: 记录主面板 MAIN_PANE=$(tmux display-message -p '#{pane_index}')
  2. 第二步: 调用 TeamCreate 创建团队
  3. 每个 Agent 调用必须带 team_name 参数（与 TeamCreate 一致）
  4. 禁止使用 Agent(run_in_background: true) 或 Agent() 不带 team_name
  5. 无依赖的 Agent 在同一条消息中并行调用
  6. Agent 完成后立即清理: 不被后续复用 → SendMessage shutdown → 等 2s → 无响应则强制 kill pane（跳过 MAIN_PANE）
```

## 工具调用模板

```javascript
MAIN_PANE=$(tmux display-message -p '#{pane_index}')
TeamCreate({ team_name: "task-team", description: "..." })
→ Agent({ name: "agent-1", team_name: "task-team", subagent_type: "...", prompt: "..." })
→ Agent({ name: "agent-2", team_name: "task-team", subagent_type: "...", prompt: "..." })
```

## Delegate 模式

主 Agent 是 Coordinator，不是 Implementor。不参与业务代码编写，专注于任务分配、进度追踪、异常处理、结果汇总。

> 详细协议见 `/multi-agent` SKILL.md 的 "Delegate 模式" 章节
