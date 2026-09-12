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

## curve 曲线面板（v2.2 新增——量变/趋势型 aha）

```json
"curve": {
  "xLabel": "任务进度", "yLabel": "输出质量",        // 轴标题，建议写全
  "xMax": 100, "yMax": 100,                          // 坐标范围，坐标系左下原点
  "yThreshold": 75,                                  // 可选: 在 x 轴该值处画贯穿竖直虚线（参考线）
  "curves": [                                        // 1-N 条曲线，折线直连不做平滑
    { "id": "raw", "label": "裸奔", "color": "#ef4444",
      "points": [[0,90],[15,86],[30,78],[45,66],[60,50],[75,38],[100,22]] }   // ≥6 个点
  ],
  "flags": [ { "x": 75, "label": "交接旗", "color": "#3b82f6" } ]   // 可选: x 轴里程碑旗标
},
"steps": [
  { "title": "...", "desc": "...", "reveal": { "raw": 4 } }   // raw 画到第 4 个点（1-based）
]
```

- `reveal` 值 = 该曲线画到第几个点; 引擎用 stroke-dashoffset 600ms 补间**逐段生长**（生长动词），已画部分保持，中途改目标从当前值续补间; 未 reveal 的曲线完全隐藏
- 重置/重播自动归零; reduce-motion 跳过补间直接出终态; 步进/重置/调速复用播放控件（补间时长固定 600ms）
- 颜色 16 进制直填（剧本自包含）; 图例由 curves[].label 自动生成
- 适用判据: **曲线 = 量变/趋势型 aha**（质量滑坡、成本爬升、收益交叉）——要读者看「变化过程」时用 reveal 分步; 曲线是连续量，flow 是离散结构，不要混用叙事

## flow.cruise 巡游（v2.2 新增——旅程型 aha 的环境动效）

```json
"flow": {
  "nodes": [...], "edges": [...],
  "cruise": { "intervalMs": 900, "path": ["s-1", "s05", "gate"] }
}
```

- steps 播完后（或剧本无 steps 时加载后）一枚发光 token（circle r=5, #3b82f6+光晕）沿 path 节点序列连续巡游，走完回绕起点
- 每段 getPointAtLength + rAF 按边长**匀速**（移动动词）; 路过节点时该节点点亮 0.6s（脉动）
- 生命周期: 巡游计时器挂 root._fsClear，重置/重播/重初始化/离开页面即清; reduce-motion 不巡游
- 适用判据: **巡游 = 旅程型 aha**（数据包流转、请求生命周期）——path 节点尽量在 edges 中连通（未连通段引擎走隐形直线）; 巡游是环境动效不承载教学信息，教学信息仍走 steps

## 呼吸动词（v2.2，CSS 自动挂载）

引擎自动给「当前活跃节点（steps.on）与曲线端点」挂 `.fs-breath`（2.5s ease-in-out alternate 的 box-shadow/opacity 微脉冲）; 仅限活跃元素，剧本无需声明，reduce-motion 自动关闭。
