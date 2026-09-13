# STATE.md — redesign 周期（内容组织与交互范式）

current_stage: master-plan S1-S3 全交付 + 亮色转换 + quiz 首批完成——剩 ch2 三斧同屏(中优)/用户亮色验收/hexo d
status: in-progress
progress: 对位审计+S2 主题专项+S3 核心 100%; 剩余=对位新剧本(ch8曲线/ch2同屏)+ch12+quiz+S4 终验
next_action: ①quiz 首批 3 章（Brown 规则, 需通用化 quiz 组件或逐章内嵌）②上线后观察: 高亮配色/三标签/动效的用户反馈 ③中优弹药: ch2 已建取舍法则, ch8 曲线证实已内建(threelines)撤销差距

## 已裁决策（勿重新讨论）

- 章节集合 11 章 + ch12 立项; 顺序不重排; 双入口已落地
- 分区容器 = 自写 fs-tabs.js（docsify-tabs 与 docsify@5 不兼容已证伪）; 模板 = ch6
- quiz 做（Brown 规则）; 深挖折叠仅长条目; 主播放钮颜色待 T4 复验
- 用户 2026-09-12 晚反馈「交互太少太干」→ 波 3.5 已补 ch1/ch5; 后续加密弹药 = A 线 C12/C13/C16/C17（每部仅 JSON）

## 波次账本（提交链）

- 波 1 `3d081d9`: 交互基建 P0 三件套 + progress.js + 插件钉版
- 波 2 `ed4405e`: fs-tabs 自写 + ch6 四段式试点（CDP 全绿）
- 波 3 `02c60b9`: 位置标记 ×8 章 / 双入口 / path 双坐标系+最短路线 / 行数同步
- 检查点 `4288dd4`: HANDOFF + STATE
- 波 3.5 `c2d0800`: 交互密度补齐 ch1-gate + ch5-paths（用户反馈「太干」驱动）
- 高亮修复 `5ae0add`+`0bfb2e5`: learncc Tailwind-400 色板 + docsify@5 高亮器外置四层根因链修复（组件须后置/IPv6 桥/SRI 浏览器实测法）
- 波 5 `e77e475`: ch6 B 方案（30秒合并, 三标签）+ fs-motion 入场体系 + 芯片错峰 + T4 主钮白底黑字 + 动效语义总账
- 高亮+动效保真 `0bfb2e5`/`5ae0add`: learncc Tailwind-400 高亮色板 + docsify@5 高亮器外置四层根因修复
- S1/S2/S3核心 `b240af6`/`3293bf4`: 对位审计(9/11 对位, ch2/ch8 差距) + 圆角五档收敛/hex token 化/tabular + 7 章三标签推广 + master-plan.md 三轴总编排
- 详情见 progress.md; 研究结论见 findings.md

## 风险与未决

- fs-tabs pane 内锚点跳转（推广时观察, 必要时 select 联动 hash）
- sweep Phase 4 终验+博客同步（rsync→用户 hexo d）在波 4 后
- :focus-visible 真实 Tab 键人工确认（用户侧）
- quiz 出题是内容工作: 每章 2-3 题, 主会话亲写, P1 分批不塞波 4

- 亮色转换 `f3ecde5` 后续: docsify 基础主题 dark→vue(亮), :root token 亮色翻转, 高亮色板亮底深色系, 封面渐变亮色, 列宽 1040px, 正文 16px——用户三指令(字号/宽度/亮色)全落地

- quiz 首批 `d0ee798`: fs-quiz 组件（Brown 规则/声明式题库）+ ch4/ch6/ch9 题库 3 份 + 三章「学完自测」挂载 + verify quiz 断言
