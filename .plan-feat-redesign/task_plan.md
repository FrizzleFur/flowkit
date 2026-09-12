# Task Plan — redesign 周期

> 2026-09-12 晚状态: R1/R2 完成; R3 执行中——波 1/2/3/3.5 已交付, 波 4 待做（新会话续, STATE.md 为恢复入口）

## Phase R1 三路并行研究 ✅ complete

- lcx-live: notes/lcx-live.md（learncc 活体: 四段式/三正交轴/5 顺滑 6 卡点）
- lcx-src: notes/lcx-src.md（源码: 内容模型/4-tab ~35 行/注册点失衡/可移植性判定表）
- bp-research: notes/bp-research.md（10 站 + Freeman/NN/g/OOPSLA 依据 + 可移植分级 + 反模式 9 条）

## Phase R2 综合与提案 ✅ complete（proposal.md; T1-T3+章节组织已裁, T4 待前台复验, T5 默认）

## Phase R3 执行（in_progress）

| 波 | 内容 | 状态 | 提交 |
|---|---|---|---|
| 波 1 | 交互基建 P0 三件套 + progress.js + 插件钉版 | ✅ | 3d081d9 |
| 波 2 | fs-tabs 自写（插件证伪回退）+ ch6 四段式试点 | ✅ CDP 全绿 | ed4405e |
| 波 3 | 位置标记 ×8 章 / 双入口 / path 双坐标系+最短路线 / 行数同步 | ✅ | 02c60b9 |
| 波 3.5 | 交互密度补齐: ch1-gate + ch5-paths 回放（用户新输入「太干」） | ✅ CDP | c2d0800 |
| 波 4 | ch6 模板推广 7 章（tabs+摘要卡+双卡逐章）+ ch12 实战走查章（立项✓, 内容待写, 需实读三周期 git 链）+ sidebar/path-data/机检 11→12 同步 | ⏳ pending | — |
| P1 批 | quiz 族出题（Brown 规则）/ 锚点区 GitHub 直链 / 增量 delta | ⏳ pending | — |
| T4 | learncc 前台实拍定主播放钮颜色 | ⏳ pending | — |

## 测试纪律（新增, 复用）

Chrome 启发式缓存→fetch cache:reload 强刷; 截图强制帧法; 后台 tab timer 节流 ≥1s 放宽断言等待
