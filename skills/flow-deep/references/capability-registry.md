# Capability Registry - 能力注册表

> flow-deep 的能力索引。Stage 0 扫描时与此文件交叉比对，生成当前会话的可用能力矩阵。

## 注册表结构

每个能力条目格式：

```
### CID: skill-name
- 类型: 必需/可选/增强/领域
- 层级: orchestrate/discipline（默认 discipline，见下方"层级二分"）
- 触发条件: 何时自动启用
- 适用 Stage: 0-5.5
- 路由指令: Agent 注入内容（或引用 skill-routing.md）
- 依赖: 需要的前置能力
- 互斥: 与哪些能力冲突
```

---

## 层级二分（Orchestrate vs Discipline）

> 灵感来自 Matt Pocock 的 user-invoked / model-invoked 二分。约束 Stage 间调用方向，避免编排入口互相耦合、避免纪律反向劫持控制流。对应 flow-deep 设计宪法的"编排层与纪律层职责不混"铁律。

每个能力属于两层之一：

- **orchestrate（编排层）** — 在 flow-deep 中承担子控制流的能力：决定 plan 结构、决定并发执行、决定迭代循环。它们是"子编排器"。
- **discipline（纪律层）** — 在 Stage 内部被注入给 Agent、或作为工具被调用的复用能力（怎么写测试、怎么审查、怎么思考、领域规范、安全护栏、协议引导）。

调用方向约束：

- `orchestrate → discipline`：允许
- `orchestrate → orchestrate`：禁止直接互调，只能由 flow-deep 主线程按 Stage 顺序调度
- `discipline → orchestrate`：禁止反向劫持控制流

> 诚实说明：以上是**描述性归类**，指导新增能力时的归类与调用方向，不自动强制——实际约束靠 flow-deep 主线程的调度设计。主要价值是"新增能力时提醒归类"，非运行时拦截。

现有能力层级映射：

| CID | 能力 | 层级 |
|-----|------|------|
| C01 | using-superpowers | discipline（协议引导） |
| C02 | /prompt | discipline |
| C03 | Sequential Thinking | discipline（思考工具） |
| C04 | /mermaid | discipline |
| C05 | planning-with-files | orchestrate |
| C06 | /multi-agent | orchestrate |
| C10 | TDD | discipline |
| C11 | writing-plans | discipline |
| C12 | code-review | discipline |
| C13 | auto-iterate | orchestrate（迭代控制流） |
| C14 | verification-before-completion | discipline |
| C15 | systematic-debugging | discipline |
| C30-C34 | 领域能力 | discipline |
| C40-C42 | 安全防护 | discipline |

> 新增能力时在此表登记层级；未登记默认 discipline。

---

## L1: 管道必需能力（缺失则报错）

### C01: using-superpowers
- 类型: 必需
- 触发: 每个 flow-deep 任务
- Stage: 0
- 检查: Skill `using-superpowers` 存在
- 路由: Stage 0 前置检查脚本

### C02: /prompt
- 类型: 必需
- 触发: 每个 flow-deep 任务（`--no-prompt` 除外）
- Stage: 1
- 检查: Skill `prompt` 存在
- 路由: 调用 /prompt 技能

### C03: Sequential Thinking
- 类型: 必需
- 触发: 每个 flow-deep 任务
- Stage: 2
- 检查: MCP server `sequential-thinking` 可用
- 路由: Stage 2a 调用 mcp__sequential-thinking__sequentialthinking

### C04: /mermaid
- 类型: 必需
- 触发: 每个 flow-deep 任务（`--no-mermaid` 除外）
- Stage: 2
- 检查: Skill `mermaid` 存在
- 路由: Stage 2b 生成可视化图表

### C05: planning-with-files
- 类型: 必需
- 触发: 每个 flow-deep 任务（`--no-plan` 除外）
- Stage: 3
- 检查: Skill `planning-with-files` 存在
- 路由: 创建 .plan/ 目录和规划文件

### C06: /multi-agent
- 类型: 必需
- 触发: 每个 flow-deep 任务（`--no-multi` 除外）
- Stage: 4
- 检查: Skill `multi-agent` 存在
- 路由: 启动多 Agent 并发执行

---

## L2: 代码质量能力（自动匹配）

### C10: TDD（test-driven-development）
- 类型: 增强
- 触发: 任务包含代码实现，且存在 `test` 相关文件
- Stage: 4（Agent 注入）
- 检查: Skill `test-driven-development` 或 superpowers:test-driven-development 存在
- 路由: 注入 RED-GREEN-REFACTOR 工作流（详见 skill-routing.md）
- 互斥: 无

### C11: writing-plans
- 类型: 增强
- 触发: 任务包含代码实现（自动检测 `code-implementation` 类型）
- Stage: 3.6
- 检查: superpowers:writing-plans 存在
- 路由: 细化为 bite-sized TDD 步骤
- 依赖: C05

### C12: code-review
- 类型: 增强
- 触发: 代码实现完成后
- Stage: 4（Agent 完成后）/ Stage 5
- 检查: Skill `review` 或 superpowers:requesting-code-review 存在
- 路由: 注入 Spec 合规审查（详见 skill-routing.md）
- 依赖: C11

### C13: auto-iterate
- 类型: 增强
- 触发: `--iterate N` 参数 或 Stage 5 验证失败
- Stage: 5.5
- 检查: Skill `auto-iterate` 存在
- 路由: 启动有界 keep/revert 循环（详见 auto-iterate SKILL.md）
- 依赖: C05
- 降级: 未安装时使用内置简化循环（见 Stage 5.5 降级模式）

### C14: verification-before-completion
- 类型: 必需（flow-deep）/ 可选（flow）
- 触发: 所有任务完成后
- Stage: 5
- 检查: superpowers:verification-before-completion 存在
- 路由: 执行验证检查清单

### C15: systematic-debugging
- 类型: 增强
- 触发: 遇到 bug 或测试失败
- Stage: 4（Agent 内循环）/ Stage 5.5（迭代修复）
- 检查: Skill `systematic-debugging` 或 superpowers:systematic-debugging 存在
- 路由: 注入系统化调试协议

---

## L3: 思考模式配置（L1-C03 的参数变体）

> 注意: C20/C21 不是独立能力，而是 C03 (Sequential Thinking) 的深度参数变体。审计时不单独计为独立能力。

### C20: Sequential Thinking 默认深度
- 类型: L1-C03 的默认参数配置
- 参数: 默认 4K
- Stage: 2a
- 说明: 当 C03 可用时自动使用此配置

### C21: Sequential Thinking --think-hard
- 类型: L1-C03 的增强参数配置
- 参数: `--think-hard` 升级到 10K
- Stage: 2a
- 说明: 需要 C03 可用 + 用户显式指定 --think-hard

### C22: 三角色讨论（默认）
- 类型: 必需
- 参数: 默认启用（`--no-discuss` 禁用）
- Stage: 2c

### C23: reason 盲评法官团
- 类型: 增强
- 参数: `--reason` 启用
- Stage: 2c（替代 C22）
- 检查: autoresearch plugin 的 `/autoresearch:reason` 可用
- 互斥: 与 C22 互斥（替代关系）

---

## L4: 领域特定能力（关键词匹配）

### C30: web-access
- 类型: 领域
- 触发: 任务涉及联网、URL、网页内容
- Stage: 2（研究）/ 4（Agent 执行）
- 检查: Skill `web-access` 存在
- 路由: 注入 web-access skill 的指引
- 关键词: 联网, URL, 网页, 访问, 浏览器, 抓取

### C31: harmonyos-app
- 类型: 领域
- 触发: 任务涉及 HarmonyOS/鸿蒙开发
- Stage: 4（Agent 注入规范）
- 检查: Skill `harmonyos-app` 存在
- 路由: 注入鸿蒙开发规范
- 关键词: HarmonyOS, 鸿蒙, ArkTS, ArkUI, .ets

### C32: gstack / browse
- 类型: 领域
- 触发: 任务涉及浏览器测试、QA
- Stage: 4（Agent 注入测试流程）
- 检查: Skill `gstack` 或 `browse` 存在
- 路由: 注入 headless browser 测试指令
- 关键词: 浏览器测试, QA, E2E, 截图, 回归测试

### C33: linear
- 类型: 领域
- 触发: 任务涉及 issue/project 管理
- Stage: 2（收集需求）/ 5（更新状态）
- 检查: Skill `linear` 存在
- 关键词: Linear, issue, ticket, project, 任务管理

### C34: prime-agent
- 类型: 领域（可选，C34 可用时自动路由）
- 层级: discipline（外部工具调用）
- 触发: C34 可用时，`security-audit` / `code-verification` / `autonomous-task` 类型**自动路由**（无需触发词）
- Stage: 4（Execution Router 自动后端选择）
- 检查: `which prime-agent` 存在 + Provider API Key 可用
- 路由: 自动注入 prime-agent skill 调用指令（--no-session --mode json 模式）
- 依赖: 外部安装（`curl -fsSL https://app.primeintellect.ai/prime-agent/install.sh | sh`）+ API Key
- 禁用: `--no-prime` 退回 Claude Code 原生 Agent
- 降级: C34 不可用时（未安装/无 Key），自动降级为 Claude Code 原生 Agent，不报错
- 关键词: prime-agent, RLM, IPython 代码验证, 实际运行验证, Prime Agent, 代码执行验证, security-audit
- 说明: RLM harness，通过持久 IPython kernel 实际运行代码验证分析。C34 可用时 security-audit / code-verification 自动路由到此后端

---

## L5: 安全防护能力（自动触发）

### C40: guard
- 类型: 防护
- 触发: 检测到破坏性命令
- Stage: 任意
- 检查: Skill `guard` 存在
- 路由: 注入全量安全模式

### C41: careful
- 类型: 防护
- 触发: 检测到删除/覆盖操作
- Stage: 任意
- 检查: Skill `careful` 存在
- 路由: 注入安全护栏

### C42: freeze
- 类型: 防护
- 触发: 用户指定目录限制
- Stage: 0（设置边界）
- 检查: Skill `freeze` 存在
- 路由: 限制文件编辑到指定目录

---

## 覆盖审计模板

Stage 2 完成后，执行以下审计清单：

```markdown
## 能力覆盖审计

### 可用能力（Stage 0 扫描结果）
L1 必需: [C01: ✓] [C02: ✓] [C03: ✓] [C04: ✓] [C05: ✓] [C06: ✓]
L2 代码质量: [C10: ✓/✗] [C11: ✓/✗] [C12: ✓/✗] [C13: ✓/✗] [C14: ✓] [C15: ✓/✗]
L3 思考增强: [C20: ✓] [C22: ✓] 或 [C23: ✓/✗]
L4 领域: [C30: ✓/✗] [C31: ✓/✗] [C32: ✓/✗] [C33: ✓/✗] [C34: ✓/✗]
L5 安全: [C40: ✓/✗] [C41: ✓/✗] [C42: ✓/✗]

### 任务匹配结果
| Phase | 类型 | 匹配能力 | 是否遗漏 |
|-------|------|---------|---------|
| Phase 1 | code-implementation | C10, C11, C14 | - |
| Phase 2 | code-review | C12 | - |
| Phase 3 | testing | C10, C15 | - |

### 遗漏项（如有）
- [ ] C13 auto-iterate: 可用但未匹配，建议在 Stage 5.5 启用（如果有 --iterate）
- [ ] C30 web-access: 可用但未匹配，任务不需要联网

### 审计结论
覆盖率: N/M（可用能力中已匹配的比例）
```

---
