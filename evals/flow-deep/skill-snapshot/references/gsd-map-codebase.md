# 代码库映射

> 吸收自 GSD gsd-map-codebase，精简适配 Flow

## 适用场景

- Brownfield 项目初始化前
- 大型重构前需要了解现状
- 新人 onboarding

## 核心流程：4 个并行 Agent 映射

启动 4 个并行 Agent，每个负责一个维度，**直接写入文档**（不返回内容到主 Agent）：

```
.planning/codebase/
├── STACK.md          # Agent 1: 技术栈 + 集成
├── INTEGRATIONS.md   # Agent 1: 外部集成
├── ARCHITECTURE.md   # Agent 2: 架构 + 结构
├── STRUCTURE.md      # Agent 2: 目录结构
├── CONVENTIONS.md    # Agent 3: 编码规范 + 测试策略
├── TESTING.md        # Agent 3: 测试覆盖
└── CONCERNS.md       # Agent 4: 风险和关注点
```

### Agent 1: 技术栈映射

```
分析目标:
- package.json / go.mod / Cargo.toml 等依赖文件
- 框架版本（React/Vue/Express/Django 等）
- 构建工具（webpack/vite/esbuild 等）
- 外部服务集成（数据库/消息队列/云服务）

输出: STACK.md + INTEGRATIONS.md
```

### Agent 2: 架构映射

```
分析目标:
- 目录结构和模块划分
- 入口文件和路由结构
- 数据模型和 API 分层
- 设计模式使用情况

输出: ARCHITECTURE.md + STRUCTURE.md
```

### Agent 3: 质量映射

```
分析目标:
- 代码风格和 lint 配置
- 命名约定和文件组织规范
- 测试框架和覆盖率
- CI/CD 配置

输出: CONVENTIONS.md + TESTING.md
```

### Agent 4: 风险映射

```
分析目标:
- 技术债务（TODO/FIXME/HACK 注释）
- 安全风险（硬编码密钥/SQL注入等）
- 性能瓶颈（N+1 查询/大循环等）
- 依赖健康度（过时/有漏洞的依赖）

输出: CONCERNS.md
```

## 与 Flow 的集成

- 在 flow-deep Stage 2（深度思考）中，可触发代码库映射作为预处理
- 映射结果写入 `.planning/codebase/`，后续 Stage 可按需引用
- 对于小型项目（<5 文件），跳过映射，直接在 Stage 2 中用 Glob/Grep 快速了解
