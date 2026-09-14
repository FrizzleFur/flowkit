# 第 12 章 · 实战走查：这座站是怎么被建出来的

> **机制篇 · 第 12 章** · A · 编排与治理

*The Site as Evidence*

`8 anchors` · `100 行` · 组件 `replay ch12-walkthrough`（8 步）· 约 15 分钟

**本章位置**: 元层 · 实战走查 · 机制篇十一站讲完的管道，这座站自己完整跑了一遍——本章把全过程摊开给你看

<div class="fs-callout">

**一句话机制**: 教程里的 Goal Contract、双评审、波次执行、证据表、经验沉淀不是纸上流程——这座站的每一波改造都是按它跑的，本章以真实计划文件与提交链为证。

**机制定位**: 全教程的 capstone——把前十一章的机制放进一个真实任务的完整实录里对照；案例就是「你正在读的这座站」。

**本章你将看到**: 一部五阶段走查回放（立约→研究→规划→执行→验证沉淀，每步带真实产物）· 三份计划文件与提交链的对照表 · 自指案例的边界批判。约 15 分钟。

**快用**: 想复刻这套建站流程 → 读 `.plan-feat-redesign/master-plan.md`（三轴编排）+ 各波提交（`git log 9c60cd6..HEAD`）; 想验证任何一条叙述 → 锚点表里的文件都在仓库里，实读即证。

</div>

<div class="fs-replay" data-script="assets/scripts/ch12-walkthrough.json"></div>

*走查演示: 五阶段各带真实产物——计划文件、提交号、机检与截图，无一步是编的。*

<div class="fs-tabsep" data-label="机制"></div>

## 为什么：敢用自己当案例

教程类内容最怕「纸上管道」——规则写得漂亮，没人见过它真跑。flowkit 的独特处境是: **这座站本身就是 flow-deep 管道的产物**。三周期（flowsite 建站 / iviz 动效研究 / polish 精修）与后续的清扫、重设计周期，每一程都有契约、规划、执行、验证、沉淀的完整留痕——拿它当 capstone 案例，读者可以逐条去仓库里对证。

五阶段与真实产物的对照:

| 阶段 | 真实产物 | 对照机制 |
|---|---|---|
| Stage 0.5 立约 | `.plan-feat-sweep/spec.md` / `.plan-feat-redesign/spec.md`（六字段契约） | [第 5 章](ch5-input-and-planning.md) Goal Contract |
| Stage 3 规划 | `.plan-feat-redesign/master-plan.md`（三轴编排 + 章节×动效对位表） | [第 4 章](ch4-pipeline-overview.md) 确定性规划 |
| Stage 3.5/3.6 双评审 | `notes/reconciliation.md`（75 条对账）、交互评审报告（CDP 行为探针 P0 清单） | [第 6 章](ch6-review-and-decision.md) |
| Stage 4 波次执行 | `3d081d9` 基建 → `ed4405e` 试点 → `02c60b9` 铺开 → `c2d0800` 密度补齐 | [第 7 章](ch7-concurrent-execution.md) |
| Stage 5 验证 | `verify.py` 机检 ALL PASS + CDP 强制帧行为断言 + `shots/` 截图证据 | [第 9 章](ch9-verification-loop.md) |
| Stage 5.8 沉淀 | 知识库新增 docsify 零构建方法论、伪验收防御等条目 | [第 10 章](ch10-cross-session-memory.md) |

三个值得单独看 execution 细节的地方:

- **执行偏差的真实处置**: 高亮「发黄」的根因挖了四层（高亮器外置 / 语法组件顺序 / 默认色板 / 主题零规则）——执行偏差就地修；而「docsify-tabs 与 docsify@5 不兼容」属于 plan 假设有误，按退回协议换到备选方案自写 fs-tabs。两种处置在[第 9 章](ch9-verification-loop.md)的分型里各有归属。
- **验收的证据形态**: 每波验收不是「看一眼」，是机检脚本（`verify.py`，17 部剧本/11 章/12 组件断言）+ CDP 行为探针（播放仲裁不变量、三标签结构、高亮色板逐类采样）+ 截图留档三件套——Stage 5 的「新鲜证据」标准在这里落了地。
- **用户反馈进管道**: 「交互太少太干」的反馈当轮就变成密度审计与两部新回放（ch1-gate / ch5-paths）——Stage 5.5 的迭代输入不一定来自机器，用户的眼睛是最快的 Guard。

<div class="fs-tabsep" data-label="本章源码锚点表"></div>

| 断言 | 锚点 |
|---|---|
| 三周期契约与波次规划 | `.plan-feat-site/spec.md`; `.plan-feat-iviz/OUTLINE.md`; `.plan-feat-polish/spec.md` |
| 清扫与重设计契约 | `.plan-feat-sweep/spec.md`; `.plan-feat-redesign/spec.md` |
| 交互密度对账（75 条） | `.plan-feat-sweep/notes/reconciliation.md` |
| 动效评审与对位表 | `.plan-feat-sweep/notes/review-interaction-fluidity.md`; `.plan-feat-redesign/master-plan.md` |
| 改进提案（治理同源） | `site/propositions.md`（REC-P1~P4, 触发条件驱动） |
| 闸门分岔与取舍法则回放 | `site/assets/scripts/ch1-gate.json`; `site/assets/scripts/ch2-rules.json` |
| 波次提交链 | `git log --oneline 9c60cd6..HEAD`（9c60cd6 为三周期交接基线） |
| 机检与证据脚本 | `.plan-feat-sweep/verify.py`（17 剧本/12 章/12 组件断言） |

<div class="fs-tabsep" data-label="批判小节（深挖: 局限与成本）"></div>

- **自指案例的边界**: 本站建设是「文档+前端」型任务，不涉及支付、认证这类高危场景——管道在业务关键路径上的表现，本章不提供证据。它证明的是「流程可执行、可验收、可沉淀」，不是「流程万能」
- **案例的时效性**: 提交号与文件路径是快照——仓库继续演进后，个别锚点会漂移（与全站锚点纪律一致: 实读为准）
- **单案例不构成基准**: 一座站按流程建成了，不等于「按流程必建成」——这与 evals 的诚实划界同源（见[第 11 章](ch11-orchestration-governance.md)）: 本章讲「机制存在且被这样用过」，不讲「用了必然更好」

<div class="fs-tabsep" data-end="1"></div>

<nav class="fs-prevnext">
<a class="fs-nav-prev" href="#/mechanisms/ch11-orchestration-governance"><span class="fs-arrow">←</span> 上一章 · 编排治理与质量自举</a>
</nav>
