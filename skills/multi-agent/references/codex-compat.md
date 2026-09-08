# multi-agent 的 Codex 兼容适配层

> 适用环境：OpenAI Codex CLI。**Claude Code 环境忽略本文件**——原生 Agent/Task/SendMessage 直接可用。

## 机制映射

| Claude Code | Codex |
|---|---|
| Agent(name, subagent_type) | `spawn_agent`（返回句柄，无命名寻址；自定义 agent 类型用 `~/.codex/agents/` TOML 定义，含 model / sandbox_mode / mcp_servers） |
| TaskList（查询复用判定） | 读 `.plan/progress.md`（主会话是唯一协调者，自己维护状态） |
| SendMessage（agent 间通信） | `send_input` 单向注入运行中 agent；架构上改为主从模式——主会话分发→wait_agent→汇总，agent 间不直接互通 |
| TaskStop | `close_agent` |
| 后台任务 | `codex exec` / 后台终端（`/ps` / `/stop`）可作补充 |

## 不变项

- tmux 分屏与 pane 清理：OS 层能力，与 harness 无关，规则照旧
- 并发约束：同批次 spawn ≤2 防 429（Codex `[agents] max_concurrent_threads_per_session` 可按套餐调整）
- Delegate 协议（主会话是 Coordinator 不是 Implementor）：平台无关

## 架构差异提醒

Codex 无跨会话常驻 teammate：Phase 间「复用空闲 Agent」改为「Phase 内 spawn→wait→close」生命周期收窄到单 Phase；Phase 续接状态全部落 `.plan/progress.md` 文件。
