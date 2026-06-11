# Constitution Checklist - 架构宪法门控

> 本文件由 flow-deep Stage 3 引用。在 Plan Mode 规划前，检查项目级架构原则。
> 核心原则: 架构约束从"建议"提升为"门控" -- 通过则继续，违反必须显式记录理由。

## 触发条件

当项目存在 constitution 文件时自动触发。检测顺序:
1. `--plan-dir/constitution.md` (规划目录级)
2. `.plan/constitution.md` (默认规划目录)
3. `constitution.md` (项目根目录)
4. 以上均不存在 → 跳过，不阻塞

## Gates 检查

当 constitution 文件存在时，在规划前执行以下 Gates:

```
Constitution Gates:
  □ Simplicity Gate: 并行模块数 ≤ 合理上限？无投机性功能？
  □ Anti-Abstraction Gate: 直接使用框架能力？单一数据模型表示？
  □ Integration-First Gate: 契约先于实现定义？契约测试已规划？
  □ Test-First Gate: 测试在实现代码之前规划？
  □ Module-Boundary Gate: 模块边界清晰？无循环依赖？
  □ API-Contract Gate: 接口通过契约定义？不暴露内部实现？
```

> **注意**: 具体的 Gate 条目取决于项目 constitution.md 中定义的原则。
> 以上为默认建议项。如果 constitution.md 定义了不同的原则，以其为准。

## 执行逻辑

```
检测 constitution.md
    │
    ├── 不存在 → 跳过，按现有方式规划
    │
    └── 存在 → 读取原则定义
                │
                ├── 全部 Gates 通过 → 继续 Plan Mode 规划
                │
                └── 有 Gate 未通过 → 在 plan 中必须包含 Complexity Tracking 表:
                    | Violation | Why Needed | Simpler Alternative Rejected Because |
                    |-----------|------------|-------------------------------------|
                    | [具体违反] | [为什么需要] | [为什么更简方案不可行]              |
                    
                    → 继续规划（不阻塞），但违反记录必须在 plan 文件中可见
```

## Constitution 文件格式（示例）

项目首次使用时，建议创建 constitution.md。以下是推荐模板:

```markdown
# [Project Name] Constitution

## Principles

### I. Module Boundary
每个功能模块必须有清晰的公共接口。模块间通过接口通信，不直接访问内部实现。

### II. API Contract First
接口契约在实现代码之前定义。所有外部接口必须有契约描述。

### III. Simplicity
初始实现最多 N 个并行模块（N 视项目而定）。投机性功能必须有明确的用户故事支撑。

### IV. Anti-Over-Abstraction
直接使用框架能力，不包装。单一数据模型表示，不创建冗余抽象层。

### V. Test-First
测试在实现代码之前编写和审批。集成测试优先于单元测试 mock。

## Complexity Tracking
<!-- 违反以上原则时，必须在此记录 -->

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
```

## 与 Stage 3.5 Plan Review 的关系

- Stage 3: Constitution Gates 是自检（Plan Mode 内部执行）
- Stage 3.5: Plan Review Agent 额外验证 Constitution Alignment（是否有未记录的违反）

两个环节互补: 先自检，再独立审查。

## 注意事项

- Constitution 是**项目级**约定，不是 flow-deep 的全局配置
- 每个项目可以自定义不同的原则
- 不存在 constitution 文件时不报错、不阻塞，完全透明跳过
- constitution.md 应纳入版本控制，团队共享
