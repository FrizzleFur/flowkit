# 并行工作流管理

> 吸收自 GSD gsd-thread + gsd-workstreams + gsd-manager，精简适配 Flow

## 适用场景

- 多个独立任务需要并行推进
- 工作跨多个会话，需要上下文持久化
- 需要管理多个 Phase 的进度

## 模块一：跨会话线程（Thread）

轻量级上下文持久化，用于跨会话但不需要完整 Phase 流程的工作。

### 创建线程

```
.planning/threads/
└── {slug}.md
```

模板：
```markdown
# Thread: {描述}

## Status: OPEN

## Goal
{目标描述}

## Context
{关键信息、代码片段、错误信息}

## References
- {相关文件路径、issue 链接}

## Next Steps
- {下一步做什么}
```

### 操作
- 创建: `/gsd-thread {描述}`
- 列表: `/gsd-thread`（无参数）
- 恢复: `/gsd-thread {slug}`

## 模块二：并行工作流（Workstreams）

多个里程碑级任务并行推进。

### 操作

| 命令 | 说明 |
|------|------|
| `list` | 列出所有工作流 |
| `create <name>` | 创建新工作流 |
| `switch <name>` | 切换到指定工作流 |
| `progress` | 所有工作流进度概览 |
| `complete <name>` | 归档已完成工作流 |

### 数据结构

```
.planning/
├── workstreams/
│   ├── ws-{name-1}/
│   │   ├── ROADMAP.md
│   │   └── STATE.md
│   └── ws-{name-2}/
│       ├── ROADMAP.md
│       └── STATE.md
└── .active-workstream → ws-{name-1}
```

## 模块三：多 Phase 管理中心

交互式管理当前里程碑的所有 Phase。

### 核心操作

1. **状态总览**: 读取 STATE.md + ROADMAP.md，展示所有 Phase 状态
2. **Phase 操作**: 添加/删除/插入 Phase
3. **依赖管理**: 分析 Phase 间依赖，建议执行顺序
4. **进度同步**: 更新 STATE.md 中的进度信息

### 与 Flow 的集成

```
Flow 作为执行引擎:
  /gsd-manager 展示状态 → 选择 Phase → /flow 执行该 Phase

Thread 用于跨会话:
  会话 1: /flow 执行到一半 → /gsd-thread 保存上下文
  会话 2: /gsd-thread 恢复 → /flow 继续

Workstreams 用于多项目:
  /gsd-workstreams switch project-b → /flow 执行 project-b 的任务
```

## 精简版替代

如果不需要完整的 GSD 工作流管理，可以用 Flow 的内置机制替代：

- **Thread** → flow-deep 的 STATE.md 已实现跨会话恢复
- **Workstreams** → 用 git branch 隔离不同工作流
- **Manager** → `/flow --plan-dir .planning/workstreams/{name}` 指定不同规划目录
