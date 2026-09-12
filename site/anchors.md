# SC5 锚点复核表

> 本站承诺: 教程叙述与 flowkit skills 源码逐一锚定。下表为全站锚点统计; 各章末尾有逐条锚点表。
> 行号均为写作时实读快照（2026-09-12）, 引用前请以当前源文件为准——文档会腐化, 锚点复核纪律长存（见[第 11 章](/mechanisms/ch11-orchestration-governance.md)）。

| 章 | 文件 | 标题 | 行数 | 锚点引用 | 组件 |
|---|---|---|---|---|---|
| 1 | principles/ch1-agent-loop-and-pipeline.md | Agent Loop 与管道形态 | `65` | `~6` | switch |
| 2 | principles/ch2-context-three-axes.md | 长时程三板斧——概念与工程的三对映 | `199` | `~25` | — |
| 3 | principles/ch3-memory-loop.md | 记忆与召回闭环 | `200` | `~24` | — |
| 4 | mechanisms/ch4-pipeline-overview.md | 管道全景：从 Stage -1 到 5.8 的一条龙 | `205` | `~49` | replay |
| 5 | mechanisms/ch5-input-and-planning.md | 输入质量与思考规划：先立约，再喂饱，后想清 | `198` | `~40` | johari |
| 6 | mechanisms/ch6-review-and-decision.md | 评审与决策：两个 Claude、八副眼镜与六条原则 | `212` | `~26` | autodecide |
| 7 | mechanisms/ch7-concurrent-execution.md | 并发执行：multi-agent 的分片与治理 | `200` | `~64` | budget |
| 8 | mechanisms/ch8-context-engineering.md | 上下文工程：从容量检测到断点恢复的操作闭环 | `222` | `~20` | replay |
| 9 | mechanisms/ch9-verification-loop.md | 验证与迭代：不达证据不罢休 | `202` | `~58` | — |
| 10 | mechanisms/ch10-cross-session-memory.md | 跨会话记忆：auto-skill 双库的机制手册 | `202` | `~37` | — |
| 11 | mechanisms/ch11-orchestration-governance.md | 编排治理与质量自举 | `76` | `~5` | — |
| — | **合计** | **11 章** | `1964` | `~354` | **6 处落位** |

> 剧本 JSON: `assets/scripts/`（管道流转 + Auto Handoff 两部, 经 python json 校验）。组件库: `assets/interactive/` 五件, `node --check` 全过。