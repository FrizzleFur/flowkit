# auto-skill 的 Codex 兼容适配层

> 适用环境：OpenAI Codex CLI / DeepSeek dsh。**Claude Code 环境忽略本文件**。

## 数据层：平台无关

knowledge-base/ 与 experience/ 的条目读写是纯文件操作，索引（_index.json）合并与关键词召回协议各平台一致。两侧经验已在 2026-09-08 完成并集合并（symlink 统一后单实体，不再分叉）。

## 召回触发机制映射

| Claude Code | Codex | dsh |
|---|---|---|
| SessionStart hook + CLAUDE.md 强制协议（会话启动被动召回） | hooks.json `SessionStart` 事件（可注入 developer context，语义同构）；或在 `~/.codex/AGENTS.md` 写启动指令「新任务先按关键词查 auto-skill 索引」 | hooks-claude-code 桥直接复用 hooks.json |

## dsh 备注

dsh 的 hooks 组直接复用 Claude Code 线协议，本技能的召回/沉淀机制理论上零改动可用（0.1.x 预览，需实测）。
