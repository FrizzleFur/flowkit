# HANDOFF — flowkit 教程站（redesign 周期进行中）

> 更新: 2026-09-12 晚 | 前置: 三周期交付（9c60cd6）→ sweep 清扫（部分）→ redesign 重设计（波 1-3 已交付, 波 4 待做）| 工作树净, main 已推

## 一分钟读懂现状

教程站 site/ 交付后进入「重设计周期」: 三路研究（learncc 活体+源码、10 站外部横评）→ 设计提案（proposal.md, T1-T5+章节组织已裁）→ 四波执行。**波 1-3 已落地**（交互基建 P0 三件套/进度系统/ch6 四标签试点/位置标记 ×8 章/双入口/最短路线）, 全部有 CDP 证据。**波 4 待做**: ch6 模板推广 7 章 + ch12 实战走查章 + quiz 分批。

## 状态获取指令（新会话按序读）

1. `.plan-feat-redesign/STATE.md` — 主状态（波次账本/已裁决策/测试纪律/风险）
2. `.plan-feat-redesign/proposal.md` — 设计提案与裁决记录
3. `.plan-feat-redesign/notes/` — 三份研究底稿（lcx-live/lcx-src/bp-research）
4. `.plan-feat-sweep/` — 前序清扫周期（对账 37 条挂账 + 交互评审报告 + verify.py 机检）
5. `git log --oneline -5` — 提交链

## 已裁决策（勿重新讨论）

- 章节集合 11 章不动 + **ch12 实战走查章已立项**; 顺序不重排; 原理篇=地基三讲（双入口已落地）
- 分区容器 = **自写 fs-tabs.js**（docsify-tabs@1.6.3 与 docsify@5 不兼容已被 CDP 证伪; 标记 = `<div class="fs-tabsep" data-label="...">`, 结束 `data-end="1"`; 模板 = ch6）
- quiz 做（Brown 规则: 重试至全对/看答案锁定/记录作答, constquiz 扩展）; 主播放钮颜色待 learncc 前台复验（T4）; 深挖折叠仅长条目
- 优先级框架 = 三类读者（首读/回访/查阅）体验影响, 非审计驱动

## 关键纪律（延续 + 本周期新增）

- 原四条全延续: SC5 锚点实读 / 零依赖零构建 / 渲染交付 CDP 实测 / 博客同步链 site/ → BlogBackUp/source/flowkit/ → 用户 hexo d
- **Chrome 启发式缓存鬼影**: 改资产后必须 `fetch(u, {cache:'reload'})` 强刷再 reload——旧 Last-Modified 可数小时不回源（本次教训, 40 分钟）
- **截图强制帧法**: 后台 tab IO 不触发, `/screenshot` 强制合成帧可驱动 IO/timer 链——行为验证的核心手法
- 预览服务: 4099 端口 no-store 版（重启脚本见 /tmp/fs-sweep-server.log 思路）
- agent 完成即产物清点即 TaskStop（不等通知）; 机检 = `.plan-feat-sweep/verify.py`

## 未决事项

| 项 | 谁 | 说明 |
|---|---|---|
| 波 4 推广 + ch12 | 下会话 | STATE.md next_action 有逐步清单 |
| sweep Phase 4 终验+博客同步 | 波 4 后 | 机检复跑 + CDP 抽查 + rsync BlogBackUp → 用户 hexo d |
| :focus-visible 真实 Tab 键确认 | 用户 | 打开站点按 Tab 看焦点环 |
| 主播放钮颜色（T4） | 待复验 | learncc 前台实拍采样后定 |
| REC-P1~P4 | 持续观察 | 触发条件驱动, 核验表在 sweep/notes |

## 本地预览

```bash
cd site && python3 -m http.server 4099   # file:// 不支持 docsify; 服务已切 no-store 更佳
```
