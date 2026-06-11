# Stage 5: 完成验证

> 由 flow/flow-deep 共享。验证所有 Phase 的完成状态。

## 调用

`superpowers:verification-before-completion`（通过 Skill tool 加载完整技能）

## 行为

1. 使用 Skill tool 加载 `superpowers:verification-before-completion`，严格遵循其完整规范
2. 检查所有 Phase 的完成状态（task_plan.md）—— 附运行输出作为证据
3. 运行测试套件确认全部通过（如有）—— 必须看到实际输出，不可使用 "should pass"
4. 检查是否有 lint 错误（如有）—— 必须看到实际输出
5. 确认代码审查问题已全部解决（如 `--review` 启用时）
6. 向用户展示验证报告（每个验证项必须附带实际命令输出）

## 铁律

> **IL-2: Verification Iron Law** — 完整定义和 Rationalization Table 见 `references/iron-laws.md`
>
> **IRON LAW**: No completion claims without fresh verification evidence.
> 禁止使用 "should work"、"probably"、"seems to" 等表述。
>
> **Rationalization Guard**: 如果内部推理出现 "代码看起来应该能工作"、"大概通过了"、"上一轮已经验证过" 等话术 → 立即停止，运行实际验证命令获取输出证据。

## 跳过条件

- flow: `--no-verify`
- flow-deep: 不可跳过

## STATE.md 写入（flow-deep 专属）

验证完成后:
- 设置 `current_stage: 5`，记录验证结果 (PASS/FAIL 各项)
- 记录未完成项到 `blockers`
- 若全部通过: 设置 `status: completed`，清空 `next_action`
- 若有失败: 设置 `next_action` 为 "Stage 5.5 迭代修复 [具体失败项]"
