# repo-integrity-loop — contract

> flowkit 第一个定时 loop（L4 候选的仓级形态）。trigger 形态：CI cron（GitHub Actions schedule）。
> Jul 9 长文纪律："Build the 1-layer version first"——单层起步，刻意不加 evolve 层与自动修复。

## Goal

flowkit 仓内 skills 的结构完整性零断链零漂移：lint 七项断言（L1-L7）全绿即达成。
**Zero-drift found = a successful run, not a wasted one**（no-op 是有效 run）。
永续监守，无 finish line。

## Boundaries

- Free to: 只读扫描（lint_flowkit.py 全量跑）
- Never do: 自动修复、自动 commit、推送任何变更
- Ship-on-its-own: lint exit 0 = 无事发生（成功）；exit 1 = Actions 红灯 + 日志即报告——人来看，loop 自己不修

## SOP (each run)

1. CI 按 schedule 唤醒，checkout 最新 main
2. 跑 `python3 scripts/lint_flowkit.py`
3. exit 0 → no-op 成功；exit 1 → 红灯（报告 = Actions 日志内嵌修复指引）
4. 游标即 git SHA（Actions run 自带），无需单独 state 文件

## Current understanding

- 监控对象：仓内 5 skill 的引用完整性 / codex-compat 双向 / frontmatter / 行数 budget（flow-deep 800 警戒线）
- 已知豁免：L1 废弃 API 的说明性文字命中（warning 级人工判断）

## Logs

（每 run 一行由 Actions 历史承载：日期 | SHA | 绿/红 | 新发现——首条 2026-09-10 挂 cron 时登记）

## signal 登记表（跨 loop 边）

| 信号 | 写者 | 读者 | 载体 |
|---|---|---|---|
| lint 战果（新断链/预算越线） | 本 loop | L3 研究吸收 loop（人+Claude 复盘 → CHANGELOG/改进） | Actions 日志 + CHANGELOG |
| SKILL.md 行数台账 | 本 loop（每 run 输出） | P3 下沉决策（人） | Actions 日志 L3 节 |
