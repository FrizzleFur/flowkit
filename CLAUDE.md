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

### 条目写法

- 一条 = 一个用户可理解的演进点（按「对使用者的意义」归并，不按 commit 罗列）
- 格式：`- 新增/修复/移除 **机制名**（所属模块）—— 一句话说明 + why`
- 中文书写，技术术语保持英文；模块名（flow / flow-deep / multi-agent / auto-iterate / auto-skill）加粗

### README 其他纪律

README 只保留「30 秒决定要不要用」的内容（架构总览 / 设计亮点 / 快速上手 / 最近 3 版）。
版本历史细节一律去 CHANGELOG 查，不要往 README 堆。

## 提交规范

- 身份：`mike <16328879+FrizzleFur@users.noreply.github.com>`，不加 AI 协作署名
- 格式：`<type>: <中文标题>`（feat / fix / docs / refactor / chore）+ 正文要点列表
- 并发提交：GitHub contents API 遇 409 = 文件已被更新，重取 sha 重试，禁止直接覆盖
