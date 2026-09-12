# FlowKit 机制原理教程站

<blockquote class="fs-callout">
<p><strong>讲的就是代码里发生的</strong> —— FlowKit 把「感觉驱动的编码」变成可重复的工程流程，本站讲清它的每个机制<strong>为什么存在、怎么运转、在源码哪里</strong>。</p>
<p>docsify 零构建 · SC5 源码锚定 · 11 章 · 原理篇 3 + 机制篇 8</p>
</blockquote>

## 30 秒导览

<div class="fs-grid3">
<a class="fs-grid3-card" href="#/mechanisms/ch4-pipeline-overview"><strong>学会用</strong><span>直接进机制篇第 4 章管道全景，每章开头有「怎么用」侧栏</span></a>
<a class="fs-grid3-card" href="#/principles/ch1-agent-loop-and-pipeline"><strong>懂原理</strong><span>从原理篇第 1 章顺序读，flowkit 机制是贯穿全书的活例子</span></a>
<div class="fs-grid3-card"><strong>查答案</strong><span>左侧搜索（支持中文），例如搜「429」「上下文交接」「Goal Verification」</span></div>
</div>

## 两类读者，一条主干

每章结构统一: **一句话机制 → 30 秒体验（可交互）→ 怎么用（侧栏）→ 为什么（主体）→ 批判小节（局限与成本）→ 源码锚点表**。使用者读侧栏即可上手，学习者读主体理解原理——不分篇，避免两份维护。

## SC5 纪律（本站的承诺）

教程里的每条机制叙述都锚定到 flowkit skills 源文件（`skills/xxx/SKILL.md` 节/行），写作时实读源文件、终验抽查对源——**讲的就是代码里发生的**。全站锚点索引见[复核表](anchors.md)。

## 本地预览

```bash
cd site && python3 -m http.server 4000
# 浏览器打开 http://localhost:4000
```

docsify 为运行时渲染（与参考站 hello-agents.datawhale.cc 同款技术），`file://` 直开不支持——需上述任意静态服务。CDN 资源已钉版本并带 SRI 完整性校验。

## 来源与致谢

- 概念词汇参考 [hello-agents](https://github.com/datawhalechina/hello-agents)（Datawhale《从零开始构建智能体》）
- 交互形态参考 [learn-claude-code](https://github.com/shareAI-lab/learn-claude-code)（剧本回放式模拟器）
- 机制本体即 [FlowKit 仓库](https://github.com/FrizzleFur/flowkit) 的 skills 源码
