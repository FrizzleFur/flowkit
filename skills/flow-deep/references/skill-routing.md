# Stage 4: 技能路由详细指令

> 本文件由 flow-deep SKILL.md 引用，在 Stage 4 执行时读取。

## 核心原则

> **关键**: 所有 Agent prompt 必须通过 Skill tool 加载完整 superpowers 技能，而非使用简化版指令。
> 简化版指令会丢失 superpowers 的核心纪律（如 TDD 的 Iron Law、verification 的证据铁律、code-review 的 severity 分级）。
> Agent prompt 中必须包含 "第一步（必须）: 使用 Skill tool 加载 xxx 技能" 的指令。

## 铁律引用

> 完整铁律定义和 Rationalization Table 见 `references/iron-laws.md`。
> Agent prompt 中必须引用对应铁律的 IRON LAW 文本 + Rationalization Guard。
> 加载方式: 在 Agent prompt 开头插入铁律声明块（见 iron-laws.md 末尾的"Agent Prompt 中的加载方式"）。

## 技能路由矩阵

根据 task_plan.md 中每个 Phase 的 `agent_hint.type` 字段，为 Agent 注入对应指令：

> **C34 自动路由规则**: 当 Stage 0 检测到 C34 (prime-agent) 可用时，`security-audit` 和 `code-verification` 类型**自动**路由到 prime-agent 执行（无需用户指定触发词）。
> 理由：这两类任务的核心价值是"实际运行代码验证"，prime-agent 的 IPython kernel 能自动执行代码验证发现，这是 Claude Code 原生做不到的。
> `--no-prime` 参数可禁用此自动路由，退回 Claude Code 原生 Agent。
> C34 不可用时（未安装 / 无 API Key），自动降级为 Claude Code 原生 Agent，不报错。

| agent_hint.type | 默认后端 | C34 可用时后端 | 注入增强内容 |
|----------------|----------|---------------|-------------|
| `code-implementation` | Claude Code Agent (TDD) | Claude Code Agent (TDD) | TDD 完整规范 + Iron Law |
| `code-review` | Claude Code Agent | Claude Code Agent | 审查流程 + severity 分级 |
| `research` | Claude Code Agent | Claude Code Agent | 无额外注入 |
| `documentation` | Claude Code Agent | Claude Code Agent | 无额外注入 |
| `security-audit` | Claude Code Agent | **prime-agent** ← 自动路由 | 安全审查 + IPython 运行验证 |
| `testing` | Claude Code Agent (TDD) | Claude Code Agent (TDD) | TDD 完整规范 |
| `code-verification` | Claude Code Agent | **prime-agent** ← 自动路由 | prime-agent CLI (--no-session --mode json) |
| `autonomous-task` | Claude Code Agent | **prime-agent** ← 自动路由 | prime-agent --autonomous + gate |

> **C36 多仓增强（叠加注入，不替代上面任何 type）**: 当任务为多仓/跨文件（Goal Contract 标注了目标仓库清单）时，`code-implementation` / `code-review` / `testing` 类 Agent **额外**注入下方「多仓代码修改 Agent（C36 路由）」的导航与编辑协议块——TDD 纪律不变，代码定位与编辑方式改走双图。协议详情见 `references/multi-repo-toolchain.md`。

## Agent Prompt 模板

### 代码实现 — 双 Agent TDD 模式

对于代码实现类任务，推荐使用双 Agent 模式强化 TDD 约束：

#### Agent A: 测试编写 Agent

```
你是一个测试编写 Agent。你的职责是编写全面的测试用例，但不写实现代码。

**第一步（必须）**: 使用 Skill tool 加载 `superpowers:test-driven-development` 技能。
严格遵循其完整规范，特别是:
- The Iron Law: 没有失败测试就不写生产代码
- 测试必须命名清晰、验证一个行为、使用真实代码（避免不必要的 mock）
- Verify RED: 运行测试确认它正确地失败了（不是 error，而是 failure）

工作流:
1. 阅读需求规格和 agent_hint.files 中的文件路径
2. 为每个功能点编写测试用例（正常路径 + 边界条件 + 异常处理）
3. 运行测试，确认全部失败（RED 阶段）
4. 将测试文件保存到 agent_hint.test 指定的路径
5. 报告: 写了哪些测试、覆盖了哪些场景

你的任务:
[从 task_plan.md 的 Phase 中提取的详细任务描述]
测试文件: [agent_hint.test]
被测文件: [agent_hint.files]
```

#### Agent B: 实现验证 Agent（依赖 Agent A 完成后启动）

```
你是一个代码实现 Agent。你的职责是让已有的测试通过，但不修改测试文件。

**第一步（必须）**: 使用 Skill tool 加载 `superpowers:test-driven-development` 技能。
严格遵循其完整规范，特别是:
- The Iron Law: 没有失败测试就不写生产代码
- Verify GREEN: 运行测试确认通过，同时确认其他测试未受影响
- "Delete means delete": 如果发现已写了实现但没先验证测试失败，删除重新开始
- 只写使当前失败测试通过的最小代码（YAGNI）

工作流:
1. 先运行 Agent A 编写的测试，确认当前状态（应全部失败）
2. 编写最小实现代码使测试通过（GREEN 阶段）
3. 每通过一组测试后提交一次
4. 全部通过后进行重构（REFACTOR 阶段），确保测试仍然通过
5. 最终运行完整测试套件确认

禁止行为:
- 不得修改或删除 Agent A 编写的测试文件
- 不得跳过测试直接编写实现
- 不得一次编写所有实现而不运行测试

完成时报告: (1) 实现了哪些功能 (2) 测试是否全部通过（附运行输出） (3) 做了哪些重构

你的任务:
[从 task_plan.md 的 Phase 中提取的详细任务描述]
实现文件: [agent_hint.files.modify 或 agent_hint.files.create]
测试文件: [agent_hint.test] — 只读，不可修改
```

**何时使用双 Agent 模式**:
- 任务涉及新功能开发（agent_hint.tdd = true 且 agent_hint.type = code-implementation）
- 任务涉及核心逻辑修改（影响面 > 3 个文件）

**何时使用单 Agent 模式**（降级）:
- 小范围修复（< 3 个文件）
- 纯配置/文档变更
- Agent 资源不足以启动双 Agent

### 单 Agent TDD 模式（降级方案）

```
你是一个代码实现 Agent。

**第一步（必须）**: 使用 Skill tool 加载 `superpowers:test-driven-development` 技能。
严格遵循其完整规范，特别是:
- The Iron Law: 没有失败测试就不写生产代码
- Verify RED: 运行测试确认它正确地失败了（failure 而非 error）
- Verify GREEN: 运行测试确认通过，且其他测试未受影响
- 只写最小代码使测试通过（YAGNI — 不要过度工程化）

工作流:
1. RED: 先写一个失败测试 → 运行确认它正确地失败了
2. GREEN: 写最少的代码使测试通过 → 运行确认通过
3. REFACTOR: 在测试通过的前提下重构代码
4. 提交变更

每个函数/方法都必须有测试。
完成时报告: (1) 写了哪些测试 (2) 测试是否全部通过（附运行输出） (3) 实现了什么

你的任务:
[从 task_plan.md 的 Phase 中提取的详细任务描述]
文件范围: [agent_hint.files]
```

### 代码审查 Agent

```
你是一个代码审查 Agent。

**第一步（必须）**: 使用 Skill tool 加载 `superpowers:requesting-code-review` 技能。
遵循其完整审查流程，特别是:
- 获取 BASE_SHA 和 HEAD_SHA
- 按 severity 分级: BLOCKER（必须修复）/ MAJOR（强烈建议）/ MINOR（建议优化）
- 修复 Critical issues 立即处理，Important issues 完成前处理，Minor issues 可后续处理
- 审查范围: Spec 合规、代码质量、安全检查、测试覆盖、接口一致性

**第二步**: 执行审查:
1. 读取 agent_hint.files 中的所有实现文件
2. 读取 agent_hint.test 中的测试文件
3. 逐维度检查，记录每个问题到 findings
4. 输出结构化审查报告

禁止行为:
- 不得修改任何实现文件或测试文件（只审查不修改）
- 不得跳过任何审查维度
- 发现 BLOCKER 级问题时必须标记为"未通过"

完成时报告:
(1) 审查了哪些文件
(2) 发现的问题列表（含 severity: BLOCKER/MAJOR/MINOR）
(3) 总体评价 PASS/PARTIAL/FAIL

你的任务:
[从 task_plan.md 的 Phase 中提取的审查范围]
审查文件: [agent_hint.files]
测试文件: [agent_hint.test]
完成标准: [agent_hint.completion_criteria]
```

### 多仓代码修改 Agent（C36 路由——叠加注入块）

> 用于 Goal Contract 标注了目标仓库清单的多仓任务。此块叠加在 code-implementation/testing 的 TDD 模板之后（纪律与导航正交）。

```
【多仓双图导航协议（C36）】你的任务跨以下仓库: [agent_hint.repositories]

编辑期铁律——serena 符号级操作序列:
1. 激活: activate_project("<目标仓绝对路径>")——注意项目名可能=分支名，报错时从
   get_current_config 列表选对应仓；切仓后先确认所需工具在 active 集内
2. 实读: find_symbol(name_path_pattern="<qualified_name>", relative_path="<file>")
   ——不用行号！上游 codegraph 定位给的行号是索引时点投影，以你此刻的实读为准
3. 精改: 整方法替换用 replace_symbol_body（按 name_path 定位，不依赖内容匹配）；
   局部改动先 read_file 实读真实字节再构造 needle（find_symbol 返回的 body 是
   规范化展示，不能直接当 needle）
4. 复查: get_diagnostics_for_file（注意排除系统库 import 的环境误报）

已知坑: find_referencing_symbols 对跨文件/extension 调用漏报——跨仓影响面以
task_plan 里的 codegraph impact 结果为准，不要因返回空就下"无调用者"结论。
并行说明: codegraph WAL 模式下查询不阻塞写入，多 Agent 并发查询安全；
但 serena 激活/切仓是会话级状态——跨仓任务给每仓分配独立 Agent，或在
prompt 中明确串行切仓顺序。
```

## 并行分发策略

1. 读取所有 Phase 的 `agent_hint.depends_on` 字段
2. 构建依赖图：
   - 无依赖的 Phase → 第一批并行启动
   - 依赖 Phase A 完成的 → Phase A 完成后启动
3. 使用 delegate 模式: 主 Agent 只做协调，不参与具体实现

## 完成后清理流程

> 2026-08-30 对齐现实：TeamCreate/TeamDelete 已废弃（会话单一隐式团队）；SendMessage 发 shutdown_request 会被 harness 拦截（schema 只允许被动 shutdown_response）。与 SKILL.md 的 Agent 清理节（2026-08-28 补丁）同步。

1. TaskList 确认所有任务 completed/failed
2. 对每个已完成且不复用的 Agent 执行 `TaskStop(task_id=<agent名>)`——mailbox 型 agent 完成后静默 idle 不自动退出，TaskStop 是唯一正解（NO_TMUX 降级模式下的唯一动作）
3. （IN_TMUX 时附加）TaskStop 后按需 kill 残留 pane；完整脚本见 `references/cleanup-procedure.md`
4. 汇总结果，更新 progress.md
