# HANDOFF — flowkit 教程站 · 上线收尾交接（2026-09-14）

> 前置会话: redesign 全周期（研究→提案→波1-5→亮色转换→quiz→泳道→ch12→双 Pages 上线）
> 本文件目标: 下一会话直接修两个线上问题 + 接手剩余队列。上下文 88.8% 触发 Context Guard 交接。

## 一分钟现状

教程站已全量交付并推送: flowkit main 至 `d161a88`、BlogBackUp master 至 `1d4149ba`、博客已部署 `d62a5c4`（hexo clean+g+d 全链）、flowkit 仓 Pages（frizzlefur.github.io/flowkit）正常。**剩两个线上问题待修（诊断已到位）**。

## 🔴 P1: michaelmaomao.github.io/flowkit/ 打开空白 — 根因已坐实

**诊断证据（2026-09-14 实测）**:
- `flowkit/_sidebar.md` → **404**; `flowkit/README.md` → 200; index.html → 200
- 部署仓根 `.nojekyll` → **404**
- 但 hexo 部署清单里明明有 `flowkit/_sidebar.md`（文件已推到仓里）

**根因**: michaelmaomao.github.io 是**用户页仓，GitHub Pages 默认跑 Jekyll**——Jekyll 构建时**丢弃下划线开头文件**（`_sidebar.md`/`_coverpage.md`）。文件在 git 里但 Jekyll 处理后不输出 → docsify 的 sidebar/coverpage fetch 404 → 站点渲染空白。frizzlefur.github.io/flowkit 正常是因为 gh-pages 分支根有 `.nojekyll`。

**修法（下会话直接执行）**:
```bash
touch /Users/new/Documents/Repos/BlogBackUp/source/.nojekyll   # hexo 复制到 public/ 根
cd /Users/new/Documents/Repos/BlogBackUp && git add -f source/.nojekyll && git commit -m "fix: .nojekyll 禁 Jekyll——flowkit 子站的 _sidebar/_coverpage 不再被丢弃"
# 然后全链: hexo clean && hexo generate && hexo deploy（用 /Users/new/.nvm/versions/node/v24.18.0/bin/hexo）
# 注意: .nojekyll 只影响 GitHub Pages 的 Jekyll, 不影响 hexo 自身构建
```
修后验证: `curl -o /dev/null -w "%{http_code}" https://michaelmaomao.github.io/flowkit/_sidebar.md` 应 200（注意 CDN ~10min 缓存, 加 `?cb=$RANDOM` 穿透）。

## 🟡 P2: 博客主页导航无 FlowKit tab — 大概率浏览器缓存（复验已近实锤）

**复验证据（交接前最后一查）**: 部署产物 public/index.html grep flowkit 13 处; 线上主页（缓存穿透）导航已见「思所」「读书」——它们只存在于新菜单（1d4149ba），证明新菜单已部署，FlowKit tab 应同在（探针 grep 采样被文章标题挤占，未单独确认）。
**用户侧动作**: 硬刷新（Cmd+Shift+R）或无痕窗口打开主页。
**若硬刷新后仍无**: 30 秒裁定——`curl -s "https://michaelmaomao.github.io/?cb=$RANDOM" | grep -oE 'FlowKit[^<]*' | head -5` 看导航区（区别于文章标题 FlowKit-xxx）; 仍无再查 node_modules/hexo-theme-melody（npm 版存在, 但 themes/melody 优先级更高, 已排除 _config.melody.yml 覆盖）。
**原疑点记录（已部分排除）**:

**诊断证据**: 主页 HTML（缓存穿透后）grep "flowkit" 只命中文章标题，无 `<nav>` 菜单项。
**已排除**: 菜单配置已提交推送（`1d4149ba`: themes/melody/_config.yml menu 加了 `FlowKit: /flowkit/` + 思所/读书/相册）且推送在 hexo generate **之前**。
**疑点（按概率排序）**:
1. hexo 实际用的主题不是本地 `themes/melody`——查 `_config.yml` 的 `theme:` 解析与 `node_modules/hexo-theme-melody` 是否存在（npm 安装版会优先/覆盖）
2. melody 菜单可能需 `hexo clean` 后才重渲染（已 clean 过, 存疑）
3. 根 `_config.yml` 或 `_config.melody.yml`（hexo 5+ 的根级主题配置文件）覆盖了 themes/melody/_config.yml——**`ls /Users/new/Documents/Repos/BlogBackUp/_config.melody.yml` 一查便知, 若存在改它才生效**
4. CDN 缓存（已用随机参穿透, 概率低）

**验证路径**: `grep -i flowkit /Users/new/Documents/Repos/BlogBackUp/public/index.html`（部署产物里有没有）——有=CDN 缓存, 没有=生成链配置未生效。

## 状态获取（新会话按序读）

1. 本 HANDOFF.md
2. `.plan-feat-redesign/STATE.md`（波次账本/已裁决策/风险）
3. `.plan-feat-redesign/master-plan.md`（三轴总编排）
4. `git -C /Users/new/Documents/Repos/flowkit log --oneline -6`

## 剩余队列（修完 P1/P2 后）

- quiz 二批: 其余 8 章出题（fs-quiz 组件已就绪, 模板 `site/assets/quiz/ch4.json`, 挂载范式见 ch4 机制 pane 尾）
- 中优: ch2 三斧同屏回放（A 线设计现成, ch2-rules 已建可作参考）
- 微挂账: S6 quote-soft / S13 coarse 指针
- :focus-visible 真实 Tab 键人工确认（用户侧）

## 关键纪律（延续）

- **cwd 漂移是本会话最大事故源**（曾把 PicCal 仓切到 orphan 分支, 已恢复+补丁已推 `6a3b8cc`）——所有 git/分支操作**必须显式 cd 或 git -C 绝对路径**
- hexo d 不隐含 generate: 改源码后必须 clean+g+d 全链
- Chrome 启发式缓存: 改资产后 `fetch(u,{cache:'reload'})` 强刷; 线上验证加 `?cb=$RANDOM`
- CDP IPv6 桥在跑（/tmp/ipv6-bridge.mjs, 127.0.0.1:9223→[::1]:9223）; 预览服务 4099 no-store
- 机检: `cd /Users/new/Documents/Repos/flowkit && python3 .plan-feat-sweep/verify.py`（当前 17 剧本/12 章/13 组件/3 题库 ALL PASS）
- 博客同步链: flowkit/site → rsync → BlogBackUp/source/flowkit/ → hexo clean+g+d
- 并行会话在改 flowkit skills（check_context.py 等未提交改动是它的, 勿动勿捎带——本仓提交用显式路径 git add）

## 上线地址速查

| 产物 | 地址 | 状态 |
|---|---|---|
| flowkit 仓 Pages | https://frizzlefur.github.io/flowkit/ | ✅ 正常 |
| Graph of Loops 讲解页 | https://frizzlefur.github.io/flowkit/graph-loop-explainer.html | ✅ |
| 博客 | https://michaelmaomao.github.io/ | ⚠️ P2 导航缺 FlowKit |
| 博客 /flowkit/ | https://michaelmaomao.github.io/flowkit/ | 🔴 P1 空白（Jekyll） |
