# FlowKit

> **📝 博客深度解读**: [FlowKit: AI 原生工作流编排工具集](https://michaelmaomao.github.io/2026/05/05/FlowKit-AI%E5%8E%9F%E7%94%9F%E5%B7%A5%E4%BD%9C%E6%B5%81%E7%BC%96%E6%8E%92%E5%B7%A5%E5%85%B7%E9%9B%86/) —— 设计动机、核心架构、设计决策与踩坑经验详解

> AI 原生工作流编排工具集 —— 从任务分析到验证交付的结构化管道。

**[English](README_EN.md)** | 中文

## Pipeline 架构总览

```
                              ┌──────────────────────────────────────────────────┐
                              │                  FlowKit 管道                    │
                              └──────────────────────────────────────────────────┘
         ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐
  Input──▶│  Stage 0  │──▶│  Stage 1  │──▶│  Stage 2  │──▶│  Stage 3  │──┐
         │ 前置检查  │   │ Prompt优化│   │ 深度思考  │   │ 确定性规划│  │
         └───────────┘   └───────────┘   └───────────┘   └───────────┘  │
                                                                            │
         ┌──────────────────────────────────────────────────────────────────┘
         │
         ▼
    ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐
    │ Stage 3.5 │──▶│ Stage 3.6 │──▶│  Stage 4  │──▶│  Stage 5  │──┐
    │ Plan Review│  │ 多角色面板│   │ 多Agent执行│  │  完成验证 │  │
    └───────────┘   └───────────┘   └───────────┘   └───────────┘  │
                                                                       │
         ┌──────────────────────────────────────────────────────────────┘
         ▼
    ┌─────────────────┐
    │  Stage 5.5/5.7  │  ── 未达标时自动迭代，Ralph Loop 强制持续
    │  自主迭代引擎   │
    └─────────────────┘
```

## 为什么造这个轮子

使用 AI 编程助手（Claude Code、Cursor 等）的过程中发现一个核心问题：**Agent 能力很强但缺乏纪律性**。它们跳过验证、忽略边界情况、用"应该可以"来宣布完成。FlowKit 把软件工程的严谨性注入 AI Agent 工作流 —— 让"感觉驱动的编码"变成可重复的工程流程。

## 核心模块

| 模块 | 定位 | 一句话亮点 |
|------|------|-----------|
| **[flow](skills/flow/SKILL.md)** | 轻量编排引擎 | 按需启用 —— 通过参数控制管道阶段 |
| **[flow-deep](skills/flow-deep/SKILL.md)** | 全量深度引擎 | 强制全开 —— 所有关卡不可跳过 |
| **[multi-agent](skills/multi-agent/SKILL.md)** | 多 Agent 协作 | tmux 分屏并行 + 阶段间复用 |
| **[prompt](skills/prompt/SKILL.md)** | Prompt 评分 | 乔哈里视窗 + 3S 原则量化评估 |

## 设计亮点

### 1. Iron Laws —— 不可协商的执行铁律

四条规则，每条配备**合理化辩解对照表**，防止 LLM 自我辩解跳过：

```
  IL-1 · TDD                  IL-2 · Verify
  ┌────────────────┐          ┌────────────────┐
  │ No prod code   │          │ No "done"      │
  │ without failed │          │ without fresh  │
  │ test           │          │ evidence       │
  └───────┬────────┘          └───────┬────────┘
          │                           │
          ▼                           ▼
   "too simple"               "should work"
          │                           │
          └──────────┬────────────────┘
                     ▼
          ┌─────────────────────┐
          │ Rationalization Tbl │
          │ excuse -> rebuttal  │
          └─────────────────────┘

  IL-3 · Debug                 IL-4 · Review
  ┌────────────────┐          ┌────────────────┐
  │ No code change │          │ Review is      │
  │ without root   │          │ read-only      │
  │ cause          │          │ never modify   │
  └────────────────┘          └────────────────┘
```
*IL-1: 无失败测试不写生产代码 · IL-2: 无新鲜证据不宣布完成 · IL-3: 无根因确认不改代码 · IL-4: 审查只读永不修改*

### 2. Auto-Decide Layer —— 减少 80% 人工评审

多角色面板评审（Stage 3.6）中，6 条原则自动分类发现项：

```
  发现项输入
      │
      ▼
  ┌──────────────────────┐
  │   Auto-Decide Layer  │
  ├──────────────────────┤
  │                      │
  │  P1 行业标准 ────────┼── 违反 → 自动修复 (AUTO_FIX)
  │  P2 风险阈值 ────────┼── 高风险 → 修复 / 低风险 → 通过
  │  P3 一致性   ────────┼── 与已有一致 → 自动通过 (AUTO_APPROVE)
  │  P4 YAGNI    ────────┼── 过度设计 → 上浮给用户 ⚖️
  │  P5 安全优先 ────────┼── 安全相关 → 自动修复
  │  P6 不可逆性 ────────┼── 不可逆 → 上浮给用户 ⚖️
  │                      │
  └──────┬───────┬───────┘
         │       │
         ▼       ▼
   ┌──────────┐  ┌──────────────────┐
   │ 80% 自动 │  │ 20% Taste       │
   │ 处理完毕 │  │ Decision 上浮   │
   │ (静默)   │  │ 给用户决策      │
   └──────────┘  │ (通常 < 5 条)   │
                 └──────────────────┘
```

只有 **Taste Decision**（品味决策）需要人工 —— 通常 < 5 条，而非 20+ 条。

### 3. STATE.md —— 跨会话恢复

管道内置崩溃恢复机制：

```
  会话在 Stage 4 Phase 2 中断 💥
          │
          ▼
  ┌─────────────────────────┐
  │    .plan/STATE.md        │
  │                          │
  │  current_stage: 4        │
  │  current_phase: 2        │
  │  next_action: "Stage 5"  │
  │  progress: 65%           │
  └──────────┬──────────────┘
             │
             ▼
  新会话读取 STATE.md
          │
          ▼
  "上次停在 Stage 4 Phase 2
   —— 恢复还是重新开始？"
          │
          ▼
  从断点精确恢复 ──▶ 继续执行
```

GSD、GStack 等社区框架均无此能力。

### 4. Prompt 量化评分

基于乔哈里视窗理论 + 3S 原则：

```
                AI 知道           AI 不知道
            ┌──────────────┬──────────────┐
  人知道    │ Q1 公共知识   │ Q4 独有知识 ⚠│
            │ 直接描述即可  │ 必须喂模式    │
            ├──────────────┼──────────────┤
  人不知道  │ Q2 AI 专业   │ Q3 探索创新   │
            │ 信任 AI 即可  │ 协同探索      │
            └──────────────┴──────────────┘

  Q4 未使用喂模式 → 评分 ≤ 2/10 (Critical)
  Q4 使用喂模式   → 评分 7.0-8.5/10
```

### 5. Fallback 协议 —— 遇错先问 Plan

执行中遇到意外时，第一反应不是"怎么修"，而是"Plan 哪里假设错了"：

```
  执行遇到异常
      │
      ├─ 小偏差 ────────────▶ 直接修复 ──▶ 继续
      │
      ├─ Plan 假设有误 ─────▶ Plan Fallback
      │                       │
      │                  ┌────┴────┐
      │                  ▼         │
      │              暂停执行      │
      │              记录偏差      │
      │              更新 Plan     │
      │              用户确认 ─────┘
      │                  │
      │                  ▼
      │              继续执行
      │
      └─ 同一 Phase 失败 2 次
              │
              ▼
         退回 Stage 2 重新分析
```

## Flow vs Flow-Deep

| 维度 | `/flow` | `/flow-deep` |
|------|---------|--------------|
| 前置检查 | — | 强制开启 |
| 深度思考 | 可选 (`--think`) | 强制（ST + Mermaid + 三角色讨论） |
| Plan Mode | 默认开启，可关闭 | 不可关闭 |
| Plan Review | 可选 | 强制 |
| 多角色面板 | — | 默认 3-5 角色 |
| TDD 注入 | 可选 | 自动注入 |
| 完成验证 | 可跳过 | 不可跳过 |
| Ralph Loop | 手动触发 | 迭代用完自动触发 |

## 快速上手

本工具集为 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI 设计。

### 一行安装（推荐）

通过 [skills.sh](https://skills.sh)（Vercel Labs 的 Agent Skills 包管理器）一行安装全部模块：

```bash
npx skills add FrizzleFur/flowkit -a claude-code
```

只安装单个模块：

```bash
npx skills add https://github.com/FrizzleFur/flowkit/tree/main/skills/flow
```

### 手动安装（无 Node 环境备选）

```bash
# 复制所需模块到 Claude Code skills 目录
cp -r skills/flow ~/.claude/skills/
cp -r skills/flow-deep ~/.claude/skills/
cp -r skills/multi-agent ~/.claude/skills/
cp -r skills/prompt ~/.claude/skills/
```

在 Claude Code 中调用：

```
/flow 重构认证模块
/flow-deep 重新设计支付系统，支持多币种
/prompt 评估这个提示词："写一个排序算法"
```

## 设计哲学

| 来源 | 管什么 | 我们吸收了什么 |
|------|--------|---------------|
| GStack | 决策流程 | Auto-Decide Layer (P1-P6 + Taste Decision) |
| Superpowers | 执行纪律 | Iron Laws + Rationalization Table |
| GSD | 上下文质量 | STATE.md 跨会话恢复 |

**原创贡献（社区框架中均未出现）：**
- STATE.md 崩溃恢复机制
- Auto-Decide Layer 六原则自动决策系统
- Ralph Loop 集成（Stop Hook + auto-iterate 双层迭代）
- 乔哈里视窗 Prompt 量化评分

## 更新日志 (Changelog)

### v1.2.1 (2026-08-21)

**multi-agent / flow / flow-deep**
- **弱化 tmux 硬依赖** —— 执行模式改为环境自适应双模式：有 tmux 走 tmux-split 团队分屏；无 tmux **静默降级**为同消息无分屏并发（不提示安装、不要求重试）
- 降级模式保留规模档位硬约束（同消息 ≤ 4 防 429）与 Delegate 协调协议；pane 清理步骤自动跳过
- why: tmux 只是可视化增强而非能力前提，多数环境本就没有 tmux，强制提示会打断任务流

### v1.2.0 (2026-08-21)

**flow**
- Grilling 新增 **防拷打三律** —— 增量披露（每问前说明上一答更新了什么判断）、改变结论判据（只问可能改变结论的问题）、显式停止（信息足够立刻收束不凑满）；吸收自苏格拉底提问法，解决"无限追问导致用户被问爆"
- 需求探索收束新增 **问诊六件套** —— 原问题/真问题/已确认事实/未验证假设/关键变量/可行动新问题，后续 Stage 直接拿到澄清后的新问题
- 三角色讨论升级 —— 每角色四项陈述（新增**可证伪声明**：什么证据会让我改变判断）；第二轮先挖**分歧三件套**（共同事实/真正分歧/分歧背后假设）再调和，未消解的分歧显式记录而非过早掩盖

**prompt**
- 新增 **交互节奏控制** 检查项（多轮对话型专项）—— 延迟结论 / 一次一问 / 反形式主义 / 信息密度判据，补齐 Johari+3S 之外的多轮交互质量维度

### v1.1.0 (2026-08-21)

**flow-deep**
- 新增 **Context Guard（上下文容量守卫）** —— Stage/Phase 边界用 `scripts/check_context.py` 从会话 transcript usage 真值检测 context 占用百分比（精确值，非模型自估），超 70% 时 AskUserQuestion 三选项：保存并继续 / 保存并交接（生成 HANDOFF.md 衔接 prompt 给下一个 agent）/ 跳过
- 新增 **主动 Checkpoint 与 Handoff 协议** —— 保存动作清单、HANDOFF.md 模板（路径引用不复制内容）、同 Stage 节流、AskUserQuestion 不可用时的无交互降级、检测失败静默降级（exit 0/1/2 契约）
- 新增 **prime-agent 集成（C34）** —— capability-registry 注册 + skill-routing 自动路由：`security-audit` / `code-verification` 任务在 C34 可用时自动走 prime-agent（IPython 实际运行代码验证），`--no-prime` 可禁用
- 触发条件表 P0 升级为脚本实测，替换不可靠的"人工判断"预估

### v1.0.0 (2026-07-16)

**flow-deep**
- 新增 **Goal Contract（目标契约）** —— 防止 agent 做大量"看起来正确但偏离用户真实目标"的工作；提供 Objective / Success Criteria / Non-goals / Verification Plan 模板
- 新增 **Workflow Script Patterns（工作流脚本模式）** —— Stage 4 选 Workflow 后端时的 Review Workflow / Execution Workflow 模式参考
- `SKILL.md` 大幅更新（532 → 694 行）；capability-registry / context-management / panel-review 同步增强

**flow**
- 新增 **选型指南（selection-guide）** —— flow-deep vs flow vs grill-me 的入口决策依据、升级/降级信号、组合用法与三种误用
- `SKILL.md` 更新；cleanup-procedure / needs-exploration / stage55-iteration 同步增强

**multi-agent**
- `SKILL.md` 更新（315 → 328 行）

## License

MIT
