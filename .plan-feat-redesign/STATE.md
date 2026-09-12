# STATE.md — redesign 周期（内容组织与交互范式）

current_stage: Phase R3 执行中——波 1/2/3 已交付, 波 4 待做
status: in-progress（波 4: ch6 模式推广 + 摘要卡逐章 + ch12 实战走查章）
progress: R1 研究 100% / R2 提案 100%（T1-T3+章节组织已裁）/ R3 执行 60%
next_action: 波 4——①tabs 推广至其余机制篇章（每章: fs-tabsep 分隔重组 + 摘要卡「本章你将看到」+ prev/next 双卡, 对照 ch6 模板 site/mechanisms/ch6-review-and-decision.md）②ch12 实战走查章立项写作（素材=git log 三周期真实链, 建 site/mechanisms/ch12-*.md + sidebar + path-data + verify.py 章节数 11→12）③quiz 族内容分批（P1）

## 已裁决策（勿重新讨论）

- T1 分区容器: docsify-tabs 插件**已被证伪**（与 docsify@5 不兼容, 注释标记被吞）→ 已回退自写 fs-tabs.js（用户 T1 备选即此项, 已获准）
- T2 试点 ch6 ✓ 已交付; T3 quiz 做 P1 分批; ch12 立项 ✓; 深挖折叠仅长条目（T5 默认）
- 主播放钮颜色（T4）: 待 learncc 前台复验后定, 本轮未动
- 四向可议点收编: 入场动效降 P2（NN/g 克制）; :focus-visible 已落 P0（真实 Tab 键人工确认项待用户按验）

## 波次账本

- 波 1（3d081d9）: 仲裁+pause-on-exit / hover 去蓝+border-hi token / :focus-visible / progress.js / tabs+copy-code 插件钉版 SRI（tabs 后证伪闲置, copy-code 有效）
- 波 2（ed4405e）: fs-tabs.js + ch6 四段式试点（CDP 全绿: 四标签/切换/折叠线上/隐藏 pane 不播/nav 不被吞）
- 波 3（本次）: 位置标记 ×8 章 / 双入口 / path 双坐标系+最短路线 / 行数全量同步（1964→2245）
- 波 4（待做）: 推广 + ch12 + quiz 分批

## 测试纪律（本周期新增）

- **Chrome 启发式缓存**: 旧 Last-Modified 文件可数小时不回源——改资产后必须 `fetch(u, {cache:'reload'})` 强刷对应 URL 再 reload, 否则看到的是鬼影（本次 tabs 试点排查 40 分钟的教训）
- 预览服务已切 no-store（4099, nohup 脚本见 /tmp/fs-sweep-server.log）
- 后台 tab: IO 不触发不渲染——行为验证用「截图强制帧」法; timer 节流 ≥1s, 断言等待要放宽

## 风险与未决

- fs-tabs pane 内锚点跳转（sidebar subMaxLevel 列出隐藏 pane 内 h3, 点击跳转时 pane 若隐藏则跳不到——推广时观察, 必要时 select(i) 联动 hash）
- docsify-copy-code 与 docsify@5 已实测出按钮 ✓; tabs 插件文件仍在 index.html（无害, 可留可删）
- quiz 出题是内容工作: 每章 2-3 题, 主会话亲写, P1 分批不塞波 4
