# FlowKit 改进提案（REC 式）

> 来源: flowsite 建站过程的三路研究（hello-agents 概念体系 / learn-claude-code 形态 / flowkit 机制地图）。
> 纪律: **每条提案附触发条件——不达条件不实施**（借鉴 graph-engineering-research 的 REC 触发条件模式，防过度工程）。提案不直接改源码，达条件后走正常评审。

## REC-P1 · 记忆检索评分排序

**现状**: auto-skill 召回是纯关键词匹配（命中多少读多少，不做优先级排序），Stage -1 一次全量加载。
**提案**: 召回命中后按评分排序取 Top-K——评分公式参考 hello-agents ch8: `相关性 × 时间衰减 × (0.8 + 重要性 × 0.4)`; 相关性用命中关键词数/条目长度归一，时间衰减用 lastUpdated 距今天数，重要性暂以「被 consumed_by 引用次数」代理。
**触发条件**: 实际出现「召回命中条目过多导致上下文膨胀」（当前 44 分类下命中量可控，暂无此痛）。
**成本估计**: auto-skill SKILL.md 召回节 ~20 行 + 一次实测验证。

## REC-P2 · 混合检索（BM25 主 + 向量重排）

**现状**: 纯关键词召回。
**提案**: 保持 BM25/关键词为主检索，叠加向量模型只做**重排**（rerank Top-20）。
**依据（实测）**: rag-lab 双臂评测（AIPrj/rag-lab，2026-09-12，86 文件 261 块 25 查询）——BM25 MRR 0.921 已是强基线，embedding 召回仅 +1.2pp 且两臂 miss 集互补: 向量赢意图词查询，BM25 赢低频精确词。结论**混合而非替换**。
**触发条件**: 与 REC-P1 同源——召回质量痛点出现时一并实施（重排依赖先有候选集排序需求）。
**成本估计**: 依赖 embedding API（密钥管理）——触发前先评估单机可否用本地小模型。

## REC-P3 · ContextPacket 统一交接物命名

**现状**: 上下文交接物有三个名字: HANDOFF.md（交接协议）/ STATE.md（活记忆）/ Auto Handoff 五件套（checkpoint 集合）——概念上同族但无统称，教程与文档各自解释。
**提案**: 引入「ContextPacket」作为族名（借鉴 hello-agents ch9.3 的 ContextPacket 抽象）: HANDOFF.md 是 Packet 的序列化形态，五件套是 Packet 的字段集，STATE.md 是常驻最小 Packet。纯命名层改动，不动机制。
**触发条件**: 机制文档再出现一次「交接物指代不清」引发的理解成本时实施（本站 ch8 已用「交接物」作非正式族名缓解）。
**成本估计**: 术语表一处 + 相关文档措辞对齐。

## REC-P4 · evals 能力划界声明

**现状**: evals 定位为回归网（防退化），但仓库内无显式声明它**不是**能力基准——外部读者可能误读为「flowkit 经评测优于 X」。
**提案**: 在 evals/README.md 增加一段「划界声明」: 回归网 ≠ 能力基准; flowkit 不宣称经基准检验的「效果更优」; 若未来要做能力基准（BFCL/GAIA 式），是新目录不是 evals 的扩展。
**触发条件**: 站点（或任何对外材料）发布后首次收到「评测依据是什么」类提问时实施——诚实划界成本极低，但按「不预建」纪律等真实信号。
**成本估计**: README 一段话。

---

## 未立项记录（研究吸收但不提案）

- **hello-agents 教学法**（30 秒体验先行 / 批判小节 / 渐进式框架演化）: 已直接用于本站章节模板，属「已消化」，无需进 flowkit 本体。
- **learn-claude-code simulator 剧本模式**: 已用于站内 replay 组件。若未来 flowkit 出官方站点可复用，暂无 skill 本体改动。
- **GSSC 流水线 / Agentic-RL / A2A-ANP 协议**: 与 flowkit 当前「约定级、不上引擎」的定位不匹配——刻意不吸收（graph-engineering-research 仓四向对照的结论同源）。
