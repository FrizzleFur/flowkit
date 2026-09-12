# fs-replay v2 剧本声明表协议

> 引擎: `assets/interactive/replay.js`（多面板步进引擎）。子项目/章作者**只写本协议的 JSON + 章 md 里一个 div**，不写任何 JS。

## 容器（章 md 内）

```html
<div class="fs-replay" data-script="assets/scripts/<章>-<slug>.json"></div>
```

布局变体: 默认纵向（纯消息剧本）；`flow` 字段存在时自动左右分栏（流程图 | 消息面板）；`messagesPanels` 多于一个时自动多面板堆叠。

## Schema v2

```json
{
  "title": "演示标题",
  "version": 2,
  "layout": "flow+messages",              // 可选，引擎按字段自动推断，一般不用手写
  "flow": {                                // 可选：流程图面板
    "nodes": [ { "id": "s-1", "label": "Stage -1 召回", "x": 20, "y": 10, "w": 150, "h": 34, "type": "rect" },
               { "id": "gate", "label": "闸门?", "type": "diamond", ... } ],
    "edges": [ { "from": "s-1", "to": "s05", "label": "命中" } ]   // 边键 = "from>to"
  },
  "messagesPanels": [                      // 可选：1-N 个消息面板（多面板=上下文隔离类演示）
    { "id": "main",  "title": "主会话 messages[]" },
    { "id": "child", "title": "子代理 messages[]" }
  ],
  "steps": [
    { "title": "步骤短标题", "desc": "该步的教学旁白（无哑动画纪律：每步必写）",
      "on":      ["s-1", "s05"],           // 本步点亮的流程图节点 id
      "edgesOn": ["s-1>s05"],              // 本步点亮的边
      "clear":   ["child"],                // 本步开始前清空哪些消息面板（可选）
      "append":  { "main":  [ { "role": "user", "label": "任务书" } ],   // 向面板追加消息块
                   "child": [ { "role": "task", "label": "只传任务提示词" } ] }
    }
  ]
}
```

## 字段纪律

- `role` 取值: user / assistant / tool_call / tool_result / system / task / final（各有专属色）
- **每步必有 `title` + `desc`**——无哑动画；desc 讲「这一步为什么」，不是复述画面
- 坐标系: SVG viewBox 原点在左上，引擎自动加 8px 内边距；节点 `x/y/w/h` 手排，避免重叠；回环边（A→下游→A）直接声明，直线绘制可接受
- v1 旧剧本（steps[].role/content/annotation）仍被兼容，无需迁移；新剧本一律 v2

## 已有剧本

| 文件 | schema | 面板 |
|---|---|---|
| ch4-pipeline.json | v1（兼容模式运行） | 单消息 |
| ch8-autohandoff.json | v1（兼容模式运行） | 单消息 |

## lanes 泳道面板（v2.1 新增——多列并行/条目状态流动类机制）

```json
"lanes": [ { "id": "lane-main", "title": "主会话" }, { "id": "lane-a", "title": "分片 A" } ],
"steps": [
  { "title": "...", "desc": "...",
    "lanes": { "set": {
      "shard-1": { "lane": "lane-a", "state": "running", "label": "分片 A: wordsVerb", "note": "验收清单 3 项" },
      "shard-2": { "removed": true }
    } } }
]
```

- `state` ∈ queued（灰）/ running（蓝）/ done（绿）/ failed（红）; `removed: true` 移除条目
- 语义: 每步给出条目的**期望位置与状态**（非增量 delta），引擎负责换道/建卡/改色——与 learncc「声明表」哲学一致
- 适用: 并行分发（multi-agent 分片勾销）、pane 生命周期、预算分配、任何「多实体跨阶段流动」叙事
