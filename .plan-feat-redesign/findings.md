# Findings — redesign 周期研究发现

> 底稿: notes/lcx-live.md(213行) / notes/lcx-src.md(135行) / notes/bp-research.md(131行)。本文件存综合结论与实现期发现。

## 研究结论（三角测量）

1. **learncc 内容组织精华**（活体+源码双源）: 章页四段式（页头→持久可视化→四标签→分页）; 四标签=渐进披露 读→玩→看→深挖; 增量叙事（Changes 表/LOC 一等公民）; 双坐标系（编号=构建序, 分组=架构归属）; 同一内容三正交轴（Timeline/Compare/Layers）。
2. **learncc 自身卡点**（我们不复制）: 四标签在首屏折叠线下; 首页/Timeline/Layers 三份同构重复; Code 标签死端（无复制/直链）; Learn 5111px 无页内 TOC; 多计数器并存困惑。
3. **内容模型真相**: 真源=仓根 sXX 目录; constants.ts=清单 SSO; prev/next=indexOf±1; prebuild 派生 LOC/diff 进仓（保零计算）; 加一章 5 个手写注册点无自动发现（失衡教训）。
4. **可移植性**: 内容层 docsify 全等价; 呈现层需自研原生 JS（replay 引擎已是雏形）。
5. **教育学依据**（bp-research）: Freeman 2014 主动学习 +6%/不及格 1.5x; NN/g 首屏 57%/74% 眼动; OOPSLA 2024 quiz 数据反哺改稿; 逃生阀三家共识（svelte solve/MDN solution/react.dev 文案）。
6. **范式判据**: 讲概念=线性长滚动+页内练习成立（javascript.info 为 docsify 最近参照）; 检验理解=Brown 式原位形成性 quiz; 反模式 9 条（锁章节/动效滥用/游戏化过用/谜题先行/不可重置等）。

## 实现期发现

- **核心判断**: 本站内容件与 learncc 四标签一一对应（callout≈Learn/replay≈Simulate/锚点表≈Code/批判≈Deep Dive），缺的是组织容器与进度感——非内容缺位。
- **伪增量陷阱**: learncc 增量是物理事实（s02 包含 s01 的 102 行）; flowkit 章节是「侧面讲透」非「管道长一截」——硬抄增量叙事会穿帮。解法=「生命周期位置标记 + anchors 量感」。
- **docsify-tabs@1.6.3 × docsify@5 不兼容**: 注释标记被 marked 渲染管线吞掉（CDP 实证 tabsComment=false）。自写 fs-tabs（分隔 div 标记方案）~55 行替代; 附带红利: pane display:none 与 pause-on-exit 联动。
- **Chrome 启发式缓存鬼影**: 旧 Last-Modified 文件按 10% 启发式数小时「新鲜」不回源——改资产后必须 fetch(u,{cache:'reload'}) 强刷对应 URL; 新响应 no-store 救不了从未发出的请求。40 分钟教训。
- **截图强制帧法**: 后台 tab 不跑渲染帧→IO 不触发/timer 节流 ≥1s; /screenshot 强制合成一帧可驱动整条 IO→setTimeout 链。行为验证核心手法。
- **仲裁误读教训**: 静态读 replay.js:519 误判「已有软仲裁」（!st.playing 查的是自身闭包）——活体实验证伪（t2 双播实锤）。行为探针与代码实读互为校正。
- **交互密度盘点**（用户反馈驱动）: 全站 11 章, 缺口章=ch1（仅 switch）/ch5（johari+feedsplit 无回放）。补 ch1-gate（C15 闸门分岔）/ch5-paths（C18 双路径对比）后 11/11 全覆盖。A 线剩余候选（C12/C13/C16/C17）为下一轮加密弹药。
