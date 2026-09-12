# B-patterns — 原理演示动效形态库

> 子项目: 动效技术形态研究 | 2026-09-12 | 输入: R2-learncc.md + site/assets/interactive/ 5 组件源码 + 2 剧本 JSON
> 回答的问题: **什么样的原理用什么样的动效最合适**。每种形态给匹配判据、零框架实现路径、嵌入协议、成本与降级、learn-claude-code 来源。
> 约束（spec.md）: 原生 JS + SVG + CSS，零框架零构建零新增 CDN; SC5 同源纪律——动画是演示不是改编。

---

## 0. 站内既有资产与公共协议（所有形态的地基）

### 0.1 既有 5 组件盘点（形态库前 5 形态的实装基线）

| 组件 | class | 数据源 | 已验证的形态 |
|---|---|---|---|
| replay.js | `.fs-replay[data-script]` | fetch JSON 剧本 | 剧本回放（P1） |
| autodecide.js | `.fs-autodecide` | 内嵌 CASES | 判定游戏（P6） |
| johari.js | `.fs-johari` | 内嵌 CASES | 判定游戏变体（P6） |
| budget429.js | `.fs-budget` | 内嵌 steppers | 数值计算器（P5） |
| switch-panel.js | `.fs-switch` | 内嵌 DEEP/PARAMS | 参数裁剪面板（P4） |

### 0.2 docsify 嵌入协议（新组件必须一致）

```
章 md 一行容器:   <div class="fs-xxx"></div>          （或 data-script="assets/scripts/xxx.json"）
组件 JS 尾部注册:  FlowSite.fns.push(function initAll(){
                     document.querySelectorAll('.fs-xxx:not([data-ready])')...build(n)
                   });
index.html:       <script src="assets/interactive/xxx.js"></script>
                 + 自愈轮询选择器串追加 .fs-xxx:not([data-ready])
CSS:              assets/interactive/components.css 追加一节（class 前缀 fs-xx-）
```

三保险机制已在 index.html 落地: `hook.doneEach` → `FlowSite.initAll()` + hashchange 兜底 + 800ms 自愈轮询。**新组件只要注册 fns 并在轮询选择器串里加自己的 class，即自动获得全部时序免疫**。

### 0.3 代码约定（从既有组件提取）

- `el(tag, cls, text)` 三参 helper 建 DOM; 全部 `textContent` 赋值，**零 innerHTML 拼接用户数据**（XSS 纪律，剧本内容含尖括号也安全）
- `data-ready="1"` 防重入; try/catch 包住每个 fns 单组件失败不拖累
- 动画只用 `transform` / `opacity` / `stroke-dashoffset` 三类合成器友好属性（例外: 进度条 width——低频更新可接受）
- `prefers-reduced-motion` 全站媒体查询统一降级（见 0.5）

### 0.4 性能通则

- 同屏并发动画数 ≤3 组; 每组内动画元素 ≤10
- 长序列（剧本回放 >12 步）容器 max-height + overflow-y（replay.css 已有 max-h 先例），避免页面被单组件撑穿
- rAF 循环必须有终止条件（pct>=1 或 !playing）; setInterval 句柄可 clearTimeout

### 0.5 移动端通则

- 按钮/选项最小触区 34×34px（.fs-btn 既有尺寸已达标）
- 双栏/三栏布局 768px 断点折成单栏纵向
- `@media (prefers-reduced-motion: reduce)` 下: 打字机直出全文、描线直接到位、autoPlay 禁用、只保留手动单步

---

## P1. 剧本回放（Script Replay）——升级方向: 流式逐出 + 步骤指示器

### 适用原理类型（匹配判据）

**时序性多角色过程**——机制的实质是"一串事件按顺序发生，每步有旁白教学价值"。判据: ①能写成 5 角色（user/assistant/tool_call/tool_result/system）消息流 ②aha 时刻在"下一步发生什么"而非"整体长什么样" ③步与步之间有因果衔接。
flowkit 命中: ch4 十二关流转、ch8 Auto Handoff 链路、ch9 验证-迭代循环、ch11 编排分发、ch3 记忆召回闭环——**几乎每章都有一条"典型流转"可剧本化**（站点已有 2 部验证）。

### 原生实现要点（升级项，基座已有）

已有: setTimeout 步进 + 五色消息块 + annotation + 0.5-4x 调速（replay.js 107 行）。两个升级:

**a) 流式字符逐出（模拟 LLM 输出感）**——rAF 打字机，速度与剧本 speed 联动:

```js
function typeInto(stage, pre, text, done, speed) {
  var i = 0, chunk = Math.max(1, Math.ceil(text.length / (30 / speed)));
  (function frame() {
    pre.textContent = text.slice(0, i += chunk);
    stage.scrollTop = stage.scrollHeight;
    (i < text.length) ? requestAnimationFrame(frame) : done();
  })();
}
// renderStep 改造: 先建空 pre → typeInto 完成后再 append annotation、启动下一步计时
```

**b) 步骤指示器圆点（i/N 可点击跳转）**:

```js
steps.forEach(function(_, k) {
  var dot = el('span', 'fs-rp-dot' + (k === idx ? ' on' : ''));
  dot.onclick = function () { stop(); idx = k; rebuild(stage, script, idx); };
  dotsEl.appendChild(dot);
});
// rebuild: 清空 stage → for 0..idx 逐条直出（跳转时不过打字机，等价 useSimulator 的 slice 追加式）
```

### docsify 嵌入模式

与现有一致: `<div class="fs-replay" data-script="assets/scripts/chN-xxx.json"></div>`; 剧本 JSON 放 `assets/scripts/`，steps 数组每条 `{role, content, annotation}`（annotation 是教学旁白，learncc 实测最有价值的手法之一）。

### 成本与降级

- 升级 a+b: **1.5-2h**（改 replay.js 单文件 + replay.css 十几行）; 新剧本每部 1-1.5h（写作占比 90%）
- 降级: reduce-motion → 打字机直出; 移动端天然可用（纵向流 + 触屏按钮）
- 性能: 单屏同时只 1 条消息在打字; rAF 有终止; dot 数 = 步数 ≤20

### learn-claude-code 对应参考

**TOP1 直接来源**: simulator 全家桶——`useSimulator.ts`（~90 行状态机: currentIndex + isPlaying + speed × setTimeout(1200/speed)）、`simulator-message.tsx`（五类色块 + framer-motion 淡入上移 + 容器自动滚底）、`s01~s17.json` 剧本（每章 8-20 步）。本站 replay.js 即其原生 JS 化，R2 判定"docsify 可低成本复刻"已兑现。

---

## P2. 状态机步进（Stepper Panels）——双面板联动

### 适用原理类型（匹配判据）

**结构 + 过程双 teaching**——机制既有静态结构（流程图/管道/分层），又有动态过程（控制流怎么走）。判据: ①原理能画成 ≤10 节点的图 ②"走到哪一步、激活哪块"本身就是知识点 ③需要"当前步解释卡"。
flowkit 命中: ch1 管道形态总览（flow vs flow-deep 走哪条路）、ch4 十二关的 Stage 推进、ch11 三级编排（flow→flow-deep→multi-agent）路由判定、ch9 验证回环（失败→定位→最小修复→复验的回边）。

### 原生实现要点

步进引擎（~70 行，可独立成 `stepper-engine.js` 供多组件复用）:

```js
function makeStepper(svg, data, noteEl, dotsEl) {   // data.steps[i] = {nodes:[], edges:[], note, panel?}
  var i = -1, timer = null;
  function apply() {
    var s = data.steps[i];
    svg.querySelectorAll('.on').forEach(function (n) { n.classList.remove('on'); });
    (s.nodes || []).forEach(function (id) { var n = svg.querySelector('#' + id); if (n) n.classList.add('on'); });
    (s.edges || []).forEach(function (id) { var n = svg.querySelector('#' + id); if (n) n.classList.add('on'); });
    noteEl.textContent = s.note || ''; renderDots(dotsEl, i, data.steps.length);
    if (s.panel) panelEl.innerHTML = s.panel;  // 右侧消息面板内容（同源静态串，非用户输入）
  }
  return {
    next: function () { if (i < data.steps.length - 1) { i++; apply(); } },
    prev: function () { if (i > -1) { i--; apply(); } },
    reset: function () { i = -1; apply(); },
    auto: function (on) { clearInterval(timer); if (on) timer = setInterval(this.next, 2000); }
  };
}
```

CSS 状态类（transition 放在基类，切类即补间）:

```css
.st-node { fill: #fff; stroke: #9aa4b2; transition: all .35s ease; }
.st-node.on { fill: #e8f1fb; stroke: #0f62be; stroke-width: 2.5; }
.st-node.on + .st-label { fill: #0f62be; font-weight: 600; }
```

### docsify 嵌入模式

`<div class="fs-stepper" data-script="assets/scripts/chN-steps.json"></div>`; 组件 fetch 步骤数据 + 内嵌一份通用 SVG 骨架（或 data-svg 指向 `assets/svg/chN.svg` fetch 注入）。SVG 底图推荐**手工内联 SVG**（节点带 id，R2 判定 mermaid 自动图难挂 id——mermaid 输出的节点 id 是随机串; 手工 10 节点图每张 30-60 分钟）。

### 成本与降级

- 引擎一次: **2h**; 每个机制: 手绘 SVG 0.5-1h + 步骤数据 JSON 0.5-1h → 单机制 **1-2h**
- 降级路径（R2 结论沿用）: 无 SVG 时"静态 mermaid 截图 + 右侧注释卡步进"已拿 80% 教学效果; 移动端图缩放 transform scale 或折为纵向节点列表
- 性能: 切步只改 class（合成器属性），10 节点全量重绘可忽略

### learn-claude-code 对应参考

**TOP2 来源**: Hero 步进可视化——`useSteppedVisualization.ts`（~80 行: currentStep + next/prev/reset/goToStep + setInterval 2000ms autoPlay 到末步自停）+ `shared/step-controls.tsx`（圆点指示器 + i/N）+ 每章组件（如 `s01-agent-loop.tsx`: 左 SVG 右 messages 双面板，`ACTIVE_NODES_PER_STEP`/`ACTIVE_EDGES_PER_STEP`/`STEP_INFO` 四数组数据驱动）。R2 判定其降级版为"docsify 可复刻 TOP2"。

---

## P3. SVG 流程图描线联动（Flow Highlight）——P2 的进阶子形态

### 适用原理类型（匹配判据）

**"路径本身就是知识点"的图**——重点不是节点而是连线: 循环回边、分流判定、跨层调用。判据: ①学员的 aha 在"哦，原来这条线绕回去了/分叉了" ②有 1-2 条关键边值得强调。
flowkit 命中: ch1 Agent Loop 的 while-True 回边（loop 是 flowkit 第一心智模型）、ch9 验证失败的回退边、ch11 编排路由的分流边（gate 判定走哪条）、ch2 三轴的交叉触发。

### 原生实现要点

**a) 路径生长（一次性描线）**——stroke-dasharray 补间，"线被画出来":

```js
function drawPath(p, dur) {
  var len = p.getTotalLength();
  p.style.transition = 'none';
  p.style.strokeDasharray = len; p.style.strokeDashoffset = len;
  p.getBoundingClientRect();                    // 强制 reflow，确保过渡生效
  p.style.transition = 'stroke-dashoffset ' + (dur || 800) + 'ms ease';
  p.style.strokeDashoffset = 0;
}
```

**b) 描边流动（持续虚线动画，标记"活跃通道"）**——纯 CSS:

```css
.flow-edge { stroke-dasharray: 6 4; }
.flow-edge.on { animation: edgeflow 0.9s linear infinite; stroke: #0f62be; }
@keyframes edgeflow { to { stroke-dashoffset: -10; } }   /* 负向=沿绘制方向流动 */
```

**c) marker 箭头随线走**（可选高配）: 一个 `<circle>` + rAF 沿 `path.getPointAtLength(t*len)` 采样移动——只给最关键的 1 条回边用。

### docsify 嵌入模式

依附 P2 容器（`fs-stepper` 的 edges 字段触发 b; 入场时序触发 a），或独立形态: `<div class="fs-flowdraw" data-svg="assets/svg/loop.svg"></div>` + IntersectionObserver 进视口才开始描线:

```js
var io = new IntersectionObserver(function (es) {
  es.forEach(function (e) {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    root.querySelectorAll('path[data-draw]').forEach(function (p, k) {
      setTimeout(function () { drawPath(p, 800); }, k * 350);   // 逐条错峰
    });
  });
}, { threshold: 0.3 });
```

### 成本与降级

- 独立入场描线组件: **1.5h**; 作为 P2 联动增强: +0.5h
- 降级: reduce-motion → 直接显示全图（dashoffset=0 无过渡）; 无 JS 环境 → SVG 静态完整呈现（渐进增强，图本来就是全的）
- 性能: b 形态每条活跃边 1 个动画; 同屏活跃边 ≤4（多了视觉噪音，也省合成层）

### learn-claude-code 对应参考

`mechanism-flow.tsx` 泛化图（边路径自动计算: 正交/贝塞尔 + `ACTIVE_EDGES_PER_STEP` 步进高亮）与 `s01-agent-loop.tsx` 的回边强调。R2 判定其"appearsAt 自动布局"版**不适合** docsify（React 手工几何），本形态是"保留描边动效、放弃自动布局"的裁剪复刻。

---

## P4. 参数裁剪面板（Switch Panel）

### 适用原理类型（匹配判据）

**配置 → 行为映射**——机制的表面积是一组开关/参数，实质是"同一系统按参数变形"。判据: ①有 ≥4 个可独立开关的选项 ②组合效果 = 简单可预测的集合运算（裁剪/叠加/路由） ③"等价命令行"值得直出。
flowkit 命中: ch1 flow vs flow-deep 参数体系（已实装 fs-switch）、ch8 交接参数（--handoff-max/threshold）、ch7 并发档位选择、ch11 编排模式选择（--iterate/--quick/--think）。

### 原生实现要点（已有基线，变体方向）

基线 switch-panel.js 86 行: checkbox → DEEP.filter 裁剪 → chips 重排 + 等价命令行。变体扩展点:

```js
// 变体: 单选路由（radio 替代 checkbox）——编排模式三选一等价命令
ctrl.addEventListener('change', function () {
  var picked = ctrl.querySelector('input[type=radio]:checked');
  var branch = ROUTES[picked.value];          // { stages:[...], note:'...' }
  render(branch.stages);                      // 复用 chips 渲染
  noteEl.textContent = branch.note;           // 路由说明随选择切换
});
// chips 增加出场动画: 新 pipe 每次 render 后逐个加 .in 类（CSS transition-delay 错峰）
active.forEach(function (c, k) { setTimeout(function () { c.classList.add('in'); }, k * 40); });
```

```css
.fs-sw-chip { opacity: 0; transform: translateY(4px); transition: all .25s ease; }
.fs-sw-chip.in { opacity: 1; transform: none; }
```

### docsify 嵌入模式

`<div class="fs-switch"></div>` 或变体 class（如 `fs-route`）; 数据内嵌（参数表是教学化转述，量小且稳定，无需独立 JSON——与 autodecide 同判）。

### 成本与降级

- 新变体: **1.5-2.5h/个**（含数据整理）; 纯静态无动画版 0.5h
- 降级: 天然无动画依赖（核心是布尔逻辑渲染）; 移动端 chips flex-wrap 已验证
- 性能: 无持续动画; 注意每次 change 全量重建 chips（≤12 个元素，可忽略）

### learn-claude-code 对应参考

**learncc 无此形态**（其参数面是 Compare 页的双版本对比，非配置交互）。本站首创，源自 flow-deep SKILL.md「参数速查」的教学化。远亲参考: Compare 页的前端集合运算思路（onlyA/onlyB → 我们的 cut 集合）。

---

## P5. 数值预算计算器（Budget Calculator）

### 适用原理类型（匹配判据）

**数值化约束/阈值机制**——机制实质是一道算式或一条阈值线，aha 在"亲手把数字推过临界点"。判据: ①有 2-4 个可调输入量 ②有明确判定函数（安全/临界/越界）③数字变化即时反馈。
flowkit 命中: ch7 并发预算（已实装 fs-budget: 1+subs+others ≤3）、ch8 context 阈值（70%/75% 弹交接）、ch10 记忆配额、ch5 plan-quality 自检分、ch9 迭代次数上限。

### 原生实现要点（基线已有，增强方向）

基线 budget429.js 73 行: stepper ±按钮 + judge() 三色判定。增强: **输入量视觉化**——stepper 数字下面加"占用块"条，让数量有面积感:

```js
function renderSlots(total, cap) {            // cap=3 安全线
  slotsEl.textContent = '';
  for (var k = 0; k < Math.max(total, cap); k++) {
    var s = el('span', 'fs-bd-slot' + (k < total ? ' used' : '') + (k === cap ? ' line' : ''));
    slotsEl.appendChild(s);                   // used=实心块, line=临界刻度线
  }
}
```

```css
.fs-bd-slot { display:inline-block; width:26px; height:14px; border-radius:3px;
  background:#fff; border:1px solid #dfe3ea; transition: all .25s; }
.fs-bd-slot.used { background:#0f62be; border-color:#0f62be; }
.fs-bd-slot.used.over { background:#da1e28; border-color:#da1e28; }  /* 超线块变红 */
```

### docsify 嵌入模式

`<div class="fs-budget"></div>`（或变体 class）; 数据内嵌。若做"阈值剧情版"（引导用户必须推到越界才能继续），与 P6 判定游戏杂交，容器加 `data-mode="forced"`。

### 成本与降级

- 新计算器: **2-3h/个**（含判定文案打磨）; 增强版 slots +1h
- 降级: 核心是即时算式，无动画依赖; 移动端 stepper 触区已达标
- 性能: 零持续动画

### learn-claude-code 对应参考

learncc 无交互计算器。远亲: Timeline 页卡片 LOC 进度条（`loc/MAX_LOC` width%——数值→条形的同源思路，R2 §3.5）。本站首创形态。

---

## P6. 判定游戏（Decision Quiz）——规则链直觉训练

### 适用原理类型（匹配判据）

**顺序规则链 / 分类直觉**——机制是一组判定规则（P1→P6 顺序命中即停 / 四象限 / gate 三态），教学目标是让学员建立"拿到案例秒判"的直觉。判据: ①规则可枚举 ≤8 条 ②每个案例有唯一正解 + 可解释 why ③判错的代价（教学价值）在于误走分支。
flowkit 命中: ch6 Auto-Decide P1-P6（已实装 fs-autodecide）、ch5 乔哈里象限（已实装 fs-johari）、ch11 Fit Gate（Workflow vs multi-agent）、ch4 Complexity Gate（复杂/简单分流）、ch9 keep/revert 判定、ch8 弹窗四选项（a/b/c/d 路由）。

### 原生实现要点（基线已有两实例，扩展点）

autodecide 106 行 / johari 72 行已验证模式: CASES 数组 + 选项按钮 + 右/错着色 + why 反馈。扩展点:

**a) 顺序判定可视化**——P1-P6 是"链"，答完一题把命中的原则点亮在链条上，最终拼出完整判定链:

```js
// 顶部常驻原则链 P1..P6 圆点; judge() 命中时点亮
chainEl.querySelectorAll('.fs-q-chain-dot')[caseIndex].classList.add('hit');
// 答满后整链呼吸一次，强化"顺序命中即停"记忆
```

**b) 判定路径回放**——答错时不只给 why，用 P3 的描线在迷你决策树上画出"你走的路 vs 正确的路"（红/蓝双线）。仅高价值题启用。

### docsify 嵌入模式

`<div class="fs-autodecide"></div>` 等; CASES 内嵌。题库超过 ~10 题时拆 `assets/scripts/chN-quiz.json` + data-script fetch（复用 replay 的加载协议）。

### 成本与降级

- 新题集（复用组件骨架）: **1.5-2h**（写题与 why 占 80%）; 扩展 a: +1h; b: +2h 且需迷你 SVG
- 降级: 无动画依赖，核心交互是按钮 + 文本; 移动端天然友好
- 性能: 零持续动画

### learn-claude-code 对应参考

learncc 无 quiz 形态（其教学交互全部内嵌在 simulator 的 annotation 旁白里）。本站首创，但手法上借鉴其"每步 annotation 斜体注释——动画本身在旁白"的呈现哲学（R2 §5 值得借鉴手法第 3 条）。

---

## P7. 容量仪表与渐进恶化（Gauge / Progressive Fill）

### 适用原理类型（匹配判据）

**单调演化量 + 阈值剧情**——机制核心是某个量随时间/操作只增不减（或缓慢衰减），aha 在"越过阈值那一刻世界变了"。判据: ①有 1 个主变量（百分比/容量/得分）②有 ≥2 条阈值线触发不同状态 ③"亲手喂大它"有代入感。
flowkit 命中: ch8 context 占用（60% 三轴预警 / 70% 交接 / 75% 免弹窗 / auto-compact 对比——**全站最适配此形态的机制**）、ch2 上下文三轴恶化、ch10 记忆库膨胀与召回衰减、ch11 技术债累积。

### 原生实现要点

**a) SVG 圆环仪表**（stroke-dashoffset 补间，比 div 条形更有"仪表盘"感）:

```js
function setRing(circle, pct) {
  var c = 2 * Math.PI * circle.getAttribute('r');      // 周长
  circle.style.strokeDasharray = c;
  circle.style.strokeDashoffset = c * (1 - Math.min(pct, 1));   // CSS transition 接管补间
}
```

```css
.gauge-arc { fill: none; stroke: #0f62be; stroke-width: 10;
  transform: rotate(-90deg); transform-origin: center;
  transition: stroke-dashoffset .6s ease, stroke .3s; }
.gauge-arc.warn  { stroke: #ff832b; }   /* ≥60% */
.gauge-arc.crit  { stroke: #da1e28; }   /* ≥70% */
```

**b) "再发一轮消息"驱动增长**——按钮 + 递增模型（模拟 token 累积）:

```js
var pct = 0.32;
addBtn.onclick = function () {
  pct = Math.min(0.98, pct + 0.09 + Math.random() * 0.04);   // 每轮随机开销
  setRing(arc, pct); numEl.textContent = Math.round(pct * 100) + '%';
  stage.className = 'fs-gauge ' + (pct >= .7 ? 'crit' : pct >= .6 ? 'warn' : '');
  if (pct >= .7) popPanel();   // 触发"交接弹窗"——与 ch8 剧本联动
};
```

**c) 剧情钩子**: 越阈值时弹出的选项面板复用 ch8 剧本注释（"d) 交接并记住自动"），仪表是入口、剧本回放是深读——两形态互链。

### docsify 嵌入模式

`<div class="fs-gauge" data-mech="context"></div>`; 阈值常量与文案内嵌（同源: 数值取 skills 源注释，SC5 标注来源行号）。

### 成本与降级

- 单仪表组件: **2.5-3.5h**（含阈值状态机与文案）; 剧情钩子联动 +1h
- 降级: reduce-motion → 跳变即达（transition none）; 移动端圆环 + 按钮纵向排布，天然可用
- 性能: 单元素 transition，零 rAF; 每次 click 一次重绘

### learn-claude-code 对应参考

learncc 无仪表形态。远亲: 首页 Message Growth 可视化（`MessageFlow`——消息量增长的空间隐喻，R2 §5）与 s08 Context Compact 章（压缩四步的教学诉求）。本站为承载 ch8 机制的自创形态。

---

## P8. 对比分屏（Before/After Split）

### 适用原理类型（匹配判据）

**机制的有无/强弱 A-B 对照**——教学论点是"有它和没它，命运分岔"。判据: ①同一初始情境可推演两种平行时间线 ②差异随步骤拉大（不是一步定胜负）③有可比的并排结构（消息流/清单/账单）。
flowkit 命中: ch6 有无 3.5 独立审查（沉没成本偏差有无）、ch8 交接 vs auto-compact（换窗 vs 被压缩）、ch5 有无 Goal Contract（口径分歧早发现 vs Stage 5 返工）、ch9 有无 verify/guard 的 auto-iterate、ch10 有无召回的重复踩坑。

### 原生实现要点

**单驱动双轨**——一个步进引擎同时喂两条轨道（P2 引擎的复用），同步指针 + 差异高亮:

```js
// data.steps[i] = { a: {panel, note}, b: {panel, note}, diffNote }
function apply() {
  var s = data.steps[i];
  aStage.textContent = ''; bStage.textContent = '';
  s.a.events.forEach(function (ev) { aStage.appendChild(msgBlock(ev)); });   // 复用 replay 的色块
  s.b.events.forEach(function (ev) { bStage.appendChild(msgBlock(ev)); });
  if (s.diverge) aStage.lastChild.classList.add('fs-cmp-diff'),              // 分岔步标红
                 bStage.lastChild.classList.add('fs-cmp-diff');
  noteEl.textContent = s.diffNote || '';
}
// 控件: 单组 prev/next/auto（不是两轨各一套）——同步是本形态的魂
```

```css
.fs-cmp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 768px) { .fs-cmp-grid { grid-template-columns: 1fr; } }
.fs-cmp-side.b { border-color: #9aa4b2; }         /* b 轨默认灰=没有该机制 */
.fs-cmp-side.b.on { border-color: #198038; }      /* 对照组激活后转绿 */
@keyframes shake { 25%{transform:translateX(-2px)} 75%{transform:translateX(2px)} }
.fs-cmp-diff { animation: shake .3s ease 2; border-color: #da1e28; }   /* 分岔步红闪 */
```

### docsify 嵌入模式

`<div class="fs-compare" data-script="assets/scripts/chN-ab.json"></div>`; 剧本含双轨 events——**可直接由 fs-replay 剧本改写**（同 schema 的 steps 复制一份改 b 线走向），写作成本低于全新剧本。

### 成本与降级

- 组件: **3-4h**（含与 replay 色块/引擎的复用抽取）; 每对剧本 1.5-2h
- 降级: 移动端折单栏后，改为"a 轨步进播完自动切 b 轨"（串行对照）; reduce-motion 去掉 shake 红闪改静态红框
- 性能: 双容器每次全量重建，事件块 ≤8/轨，可忽略

### learn-claude-code 对应参考

Compare 页（双 `<select>` 选版本 → onlyA/onlyB + CodeDiff 并排，R2 §3.5）。本形态把"静态对比"升级为"同步推演对比"——learncc 无此动态版，属借鉴其布局思想的自创形态。

---

## P9. 泳道并发竞演（Lane Race）

### 适用原理类型（匹配判据）

**并行/竞态/资源争用**——机制的实质是"多条线同时跑 + 共享资源上的交互"。判据: ①≥2 个并行执行体 ②有共享瓶颈（预算/窗口/队列）③时间对齐关系（谁先谁后、谁被卡住）是知识点本身。
flowkit 命中: ch7 Stage 4 并发分发（auth-core + session-mgr 双 lane + 主会话恒占 1 路）、ch7 429 限流时序（第 4 路被拒）、ch11 多 agent 团队认领任务、ch8 并行多会话 check_context。

### 原生实现要点

**a) 泳道 + 时间轴推进**——CSS transform 补间 + setInterval 采样时钟:

```js
var t = 0, TICK = 120;                                  // 模拟时钟每 tick 100ms
timer = setInterval(function () {
  t++;
  agents.forEach(function (a) {                          // agents = [{el, lane, speed, born}]
    if (a.blocked) return;
    a.x += a.speed;
    a.el.style.transform = 'translate(' + a.x + 'px,' + (a.lane * LANE_H) + 'px)';
    if (budgetExceeded()) { a.blocked = 1; flash429(a.el); }   // 越预算: 该 agent 冻结+红闪
  });
  if (t > MAX_TICK) clearInterval(timer);
}, 100);
```

**b) 预算轨道联动**——顶部常驻"占用槽"（P5 的 slots 渲染），agent born/exit 时增减，第 4 个 spawn 动作触发 429 红条:

```js
function flash429(el) {
  el.classList.add('fs-lane-429');
  log.appendChild(el('div', 'fs-lane-log429', 'HTTP 429 — 第 ' + (++rejected) + ' 路被限流冻结'));
}
```

```css
.fs-lane-dot { transition: transform .1s linear; }     /* 时钟粒度补间 */
@keyframes freeze { 50% { opacity: .3; } }
.fs-lane-429 { animation: freeze 1s ease 3; fill: #da1e28; }
```

**c) 分屏彩蛋**: IN_TMUX 时 lane 用等比色块模拟 tmux pane 分割线（教学梗即彩蛋，一行 border-left 搞定）。

### docsify 嵌入模式

`<div class="fs-lanes" data-script="assets/scripts/ch7-race.json"></div>`; 剧本声明 agents（lane/speed/事件点）与预算常量。控制: 播放/重置/「+1 agent」按钮（亲手触发 429 是本形态的 aha 按钮）。

### 成本与降级

- 组件: **4-5h**（全形态库最贵——时钟循环 + 冲突判定 + 日志）; 简化版（预定剧本、无交互 spawn）2.5h
- 降级: 移动端 lane 高压缩 + 横向滚动; reduce-motion → 轨道直接显示终态 + 事件清单列表（"t=3 时第 4 路被拒"）
- 性能: 唯一持续 rAF/interval 形态——**离开视口必须暂停**: IntersectionObserver 不相交时 clearInterval，回视口续播（这是本形态的性能红线）

### learn-claude-code 对应参考

learncc 无泳道形态。思想远亲: s11 Background Tasks 章（后台线程 + 后续收集的教学诉求）与官网 s01 hero 的循环节点亮起节奏（R2 §5）。本站为 ch7 自创形态——**它是 P5 计算器的时序化: budget 回答"能开几路"，lane race 回答"开多了会发生什么"**。

---

## P10. 时间线演化（Timeline Evolution）——决策变迁史

### 适用原理类型（匹配判据）

**机制的演进史/决策修订链**——教学论点是"这个规则不是天上掉下来的，是被事故逼出来的"。判据: ①有 ≥4 个时间点（版本/日期/事件）②每个节点有"当时的认知 vs 触发事件 vs 修订后规则"三元组 ③纵向单列可读。
flowkit 命中: ch7 并发上限 2→3 演进（budget429 已内置此注释）、ch8 设计宪法第 4 条修订（只询问→可自动）、ch4 Plan Mode 反转默认、ch11 技能路由从静态到 auto-skill 的演进、ch10 记忆系统三代迭代。prop md / anchors 也可用此形态做"改进提案路线图"。

### 原生实现要点

静态结构 + IO 滚动入场（无持续动画，learncc Timeline 的原生等价）:

```js
var io = new IntersectionObserver(function (es) {
  es.forEach(function (e) {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, { threshold: 0.2 });
root.querySelectorAll('.fs-tl-item').forEach(function (n) { io.observe(n); });
```

```css
.fs-tl { position: relative; padding-left: 22px; }
.fs-tl::before { content:''; position:absolute; left:7px; top:4px; bottom:4px;
  width:2px; background:#dfe3ea; }
.fs-tl-item { position: relative; margin-bottom: 14px; opacity: 0;
  transform: translateX(-8px); transition: all .45s ease; }
.fs-tl-item.in { opacity: 1; transform: none; }
.fs-tl-item::before { content:''; position:absolute; left:-19px; top:4px;
  width:12px; height:12px; border-radius:50%; background:#0f62be; border:2px solid #fff; }
.fs-tl-item.revert::before { background:#da1e28; }     /* 事故节点红 */
```

节点数据结构（内嵌数组即可）: `{date:'2026-08-28', title:'宪法第 4 条修订', event:'用户裁定', from:'只询问', to:'可显式 opt-in 自动', quote:'来源: 会话决议'}`——**from→to 是本形态的核心字段**（与 P4 的参数变化、P8 的对照共用"箭头语义"）。

### docsify 嵌入模式

`<div class="fs-timeline" data-src="assets/scripts/chN-timeline.json"></div>` 或内嵌。规模小时直接在 md 里手写 HTML 列表 + 仅 CSS（零 JS 降级档: IO 入场去掉就是纯静态）。

### 成本与降级

- 组件: **1.5-2h**（最便宜的"入场动画级"形态）; 每条时间线数据 0.5-1h（考据 from/to 与来源是主要成本——SC5 同源要求）
- 降级: 纯 CSS 已成立; reduce-motion 去 transition; 移动端天然单列
- 性能: IO 一次性触发后 unobserve，零残留

### learn-claude-code 对应参考

Timeline 页（垂直时间线: layer 配色圆点内嵌章号 + 竖向连线 + LOC 进度条 + framer-motion whileInView 入场，R2 §3.5）。原生化的正是 whileInView → IntersectionObserver 这一层; layer 五色语义色系统也值得在本站"机制分类徽章"上复用。

---

## 11. 匹配速查表（原理特征 → 推荐形态）

| 原理的特征问句 | 命中判据 | 首选形态 | 次选 |
|---|---|---|---|
| "把一次典型运行讲成故事会怎样?" | 多角色时序 + 每步旁白价值 | P1 剧本回放 | P8 对比分屏 |
| "控制流走到哪、激活哪块是知识点?" | 静态结构 + 动态过程 | P2 状态机步进 | P3 描线联动 |
| "这条连线/回边本身是 aha?" | 循环/分流的边 | P3 描线联动 | P2 |
| "一组开关把系统变成什么样?" | 参数→行为集合运算 | P4 参数面板 | P2 |
| "数字推过临界点会发生什么?" | 数值阈值 + 判定函数 | P5 计算器 | P7 仪表 |
| "学员该练出秒判直觉吗?" | 规则链/分类 + 可枚举 | P6 判定游戏 | P5 |
| "量只增不减、越线世界就变?" | 单调量 + 阈值剧情 | P7 渐进恶化 | P5 |
| "有无这个机制命运分岔?" | 平行时间线对照 | P8 对比分屏 | P1×2 |
| "多线同跑 + 争资源?" | 并行/竞态/预算 | P9 泳道竞演 | P5 |
| "规则是被什么事故逼出来的?" | 演进史/修订链 | P10 时间线 | — |

## 12. 形态间共享基础设施（综合方案时抽取建议)

- **步进引擎**（P2/P8/P9 共用）: next/prev/reset/auto + 圆点指示——抽 `stepper-engine.js`
- **消息色块**（P1/P8 共用）: 五角色色块渲染——从 replay.js 抽 `msgBlock()`
- **剧本 fetch 协议**（P1/P2/P8/P9/P10 共用）: `data-script` + catch 报 file:// 提示——抽 `loadScript()`
- **IO 可见性**（P3/P10 入场、P9 暂停）: 统一 `watchVisible(el, onIn, onOut)`
- **slots 占用块**（P5/P9 共用）: `renderSlots(total, cap)`

抽取顺序建议: 先在新组件里复制粘贴验证 2 次，第 3 次出现时再抽公共文件（避免过早抽象）。

## 13. 对 flowkit 最百搭的前三形态（结论）

1. **P1 剧本回放**——引擎已实装且验证 2 章; flowkit 机制的普遍本质是"流转叙事"（管道/交接/验证/分发都是一串事件），几乎每章可产一部剧本; 升级（流式+圆点）成本仅 2h。
2. **P2 状态机步进**——"管道"是 flowkit 的第一心智模型，步进双面板（图 + 注释卡）直接复刻 learncc 验证过的 hero 教学; 引擎 2h 一次投入，后续每机制 1-2h。
3. **P6 判定游戏**——flowkit 治理层到处是"顺序规则链"（P1-P6/Fit Gate/Complexity Gate/象限），已有 2 实例验证复用性; 新规则链题集 1.5-2h/个，性价比最高。

共性: 三者皆为"容器 + 数据"解耦（剧本/步骤/题集都是数据），一次引擎多次复用——这是对"12-18 原理点"规模的最优摊薄策略。
