---
name: prompt
description: Evaluate, score, or optimize prompts based on Johari Window and 3S principles
---

# Prompt Scoring Skill

Prompt 评分与优化工具，基于乔哈里视窗理论和 3S 原则，提供自动评分、问题诊断、优化建议和优化版本生成。

效果：
![https://gw.alicdn.com/imgextra/i4/O1CN01OllFyJ1ph8JrBWAsI_!!6000000005391-2-tps-1560-984.png]


## Triggers

**TRIGGER when user:**
- Explicitly invokes /prompt or /prompt-scoring
- Asks about prompt quality: "这个提示词怎么样", "prompt 写得好吗"
- Requests optimization: "优化这个提示词", "改进这个 prompt"
- Provides text and asks for evaluation: "帮我看看这段 prompt"

**AUTO-DETECT** (ask before proceeding):
- User input exceeds 200 characters AND looks like a prompt (contains instructions, role definitions, or task descriptions)
- Ask: "检测到你输入了一段较长的提示词，是否需要我进行评分和优化？"

**WHEN INVOKED VIA /prompt COMMAND:**
- Treat ALL remaining input as the prompt to optimize
- No need to say "优化" explicitly

## Invocation Modes

### Command Mode (`/prompt <content>`)

**IMPORTANT**: When invoked via `/prompt` command, the **ENTIRE** content after `/prompt` is treated as the prompt to optimize. No need to add "优化" or "评分" keywords.

| Input | Behavior |
|-------|----------|
| `/prompt 写一个冒泡排序` | Score and optimize "写一个冒泡排序" |
| `/prompt 你是一个专业的翻译，请帮我翻译以下内容` | Score and optimize the entire prompt |
| `/prompt As a senior developer, review my code` | Score and optimize the English prompt |

### Natural Language Mode

When triggered by implicit keywords in conversation, extract the prompt content from user message.

| Input | Extracted Prompt |
|-------|------------------|
| "帮我优化一下这个提示词：写一个冒泡排序" | "写一个冒泡排序" |
| "这个 prompt 写得怎么样：你是 AI 助手" | "你是 AI 助手" |

## Workflow

### Step 0: Auto-Detect Mode (Implicit Trigger)

**Detection Criteria**:
- Input length > 200 characters
- AND looks like a prompt (contains any of these patterns):
  - Role definition: "你是", "你是一个", "As a", "You are"
  - Task instruction: "请", "帮我", "请帮我", "Please", "Help me"
  - Constraint keywords: "要求", "必须", "注意", "Requirements", "Must"
  - Format specification: "输出格式", "返回", "Output format"

**Behavior**: Ask user before proceeding

```
检测到你输入了一段较长的提示词，是否需要我进行评分和优化？

[提示词预览]: {前50字}...
```

- User confirms "是/好/可以" → Proceed to scoring
- User declines "否/不用" → Treat as normal conversation

### Step 1: Determine Mode

```
Input received
├── Starts with "/prompt " → Command Mode
│   └── Extract: everything after "/prompt "
├── Auto-Detect triggered → Auto-Detect Mode (ask first)
│   └── Extract: entire input if user confirms
└── Natural language keywords → Natural Language Mode
    └── Extract: prompt content from message
```

### Step 2-7: Analysis Pipeline

```
2. Extract Prompt → Get the prompt content to analyze
3. Analyze Prompt → Determine quadrant, 3S compliance, scene type
4. Select Weights → Choose scoring weights based on quadrant and scene
5. Calculate Score → Compute total score (1-10) based on dimensions
6. Diagnose Issues → Identify Critical/High/Medium/Low problems
7. Generate Optimized Version → Create improved prompt
```

## Core Theory

### Johari Window (乔哈里视窗四象限)

```
                    AI Knows                AI Doesn't Know
User Knows      第一象限(公共知识)        第四象限(独有知识) ⚠️
User Doesn't    第二象限(AI专业知识)      第三象限(探索创新)
Know
```

#### Critical: 第四象限识别

**检测标识** (有则可能是第四象限):
- 包含"我们团队"、"我们公司"、"本项目"等限定词
- 包含内部系统名称、团队黑话/缩写
- 包含新定义概念，且无示例、无定义

**处理规则**:
- 如果是第四象限但未使用"喂模式"(举例法/定义字典/RAG): 总分 ≤ 2.0/10 (Critical 级别)
- 正确使用喂模式: 可提升至 7.0-8.5/10

### 3S Principles

| Principle | Meaning | Detection |
|-----------|---------|-----------|
| **Single** | 单任务聚焦 | 检测"和"、"并"、"以及"等连接词，多个动词短语 |
| **Specific** | 明确详细 | 有格式+范围+示例: 9-10分; 有格式有范围: 7-8分; 无格式无范围: 2-6分 |
| **Short** | 简洁扼要 | 无冗余、高信息密度: 9-10分; 冗余修饰、低密度: 4-6分 |

## Scoring System

### Scene Detection

| Scene | Conditions | Weight Distribution |
|-------|------------|---------------------|
| **简单任务** | 字数<100, 单目标, 无复杂结构 | 目标明确性 40% + 3S原则 30% + 基础清晰度 30% |
| **复杂专业** | Role-Based, 工作流, 约束 | 基础评分 50% + 深度评分 50% |
| **第四象限** | 独有知识, 企业术语, 新概念 | 目标明确性 20% + 示例/术语完整性 80% |
| **学习任务** | 学习、理解、解释关键词 | 目标明确性 30% + 3S原则 30% + 表达清晰度 40% |

### Scoring Dimensions

#### 基础评分 (所有 Prompt)
1. **目标明确性** (40%): 目标清晰? 有成功标准? 范围明确?
2. **3S 原则** (30%): Single/Specific/Short
3. **基础清晰度** (30%): 语言表达清晰? 逻辑结构合理?

#### 深度评分 (条件触发)
**触发条件**: 复杂专业任务 OR 第四象限 OR 包含 Role-Based 结构 OR 字数 > 200

4. **约束完整性** (25%): 约束必要/可验证/无冲突
5. **技能匹配度** (25%): Role/Skills 匹配任务
6. **工作流清晰度** (25%): 步骤逻辑清晰/可重复执行
7. **示例/术语完整性** (25%): 示例完整/术语有定义

## Problem Diagnosis

### Critical Level (必须修复)

| # | Problem Type | Detection | Impact |
|---|--------------|-----------|--------|
| 1 | 第四象限未使用喂模式 | 第四象限但无示例/定义 | AI无法理解独有知识 |
| 2 | 多目标混杂 | Single原则违背，多个目标 | AI无法确定主要目标 |
| 3 | 完全缺少成功标准 | 无输出要求、无验证标准 | 无法判断是否完成 |

### High Level (强烈建议修复)

| # | Problem Type | Detection |
|---|--------------|-----------|
| 4 | 约束互相冲突 | 约束之间互相矛盾 |
| 5 | 技能与任务不匹配 | Role/Skills 与任务无关 |
| 6 | 示例不完整 | 第四象限示例缺少输入/输出/模式 |

### Medium Level (建议优化)

| # | Problem Type | Detection |
|---|--------------|-----------|
| 7 | 过度设计(第一象限) | 第一象限使用复杂 Role-Based 结构 |
| 8 | 缺少部分成功标准 | 有成功标准但不完整 |
| 9 | 约束不够具体 | 约束模糊无法验证 |

### Low Level (可选优化)

| # | Problem Type |
|---|--------------|
| 10 | 格式不规范 |
| 11 | 表达不够简洁 |

### 交互节奏控制（多轮对话型 Prompt 专项检查，2026-08-21 新增）

单轮内容质量之外，多轮对话型 Prompt（追问/澄清/访谈类）还需检查节奏四律：

| # | 技巧 | Detection | Impact |
|---|------|-----------|--------|
| 12 | 延迟结论 | 有无"先不要给建议 / 先别急着回答"类指令 | 防止跳过探索直接给答案 |
| 13 | 一次一问 | 是否要求"每次只问一个问题，根据回答决定下一问" | 防问卷轰炸（一次抛多个令人困惑） |
| 14 | 反形式主义 | 有无"信息足够时立刻停止，不必凑满 N 个" | 防为凑额度问无价值问题 |
| 15 | 信息密度判据 | 是否限定"只问可能改变结论的问题" | 提升每轮问答的边际价值 |

## Optimization Strategies

### Strategy Selection

| Condition | Strategy | Method |
|-----------|----------|--------|
| 问题少(≤3), 无Critical | 保留式优化 | 保留原有结构风格，只修改问题部分 |
| 问题多(>3), 有Critical | 重构式优化 | 重新设计结构，应用合适模板 |
| 完全不匹配最佳实践 | 模板化优化 | 推荐最合适模板，基于模板重新构建 |

## Output Format

### Standard Report Structure

```markdown
## Prompt 评分报告

### 基本信息
- **象限**: [第一/二/三/四象限]
- **场景**: [简单/复杂/第四象限/学习任务]
- **总分**: X/10

### 各维度得分
1. **目标明确性**: X/10 - [简要说明]
2. **3S 原则**: X/10
   - Single: X/10
   - Specific: X/10
   - Short: X/10
3. **基础清晰度**: X/10

### 问题诊断
[按严重性排序：Critical > High > Medium > Low]

#### [问题 1]
- **等级**: Critical
- **类型**: [问题类型]
- **描述**: [问题详细说明]

### 优化建议
- **针对问题**: [问题 X]
- **优化方向**: [具体建议]
- **预期改进**: 评分提升 X/10 → X/10

### 优化版本
[基于优化建议生成的完整 Prompt]
```

## Examples

### Example 1: Command Mode

**Input**: `/prompt 写一个冒泡排序`

**Mode**: Command Mode - entire input "写一个冒泡排序" is the prompt to optimize

**Analysis**:
- 象限: 第一象限
- 场景: 简单任务
- 3S: Single(10/10), Specific(7/10), Short(9/10)

**Score**: 7.9/10

**Issues**: Medium - 缺少性能要求

**Optimized**:
```markdown
用 Python 实现快速排序算法：
- 输入：整数列表
- 输出：升序排列的列表
- 要求：时间复杂度 O(n log n)，空间复杂度 O(log n)
```

### Example 2: Natural Language Mode

**Input**: "帮我优化这个提示词：审查我们公司的 XYZ 系统代码，确保遵循 YYY 规范"

**Mode**: Natural Language Mode - extract "审查我们公司的 XYZ 系统代码，确保遵循 YYY 规范"

**Analysis**:
- 象限: 第四象限 (人知 AI 不知)
- 问题: 未使用喂模式

**Score**: 2.0/10 (Critical)

**Optimized** (8.5/10):
```markdown
审查我们公司的 XYZ 系统代码，确保遵循 YYY 规范。

**定义**:
- XYZ 系统：我们内部的微服务框架，基于 Spring Boot
- YYY 规范：内部代码规范，要求类名用 PascalCase，方法名用 camelCase

**示例**:
❌ 不符合规范:
public class user_service { }

✅ 符合规范:
public class UserService { }
```

## Quick Reference

### Quadrant Decision Tree

```
包含限定词("我们公司/团队")?
├─ 是 → 第四象限 (需要喂模式)
└─ 否 → 开放提问?
         ├─ 是 → 第二象限
         └─ 否 → 探索创新?
                  ├─ 是 → 第三象限
                  └─ 否 → 第一象限
```

### Score Interpretation

| Score | Quality | Action |
|-------|---------|--------|
| 9-10 | 优秀 | 可直接使用 |
| 7-8.9 | 良好 | 建议小优化 |
| 5-6.9 | 一般 | 建议优化 |
| 3-4.9 | 较差 | 需要重构 |
| 1-2.9 | 严重问题 | 必须重写 |

## Best Practices

1. **第四象限必须用喂模式**: 举例法、定义字典、RAG 技术
2. **遵循 3S 原则**: Single(单任务) + Specific(明确详细) + Short(简洁)
3. **第一象限避免过度设计**: 公共知识直接描述，无需复杂 Role-Based
4. **明确成功标准**: 定义输出格式和验证标准
5. **约束要可验证**: 避免模糊的约束条件

## Limitations

- 中文优化为主，英文 Prompt 评分可能有偏差
- 主观性评分，仅供参考
- 需要结合具体场景判断
