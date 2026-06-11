# 后续任务: gsd-execute-phase vs multi-agent 优化路径

> 状态: 评估完成 | 创建: 2026-04-12 | 更新: 2026-04-12 | 来源: GSD 深度调研 + skill-creator 评估

## 架构对比总结

| 维度 | gsd-execute-phase | multi-agent (flow-deep Stage 4) |
|------|-------------------|-------------------------------|
| 并行策略 | Wave 模型: 自动依赖分组 | 人工标注: task_plan.md 标注 |
| 上下文隔离 | 每个 executor 独立 200K | Agent 共享 team context |
| 文件隔离 | git worktree 物理隔离 | 文件边界约定 |
| 原子提交 | 每个 task 独立 commit | 无强制 |
| 错误恢复 | spot-check + 原子回滚 | TaskList 状态追踪 |
| Agent 类型 | 固定 gsd-executor | 按 subagent_type 路由 |
| 技能注入 | workflow/refs 引用 | TDD/审查/调试工作流注入 |
| Agent 通信 | 无 (完全独立) | SendMessage 实时通信 |
| 验证 | 内置 gsd-verifier | Stage 5 独立验证 |
| 跨会话 | STATE.md + continue-here.md | STATE.md (刚引入) |

## 从 GSD 借鉴的 5 个优化点

### O1: Wave 依赖自动分析 [高优先级]

**当前问题**: Stage 3 规划时需人工标注 Phase 可否并行，容易遗漏隐式依赖。
**借鉴来源**: gsd-execute-phase 的 `discover_and_group_plans` + `files_modified overlap check`
**实施方案**:
1. 在 `references/code-planning.md` 的 Phase 细化模板中增加依赖推导规则
2. 从 agent_hint.files.modify 字段自动推导 Phase 间依赖
3. 同文件被多 Phase 修改 → 自动标记为依赖关系，降级串行
**修改文件**: `references/code-planning.md`, SKILL.md (Stage 3.6 说明)

### O2: 原子 Git 提交协议 [中优先级]

**当前问题**: multi-agent 的 Agent 可能批量提交，失败时难以定位/回滚。
**借鉴来源**: gsd-executor 的 "Commit each task atomically" + --no-verify 并行安全
**实施方案**:
1. 在 `references/skill-routing.md` 为代码实现类 Agent 增加强制规则
2. 每完成一个逻辑单元做 git commit
3. commit message 包含 Phase ID + task 描述
4. 并行模式使用 --no-verify 避免 hook 冲突
**修改文件**: `references/skill-routing.md`

### O3: Spot-check 快速验证 [高优先级]

**当前问题**: multi-agent 依赖 Agent 自报完成，无法独立验证实际产出。
**借鉴来源**: gsd-execute-phase 的 post-wave spot-check
**实施方案**:
1. Stage 4 每个 Phase 完成后，主 Agent 做 3 项快速检查:
   - 预期创建的文件是否存在
   - git log 确认有新提交
   - 相关测试是否通过
2. 检查失败 → 标记为需修复，而非直接进入 Stage 5
**修改文件**: SKILL.md (Stage 4 说明)

### O4: 自适应上下文增强 [低优先级]

**当前问题**: 所有 Agent 注入相同量上下文，不区分窗口大小。
**借鉴来源**: gsd-execute-phase 的 CONTEXT_WINDOW 检测
**实施方案**:
1. 检测当前模型上下文窗口大小
2. 200K → 只传路径，Agent 自行读取
3. 1M+ → 直接注入前序 Phase 摘要 + 项目上下文
**修改文件**: `references/skill-routing.md` (Agent prompt 模板)

### O5: --interactive 降级模式 [中优先级]

**当前问题**: flow-deep 只有 --no-multi 串行模式，没有中间态。
**借鉴来源**: gsd-execute-phase 的 --interactive flag
**实施方案**:
1. 增加 --interactive 参数
2. 不创建 Agent 团队，在当前会话逐步执行
3. 每个 Phase 完成后暂停让用户审查
4. 适合小任务、调试、学习场景
**修改文件**: SKILL.md (参数速查 + Stage 4 说明)

## 场景推荐矩阵

| 场景 | 推荐引擎 | 原因 |
|------|---------|------|
| 大型代码重构 (10+ 文件) | gsd-execute-phase | Wave 并行 + worktree 隔离 + 原子提交 |
| 快速功能开发 (2-3 文件) | multi-agent --interactive | 轻量、可视化、技能路由 |
| 多 Phase 复杂项目 | gsd-execute-phase | 跨会话恢复 + 上下文隔离 |
| 研究/分析任务 | multi-agent | 无需 GSD 项目结构 |
| TDD 驱动开发 | multi-agent | 技能路由支持 TDD 注入 |
| 需要代码审查的任务 | multi-agent | 技能路由支持审查注入 |

## 待执行任务

1. [ ] O1: 在 code-planning.md 中增加 Wave 依赖自动推导规则
2. [ ] O2: 在 skill-routing.md 中增加原子 Git 提交协议
3. [ ] O3: 在 SKILL.md Stage 4 中增加 spot-check 验证步骤
4. [ ] O4: 在 skill-routing.md 中增加自适应上下文增强逻辑
5. [ ] O5: 在 SKILL.md 中增加 --interactive 参数和执行模式
6. [ ] 设计 A/B 测试: 同一任务分别用两种引擎执行，对比质量/耗时/token 消耗
7. [ ] 评估混合模式可行性: Stage 0-3 用 flow-deep，Stage 4 可选 gsd-execute-phase
8. [ ] 编写 `--engine gsd|flow` 参数，允许用户在 flow-deep 中选择执行引擎
