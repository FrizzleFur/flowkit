# Flow / Flow-Deep 依赖与架构说明

> 本文档供人类阅读，不被 AI 自动加载。更新: 2026-05-02

## 定位

| 技能 | 定位 | 一句话 |
|------|------|--------|
| `/flow` | 轻量编排引擎 | "按需启用"——通过参数控制哪些能力生效 |
| `/flow-deep` | 全量深度引擎 | "默认全开"——所有质量保障机制强制启用 |

## 管道流程对比

```
                    Flow                        Flow-Deep
                    ────                        ──────────
Stage 0           (无)                        Superpowers 前置检查 + 能力发现
Stage 1           Prompt 优化 (--no-prompt)    Prompt 优化 (不可跳)
Stage 1.5         需求探索 (条件触发)           需求探索 (条件触发)
Stage 2           深度思考 (--think 可选)       深度思考 (强制: ST+Mermaid+三角色)
Stage 3           规划 (Plan Mode 默认开)      规划 (Plan Mode 不可禁)
Stage 3.5         Plan Review (--plan-review)  Plan Review (强制)
Stage 3.6         (无)                        多角色面板评审 (默认开)
Stage 3.7         代码级细化 (--code-plan)     代码级细化 (自动触发)
Stage 4           并发执行 (--no-multi 串行)   并发执行 (含 TDD 注入)
Stage 4.5         Agent 清理                  (合并在 Stage 4 中)
Stage 5           完成验证 (--no-verify 可跳)  完成验证 (不可跳)
Stage 5.5         迭代优化 (--iterate N)       迭代优化 (--iterate N 或自动)
Stage 5.7         Ralph Loop (--ralph)         Ralph Loop (Stage 5.5 用完自动触发)
```

## 依赖清单

### 必需依赖（缺失则无法运行）

| 依赖项 | 类型 | Flow | Deep | 说明 |
|--------|------|:----:|:----:|------|
| `/prompt` | Skill | Stage 1 | Stage 1 | Prompt 评分优化 |
| `planning-with-files` | Skill | Stage 3 | Stage 3 | 文件化规划模板 |
| `/multi-agent` | Skill | Stage 4 | Stage 4 | Agent 并发执行 |
| `using-superpowers` | Skill | - | Stage 0 | 环境前置检查 |

### MCP

| 依赖项 | Flow | Deep | 说明 |
|--------|:----:|:----:|------|
| Sequential Thinking | --think 启用 | 强制 | 结构化思考 4K/10K |

### Superpowers 技能（按条件加载）

| 技能 | Flow 触发 | Deep 触发 | 阶段 |
|------|-----------|-----------|------|
| brainstorming | Stage 1.5 参考 | Stage 1.5 参考 | 需求探索 |
| writing-plans | --code-plan | 自动 | Stage 3.7 代码级细化 |
| test-driven-development | --tdd | 自动注入 | Stage 4 TDD |
| dispatching-parallel-agents | --deep | 自动 | Stage 4 并行分发 |
| requesting-code-review | --review | 自动 | Stage 4 代码审查 |
| verification-before-completion | 默认启用 | 强制 | Stage 5 验证 |
| systematic-debugging | Stage 5.5 | Stage 5.5 | 系统化调试 |

### 迭代增强

| 依赖项 | 类型 | Flow | Deep | 说明 |
|--------|------|:----:|:----:|------|
| auto-iterate | Skill | --iterate N | --iterate N / 自动 | keep/revert 循环 |
| ralph-loop | 插件 | --ralph | 自动触发 | Stop Hook 强制持续 |

### Flow-Deep 独有 Reference 文件

| 文件 | 用途 |
|------|------|
| plan-quality.md | Plan 质量 Checklist |
| plan-review.md | Stage 3.5 Plan Review 协议 |
| panel-review.md | Stage 3.6 多角色面板 + Auto-Decide Layer |
| iron-laws.md | 4 条铁律 + Rationalization Table |
| skill-routing.md | Agent 技能路由矩阵 |
| fallback-protocol.md | 退回 Plan 协议 |
| ralph-integration.md | Ralph Loop 集成规范 |
| context-management.md | 上下文压缩 + STATE.md 模板 |
| code-planning.md | 代码级细化格式 |
| capability-registry.md | 能力发现注册表 |

共享文件（flow/references/）: stage55-iteration.md, stage5-verification.md 等。

## Iron Laws 铁律体系

4 条不可协商的执行纪律，每条配 Rationalization Table 防止 LLM 自我辩解跳过。

| 铁律 | 原则 | 引用位置 |
|------|------|---------|
| IL-1 TDD | 无失败测试不写生产代码 | skill-routing.md Agent prompt |
| IL-2 Verification | 无新鲜证据不宣布完成 | stage5-verification.md, ralph-integration.md |
| IL-3 Debugging | 无根因不改代码 | fallback-protocol.md, ralph-integration.md |
| IL-4 Code Review | 审查只读，永不修改 | skill-routing.md 审查 Agent |

## Auto-Decide Layer（面板评审）

Stage 3.6 的自动决策系统，6 原则 (P1-P6) 自动处理 80% 常规发现:

| 原则 | 名称 | 逻辑 |
|------|------|------|
| P1 | Industry Standards | 违反行业标准的 → AUTO_FIX |
| P2 | Risk Threshold | 高风险 → AUTO_FIX，低风险 → AUTO_APPROVE |
| P3 | Consistency | 与已有决定一致 → AUTO_APPROVE |
| P4 | YAGNI | 过度设计 → Taste Decision |
| P5 | Security First | 安全相关 → AUTO_FIX |
| P6 | Reversibility | 不可逆 → Taste Decision |

仅 Taste Decision 上浮给用户，最多 8 条。

## auto-iterate vs Ralph Loop 的关系

两者互补而非替代，解决不同层面的问题:

| | auto-iterate | Ralph Loop |
|---|---|---|
| 层级 | 应用逻辑层 | 会话控制层 |
| 做什么 | 结构化 keep/revert 循环，metric 追踪，Guard 防回归 | Stop Hook 拦截退出，强制持续 |
| 有纪律吗 | 有——每次只改一个，机械验证，失败自动回滚 | 没有——只是"不让停" |
| 有记忆吗 | 有——TSV 历史追踪，stuck strategy，收敛检测 | 没有——注入固定 prompt |

**Ralph Loop 是"不让你停"，auto-iterate 是"怎么迭代"。** 在 flow-deep 中，Ralph Loop (Stage 5.7) 是 auto-iterate (Stage 5.5) 的外层包裹——每轮 Ralph 迭代内部调用的还是 auto-iterate 的 keep/revert 协议。没有 auto-iterate，Ralph Loop 的迭代就是无结构的"继续试"。

## Ralph Loop 集成

Stage 5.7 的强制持续机制。核心要点:

- **Ralph Loop 是 Stop Hook 插件**，通过拦截会话退出实现"不达目的不罢休"
- **固定 prompt 策略**: 启动时写入一次性 prompt，每轮注入同一份。LLM 自行从 progress.md 读取最新状态
- **Completion Promise**: 达标时输出 `<promise>FLOW_DEEP_COMPLETE</promise>` 退出循环
- **双状态文件**: `.claude/ralph-loop.local.md`（Hook 维护）+ `.plan/STATE.md`（LLM 同步）
- **降级方案**: 插件不可用时提示用户手动重启 auto-iterate

## 参数速查

### Flow

```
/flow [options] <任务表述>

阶段: --no-prompt | --no-plan | --no-multi
思考: --think | --think-hard | --mermaid | --discuss
Plan:  --strict-plan | --plan-review | --code-plan | --precise-plan
执行:  --tdd | --review | --deep
迭代:  --iterate N | --guard <cmd> | --ralph | --ralph-max N
配置:  --plan-dir <dir> | --agents <types> | --lang <zh|en> | --dry-run
预设:  --quick | --standard | --deep
```

### Flow-Deep

```
/flow-deep [options] <任务表述>

阶段: --no-prompt | --no-plan | --no-multi
思考: --think-hard(10K) | --no-think | --no-mermaid | --no-discuss
执行: --no-tdd | --tdd-dual | --no-review | --no-panel | --panel-roles | --panel-depth
迭代: --iterate N | --guard <cmd> | --ralph-max N | --no-ralph
调试: --dry-run
配置: --plan-dir <dir> | --agents <types> | --lang <zh|en>
```

## 设计哲学

三大社区框架的分工:

| 框架 | 管什么 | 我们集成了什么 |
|------|--------|---------------|
| GStack | 决策流程 | Auto-Decide Layer (6 原则 + Taste Decision) |
| Superpowers | 执行纪律 | TDD Iron Law + Rationalization Table + 4 条铁律 |
| GSD | 上下文质量 | STATE.md 跨会话恢复（Fresh Session / 崩溃恢复待集成） |

flow-deep 的独有优势:
- STATE.md 跨会话恢复（GStack 和 GSD 都没有）
- Auto-Decide Layer（原创设计，非照搬 GStack）
- Ralph Loop 集成（Stop Hook + auto-iterate 双层迭代）
