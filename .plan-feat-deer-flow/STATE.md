# STATE — deer-flow 调研

status: completed
current_stage: 5
plan_dir: .plan-feat-deer-flow/

## Phase

- Phase 1 素材分片（1.1 explorer 本地仓 ∥ 1.2 eco-scout web-access）— pending
- Phase 2 主会话整合（校准→对比→演进→推广）— pending
- Phase 3 ex-web HTML（res/deer-flow-research.html）— pending
- Phase 4 Goal Verification — pending

## 关键结论缓存

- star 82,329 / fork 11,358 已 API 核验（2026-09-13）；用户「82K」口径准确
- 本地仓结构信号: backend+frontend / skills/ / plans/ / CLAUDE.md+AGENTS.md / README×4 / OSS 卫生完整
- 三角色四共识: 意图校准先行 / 可比面-不可比面二分 / 概念同构表为核心章 / 演进三选一+推广双路线

next_action: ""

## Goal Verification（2026-09-14 完成）

| SC | Evidence | Status |
|---|---|---|
| SC1 详梳全有本地实读证据 | explorer 底稿 10 项全答，E1.1-01~E10.3-03 全 file:line | Pass |
| SC2 对比先口径后采集+证据分级 | 三轴校准先行（F8 离散档位）+ 三问行为契约 + 徽章逐条（HTML 20 处） | Pass |
| SC3 演进逐条映射+三选一 | E-1~E-7 全带证据编号+成本双栏（F14） | Pass |
| SC4 推广双路线+动作含第一步成本+权威源 | P-1~P-5 + 乙路线呈现不推荐 + star/赛道分母 API 实测 | Pass |
| SC5 HTML 单文件零依赖+可回源+footer 快照 | 机检 0 外部 script/0 外链/6 段标题；footer 含方法声明+精度口径 | Pass |
| SC6 意图 sign-off | 用户已确认（方法论自用为主转译） | Pass |
| SC7 建议引用真实证据编号 | E-1~E-7/P-1~P-5 全部引用 E1.x-nn，底稿可查 | Pass |

**结论：DONE**（7/7 SC Pass）。产出：res/deer-flow-research.html（05ae780 已推送）+ findings.md 全量底稿。

## 会话快照（2026-09-14 收盘更新）

- **Phase 1 完成**: 双分片底稿已落 findings.md（explorer 10 项全答 + 三问契约 / eco-scout 6 项全答 + 幸存者分母）；克隆经三次重试（HTTPS 断连→SSH 成功，F0 存在性断言拦住残缺目录一次）
- **Phase 2 Step 1-3 完成**: 意图校准已获用户 sign-off（方法论自用为主+同行可见为辅，未选大众产品化路线——「为什么它 82K 我们没有」按此转译为伪命题+真命题双轨）；三轴校准+对比矩阵+概念同构表已交付于对话（12 功能面逐项对照 + 三问判定：skills 真同构/plans 同名异构；核心发现「四价值观独立收敛」）
- **待续**: Step 4 演进吸收（三选一判据+成本双栏）→ Step 5 推广策略（双路线+幸存者分母引用）→ Phase 3 ex-web HTML（res/deer-flow-research.html，先做模版裁剪决策）→ Phase 4 GV（Evidence 表固定形式+抽查程序+star 原值重放）
- 证据编号体系（E1.1-nn/E1.2-nn）已在两底稿建立，后续建议强制引用

## 事故与漂移登记

- 2026-09-13 12:13 前后 deer-flow 本地克隆在会话期间被外部删除（非编排方动作；克隆曾 exit 0 且 ls 验证过）——plan-reviewer-c F0 抓获（「文件态≠磁盘态」漂移，planning-with-files 的 STATE 与磁盘现实脱节实例）；用户裁定原地重克隆，存在性断言已前置进克隆命令
