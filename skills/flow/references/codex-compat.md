# flow 的 Codex 兼容适配层

> 适用环境：OpenAI Codex CLI（以及机制同构的其他 harness，如 DeepSeek dsh）。
> **Claude Code 环境忽略本文件**——原生机制直接可用，无任何降级。

环境自判：工具集中出现 `spawn_agent` / `send_input`（Codex 多 agent 工具族）而非 Claude Code 的 Agent / Task 工具族，即为 Codex 环境。dsh 环境出现 `ask_user_question` / `exit_plan_mode`。

## 调用约定

- Claude Code：`/flow <任务>` ；Codex：`$flow <任务>`（skill 显式调用前缀差异，参数语义不变）

## 机制映射表（CC → Codex）

| Claude Code | Codex 降级方式 |
|---|---|
| AskUserQuestion | 编号选项自然语言：输出「请选择：1)… 2)… 3)…（推荐 1）」后**停止等待回复**，不替用户选择 |
| EnterPlanMode（只读沙箱） | 无强制沙箱。探索阶段开始前显式声明「只读探索，不改文件」，自律用 Read/Glob/Grep |
| ExitPlanMode（审批环） | 输出完整 plan 后**停止**，明示「计划已呈上，请回复批准或修改意见」，获批后才进入执行 |
| TaskCreate/TaskList/TaskUpdate/TaskGet | planning-with-files 文件协议：`.plan/task_plan.md`（计划与状态）+ `progress.md`（进度）。任何续接前先读 progress.md |
| Agent(name, subagent_type) | `spawn_agent`（返回句柄）；等待 `wait_agent`；回收 `close_agent` |
| SendMessage（双向寻址） | `send_input` 单向注入运行中 agent。Phase 协调改为主会话中心化：分发→wait→汇总，不做 agent 间自由通信 |
| TaskStop | `close_agent` |
| Stop Hook（Ralph Loop） | Codex hooks.json 的 Stop 事件 `decision:block` 语义同构（本期未移植，记录备用） |

## 各 Stage 要点

- Stage 1.5 需求澄清：用编号选项模板逐项问，每次一批 ≤4 问
- Stage 3 规划：plan 文件即审批物；planning-with-files 协议天然兜底 Task 系统缺失
- Stage 4 并发：spawn_agent 并行分发沿用「同批次 ≤2」约束（Codex `[agents] max_concurrent_threads_per_session` 可调）；tmux 分屏不变（OS 层能力）
- Stage 5 验证：Evidence 表照常输出

## dsh（DeepSeek Harness）备注

dsh 机制同构度高于 Codex：`ask_user_question` / `exit_plan_mode` 原生存在，hooks-claude-code 桥可直接复用 Claude Code hooks.json。本文件映射表在 dsh 下大多不需要。详见调研报告 `FDFeature/toolchain-survey/flow生态移植调研-Codex与DeepSeek.md`（2026-09-08）。
