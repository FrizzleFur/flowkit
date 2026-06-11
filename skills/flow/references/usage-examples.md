# Flow 使用示例

> 详细的端到端使用示例，展示不同参数组合下的管道行为。

## 示例 1: 标准流程

```
/flow 重构支付系统，需要支持多币种和多种支付方式

→ Stage 1: 优化任务表述
  原始: "重构支付系统，需要支持多币种和多种支付方式"
  优化: "重构现有支付系统架构，实现策略模式支持多币种(CNY/USD/EUR/JPY)和多支付方式(支付宝/微信/信用卡)，需保证交易安全和向后兼容"

→ Stage 2: 跳过（未启用思考参数）

→ Stage 3: 创建 .plan/ 规划
  - task_plan.md: 5个Phase，3组可并行任务
  - findings.md: 技术调研结论

→ Stage 4: 启动 multi-agent 并发执行
  - core: 核心架构 (backend-developer)
  - gateway: 支付网关 (backend-developer)
  - security: 安全审计 (security-auditor)
  - test: 测试覆盖 (test-automator)
```

## 示例 2: 深度分析模式（含 Plan Review）

```
/flow --deep --plan-dir docs/refactor-plan 重构认证系统

→ Stage 1: Prompt 优化
→ Stage 2: 深度思考 (Sequential Thinking + Mermaid + 三角色讨论)
  - 思考结论: 5个子任务，3个可并行
  - Mermaid 图: 任务依赖关系可视化
  - 三角色讨论: 架构师 vs 安全专家 vs 性能工程师
→ Stage 3: 确定性规划到 docs/refactor-plan/（质量评分: 8.5/10）
→ Stage 3.5: Plan Review（--deep 自动建议启用）
  - 独立 Agent 审查 → APPROVED_WITH_NOTES
  - 用户确认采纳建议后继续
→ Stage 4: multi-agent 并发执行（含退回 Plan 协议）
```

## 示例 3: Plan Review + 退回 Plan 场景

```
/flow --plan-review --precise-plan 重构数据访问层，从 REST 迁移到 GraphQL

→ Stage 3: 确定性规划（精确到文件/行号）
→ Stage 3.5: Plan Review
  - 审查 Agent 发现: GraphQL schema 设计未考虑 N+1 查询问题
  - 结论: NEEDS_REVISION
  - 退回 Stage 3 → 更新 plan 加入 DataLoader 批处理层
  - 再次 Review → APPROVED
→ Stage 4: 执行中...
  - Task 2.1 遇到: ORM 不支持 GraphQL 订阅 ← Plan 假设有误
  - 触发 Plan Fallback: 记录状态 → 更新 plan → 用户确认 → 继续
```

## 示例 4: 常用参数组合

```
# 跳过优化直接规划执行
/flow --no-prompt 实现用户个人中心，含信息编辑、头像上传、密码修改
→ Stage 1: 跳过 → Stage 3: 规划 → Stage 4: 并发执行

# 仅规划和思考，不执行
/flow --no-multi --think --mermaid 分析当前系统性能瓶颈
→ Stage 1: 优化 → Stage 2: 思考+Mermaid → Stage 3: 规划 → Stage 4: 跳过

# 预览模式（仅生成计划不执行）
/flow --dry-run 重构数据库访问层
→ Stage 1-3: 生成计划预览 → 不执行

# 带 Plan Review 的精确规划
/flow --plan-review --precise-plan --no-multi 添加 OAuth2 登录
→ Stage 3: 精确到行号的 plan → Stage 3.5: 审查确认 → 串行执行
```
