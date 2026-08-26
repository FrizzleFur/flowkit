# Stage 3.6: 代码级细化详细指令

> 本文件由 flow-deep SKILL.md 引用，在 Stage 3.6 触发时读取。

## 触发条件

Stage 2 的技能匹配结果中，存在需要代码实现的子任务。

## 执行步骤

1. 读取 Stage 3 生成的 `task_plan.md`
2. 对每个含代码实现的 Phase，细化为代码级计划:
   - 每步 2-5 分钟的 bite-sized 任务
   - 每步含完整代码（无 placeholder、无 TBD）
   - 遵循 TDD 循环: 写失败测试 → 验证失败 → 最小实现 → 验证通过 → 提交
3. 细化后的计划保存到 `--plan-dir` 目录下

## 输出格式

每个 Phase 的代码级计划应包含：

```markdown
### Phase N: [名称] — 代码级计划

#### Step 1: 写失败测试 (RED)
```python
# test file path and complete test code
```

#### Step 2: 验证测试失败
```bash
pytest tests/path/test.py::test_name -v
# Expected: FAIL
```

#### Step 3: 最小实现 (GREEN)
```python
# implementation file path and complete code
```

#### Step 4: 验证测试通过
```bash
pytest tests/path/test.py::test_name -v
# Expected: PASS
```

#### Step 5: 提交
```bash
git add ... && git commit -m "feat: ..."
```
```

## agent_hint 字段

每个 Phase 的输出应包含 `agent_hint` 供 Stage 4 的 multi-agent 读取：

```yaml
agent_hint:
  type: code-implementation  # 共 7 种，见下方类型选择指引
  subagent: voltagent-core-dev:backend-developer  # 推荐的 subagent_type
  files:
    create: [path/to/new.py]
    modify: [path/to/existing.py]
    test: [path/to/test.py]
  tdd: true  # 代码实现类必须为 true
  depends_on: [phase-1, phase-2]  # 依赖的前置 Phase
```

**type 类型选择指引**（Stage 4 会按 skill-routing.md 路由表分发后端）:

| type | 何时规划为此类型 | 后端路由 |
|------|----------------|---------|
| `code-implementation` | 写新功能/修 bug（默认） | Claude Code Agent (TDD) |
| `code-review` | 审查已有代码变更 | Claude Code Agent |
| `research` | 调研/方案对比/信息收集 | Claude Code Agent |
| `documentation` | 文档撰写/整理 | Claude Code Agent |
| `security-audit` | 审计代码安全行为、需要"实际运行观察行为"而非静态审读 | C34 可用时自动路由 prime-agent |
| `code-verification` | 验证分析结论、需要"实际运行代码复现"验证 bug 假设 | C34 可用时自动路由 prime-agent |
| `autonomous-task` | 长时自主批量任务（evals/批量迁移），有可机检的质量门控 | C34 可用时自动路由 prime-agent --autonomous |

> 判断依据：任务的核心价值是否是"实际运行代码"？是 → security-audit / code-verification（prime-agent 的 IPython kernel 能执行验证，Claude Code 原生做不到）；任务是否需要数十轮自主迭代 + 机检 gate？是 → autonomous-task。仅当规划出这三种类型，C34 自动路由才会生效（详见 skill-routing.md）。
