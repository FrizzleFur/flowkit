# 选型指南：flow-deep vs flow vs grill-me

> flow 体系（flow / flow-deep）的入口选择——详细决策依据。flow 和 flow-deep 的 SKILL.md 正文只留速查表，完整内容在本文件。

## 口诀

**小澄清用 grill-me，大工程用 flow-deep，中间用 flow。拿不准就问"做错了多难恢复"——难恢复就 flow-deep。**

## 分流速查

| 场景 | 入口 | 理由 |
|------|------|------|
| 核心系统重构、支付/认证、对外 API、安全敏感 | **flow-deep** | 错一次代价大，要 Goal Contract + Plan Review + 验证闭环 |
| 中等特性（3-5 步、单模块、可回滚） | **flow** | 轻量三步够用，不必全管道 |
| 只想把方案彻底想清楚，产出 design tree | **grill-me** | 只要澄清不要执行 |
| 方向都没定，只有模糊念头 | 自由对话 / brainstorming | grill-me 无主干会把你问爆 |

## 升级 / 降级信号

**升级到 flow-deep**：多模块 / 难恢复 / 对外可见 / 安全敏感 / 需要 Goal Contract + 强制 Plan Review + 多角色面板评审。

**降到 grill-me**：只想理清需求、产出方案，还不想启动执行管道。grill-me 的产出后续可喂给 flow / flow-deep。

**降到自由对话**：方向都没定，先理清想法；有了主干后再进 grill-me。

## 组合用法

- **大工程 + 需求未澄清**：`/grill-me` 拉出 design tree → `/flow-deep --no-prompt` 跳过重复优化
- **大工程 + 需求清晰**：直接 `/flow-deep`，Stage 1.5 主干明确时自动走 Grilling 模式（不必单独跑 grill-me）
- **只想要 PRD**：`/grill-me` → `/to-prd`，不启动管道

## 三种误用

- 用 flow-deep 改错别字 → 杀鸡用牛刀（复杂度闸门会拦）
- 用 grill-me 做完整工程 → 它只澄清，不规划/执行/验证
- 走 flow-deep 又单独跑 grill-me → 重复（Stage 1.5 已内置 Grilling 模式）

## 和 mattpocock 体系（/ask-matt）的关系

`/ask-matt` 路由的是 **mattpocock 轻量体系**（grill-with-docs → to-prd → to-issues → implement），**不认识 flow / flow-deep**。

- 想用 mattpocock 轻量组合 → `/ask-matt`
- 高风险要兜底 → 直接 `/flow-deep`（ask-matt 不覆盖）
- 本指南才是 flow 体系的选型依据

## 术语

- **grill-me** — mattpocock 的 user-invoked 入口 skill（独立调用，无代码库时用）
- **grilling** — mattpocock 的 model-invoked 原语（被入口或 flow-deep 调用）
- **Grilling 模式** — flow-deep Stage 1.5 内的范式（可调用 grilling 原语承载），不等同于 grill-me 入口
