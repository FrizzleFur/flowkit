# Plan Review - 半自动 Plan 审查

> 本文件由 flow SKILL.md 引用。定义 Stage 3.5 的 Plan Review 流程。
> 核心理念: "两个 Claude" 模式——用新上下文消除思维惯性。

## 概述

Plan Review 在 Stage 3（规划）完成后、Stage 4（执行）之前，启动一个独立的 Agent 以 Staff Engineer 角色审查 plan。审查结果需要用户手动确认后才继续执行。

## 启用条件

### 手动启用
- `--plan-review` 参数

### 自动建议（不自动执行，仅提示）
当满足以下任一条件时，建议用户启用 Plan Review:

| 条件 | 说明 |
|------|------|
| 改动影响 3+ 模块 | 多模块改动需要架构层面审查 |
| 涉及技术选型 | 技术选型决策需要独立验证 |
| 有安全/数据风险 | 安全敏感改动需要额外审查 |
| plan 包含 5+ Phase | 复杂度足够高需要审查 |
| --deep 模式 | 深度模式默认建议启用 |

建议话术:
```
检测到该任务涉及 [3+ 模块/技术选型/安全风险]，建议启用 Plan Review (--plan-review)。
是否在执行前让独立 Agent 审查 plan?
```

## Agent Prompt 模板

```
你是一名资深 Staff Engineer，请审查以下实现方案。

审查维度（按优先级排序）:
1. 架构合理性: 模块划分是否清晰，职责边界是否明确
2. 遗漏的边界情况: 是否有未考虑的边界条件、异常路径
3. 安全风险: 是否有安全隐患（注入、权限、数据泄露）
4. 性能影响: 是否有性能瓶颈或资源消耗问题
5. Plan 假设验证: plan 中的技术假设是否成立（API 版本、依赖兼容性）
6. 可执行性: plan 中的步骤是否足够精确，能否直接执行
7. [SDD] Coverage Gaps: spec.md 中每个 FR-xxx 是否有对应 Task（仅 spec.md 存在时）
8. [SDD] Constitution Alignment: 是否违反项目架构宪法原则（仅 constitution.md 存在时）
9. [SDD] Cross-Artifact Consistency: spec↔plan↔tasks 术语、数据模型、依赖关系是否一致（仅 spec.md 存在时）

输出格式:
## 审查结论
[APPROVED / APPROVED_WITH_NOTES / NEEDS_REVISION]

## 发现的问题
### 严重问题（必须修复）
- [问题1]: 描述 + 建议修复方案

### 建议改进（可选）
- [建议1]: 描述 + 理由

### 确认良好
- [方面1]: 认可的设计决策

## 总体评价
[1-2 句总结]

---
方案内容:
{plan 文件内容}

当前代码库上下文:
{相关文件列表和关键代码片段}
```

## 执行流程

```
Stage 3 完成
    │
    ▼
读取 plan 文件内容
    │
    ▼
启动 Agent（subagent_type: general-purpose）
    │  prompt: 上述模板 + plan 内容 + 代码库上下文
    │
    ▼
Agent 返回审查报告
    │
    ▼
向用户展示审查报告 ──→ 用户决定:
    │                      ├── APPROVED → 继续 Stage 3.6 (代码级细化) 或 Stage 4 (无代码任务)
    │                      ├── APPROVED_WITH_NOTES → 选择性采纳后继续
    │                      └── NEEDS_REVISION → 退回 Stage 3 修改 plan
    │
    ▼
审查结果写入 findings.md 的 Plan Review 章节
```

```
Stage 3 完成
     │
     ▼
  读取 plan 文件
     │
     ▼
  启动审查 Agent (general-purpose)
     │  prompt: Staff Engineer 审查模板
     │
     ▼
  Agent 返回审查报告
     │
     ▼
  展示报告给用户 ─────────────────┐
     │                           │
     │  ┌────────────────────────┤
     │  │ 用户决策:              │
     │  │ APPROVED ──→ Stage 3.6 │
     │  │ WITH_NOTES → 选择采纳  │
     │  │ NEEDS_REV → 退回Stage3 │
     │  └────────────────────────┤
     │                           │
     ▼                           │
  写入 findings.md ◄────────────┘
```

## Agent 配置

| 参数 | 值 | 说明 |
|------|-----|------|
| subagent_type | `general-purpose` | 需要读写代码库能力 |
| name | `plan-reviewer` | 识别用 |
| prompt | 模板 + plan 内容 | 见上方模板 |
| team_name | 当前 flow 的 team | 复用团队 |

## 注意事项

- 审查 Agent 是只读的——它不应该修改任何文件，只输出审查报告
- 如果 Agent 执行失败（超时、错误），不阻塞流程，提示用户手动审查
- 审查结果记录到 findings.md，便于追溯
- 半自动模式: Agent 完成审查后，必须等用户确认才继续
- 每次只启动一个审查 Agent（不需要多个）
