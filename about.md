# 关于本站

## 这是什么

FlowKit 机制原理教程站——把 flowkit（flow / flow-deep / multi-agent / prompt / auto-skill 技能体系）的每个机制讲清**为什么存在、怎么运转、在源码哪里**。技术形态与 [hello-agents](https://github.com/datawhalechina/hello-agents) 官网同款（docsify 零构建 + 运行时渲染），交互模式参考 [learn-claude-code](https://github.com/shareAI-lab/learn-claude-code) 的剧本回放式模拟器。

## 怎么读

- 全站 11 章: 原理篇 3 章（概念与理论名分）+ 机制篇 8 章（工程操作细节）
- 每章统一结构: 一句话机制 → 30 秒体验 → 怎么用（侧栏）→ 为什么（主体）→ 批判小节 → 源码锚点表
- 五个交互组件贯穿: 剧本回放器 / Auto-Decide 判定游戏 / 管道开关面板 / 429 并发计算器 / 乔哈里象限演示

## SC5 承诺

教程叙述与 skills 源码逐一锚定（全站 ~354 处锚点引用, 见[复核表](anchors.md)）, 写作时实读源文件、交付前抽查对源。**讲的就是代码里发生的**——包括把「文档腐化的活教材」（README 旧图与正源的语义矛盾、并发上限旧值残留）原样呈现，因为它们正是锚点复核纪律存在的理由。

## 来源与致谢

- 概念词汇与教学法: [hello-agents](https://github.com/datawhalechina/hello-agents)（Datawhale《从零开始构建智能体》, 本站借鉴方法论不复制文本）
- 交互形态: [learn-claude-code](https://github.com/shareAI-lab/learn-claude-code)（"Bash is all you need" 17 章课程, simulator 剧本回放模式）
- 机制本体: [FlowKit 仓库](https://github.com/FrizzleFur/flowkit) skills 源码——本站一切事实断言的唯一正源

## 本地预览

```bash
cd site && python3 -m http.server 4000
```

`file://` 协议不支持 docsify（运行时 fetch markdown 会被浏览器拦）, 需任意静态 HTTP 服务。CDN 资源钉版本（docsify 5.0.0）并带 SRI 完整性校验。
