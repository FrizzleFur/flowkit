# Stage 4: 技能路由指令（flow 版）

> 本文件由 flow SKILL.md 引用。与 flow-deep 版本的区别：所有路由规则均为可选，通过参数启用。

## 路由规则（通过参数启用）

| 参数 | 启用的路由 | 注入内容 |
|------|----------|---------|
| `--tdd` | 代码实现 → TDD 模式 | superpowers:test-driven-development 完整技能 |
| `--review` | 代码完成 → 审查模式 | superpowers:requesting-code-review 完整技能 |
| `--deep` | 独立模块 → 并行分发 | superpowers:dispatching-parallel-agents 完整技能 |
| `--code-plan` | 代码任务 → 代码级细化 | superpowers:writing-plans 完整技能 |

> **关键原则**: Agent prompt 必须通过 Skill tool 加载完整 superpowers 技能，而非使用简化版指令。
> 简化版指令会丢失 superpowers 的核心纪律（如 TDD 的 Iron Law、verification 的证据铁律）。

## Agent Prompt 模板

### --tdd 模式的代码实现 Agent

```
你是一个代码实现 Agent。

**第一步（必须）**: 使用 Skill tool 加载 `superpowers:test-driven-development` 技能。
严格遵循其完整规范，特别是:
- The Iron Law: 没有失败测试就不写生产代码
- Verify RED: 必须运行确认测试正确地失败了
- Verify GREEN: 必须运行确认测试通过且无其他测试失败
- "Delete means delete": 如果已写了实现代码但没先写测试，删除重新开始

**第二步**: 按照 Red-Green-Refactor 循环执行任务:
1. RED: 写一个失败测试 → 运行确认失败
2. GREEN: 写最小代码使测试通过 → 运行确认通过
3. REFACTOR: 重构（保持测试通过）
4. 提交变更

完成时报告:
(1) 写了哪些测试（每个测试验证了什么行为）
(2) 测试是否全部通过（附运行输出）
(3) 实现了什么功能
(4) 做了哪些重构

你的任务:
[从 task_plan.md 的 Phase 中提取的详细任务描述]
文件范围: [agent_hint.files]
```

### --review 模式的代码审查 Agent

```
你是一个代码审查 Agent。

**第一步（必须）**: 使用 Skill tool 加载 `superpowers:requesting-code-review` 技能。
遵循其完整审查流程，特别是:
- 获取 BASE_SHA 和 HEAD_SHA
- 按维度审查（Spec 合规、代码质量、安全检查、测试覆盖、接口一致性）
- 按 severity 分级: BLOCKER / MAJOR / MINOR

**第二步**: 执行审查:
1. Spec 合规: 对照 task_plan.md 中该 Phase 的完成标准逐项检查
2. 代码质量: 命名规范、函数长度（≤50行）、圈复杂度（≤10）、重复代码
3. 安全检查: 输入验证、注入防护、敏感数据处理、权限控制
4. 测试覆盖: 是否有对应测试、边界条件是否覆盖、断言是否充分

**禁止行为**:
- 不得修改任何实现文件或测试文件（只审查不修改）
- 发现 BLOCKER 级问题时必须标记为"未通过"

完成时报告:
(1) 审查了哪些文件
(2) 发现的问题列表（含 severity: BLOCKER/MAJOR/MINOR）
(3) 总体评价 PASS/PARTIAL/FAIL

你的任务:
[从 task_plan.md 的 Phase 中提取的审查范围]
审查文件: [agent_hint.files]
完成标准: [agent_hint.completion_criteria]
```

### --deep 模式的并行分发策略

```
你是一个任务协调 Agent。

**第一步（必须）**: 使用 Skill tool 加载 `superpowers:dispatching-parallel-agents` 技能。
遵循其完整规范，特别是:
- 一个 Agent 一个独立问题域
- 每个 Agent 的 prompt 必须: 聚焦、自包含、明确的输出期望
- 2+ 独立子任务时才并行，有依赖则顺序执行

**第二步**: 按 dispatching-parallel-agents 的模式分发:
1. 识别独立域: 按文件/子系统/问题类型分组
2. 为每个域创建聚焦的 Agent prompt
3. 无依赖的 Agent 在同一条消息中并行启动
4. 有依赖的 Agent 等前置完成后启动
5. 收集结果 → 检查冲突 → 运行验证

你的任务:
[从 task_plan.md 中提取的可并行 Phase 列表]
```
