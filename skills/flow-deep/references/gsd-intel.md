# 代码库情报收集

> 吸收自 GSD gsd-intel，精简适配 Flow

## 适用场景

- 接手不熟悉的代码库
- 大型重构前需要了解现状
- 需要快速定位某个功能的实现位置

## 核心流程

### Refresh（重建情报索引）

启动 Agent 分析代码库，生成结构化情报文件：

```
.planning/intel/
├── stack.json              # 技术栈信息
├── api-map.json            # API 端点映射
├── dependency-graph.json   # 依赖关系图
├── file-roles.json         # 文件职责分类
└── arch-decisions.json     # 架构决策记录
```

Agent 执行步骤：
1. 分析项目结构（Glob + Read package.json / go.mod 等）
2. 扫描源文件提取 exports/imports
3. 生成依赖关系图
4. 分类文件职责（config/route/model/service/util/test）
5. 识别 API 端点和调用关系
6. 写入 JSON 文件，每个文件带 `_meta.updated_at` 时间戳

### Query（查询）

```bash
# 在情报文件中搜索关键词
grep -r "term" .planning/intel/ --include="*.json" -l
```

读取匹配文件，展示相关条目。

### Status（状态检查）

检查每个情报文件的新鲜度：
- 24 小时内 → FRESH
- 超过 24 小时 → STALE（建议 refresh）

## 精简版替代

如果不需要完整的 GSD intel 系统，可以在 flow Stage 2 中直接用 Glob + Grep 快速扫描：

```bash
# 快速技术栈识别
cat package.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(json.dumps({**d.get('dependencies',{}), **d.get('devDependencies',{})}, indent=2))"
```
