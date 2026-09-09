# Spec Template - 结构化规格模板

> 本文件由 flow-deep Stage 1 引用。当用户任务涉及 3+ 步骤或包含明确的功能需求时，在 Prompt 优化后按此模板生成结构化 spec。
> 核心原则: spec 只描述 WHAT 和 WHY，禁止 HOW（无技术栈、无 API、无代码结构）。

## 触发条件

当 `references/spec-template.md` 存在时，Stage 1 在 Prompt 优化后自动使用此模板。生成精简 spec 写入 `--plan-dir/spec.md`。

## 模板

```markdown
# Spec: [任务简述]

**Created**: [DATE]
**Status**: Draft

## User Stories

### US1: [标题] (P1 - MVP)
**Why P1**: [为什么这是最高优先级]
**Independent Test**: [如何独立验证此 Story，只实现此 Story 即有可用产品]
**Acceptance**:
1. Given [初始状态], When [操作], Then [预期结果]
2. Given [初始状态], When [操作], Then [预期结果]

### US2: [标题] (P2)
**Why P2**: [理由]
**Independent Test**: [独立验证方式]
**Acceptance**:
1. Given/When/Then

### US3: [标题] (P3)
<!-- 按需添加更多 User Story -->

## Functional Requirements

- FR-001: [系统 MUST 做什么，可测试的描述]
- FR-002: [系统 MUST 做什么]
- FR-003: [系统 MUST [NEEDS CLARIFICATION: 具体问题，如 "认证方式未指定 - email/password, SSO, OAuth?"]]
<!-- [NEEDS CLARIFICATION] 最多 3 个，仅用于: 显著影响范围/安全性/UX 且无合理默认值的关键决策 -->

## Success Criteria

- SC-001: [可量化的验收标准，如 "用户可在 2 分钟内完成注册"]
- SC-002: [可量化的标准，如 "系统支持 1000 并发用户"]
<!-- 必须可量化、无技术实现细节、面向用户/业务视角 -->

## Edge Cases

- [边界条件 1，如 "并发编辑冲突如何处理"]
- [边界条件 2，如 "网络断开时的行为"]

## Assumptions

- [假设 1，如 "用户有稳定网络"]
- [假设 2，如 "v1 不支持移动端"]
<!-- 对未明确细节的合理默认值，记录在此 -->

## Key Entities (if applicable)

- [Entity 1]: [代表什么，关键属性]
- [Entity 2]: [代表什么，与其他实体的关系]
```

## 规格质量规则

1. **Focus on WHAT & WHY**: 只描述用户需要什么和为什么，不描述怎么实现
2. **NEEDS CLARIFICATION 约束**: 最多 3 个，仅用于无合理默认值的关键决策
3. **Success Criteria 可量化**: 包含具体指标（时间、百分比、数量），禁止"快速"、"稳定"等模糊词
4. **User Story 独立可测**: 每个 US 可独立实现和验证，P1 = MVP 范围
5. **FR 可追溯**: 每个 FR 有唯一 ID（FR-xxx），后续 Stage 的 Task 和 Decision 都可引用

## 与下游 Stage 的关系

```
spec.md (Stage 1 生成)
  ├── Stage 2: 按 clarify-checklist.md 消歧，增量更新 spec.md
  ├── Stage 3: 基于 FR-xxx 和 US-xxx 组织 plan，生成 Coverage Matrix
  ├── Stage 3.5: 审查 spec↔plan↔tasks 跨制品一致性
  └── Stage 5: 验证每个 FR 是否有对应 Task 完成
```

## 精简模式 (flow) vs 完整模式 (flow-deep)

| 维度 | flow (精简) | flow-deep (完整) |
|------|------------|-----------------|
| User Stories | 1-3 个，只含 P1 | 全部，含 P1-P3+ |
| FR 数量 | 3-5 个核心需求 | 全部需求 |
| Edge Cases | 可选 | 必须包含 |
| Assumptions | 可选 | 必须包含 |
| 总行数 | ~30 行 | ~80 行 |
