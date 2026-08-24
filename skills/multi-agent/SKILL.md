---
name: multi-agent
description: >
  Agent Teams 方案生成与执行引擎。通过 Agent(name) + SendMessage(to: name) 工具链并行分发多 agent 团队（subagent 后台运行）；
  在 tmux 中且 pane 可用时自动获得分屏可视化，pane 故障或无 tmux 时静默降级为无分屏并发（无需任何前置依赖）。
  当用户说 /MultiAgent、"多agent"、"团队协作"、"并行处理"、"teammate"、"创建agent团队" 时使用。
  支持项目上下文感知、协作式方案生成，环境自适应。
---

# MultiAgent Skill

## When to Use

Trigger when user:
- 显式调用 `/MultiAgent <任务描述>`
- 请求创建 Agent Teams / spawn teammates
- 使用关键词: "多 agent", "团队协作", "并行处理", "teammate"
- 任务需要多 Agent 并发执行

## Core Architecture

```mermaid
graph TB
    A[用户输入] --> S0[Step 0: 项目上下文感知]
    S0 --> S1[资源检测]
    S1 --> S2[任务分析 + 角色匹配]
    S2 --> S3[协作式方案生成]
    S3 --> S4[用户微调确认]
    S4 --> S5[执行]
```

## Step 0: 项目上下文感知

在资源检测前，先了解项目背景，为 Agent 推荐和 prompt 注入提供基础。

**扫描策略（优先级递减）**:

1. **ONBOARDING.md**（如有）→ 提取工作类型分布、MCP 清单、团队 Tips
2. **CLAUDE.md** → 提取项目规范、代码风格、约束条件
3. **轻量扫描**（兜底）:
   - `git log --oneline -20` → 活跃领域/模块
   - `cat package.json` → 技术栈
   - `settings.json` → 已配置 MCP/Skills

**输出（注入到每个 Agent prompt）**:
```yaml
project_context:
  tech_stack: "如 Node.js/Express/TypeScript"
  active_areas: "如 支付模块、认证系统"
  code_style: "如 偏好函数式、禁止 any"
  key_files: "如 src/api/*, src/models/*"
  mcp_tools: "如 serena, playwright"
```

## Step 1: 资源检测

```yaml
检测来源:
  Agents: ~/.claude/plugins/*/agents/
  Plugins: settings.json → enabledPlugins
  Subagents: Agent tool 的 subagent_type 列表
  MCP: settings.json → mcpServers
  tmux: "[ -n \"$TMUX\" ] && echo IN_TMUX || echo NO_TMUX"
```

## Step 2: 任务分析 + 角色匹配

统一的角色映射表（任务类型 → 角色 → subagent_type）:

| 任务类型 | 推荐角色 | subagent_type |
|----------|---------|---------------|
| 代码审查 | security-auditor, code-reviewer | `voltagent-qa-sec:security-auditor` |
| 功能开发(前端) | frontend-developer | `voltagent-core-dev:frontend-developer` |
| 功能开发(后端) | backend-developer | `voltagent-core-dev:backend-developer` |
| 全栈开发 | fullstack-developer | `voltagent-core-dev:backend-developer` |
| 数据库 | database-optimizer | `voltagent-data-ai:postgres-pro` |
| 测试 | test-automator | `voltagent-qa-sec:test-automator` |
| 安全 | security-auditor | `voltagent-qa-sec:security-auditor` |
| DevOps | devops-architect | `voltagent-dev-exp:build-engineer` |
| 文档 | technical-writer | `voltagent-dev-exp:documentation-engineer` |
| 研究 | research-analyst | `voltagent-research:research-analyst` |
| 数据 | data-analyst | `voltagent-data-ai:data-analyst` |
| 通用 | general-purpose | `general-purpose` |

> 注意: subagent_type 依赖已安装的 voltagent 插件。运行前用 `ls ~/.claude/plugins/*/agents/` 验证映射是否有效。

**复杂度判断**:

| 级别 | 条件 | 确认步骤 |
|------|------|---------|
| 简单 | <3 个队友、无依赖 | 仅确认队友 |
| 中等 | 3-5 个队友、有依赖 | 队友 + 文件 + 依赖 |
| 复杂 | >5 个队友、跨系统 | 队友 + 文件 + 依赖 + 隔离 + 验收标准 |

**动态工作流规模档位**（与 Claude Code 原生 `/config` 动态工作流规模对齐）:

> 以下为建议性指导（非强制限制）。用于在复杂度判断后，给出并发代理数量建议。

| 档位 | 同消息并发代理数 | 适用 | 速率风险控制 |
|------|----------|------|-------------|
| `small` | 1-2 | 简单任务、单维度审查 | 无 |
| `medium` | 2（默认安全上限） | 中等任务、多维审查 | 默认安全 |
| `large` | 3-4（**必须分批，每批 2**） | 复杂任务、跨系统 | 前批完成 ≥60% 再发下批；单 agent 失败自动重试 |

> **硬约束（2026-08-24 二次校准：官方文档 + 两次实测）**:
> - **官方口径**（docs.bigmodel.cn/cn/api/rate-limit）：限制对象是「同一时刻处理中的请求数」（账户+模型维度，无公开数字）；GLM Coding Plan 按套餐建议并发项目数——**Lite 1 / Pro 1-2 / Max 2+**（每项目内含 subagent 并发）；高峰期账户级动态限流；错误码 1302=账户并发达限（降并发/加队列）、1305=平台过载（退避重试）
> - **实测**：6 并发触发 429（2026-08-21）；**4 并发 + 主会话同时持续工具调用同样触发限制（2026-08-24）**
> - **并发预算公式**：有效并发 = 主会话（恒占 1 路）+ 运行中 subagent 数 + 其他活跃 Claude 会话数。**subagent 同消息分发默认 ≤ 2**；存在其他并行会话（tmux 多 tab / 多项目）时降为 1 或串行
> - **启动前检查**：分发前确认无其他活跃 claude 会话（tmux list-panes / 进程观察）；有则压缩本批并发
> - **触发 429/1302 后**：暂停分发新 agent（已跑的由平台限流重试，不死等）；主 Agent 用 Bash/grep/Tavily 接管关键路径；恢复分发需退避间隔，禁止固定间隔高频重试（官方明确反对）
> - 为每个 agent 准备 fallback（API Error / 超时 → 主 Agent 接管），防单点卡死

## Step 3: 协作式方案生成

**核心理念**: 先输出完整方案草案，再请用户微调（而非逐项确认）。

```
流程:
  分析任务 → 直接输出完整方案（含队友/文件/依赖/执行步骤）
  → 用户审阅并指出需要调整的部分
  → 修改后确认
```

**方案输出格式**:

```markdown
# Agent Teams 方案: [任务名称]

## 任务概览
- 目标: [任务目标]
- 复杂度: [级别]
- 队友数量: [N]
- 执行模式: [tmux-split | no-split]  ← Step 1 tmux 检测结果，随方案一并确认，勿留到执行阶段才判定

## 队友配置
| 队友 | 角色 | subagent_type | 文件范围 | 依赖 |
|------|------|---------------|---------|------|

## 依赖图
[Mermaid graph showing dependencies]

## Agent Prompt 要点
每个 Agent 的 prompt 应包含:
  1. 具体任务描述
  2. 项目上下文摘要（Step 0 输出）
  3. 文件边界（可编辑/只读/禁止）
  4. 与其他 Agent 的接口约定
```

## Step 4: 评分检查

输出方案前做快速质量检查:

| 维度 | 权重 | 检查项 |
|------|------|--------|
| 任务清晰度 | 25% | 目标明确? 范围界定? |
| 角色匹配 | 25% | 角色匹配任务? 资源可用? |
| 文件分配 | 15% | 无冲突? 边界清晰? |
| 依赖关系 | 15% | 无循环? 可并行? |
| 上下文完整 | 20% | 技术栈? 约束? 示例? |

**关键问题检测**:
- 队友角色与任务不匹配 → Critical
- 多个队友编辑同一文件 → Critical
- 指定资源未安装 → Critical
- 缺少关键角色/依赖循环 → High

## Step 5: 执行模式

### 环境检测（执行模式的唯一判定来源）

```bash
[ -n "$TMUX" ] && echo "IN_TMUX" || echo "NO_TMUX"
```

**判定规则（防跳过检测）**:
- 方案（Step 3）已含「执行模式」行 → 按方案执行，不重复判定
- 方案缺失模式行 → 启动任何 Agent 前必须先跑检测，并在回复中显式写出判定行：
  `执行模式判定: IN_TMUX → tmux-split`（或 `NO_TMUX → no-split`）
- **跳过检测 ≠ NO_TMUX**：未判定就按降级启动属于流程违规（实测踩坑 2026-08-21：跳过检测直接降级启动两个审计 agent，分屏可观察性丢失且启动后不可逆）

### tmux 分屏可视化模式（IN_TMUX 且 pane 正常时）

在 tmux 中时，Agent 工具会自动为 subagent 分配 pane，可实时观察各 agent 执行。

```
CRITICAL 规则（2026-08 实测更新，TeamCreate/team_name 已废弃）:
  必须 → Agent(name=...) 会话内唯一命名 + SendMessage(to: name) 按名寻址
  废弃 → TeamCreate/TeamDelete（工具已不存在）；Agent(team_name)（参数已废弃，传了也被忽略——session 有单一隐式 team）
  pane 故障 → 首个 Agent 报 respawn pane 失败（如 Warp 环境 Device not configured）→ 立即按无分屏降级继续，不阻塞任务
```

### 无分屏并发模式（NO_TMUX 或 pane 故障时，静默降级）

不在 tmux 环境时自动切换，**不提示用户安装/启动 tmux、不要求重试**——tmux 只是可视化增强，不是能力前提；多数环境本就没有 tmux，提示安装会打断任务流。静默的对象是「不提示用户装 tmux」，**不是免检测**——降级仅依据检测结果 NO_TMUX（或 IN_TMUX 下的 pane 故障实测）。

```
规则:
  无依赖的 Agent 在同一条消息中并行调用（当前版本 subagent 默认后台运行，本模式即默认形态）
  并发数遵守规模档位硬约束（同一条消息 ≤ 2，超出分批防 429/1302）
  TaskCreate/TaskUpdate 照常用于任务追踪（不绑定 pane）
  结果由 Agent 返回值/完成通知直接汇总；无 pane 清理步骤
```

**执行步骤**:

1. **记录主面板**（IN_TMUX 时）: `MAIN_PANE=$(tmux display-message -p '#{pane_index}')`，后续清理跳过该面板

2. **并行启动 Teammates**（无依赖的在同一条消息中）:
   ```
   Agent({ name: "agent-1", subagent_type: "...", prompt: "[含项目上下文的完整任务描述]" })
   Agent({ name: "agent-2", subagent_type: "...", prompt: "[...]" })
   ```
   name 会话内唯一，用于 SendMessage({ to: "agent-1" }) 寻址与多阶段复用；无需创建 team（TeamCreate 已废弃）。

3. **创建和分配任务**:
   ```
   TaskCreate({ title: "[任务]", description: "[描述]" })
   TaskUpdate({ id: "[task-id]", owner: "[teammate-name]" })
   ```

4. **监控协调**: TaskList 跟踪进度，SendMessage 协调，完成后 shutdown

5. **清理**（Agent 完成/全部完成后）:
   - **即时清理**: TaskList 检测 Agent completed 且不被后续复用 → `SendMessage shutdown` → 等 2s → 无响应则强制 kill pane（跳过 MAIN_PANE）
   - **孤儿清理**: Phase 切换前，检测进程已退出的残留 pane:
     ```bash
     W=$(tmux display-message -p '#{session_name}:#{window_index}')
     tmux list-panes -t "$W" -F '#{pane_index} #{pane_id} #{pane_current_command}' | while read idx pid cmd; do
       [ "$idx" = "$MAIN_PANE" ] && continue
       echo "$cmd" | grep -qiE 'claude|node' && continue
       tmux kill-pane -t "$pid" 2>/dev/null
     done
     ```
   - **全局清理**: 所有 Phase 完成后，倒序 kill 非 MAIN_PANE → 验证仅剩主面板（TeamDelete 已废弃，无需调用）:
     ```bash
     W=$(tmux display-message -p '#{session_name}:#{window_index}')
     LAST=$(tmux list-panes -t "$W" -F '#{pane_index}' | tail -1)
     for i in $(seq "$LAST" -1 0); do [ "$i" = "$MAIN_PANE" ] || tmux kill-pane -t "$W.$i" 2>/dev/null; done
     [ "$(tmux list-panes -t "$W" | wc -l | tr -d ' ')" = "1" ] && echo "清理完成" || echo "警告: 仍有残留面板"
     ```

## Delegate 模式

主 Agent 是 Coordinator，不是 Implementor。

**职责**: 任务分配(TaskCreate+TaskUpdate) | 进度追踪(TaskList) | 依赖协调(SendMessage) | 异常处理 | 结果汇总

**禁止**: 自己写业务代码 | 绕过 TaskList 直接操作文件 | 抢占编辑同一文件

**Agent 间交接**:
- 文件交接: Agent A 写入 → 主 Agent 确认 → Agent B 读取
- TaskList 交接: A TaskUpdate(completed) → 主 Agent 检测 → 启动 B
- SendMessage 交接: 即时通知/协调指令

### 多阶段续接（优先复用分屏）

Phase 间不应销毁 team，应复用空闲 Agent:

1. **TaskList** → 找 status=completed 的 Agent
2. **SendMessage** → 发送新任务给空闲 Agent（复用原分屏）
3. **补充/裁剪** → 空闲不够则新建，多余则 shutdown

```
绝对禁止:
  不管已有 pane 直接创建新 Agent（面板越开越多）
  全部 shutdown 再重建（浪费资源）
  （原「禁止 run_in_background 替代分屏 Agent」条已过时：当前版本 subagent 默认后台运行，以 name 寻址复用即可）
```

### 冲突解决

| 类型 | 预防 | 处理 |
|------|------|------|
| 文件冲突 | 明确文件边界 | 主 Agent 审查差异，选择保留版本 |
| 设计冲突 | Stage 2 明确接口 | 主 Agent 裁决，SendMessage 通知适配 |
| 依赖冲突 | task_plan 标注依赖 | 主 Agent 重新排序 |
| 进度阻塞 | 设置超时 | 重试或降级 |
| 崩溃循环 | 单 agent 失败上限 2 次 | 连续 2 次崩溃 → 主 Agent 串行接管，不再重生（见 cleanup-procedure.md「崩溃循环检测与降级」） |

## Agent Prompt 模板

每个 Agent 的 prompt 应遵循以下结构:

```
## 任务
[具体任务描述]

## 项目上下文
- 技术栈: {project_context.tech_stack}
- 代码风格: {project_context.code_style}
- 注意事项: {project_context.known_issues}

## 文件边界
- 可编辑: [文件列表]
- 只读: [文件列表]
- 禁止: [文件列表]

## 接口约定
[与其他 Agent 的数据交换格式/接口定义]

## 完成标准
[明确的验收条件]
```

## 示例

### 示例: 中等任务 - 用户认证功能

```
输入: /MultiAgent 实现用户认证功能

Step 0: 读取 CLAUDE.md → 技术栈 Node.js/Express
Step 1: 检测资源 → fullstack-developer, test-automator 可用
Step 2: 任务分析 → 功能开发, 中等复杂度

方案草案:
| 队友 | 角色 | 文件范围 | 依赖 |
|------|------|---------|------|
| api | backend-developer | src/api/auth/*, src/middleware/auth.* | - |
| test | test-automator | tests/auth/* | api |

用户微调 → 确认 → 执行:
  Agent({ name: "api",
    subagent_type: "voltagent-core-dev:backend-developer",
    prompt: "实现用户认证: JWT token, 登录/注册/刷新接口...\n项目上下文: Node.js/Express..." })
  Agent({ name: "test",
    subagent_type: "voltagent-qa-sec:test-automator",
    prompt: "为 auth 模块编写测试..." })
```

### 简写: 简单任务
Bug 修复 → 1 个 fixer(frontend-developer) + 1 个 reviewer(code-reviewer)，无依赖，直接并行。

### 简写: 复杂任务
支付系统重构 → 5 个 Agent（core/gateway/security/database/test），3 个 Phase，需 worktree 隔离，Phase 间复用分屏。

## Quick Reference

```
/MultiAgent [任务描述]    Agent(name) 并行分发；有 tmux 且 pane 正常 → 自动分屏可视化；否则无分屏并发（自动降级）
```

> 环境自适应: 在 tmux 中则分屏执行；不在则静默降级为无分屏并发。无需安装 tmux，但必须先完成环境检测——跳过检测 ≠ NO_TMUX。

| 复杂度 | 队友数 | 确认项 |
|--------|--------|--------|
| 简单 | 2-3 | 队友分配 |
| 中等 | 3-5 | 队友 + 文件 + 依赖 |
| 复杂 | 5+ | 队友 + 文件 + 依赖 + 隔离 + 验收 |

> 编排理论、通信模式、高级技术和 Python 参考代码见 `references/advanced-content.md`
