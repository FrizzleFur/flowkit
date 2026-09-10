# brain-integrity-loop — contract

> 本机共享 brain（auto-skill 双库）的完整性 loop。trigger 形态：launchd / 手动（contract 就绪，
> 挂载由用户决定——`launchctl load` 一行命令见文末）。与 repo-integrity-loop 正交：
> 一个监仓、一个监本机个人数据（个人数据不进 CI，故必须本机形态）。

## Goal

auto-skill 双库（experience 40 条目 / knowledge-base 44 条目）与 `_index.json` 零断链零残留零幽灵条目。
no-op 是有效 run。永续监守。

## Boundaries

- Free to: 只读扫描 + 报告落盘（`~/.claude/skills/auto-skill/.plan/integrity-report.md`）
- Never do: 自动修复条目（REC-2 保守策略——只报告不修复）、重复报告已豁免项
- Ship-on-its-own: 报告写盘即完成，无需人审；报告有新增断链时人决定修不修

## SOP (each run)

1. Read state：上次游标（报告头部 last-scan 时间）+ 豁免清单
2. 扫描双库：`python3 skills/auto-skill/scripts/check_integrity.py`（确定性，零 LLM）
3. 对比上次报告 → 只报新增断链 / 残留 / 陈旧度变化（不重报旧闻）
4. 更新游标 + Logs 追加一行（new / fixed / carried）

## Current understanding

- check_integrity.py 现状画像（9-01 实测）：只报告不修复、macOS /Users/ 路径专用、退出码恒 0 非 gate
- 豁免：暂无（首期全量基线）

## Logs

（每 run 一行——REC-8 健康分趋势的原始数据。首条：contract 立档 2026-09-10，尚未挂载）

## 挂载命令（用户决定时机）

```bash
# launchd 形态（每周一 09:17 本地时间），plist 模板可后补；先手动跑通 SOP 再挂
python3 ~/.claude/skills/auto-skill/scripts/check_integrity.py
```

## signal 登记表（跨 loop 边）

| 信号 | 写者 | 读者 | 载体 |
|---|---|---|---|
| 双库健康报告 | 本 loop | L1 经验召回 loop（陈旧度影响召回置信）/ L3 研究 loop（REC-8 健康分数据源） | integrity-report.md |
