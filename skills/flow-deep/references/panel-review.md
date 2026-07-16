# Panel Review - 多角色面板评审

> 本文件由 flow-deep SKILL.md 引用。定义 Stage 3.6 的多角色面板评审流程。
> 核心理念: "Design Review Board"——多视角交叉验证，消除单角色盲区。

## 概述

Panel Review 在 Stage 3.5（快速审查）通过后、Stage 3.7（代码级细化）之前，启动多个并行 Agent，每个扮演不同专家角色，从各自专业维度深度评审 plan。评审结果综合后提交用户决策。

## 与 Stage 3.5 的分工

| 维度 | Stage 3.5 (快速审查) | Stage 3.6 (面板评审) |
|------|---------------------|---------------------|
| Agent 数量 | 1 个 Staff Engineer | 3-5 个专家角色 |
| 审查深度 | 广度优先，快速 sanity check | 深度优先，专业维度切入 |
| 目标 | 过滤明显问题 | 发现深层隐患 |
| 耗时 | 低（单 Agent） | 中（并行多 Agent） |
| 何时跳过 | flow-deep 中不可跳过 | `--no-panel` 可跳过 |

## 角色目录

### 完整角色列表

| ID | 角色 | 核心审查维度 | 典型适用场景 |
|----|------|-------------|-------------|
| R01 | Architect (架构师) | 模块划分、依赖关系、抽象层次、技术债务、扩展性 | 所有代码实现任务（默认） |
| R02 | Security Expert (安全专家) | 攻击面、权限模型、数据流安全、第三方依赖风险、合规性 | 涉及认证/授权/数据/支付 |
| R03 | Performance Engineer (性能工程师) | 关键路径、资源消耗、缓存策略、并发模型、容量规划 | 高并发/大数据量/延迟敏感 |
| R04 | Domain Expert (领域专家) | 业务规则覆盖、边界条件、领域术语一致性、异常流程 | 业务逻辑复杂/新领域 |
| R05 | DevOps/SRE (运维) | 部署策略、回滚方案、监控告警、配置管理、灰度策略 | 基础设施/部署变更 |
| R06 | QA Engineer (测试专家) | 可测试性、测试覆盖策略、集成点风险、回归风险、边界场景 | 所有代码实现任务 |
| R07 | Frontend Expert (前端专家) | UX 影响、可访问性、状态管理、性能预算、渐进增强 | 前端/全栈任务 |
| R08 | Data Engineer (数据工程师) | 数据建模、迁移策略、一致性保证、查询性能、数据生命周期 | 数据库变更/数据迁移 |

### 自动选择规则

> **原生对标**: 本面板评审对应 Claude Code 原生 `/code-review <level>` 多智能体审查；`--panel-depth` 即 level 参数（工作量分级）。Stage 3.5（单 Agent 快速审查）对应原生 `/review` 快速单次审查。两者构成「单次快速 vs 分级多智能体」的二分心智模型，与原生 review 命令职责一致。

三档深度，按工作量分级：

| 档位 | 角色数 | 适用场景 | 对标 level |
|------|--------|---------|-----------|
| `quick` | 1 | 已有明确方案、只需关键维度把关 | 低 |
| `basic` | 3 | 常规任务，多维交叉验证（默认） | 中 |
| `advanced` | 5 | 高风险/跨系统任务，全面深度评审 | 高 |

| 任务类型 | quick (1) | basic (3) | advanced (5) |
|---------|-----------|-----------|--------------|
| 纯后端/架构 | Architect | Architect + Performance + QA | + Security + Domain |
| 安全敏感 | Security | Security + Architect + QA | + Domain + DevOps |
| 前端/全栈 | Architect | Architect + Frontend + Domain | + QA + Performance |
| 数据密集 | Data Engineer | Data Engineer + Architect + QA | + Performance + Domain |
| 基础设施 | DevOps | DevOps + Architect + Security | + Performance + QA |
| 默认/不确定 | Architect | Architect + QA + Domain | + Security + Performance |

默认 `basic`。用户可通过 `--panel-roles "R02,R03,R06"` 覆盖自动选择（角色数不受档位限制）。

## Agent Prompt 模板

### 通用框架

```
你是一名资深 {ROLE_NAME}，请从你的专业角度审查以下实现方案。

你的专业审查维度:
{ROLE_SPECIFIC_DIMENSIONS}

通用审查维度（所有角色都要关注）:
1. 遗漏的边界情况: 是否有未考虑的边界条件
2. 假设验证: plan 中的技术假设是否成立（API 版本、依赖兼容性）
3. 可执行性: 步骤是否足够精确，能否直接执行

输出格式:
## {ROLE_NAME} 审查结论
[APPROVED / CONCERNS / BLOCKED]

## 专业维度发现
### 严重问题（必须修复）
- [问题]: 描述 + 建议修复方案

### 建议改进（可选）
- [建议]: 描述 + 理由

### 确认良好
- [方面]: 认可的设计决策

## 跨维度观察
[从你的角度看，其他角色可能遗漏的关键点，或与其他角色潜在冲突的意见]

---
方案内容:
{plan_content}

当前代码库上下文:
{codebase_context}
```

### 角色特定维度

#### R01: Architect
```
1. 模块划分: 职责边界是否清晰，耦合度是否合理
2. 依赖关系: 模块间依赖是否有循环，依赖方向是否合理
3. 抽象层次: 抽象是否恰当（不过度也不过少）
4. 技术债务: 是否引入新的技术债务，现有债务是否需要处理
5. 扩展性: 方案是否支持未来可能的需求变化
```

#### R02: Security Expert
```
1. 攻击面: 新增的入口点是否有安全风险
2. 权限模型: 权限检查是否完整，是否有越权风险
3. 数据流安全: 敏感数据是否加密传输/存储，是否有泄露路径
4. 第三方依赖: 新增依赖是否有已知漏洞
5. 合规性: 是否符合安全合规要求（GDPR、等保等）
```

#### R03: Performance Engineer
```
1. 关键路径: 核心操作的时间复杂度是否可接受
2. 资源消耗: 内存、CPU、网络、IO 使用是否合理
3. 缓存策略: 是否需要缓存，缓存失效策略是否正确
4. 并发模型: 是否有竞态条件，锁粒度是否合理
5. 容量规划: 是否有容量瓶颈，横向扩展是否可行
```

#### R04: Domain Expert
```
1. 业务规则覆盖: 业务需求是否全部覆盖
2. 边界条件: 极端场景、异常数据是否有处理
3. 领域术语一致性: 代码命名是否与业务术语一致
4. 异常流程: 错误场景的用户体验是否合理
5. 数据完整性: 业务约束是否在数据层有保障
```

#### R05: DevOps/SRE
```
1. 部署策略: 是否支持滚动部署、蓝绿部署
2. 回滚方案: 出问题时能否快速回滚
3. 监控告警: 关键指标是否有监控，告警阈值是否合理
4. 配置管理: 配置是否外部化，敏感配置是否安全
5. 灰度策略: 是否支持灰度发布
```

#### R06: QA Engineer
```
1. 可测试性: 模块是否易于单元测试、集成测试
2. 测试覆盖策略: 哪些路径必须有测试覆盖
3. 集成点风险: 模块间交互是否有集成风险
4. 回归风险: 改动是否可能影响现有功能
5. 边界场景: 是否有遗漏的测试场景
```

#### R07: Frontend Expert
```
1. UX 影响: 改动对用户体验的影响
2. 可访问性: 是否满足 WCAG 标准
3. 状态管理: 前端状态管理方案是否合理
4. 性能预算: Bundle 大小、渲染性能是否在预算内
5. 渐进增强: 是否支持降级方案
```

#### R08: Data Engineer
```
1. 数据建模: 表结构设计是否合理，索引是否充分
2. 迁移策略: 数据迁移是否安全，是否有回滚方案
3. 一致性保证: 数据一致性是否有保障（事务、幂等）
4. 查询性能: 慢查询风险，是否有 N+1 问题
5. 数据生命周期: 数据归档、清理策略是否完善
```

## Auto-Decide Layer

> 在综合分析和用户展示之间插入自动决策层，借鉴 GStack /autoplan 的决策原则思路。
> 核心目标: 自动处理 80% 的常规发现，只上浮 Taste Decisions（品味决策）给用户。

### 6 个决策原则

对综合分析后的每个发现，按以下原则逐一判定。**一旦命中某条原则，立即分类，不再继续判定**:

#### P1: 行业标准优先 (Industry Standard)

**触发**: 发现问题有明确的行业最佳实践答案
**决策**: `AUTO_APPROVED` — 自动采纳并记录
**示例**: "缺少输入验证"、"错误处理不统一"、"日志缺少请求 ID"

#### P2: 风险阈值分级 (Risk Threshold)

**触发**: 按风险等级分级处理（含安全相关发现）

| 风险等级 | 判定依据 | 决策 |
|---------|---------|------|
| CRITICAL | 数据泄露/资金风险/安全漏洞 | `BLOCKED` — 直接阻塞 |
| HIGH | 安全高危/性能瓶颈/数据不一致 | `TASTE_DECISION` — 上浮 |
| MEDIUM | 一般设计缺陷/可维护性问题 | `AUTO_APPROVED` — 记录但不阻塞 |
| LOW | 命名/格式/注释/微小优化 | `AUTO_APPROVED` — 静默记录 |

**安全相关发现特殊规则**: 安全问题不走 P1 自动采纳，统一先按 P2 分级。CRITICAL/HIGH 级在 P2 即处理（BLOCKED/TASTE_DECISION）。MEDIUM 级安全不归 P2 的 AUTO，继续走到 P5 上浮。

#### P3: 已批决策一致性 (Consistency)

**触发**: 建议与 Stage 2 深度思考或 Stage 3 plan 中已确认的决策冲突
**数据源**: 从 `findings.md` 的 Stage 2 摘要（核心结论 + 技术匹配）和 `task_plan.md` 的 Phase 定义中获取已批决策
**决策**: `AUTO_APPROVED` — 保持已批决策，记录冲突说明
**示例**: Stage 2 已决定用 Redis，QA 建议改 Memcached → 保持 Redis

#### P4: YAGNI 标记上浮 (YAGNI → Taste Decision)

**触发**: 建议引入额外复杂度但没有明确需求（前瞻性建议）
**决策**: `TASTE_DECISION` — 标记为 [YAGNI] 类 Taste Decision，上浮让用户判断
**示例**: "为未来微服务化预留接口" → 无明确需求 → 上浮让用户决定
**理由**: 前瞻性建议可能有价值，不应自动拒绝，但也不应自动采纳。让用户权衡。

#### P5: 安全一律上浮 (Security First)

**触发**: 任何安全相关的 MEDIUM 及以上风险（补充 P2 中 HIGH 以下的覆盖）
**决策**: `TASTE_DECISION` — 安全问题不自动处理，一律上浮
**示例**: "建议添加 rate limiting"、"考虑 CORS 配置" → 安全相关 → 上浮

#### P6: 可逆性评估 — 基于影响面 (Reversibility)

**触发**: 评估建议变更的影响面

| 影响面 | 判定依据 | 决策 |
|--------|---------|------|
| < 3 文件 | 局部改动，低回退成本 | `AUTO_APPROVED` — 可逆，自动通过 |
| >= 3 文件 | 跨模块/接口变更 | `TASTE_DECISION` — 不可逆，上浮 |

**例外**: 数据库 schema 变更、API 协议变更、公共接口签名变更 — 不论文件数，一律上浮。

### 判定流程

```
每个发现
  │
  ▼
P1: 有行业标准? ──是──→ AUTO_APPROVED (记录)
  │否
  ▼
P2: 风险分级? ──CRITICAL──→ BLOCKED
  │             HIGH────→ TASTE_DECISION
  │             LOW/MED──→ AUTO_APPROVED
  │(安全相关 MEDIUM 级不走 AUTO，继续到 P5)
  ▼
P3: 与已批决策冲突? ──是──→ AUTO_APPROVED (保持原决策)
  │否
  ▼
P4: 是前瞻性建议? ──是──→ TASTE_DECISION [YAGNI]
  │否
  ▼
P5: 安全相关? ──是──→ TASTE_DECISION [SECURITY]
  │否
  ▼
P6: 影响面 >= 3 文件? ──是──→ TASTE_DECISION [IRREVERSIBLE]
  │否
  ▼
AUTO_APPROVED (默认通过)
```

### Taste Decision 分类

| 标签 | 含义 | 来源原则 |
|------|------|---------|
| `[CLOSE_APPROACH]` | 两种可行方案都有道理 | P2 HIGH / Agent 间分歧 |
| `[YAGNI]` | 前瞻性建议，无明确需求 | P4 |
| `[SECURITY]` | 安全相关，需用户决策 | P5 |
| `[IRREVERSIBLE]` | 不可逆变更，影响面大 | P6 |
| `[DISAGREEMENT]` | 多角色对同一决策有分歧 | 综合分析 |

---

## 执行流程

```
Stage 3.5 通过
     │
     ▼
确定评审角色（自动选择 or --panel-roles）
     │
     ▼
并行启动 3-5 个 review Agent（同一条消息）
     │  每个: general-purpose + 角色特定 prompt
     │  只读: 不修改任何文件
     │
     ▼
收集所有评审结果
     │
     ▼
综合分析:
  - 重叠问题（2+ Agent 提到 → 高优先级）
  - 冲突意见（不同角色对同一决策有分歧 → 标记为 DISAGREEMENT）
  - 按严重性排序
     │
     ▼
Auto-Decide Layer (6 原则判定)
     │  对每个发现逐一判定:
     │  AUTO_APPROVED → 静默记录到 findings
     │  TASTE_DECISION → 收集到待审列表
     │  BLOCKED → 加入阻塞列表
     │
     ▼
Final Approval Gate (只展示需要用户决策的内容)
     │
     ▼
向用户展示精简报告 ──→ 用户决定:
     │                  ├── APPROVE_ALL → 采纳全部建议 + Auto-Decide → Stage 3.7
     │                  ├── SELECTIVE_ADOPT → 部分采纳（用户标注修改）→ Stage 3.7
     │                  └── REVISE_PLAN → 退回 Stage 3 修改 plan
     │
     ▼
审查结果写入 findings.md 的 Panel Review 章节
（含 Auto-Decide 记录，完整可追溯）
```

```
Stage 3.5 通过
        │
        ▼
   ┌────────────┐
   │ 角色选择    │
   └─────┬──────┘
         │
    ┌────┼────┐
    ▼    ▼    ▼
  ┌───┐┌───┐┌───┐
  │ R1││ R2││ R3│  ← 并行启动
  └─┬─┘└─┬─┘└─┬─┘
    │    │    │
    └────┼────┘
         ▼
   ┌────────────┐
   │ 综合分析    │
   │ · 去重      │
   │ · 标记冲突  │
   │ · 排优先级  │
   └─────┬──────┘
         ▼
   ┌──────────────────┐
   │  Auto-Decide     │
   │  6 原则判定       │
   │  ┌─────────────┐ │
   │  │AUTO_APPROVED│ │→ 静默记录
   │  │TASTE_DECISION│ │→ 待审列表
   │  │  BLOCKED    │ │→ 阻塞列表
   │  └─────────────┘ │
   └────────┬─────────┘
            ▼
   ┌──────────────────┐
   │ Final Approval   │
   │ Gate             │
   │ (只展示:         │
   │  Taste Decisions │
   │  + Blocked Issues│
   │  + Auto 摘要)    │
   └────────┬─────────┘
     ┌──────┼──────────────┐
     ▼      ▼              ▼
 APPROVE  SELECTIVE     REVISE
 _ALL     _ADOPT        _PLAN
     │      │              │
     ▼      ▼              ▼
 Stage3.7 用户选       退回
 (细化)   择采纳      Stage3
```

## Final Approval Gate 报告格式

> Auto-Decide Layer 处理后的精简报告，只展示需要用户决策的内容。

```markdown
## Panel Review — Final Approval Gate

### 角色参与情况
| 角色 | 结论 | 严重问题 | 建议 | 自动处理 |
|------|------|---------|------|---------|
| Architect | APPROVED | 0 | 2 | 2 |
| Security | CONCERNS | 1 | 1 | 1 |
| QA | APPROVED | 0 | 3 | 3 |

### Auto-Decide 摘要
| 决策类型 | 数量 | 说明 |
|---------|------|------|
| AUTO_APPROVED (行业标准 P1) | N | [1-2 个示例] |
| AUTO_APPROVED (低风险 P2) | N | [1-2 个示例] |
| AUTO_APPROVED (保持原决策 P3) | N | [1-2 个示例] |
| AUTO_APPROVED (可逆变更 P6) | N | [1-2 个示例] |
| **总计自动处理** | **N** | 已自动处理，无需人工审阅 |

### Blocked Issues — 必须解决
> 这些问题会阻塞流程，必须在继续前解决。

1. **[BLOCKED]** [问题描述]
   - 来源: [角色名]
   - 风险等级: CRITICAL
   - 建议修复: [方案]

### Taste Decisions — 需要你决定

> 以下发现无法自动处理，需要你的判断。每项附有推荐选项。

#### TD-N: [标签] 标题
- **背景**: [为什么这个决策需要人工判断]
- **来源**: [哪个角色提出 / 哪些角色有分歧]
- **选项**:
  - A: [方案A描述] — 优势/劣势
  - B: [方案B描述] — 优势/劣势
- **推荐**: [推荐选项及理由]

### 确认良好
- [方面]: 多个角色共同认可的设计决策（不需操作）

---

### 你的决定:
- [ ] **APPROVE_ALL**: 采纳所有建议（Auto-Decide + 推荐 Taste Decision 选项）
- [ ] **SELECTIVE_ADOPT**: 部分采纳（请标注每个 TD 的选择和 BLOCKED 的处理方案）
- [ ] **REVISE_PLAN**: 退回 Stage 3 修改 plan
```

### 报告生成规则

1. **重叠发现合并**: 综合分析阶段，将 2+ 角色提到的相同问题合并为 1 个发现再走 Auto-Decide，标注来源角色列表
2. **Auto-Decide 摘要**按原则分组统计，每组最多展示 2 个代表性示例（完整列表记录到 findings.md）
3. **Blocked Issues** 不超过 5 条，超过则只展示 CRITICAL 级别，其余降级为 HIGH TASTE_DECISION
4. **Taste Decisions** 最多展示 8 条，超过时按优先级排序截断: `[SECURITY]` > `[DISAGREEMENT]` > `[IRREVERSIBLE]` > `[CLOSE_APPROACH]` > `[YAGNI]`。被截断的 TD 记录到 findings.md
5. **Taste Decisions** 每条必须包含背景、来源、选项、推荐四要素
6. **确认良好** 只展示 2+ 角色共同认可的设计决策（< 3 条）
7. **完整报告**（含所有 AUTO_APPROVED 详情 + 被截断的 TD）写入 findings.md 的 Panel Review 章节
8. **Auto-Decide 结果**暂存在对话上下文中，用户确认 Final Approval Gate 后一并写入 findings.md

## Agent 配置

| 参数 | 值 | 说明 |
|------|-----|------|
| subagent_type | `general-purpose` | 需要读取代码库 |
| name | `panel-{role-id}` | 如 `panel-architect`、`panel-security` |
| prompt | 角色模板 + plan 内容 | 见上方模板 |
| team_name | 当前 flow 的 team | 复用团队 |

## 注意事项

- 所有评审 Agent 是只读的——不修改任何文件，只返回审查报告
- Agent 并行启动（同一条消息中多次 Agent 调用），不需要 tmux 分屏
- 如果某个 Agent 执行失败，不阻塞其他评审，降级为部分评审
- **Auto-Decide Layer 不替代用户决策** — 只过滤可自动处理的常规项，安全/不可逆/分歧项一律上浮
- 综合报告中的"角色间分歧"自动标记为 `[DISAGREEMENT]` Taste Decision
- 半自动模式: Final Approval Gate 必须等用户确认后才继续
- **完整可追溯**: findings.md 的 Panel Review 章节记录所有发现的 Auto-Decide 判定结果，包括 AUTO_APPROVED 的详情
- 用户选择 `APPROVE_ALL` 时，Taste Decisions 采用推荐选项；`SELECTIVE_ADOPT` 时用户可逐项调整
- 当 BLOCKED Issues > 5 时，只展示 CRITICAL 级别，其余降级为 TASTE_DECISION
