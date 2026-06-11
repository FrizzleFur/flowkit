# Stage 5.5: 自主迭代优化

> 由 flow/flow-deep 共享。当验证未达标时触发 keep/revert 循环。

## 触发条件（满足任一即触发）

- `--iterate N` 参数显式启用
- Stage 5 验证结果中有未达标项（自动触发，默认 3 轮）

## 调用

`auto-iterate` skill（如果可用）；否则使用内置降级模式

## 参数构造（传递给 auto-iterate）

```yaml
scope: 未达标 Phase 涉及的文件 glob（从 task_plan.md 提取）
metric_name: Stage 5 中失败的验证指标名
verify_cmd: Stage 5 中使用的验证命令
guard_cmd: --guard 参数值（如未设置则不传）
max_iterations: N（来自 --iterate N，若验证失败自动触发则默认 3）
baseline_value: Stage 5 验证输出的当前值
target_value: Stage 5 验证输出的目标值
direction: higher 或 lower（根据指标语义推断）
```

## 渐进式 Guard 策略（推荐）

早期只跑冒烟测试（探索方向），中期加集成测试，后期跑全量测试（精细调优）。原理: 全量 guard 太早会扼杀创新方向探索。

- 前 1/3 迭代: 仅 verify，跳过 guard（探索期）
- 中 1/3 迭代: verify + 轻量 guard（如 `npm test -- --grep smoke`）
- 后 1/3 迭代: verify + 完整 guard（精调期）

## 与 auto-iterate skill 的集成

- **auto-iterate 已安装**: 读取其 SKILL.md 和 loop-protocol.md，遵循完整的迭代协议（含 Guard 双检查、卡住策略、崩溃恢复）
- **auto-iterate 未安装（降级模式）**: 使用内置简化循环:
  1. 分析失败原因
  2. 做一个聚焦变更
  3. git commit → 验证 → 通过则保留，失败则 revert
  4. 重复 N 次

## 进度追踪

每 5 轮迭代打印进度摘要，N 轮用完后打印最终总结

## 跳过条件

不使用 `--iterate` 参数且 Stage 5 全部达标
