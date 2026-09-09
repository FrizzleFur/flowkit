# Plan Quality Standard - 确定性 Plan 规范

> 本文件由 flow / flow-deep SKILL.md 共同引用。定义 Stage 3 生成的 plan 文件质量标准。
> 核心原则: plan 的确定性越高，执行的 1-shot 成功率越高。

## Plan Quality Checklist

每个 Phase/Task 必须通过以下检查项:

```
Plan Quality Checklist:
  □ 精确文件路径: 每个变更涉及的具体文件路径（创建/修改）
  □ 行号范围或函数签名: 变更的精确位置（行号范围 或 函数名+参数）
  □ 变更内容描述: 具体改什么（非 placeholder，非"添加适当错误处理"）
  □ 验证条件: 如何确认该步骤正确完成（命令 + 预期输出）
  □ 影响范围: 该变更可能影响的模块/文件
  □ 依赖声明: 该步骤依赖哪些前置步骤的输出
```

## 禁止出现的 Placeholder 模式

以下模式视为 Plan 质量问题，必须在生成时修正:

```
❌ "TBD" / "TODO" / "后续实现"
❌ "添加适当的错误处理" / "添加验证" / "处理边界情况"
❌ "编写测试" (无实际测试代码)
❌ "与 Task N 类似" (必须重复完整内容)
❌ 只描述做什么但不展示怎么做（代码步骤必须有代码块）
❌ 引用未在任何 Task 中定义的类型、函数或方法
```

## Plan 文件格式

### 标准格式

```markdown
# [Feature Name] Implementation Plan

**Goal:** [一句话描述构建什么]
**Architecture:** [2-3 句关于方案]
**Tech Stack:** [关键技术/库]

---

## Phase 1: [Phase Name]
**可否并行:** 是/否
**依赖:** 无 / Phase N

### Task 1.1: [Task Name]

**Files:**
- Create: `exact/path/to/new_file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

**变更内容:**
[具体的代码变更描述，不是 placeholder]

**验证条件:**
- Run: `pytest tests/path/test.py::test_name -v`
- Expected: PASS

**影响范围:** [可能影响的模块]

---

### Task 1.2: [Task Name]
...
```

### 精确 Plan 格式（--precise-plan 或 --deep 模式）

在标准格式基础上，每个 Task 增加:

```markdown
### Task 1.1: [Task Name]

**Files:**
- Create: `exact/path/to/new_file.py`
- Modify: `exact/path/to/existing.py:123-145`  ← 精确行号
- Test: `tests/exact/path/to/test.py`

**函数签名:**
```python
def process_payment(
    order_id: str,
    amount: Decimal,
    currency: Currency = Currency.CNY,
) -> PaymentResult:
```

**实现步骤:**
1. [具体操作]
2. [具体操作]

**验证条件:**
- Run: `pytest tests/path/test.py::test_name -v`
- Expected: PASS with output matching "payment processed"

**回滚方案:** git checkout -- <file> 或具体的手动回滚步骤
```

## Plan 质量评分

生成 plan 后自检:

| 维度 | 评分标准 | 权重 |
|------|---------|------|
| 精确性 | 文件路径和行号是否精确 | 30% |
| 完整性 | 是否有 placeholder 或遗漏 | 25% |
| 可验证性 | 每步是否有验证条件 | 20% |
| 依赖清晰性 | 步骤间依赖是否明确 | 15% |
| 影响可控性 | 变更影响范围是否可评估 | 10% |

评分 >= 8/10: Plan 质量合格
评分 < 8/10: 需要补充精确信息后重新评估

## SDD Quality Items (when spec.md exists)

> 以下检查项仅在 `--plan-dir/spec.md` 存在时生效。spec.md 由 Stage 1 按 `references/spec-template.md` 生成。

```
SDD Plan Quality Checklist (追加):
  □ Coverage Matrix: 每个 FR-xxx 是否有至少一个 Task 覆盖
  □ No Orphan Tasks: 每个 Task 是否可追溯到至少一个 FR-xxx 或 US-xxx
  □ User Story Priority: Phase 按 US 优先级 (P1=MVP) 组织
  □ MVP Scope: 明确标注哪些 Phase 构成最小可用版本
  □ No Unresolved Clarifications: spec.md 中无遗留的 [NEEDS CLARIFICATION]
  □ Constitution Gates: 如项目有 constitution.md，Gates 检查结果已记录
```

### Coverage Matrix 格式

当 spec.md 存在时，plan 文件中必须包含:

```markdown
## Coverage Matrix
| Requirement | Task IDs | Covered |
|------------|----------|---------|
| FR-001 | T001, T002 | ✓ |
| FR-002 | T003 | ✓ |
| FR-003 | -- | ✗ GAP |
| US1 (P1) | T001-T004 | ✓ MVP |
| US2 (P2) | T005-T006 | ✓ |
```

## 与 superpowers:writing-plans 的关系

本规范聚焦于"plan 的结构化质量"，与 superpowers:writing-plans 互补:
- plan-quality.md: 定义 plan 应该包含什么（质量标准 + SDD 覆盖矩阵）
- writing-plans skill: 定义如何写 plan（TDD 步骤、bite-sized tasks）
- flow --code-plan: 启用 writing-plans 的细化流程
- spec-template.md: 定义 plan 上游的规格结构（Stage 1 生成，Stage 3 消费）
