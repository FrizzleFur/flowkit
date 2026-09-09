# 项目初始化流程

> 吸收自 GSD gsd-new-project / gsd-new-milestone，精简适配 Flow

## 适用场景

- 新项目开始，需要建立项目上下文
- 现有项目需要里程碑规划

## 核心流程

### Step 1: 项目提问（5-8 个关键问题）

向用户询问：
1. 项目目标（一句话描述）
2. 目标用户是谁
3. 技术栈选择（前端/后端/数据库）
4. 核心功能范围（Top 5）
5. 非功能需求（性能/安全/合规）
6. 已有代码库？（Brownfield vs Greenfield）
7. 团队规模和协作方式

### Step 2: 生成项目文件

```
.planning/
├── PROJECT.md          # 项目上下文（目标、技术栈、团队、约束）
├── config.json         # 工作流配置
├── REQUIREMENTS.md     # 需求文档（功能需求 + 非功能需求）
├── ROADMAP.md          # 路线图（Phase 编号 + 名称 + 目标）
├── STATE.md            # 项目记忆（当前状态、阻塞项）
└── research/           # 领域研究（可选）
```

### Step 3: PROJECT.md 模板

```markdown
# 项目名

## 目标
{一句话描述}

## 技术栈
- 前端: {framework}
- 后端: {language/framework}
- 数据库: {db}
- 部署: {platform}

## 核心功能
1. {FR-001}: {功能描述}
2. {FR-002}: {功能描述}
...

## 约束
- {非功能需求}

## 团队
- {角色}: {职责}
```

### Step 4: ROADMAP.md 模板

```markdown
# 路线图

## 里程碑: {version} — {name}

| Phase | 名称 | 目标 | 状态 |
|-------|------|------|------|
| 1 | {name} | {目标} | pending |
| 2 | {name} | {目标} | pending |
...
```

### Step 5: 里程碑归档（项目完成后）

1. 验证所有 Phase 已完成
2. 将 ROADMAP.md + REQUIREMENTS.md 归档到 `.planning/milestones/v{version}/`
3. 更新 PROJECT.md 添加已完成里程碑记录
4. 重置 STATE.md 准备下一里程碑

## 与 Flow 的集成

- 项目初始化后，后续任务直接用 `/flow` 编排执行
- ROADMAP.md 中的 Phase 对应 flow 的 task_plan.md
- STATE.md 与 flow-deep 的 STATE.md 共享同一格式
