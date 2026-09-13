# STATE.md — redesign 周期（内容组织与交互范式）

current_stage: Phase R3 执行中——波 1/2/3/3.5/5 已交付（含高亮修复+动效语义对齐）, 波 4 待做
status: in-progress
progress: R1 100% / R2 100% / R3 约 70%（波 4 内容工程 + P1 批 + T4 复验待做）
next_action: 波 4——①ch6 模板推广 7 个机制篇章（B 方案三标签: 机制/锚点表/深挖, 摘要卡含快用行; 模板=ch6-review-and-decision.md）②ch12 实战走查章写作（实读三周期 git 链; path-data 11→12 + verify.py 断言同步）③P1 批: quiz 出题/锚点区直链/增量 delta。T4 已完成（白底黑字, e77e475）

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
- 详情见 progress.md; 研究结论见 findings.md

## 风险与未决

- fs-tabs pane 内锚点跳转（推广时观察, 必要时 select 联动 hash）
- sweep Phase 4 终验+博客同步（rsync→用户 hexo d）在波 4 后
- :focus-visible 真实 Tab 键人工确认（用户侧）
- quiz 出题是内容工作: 每章 2-3 题, 主会话亲写, P1 分批不塞波 4
