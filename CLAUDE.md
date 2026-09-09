# CLAUDE.md — FlowKit 仓库协作规范

> 供 Claude Code / Codex 等 AI Agent 在本仓库工作时自动加载（Codex 侧入口为 AGENTS.md，指向本文件）。

## 版本演进纪律（Changelog 与 README 同步）

本仓库版本历史为「全量收敛 + 首页滚动」双文件结构：

- `CHANGELOG.md` — 全量版本历史（Keep a Changelog 格式，含 Unreleased 段），中文为权威版本
- `README.md` / `README_EN.md` 日志区 — 仅保留最近 3 个版本全文 + 指向 CHANGELOG 的链接

### 何时更新什么

| 改动类型 | CHANGELOG.md | README 日志区 |
|---|---|---|
| 用户可感知的功能/修复/破坏性变更 | Unreleased 段追加条目 | 不动（等发版） |
| 纯 docs 微改（无行为变化） | Unreleased 段追加（注明 docs） | 不动 |
| 发版（定版本号） | Unreleased → 正式版本段（含日期） | 滚动刷新：始终恰好最新 3 版，被挤出的版本只在 CHANGELOG 保留 |

### 发版自检（2026-09-10 立，两次漏更教训）

发版 commit 前逐项核对，**README 与 README_EN 双文件同步动作，漏一侧即违反纪律**：

1. 两文件日志区是否都插入了新版本段（中文版与 EN 版都要）
2. 两文件是否都挤出了被淘汰的最旧版（保持恰好 3 版：新版进来 → 最旧版删除）
3. 段落衔接检查：新 3 版 + 下一节（社区/Community）之间无残留空段

### 条目写法

- 一条 = 一个用户可理解的演进点（按「对使用者的意义」归并，不按 commit 罗列）
- 格式：`- 新增/修复/移除 **机制名**（所属模块）—— 一句话说明 + why`
- 中文书写，技术术语保持英文；模块名（flow / flow-deep / multi-agent / auto-iterate / auto-skill）加粗

### README 其他纪律

README 只保留「30 秒决定要不要用」的内容（架构总览 / 设计亮点 / 快速上手 / 最近 3 版）。
版本历史细节一律去 CHANGELOG 查，不要往 README 堆。

## Evals 协作纪律（谁改契约谁带测试）

改动若触碰以下任一「合同面」，**同 commit 必须更新对应断言或评测集**（详见 `evals/README.md` 五条防漂移规则）：

- stage 划分 / 五件套协议 / STATE.md schema → 更新 `scripts/lint_flowkit.py` 断言或 `evals/<skill>/` 行为断言
- 触发 description（frontmatter）→ 触发面变更，标注待 T-302 trigger eval 复验
- 新增/移动 references/scripts 文件 → 本地跑 `python3 scripts/lint_flowkit.py` 确认 L5 引用完整性（exit 0 才可提交）

### 引用写法规范（L5 断链防再发，2026-09-09 首跑抓到 2 条真断链后立）

- **技能内引用**：写 `references/xxx.md`（按本技能根解析）
- **跨技能引用**：必须写全路径 `~/.claude/skills/<name>/references/xxx.md`——裸相对路径会被运行时按「本技能根」解析而 404（lint L5 判 error）。两条历史断链均属此形态（skill-routing.md 引 flow 的 cleanup-procedure、stage5-verification 引 flow-deep 的 iron-laws）

跑 eval 后结果留痕（benchmark 报告含环境三元组：flowkit 版本 / CC 版本 / 模型）。

## 提交规范

- 身份：`mike <16328879+FrizzleFur@users.noreply.github.com>`，不加 AI 协作署名
- 格式：`<type>: <中文标题>`（feat / fix / docs / refactor / chore）+ 正文要点列表
- 并发提交：GitHub contents API 遇 409 = 文件已被更新，重取 sha 重试，禁止直接覆盖
