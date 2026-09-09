# Clarify Checklist - 结构化消歧分类法

> 本文件由 flow-deep Stage 2 引用。在深度思考完成后，按此清单扫描 spec.md 进行消歧。
> 核心原则: 只澄清**显著影响实现**的不确定点，其余用合理默认值。

## 触发条件

当 `references/clarify-checklist.md` 存在且 `--plan-dir/spec.md` 存在时，Stage 2 在思考完成后自动执行消歧扫描。flow 中仅 `--clarify` 参数触发。

## 消歧分类法

逐项扫描 spec.md，标注状态: **Clear** / **Partial** / **Missing**

| # | 分类 | 检查要点 | 常见问题示例 |
|---|------|---------|-------------|
| 1 | 功能范围与行为 | 核心用户目标、显式排除范围、角色区分 | "是否支持批量操作？" |
| 2 | 领域与数据模型 | 实体属性、唯一性规则、生命周期/状态转换 | "用户身份唯一标识是什么？" |
| 3 | 交互与 UX 流程 | 关键用户旅程、错误/空/加载状态 | "列表为空时显示什么？" |
| 4 | 非功能质量属性 | 性能（延迟/吞吐量）、可扩展性、可靠性 | "消息送达延迟的上限？" |
| 5 | 安全与隐私 | 认证/授权、数据保护、威胁假设 | "是否需要端到端加密？" |
| 6 | 集成与外部依赖 | 外部服务/API、失败模式、协议假设 | "第三方支付回调失败如何处理？" |
| 7 | 边界条件与失败处理 | 负面场景、限流、冲突解决 | "并发编辑冲突如何处理？" |
| 8 | 约束与权衡 | 技术约束、显式放弃的方案 | "是否需要离线支持？" |

## 消歧流程

```
扫描 spec.md → 生成 8 维状态图 → 识别 Partial/Missing 项
    │
    ▼
按 Impact × Uncertainty 排序 → 取 Top 5 → 逐个 AskUserQuestion
    │
    ▼
每个回答 → 增量写回 spec.md（更新对应章节 + 记录到 Clarifications 区域）
```

## 交互规则

1. **最多 5 个问题**: 超出配额的高影响项标记为 Deferred，建议用户后续 clarify
2. **每个问题附带推荐**: 给出推荐选项和理由，用户可说 "yes" 接受推荐
3. **增量写回**: 每个回答接受后立即更新 spec.md，不等到全部完成
4. **合理默认值优先**: 以下情况不提问，直接用默认值并在 Assumptions 中记录:
   - 数据保留策略 → 行业标准
   - 性能基线 → 标准应用预期
   - 错误处理 → 用户友好消息 + 适当降级
   - 认证方式 → 标准 session 或 OAuth2

## 问题格式模板

```
## Q[N]: [主题]

Context: [引用 spec.md 相关段落]
What we need to know: [具体问题]

**Recommended:** Option [X] - [推荐理由，1-2 句]

| Option | Description | Implications |
|--------|-------------|--------------|
| A | [选项 A] | [选择 A 意味着什么] |
| B | [选项 B] | [选择 B 意味着什么] |
| Custom | 提供你的答案 | |

You can reply "yes" to accept recommendation, or provide your own answer.
```

## 完成报告

消歧完成后输出:

```markdown
## Clarification Summary
- Questions asked: [N/5]
- Spec sections updated: [列表]
- Deferred items: [超出配额的高影响项]
- Coverage status:
  | Category | Status |
  |----------|--------|
  | 1. 功能范围 | Clear |
  | 2. 数据模型 | Resolved |
  | 7. 边界条件 | Deferred |
```

## 与 spec.md 的写回规则

| 消歧类型 | 写回位置 |
|---------|---------|
| 功能模糊 | 更新 Functional Requirements 对应 FR-xxx |
| 数据/实体 | 更新 Key Entities |
| 交互/UX | 更新 User Stories 的 Acceptance |
| 非功能约束 | 更新 Success Criteria 的 SC-xxx |
| 边界/负面流 | 更新 Edge Cases |
| 术语冲突 | 全文统一术语 |

每次写回后在 spec.md 的 `## Clarifications` 区域追加:
```markdown
## Clarifications
### Session [DATE]
- Q: [问题] → A: [最终答案]
```
