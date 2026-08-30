# Multi-Repo Toolchain - 多仓双图工具链协议

> flow-deep Stage 3/4 引用。多仓或跨文件代码任务的环境检验、上下文准备与双图（codegraph × serena）路由。
> 详细论证与实证：研究仓库 `graph-engineering-research`（research/06-dual-graph.md + 07-multi-repo-toolchain.md，2026-08-30 FDNote 实践验证）。

## 何时读本文件

- Stage 3 探索代码库前，任务涉及 **2+ 仓库或跨文件影响面** → 先做下方「环境检验」与「准备分档」
- Stage 4 分发代码修改 Agent 前 → 按「四段式路由」构造 agent 指令
- 新 GitHub 仓库/新工作区接入 → 按「Onboarding 六步」
- 新设备（双机迁移）→ 按「跨设备 bootstrap 六步」

## 第 0 层 · 环境检验（每次多仓任务开始时，~10 秒）

| 项 | 检验 | 缺失时 |
|---|---|---|
| Node.js | `node -v`（需 >= 20 < 25） | 升级 node |
| codegraph CLI | `which codegraph && codegraph --version` | `npm i -g @colbymchenry/codegraph` |
| serena | `get_current_config` 可返回 | 启用 serena 插件或配 MCP |
| codegraph MCP | Claude Code 工具列表含 codegraph_* | `codegraph install`（可选；CLI 直调也可完成本协议） |

## 准备分档（Q3：是否必须先准备上下文仓库）

按「跨仓性 × 持久性」两维判断，**不是布尔问题**：

| 场景 | 策略 |
|---|---|
| 单文件小改 | 跳过 codegraph，serena 即时可用（LSP 实时图零预索引成本） |
| 新需求范围未明（**默认档：半准备**） | serena 先行（秒级）+ codegraph 按需触发（首次跨仓查询时 init——未索引响应自带指引） |
| 大特性 / 重构 / 周期性工作区（**全准备**） | 三层齐上：codegraph 工作区索引 + serena 各仓注册 + .docs 知识层（一次准备长期复用） |
| 纯调研不改代码 | 都不需要——zread 读远端仓库（C35） |

判断口诀：**跨仓吗？持续开发吗？**任一"是"→至少半准备；都是→全准备。

## 三层准备清单（全准备时按序）

1. **图数据层**（codegraph）：容器根 `codegraph init .`（多仓工作区级；非 git 根可用；ignore 内置）。**时效三层检验**：DB 在？（`ls .codegraph/`）→ CLI 在？→ 版本匹配？（`codegraph status`；不匹配则重建，分钟级）
2. **符号服务层**（serena）：每仓 `.serena/project.yml`（`activate_project(<绝对路径>)` 即注册即激活；**注册后必须配 languages 字段**——无语言配置则 LSP 不启动，编辑类操作前必补）。worktree 场景注意项目名可能=分支名
3. **知识文档层**（可选）：`.docs/` 结构化文档（map-not-manual 形态），渐进建设

维护：日常改动后 `codegraph sync .`（增量，秒级；半年漂移实测 19s）。**双机场景：每次 `git pull --no-rebase` / merge 之后必须 sync**（另一台设备的提交不在本机索引里——DB 是本地投影，git 才是真相源）。

Goal Contract 标注目标仓库的格式（onboarding 第 4 步 / SKILL.md Stage 0.5 的具体形态）：

```
Execution Strategy: multi-agent + C36 双图路由
目标仓库:
  - /Users/<user>/Works/FDNote/FDNotepadCore   （主改动）
  - /Users/<user>/Works/FDNote/FDNotepadShared （影响面，impact 确认）
```

## Onboarding 六步（新仓库接入）

```
0. 环境     第 0 层检验（新设备首次必做）
1. 落位     单仓 → 独立目录；多仓协作 → 工作区容器
2. 建图     容器根（或单仓根）codegraph init
3. 注册     activate_project(<仓绝对路径>) + 写 project.yml 的 languages
4. 挂载     任务 spec 标注目标仓库 → Stage 3 走 codegraph / Stage 4 走 serena（C36 路由）
5. （可选） .docs 知识层起步
```

serena 新仓激活时询问 onboarding → FDNote 类已有 .docs wiki 的跳过。

## 四段式路由（C36——Stage 3/4 的代码任务走此协议）

```
探索期              精读期                编辑期              验证期
codegraph      →    serena           →    serena         →    serena 诊断
explore/query       find_symbol           replace_symbol_     + codegraph impact
跨仓定位"改哪里"     (name_path 实读)       body 精确修改        影响面闭环复查
```

**交接契约（铁律）**：codegraph → serena 只传 `qualified_name + file_path`，**绝不传行号**——codegraph 行号是索引时点投影，serena LSP 实时解析，投影态坐标交给实时态工具必然错位。**freshness 裁决权归 serena**（实时态）；codegraph 的定位仅作候选（sync 后两图行号天然对齐，未 sync 窗口内不可信）。

已知坑（一手+研究实证）：serena `find_referencing_symbols` 对 Swift 跨文件/extension 漏报（以实读为准）；`find_symbol` 返回的 body 是规范化展示，不能直接当 replace_content 的 needle（先 `read_file` 实读）；超大 TS 仓 tsserver 可能 OOM（跨文件关系查询交给 codegraph）；切仓后 serena 的 active tool 集会变（先确认所需工具在列）。

## 跨设备 bootstrap 六步（双机迁移场景）

```
1. 拉配置    claude-config → ~/.claude（含 skills 同步——当前缺口，待版本化）
2. 装工具    node 检查 + npm i -g codegraph + serena 插件 + MCP 挂载
3. 拉代码    各仓 git pull --no-rebase（双机 merge 策略）
4. 建图      容器根 codegraph init（或已有 DB 则 sync）——DB 是派生数据，不迁移
5. 激活      serena activate_project（project.yml 已随仓同步则秒级）
6. 冒烟      四段式验证 + 行号对齐检查
```

设计原则：**git 是唯一真相源，DB/cache 全是投影**（能重建的不迁移）；配置版本化优先于手工复刻。

## 与相邻能力的关系

- `gsd-map-codebase`：一次性扫描快照文档（给人读的概览）vs 本协议的持久可查询双图（给 agent 每次查询用）——互补不替代，registry 并存
- `C35 zread`：远端仓库调研（不改代码）vs 本协议的本地仓库开发——按「是否要改代码」分流
