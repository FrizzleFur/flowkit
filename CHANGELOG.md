# 更新日志 (Changelog)

FlowKit 全量版本历史。格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)；版本号语义：主版本.次版本.修订号，次版本升级对应功能级演进。

## [Unreleased]

（暂空——v1.7.0 刚发版）

## [v1.7.0] - 2026-09-09



### flow-deep
- Stage 3 **反转默认：默认不再进入 Plan Mode** —— 默认路径改为「plan 落盘 `.plan/` 三件套 + plan-quality 质量自检 + AskUserQuestion 用户确认点（批准/修改/重新规划）」，规划纪律与 Stage 3.5/3.6 审查关卡不变，仅审批载体从 harness 弹窗换为对话内确认；新增 `--plan-mode` 参数显式进入 Plan Mode（对应 flow 的 `--strict-plan`）。依据 2026-09-09 官方文档核实：ExitPlanMode 审批弹窗属 permission prompt，无任何配置/环境变量/flags 可抑制，且 bypass 会话中 Plan Mode 只读封锁本就不强制——保留 Plan Mode 只剩弹窗打断，无沙箱收益（取代本段原「Plan Mode 审批弹窗说明」条目）；附带修正 Stage 3 STATE.md `next_action` 漏 Stage 3.5 的顺序缺陷
- Stage 4 新增 **分发前置自检**（执行型 agent 必做）—— 派发前扫描写入路径清单识别作用域外路径（新建项目同级文件夹、/tmp 等）并征询用户（`/add-dir` / 绝对路径 allow 规则 / 修改规划），未处理不派发；防 subagent 启动后卡在权限确认上无人察觉（后台 agent 授权等待无面板提示，比主会话弹窗更难发现）
- agent-dispatch.md 新增 **权限与作用域章节**（flow/flow-deep 共用）—— subagent 权限继承机制速览（继承模式与 allow/deny 规则、acceptEdits 覆盖新建文件、保护路径任何模式都弹、文件编辑类批准不落盘）+ 作用域外写入前置处理协议 + 分发 prompt 约定（写盘用 Write/Edit 工具）+ 弹窗诊断对照表；依据 2026-09-09 官方 permissions/sub-agents/permission-modes 文档核实

### 仓库基础设施
- 新增 **CLAUDE.md / AGENTS.md** —— Agent 协作规范落库：版本演进纪律（CHANGELOG 全量收敛 + README 滚动保留最近 3 版）、条目写法、提交规范（含并发提交 409 重取 sha 规则）；README / README_EN 日志区同步收敛为最近三版
- 新增 **T-302 trigger eval 竞技场**（`evals/trigger/`）——20 条竞争口径 eval set（should/near-miss）+ runner（stream-json 早停检测 + effort 钉住 + 计时器锚点重置 + 项目级 skills 注入）。三轮测量后的最终归因（诚实降级记录）：①竞技场注入失效——项目级 `.claude/skills/` 未进 claude -p 的技能视野（显式 /flow 命令也不触发即为此症状），所测「漏触发」不能作为 description 缺陷证据；②行为事实——模型对任务型 query 倾向直接处理（文本证据：自行输出规划+架构图），编排类元技能天然吃亏；③立得住的结论：near-miss 两轮零误触发（负向边界稳健）。产品层裁定：触发以显式命令为主锚（真实使用模式即如此），description 自然语言增强降为低优先级。方法教训三条入库：触发测试必须钉 effort（max 档思考 75s+）、`--disallowedTools` 变长参会吞 prompt、竞技场注入需先验证技能确在视野
- 新增 **evals 三层体系** —— skill 本体的回归测试（管道验证一切，唯独不验证自己的补位）：L0 静态断言 / L1 触发（T-302 待建）/ L2 行为；五条防漂移规则 + 失效报警信号 + 环境三元组纪律（evals/README.md）
- **lint_flowkit.py 升级七项断言 + GitHub Actions CI 门禁** —— 新增 L5 引用完整性（技能内/跨技能两种形态）、L6 codex-compat 双向一致、L7 frontmatter 一致；L3 增 budget 线（flow-deep 800 行 = REC-11 下沉触发线，error 级）；CI 零 LLM 成本，push/PR 即跑；首跑抓出并修复 2 条跨技能裸相对引用真断链
- CLAUDE.md 增 **「谁改契约谁带测试」协作纪律** 与 **引用写法规范**（跨技能引用必须 `~/.claude/skills/<name>/` 全路径）
- **单一事实来源迁移** —— 本仓成为 5 核心 skill 主本，`~/.claude/skills`（私有仓 clone）对应目录换为反向 symlink；编辑任一侧即同一份文件、git status 即时跟踪，终结三住处拷贝漂移（历史三次事故的结构性根源）；per-skill README 导览层随迁开源，auto-skill 个人数据（experience/knowledge-base）gitignore 隔离

### flow-deep
- 新增 **行为 evals（T-301）** —— 三类型迷你任务（调研/文档/代码）× 单臂 × Stage 3 确认点截断的回归评测：3 case + 24 机检断言 + fixture + snapshot；首轮三臂全绿建立绿基线（`evals/flow-deep/benchmarks/iteration-1.json`），含 token/duration 与 8 条 analyst 观察
- **check_context.py 窗口口径修复**（evals 首批战果，两臂独立复现的误报）—— 窗口解析改为「显式传参 > FLOWKIT_CONTEXT_WINDOW > ANTHROPIC_MODEL 推断 > 200K 默认（来源标注）」，零配置随切模型自适应；session 定位加贴近度分组 + fallback 标志；first_msg 兼容 teammate 包装（原「session 疑似误选」系包装剥离缺失的误判，已翻案）；实测误报 96.1% → 19.2%

### v1.6.1 (2026-09-08)

**全家族多平台适配（Codex CLI）**
- flow / multi-agent / prompt / auto-skill 四技能新增「平台兼容」节 + `codex-compat.md` 适配层——OpenAI Codex CLI 以 `$flow` 前缀可用
- 机制映射四件套：AskUserQuestion→编号选项自然语言、Plan Mode 审批→plan 呈现+人工切换、Task 系统→planning-with-files 文件协议、Agent 编排→spawn_agent 工具族
- Claude Code 侧零影响：frontmatter/description 零变更，适配内容按渐进披露仅在非 CC 环境加载
- SKILL.md 格式同源 agentskills.io 开放标准，一份实体多平台 symlink 共用

### v1.6.0 (2026-09-07)

**flow-deep / flow / auto-iterate（humanlayer 机制吸收）**
- 深研 humanlayer/skills 四 skill（show-me / build-iterated-agentic-loop / design-control-loop / improve-claude-md），结论「1 装 3 借鉴」——机制吸收进现有文件获得全部收益、零触发面成本
- 新增 **Loop Memory 文件**（auto-iterate）—— TSV 记历史、memory 存未来规则；durable-vs-oneoff 判别 + standing-feedback 准入删除测试
- 新增 **on-the-loop 异步纠偏通道**（flow Stage 5.5）—— 迭代运行中插话纠正写 loop-memory，不打断循环、下轮 Pick 生效
- 新增 **Guard vs Dampener 对偶**（auto-iterate）—— Guard 防自己改坏，Dampener 防外部恶化，advisory→blocking 渐进
- 新增 **Controller 谱系 + fused 判据**（auto-iterate）—— 可数目标外置确定性 controller，模糊目标才用 agentic Pick；策略跨 campaign 可演化
- 新增 **单句任务定义门**（flow plan-quality）—— 目标压不成一句可验证的话，退回不写 plan
- 新增 **无人值守产出闸门**（flow-deep ralph-integration）—— 挂机跑 Ralph 前「产出速率 ≤ 评审速率」，与防"过早放弃"互补
- flow-deep Stage 2b/3 接入 **show-me capability 提示**（可选，非强制）

**show-me（新 skill）**
- 安装 humanlayer show-me v1.0.1 —— 视觉讲解形态词汇表（pseudocode / call tree / diff / HTML 方案页）
- description 增强：方案依赖不熟悉概念时主动出现做视觉讲解（实测：AST 迁移任务 Stage 2b 自动命中）

**multi-agent**
- 同步运行时仓演进：named-only 裁定、派发前 pretrust-cwd.sh 预信任（防 trust 弹窗卡 pane）、Fast Path 补充（118 行差异回补）

### v1.5.0 (2026-09-07)

**ppt-agent（移出）**
- **ppt-agent 移出 FlowKit** —— 定位分层：五个核心模块均为编排基础设施（服务于任意任务的管道/纪律/记忆），ppt-agent 则是自包含的领域内容生产工作流，与管道零耦合（不被 skill-routing 路由、不读规划文件）。移出后仓库回归纯「工作流编排工具集」定位，模块在作者个人 skills 环境继续维护
- 已通过 v1.4.0 安装 ppt-agent 的用户不受影响，删除对应 skill 目录即卸载

**multi-agent**
- 补录 **命名 agent 收尾三步协议**（08-31 漏记）—— teammate 型命名 agent 完成后进程常驻不退出，必须依次执行「进度汇总 → `TaskStop(name)` 收本体（pane 随之自动回收）→ `tmux list-panes` 验证」，防 pane 泄漏
- 演进说明：pane 管理重心已从 spawn-pane 观察窗体系（v1.3.0 所述，仅适用 unnamed 异步 agent）转向「named agent 完成即收」——named 场景由 harness 自动分配 pane，勿再手动开观察窗

### v1.4.0 (2026-09-04)

**ppt-agent（新模块）**
- 新增 **ppt-agent** —— 借鉴 linux.do 精华帖《应该是目前最强的PPT Agent》（sandun）的策划师工作流：需求调研 → 金字塔原理大纲（强制确认点）→ Bento Grid 卡片布局 → 逐页 SVG 设计稿（可直接拖入 Office 2016+ 编辑）
- 内置 **4 套风格色板预设**（商务深色/简约浅色/科技/活泼），开工定义一次全篇复用，解决 AI 生成 PPT 常见的"每页配色漂移"
- 内置 **文字防溢出约束**（估宽公式 + 字号层级表）与无外部依赖纪律，保证 SVG 拖入 PowerPoint 不丢资源
- 交付自带 **preview.html 翻页查看器**（键盘导航）与布局选型速查表（页面内容类型 → 推荐布局直接映射）

### v1.3.0 (2026-08-28)

**flow-deep**
- 新增 **Auto Handoff（75% 自动交接）** —— Context Guard 弹窗新增「交接并记住自动」（armed 状态写入 STATE.md，续接会话继承偏好）；armed 后边界实测 ≥75% 免弹窗自动交接：五件套 + HANDOFF.md → tmux 新窗口 spawn 续接会话（`CLAUDE_CODE_FORCE_SESSION_PERSISTENCE=1` 保证嵌套会话可追溯）
- 新增 `--no-auto-handoff` / `--handoff-max N` 参数（接力上限默认 3 代，防无限接力环）
- 宪法 #4 决议修订：由"只询问不自动交接"改为"弹窗但可记忆"
- 链路实测闭环：真实 tmux spawn → 新会话读 HANDOFF.md → 从 Next Action 恢复

**multi-agent**
- 新增 **Fast Path 风险路由** —— 分发前按任务性质（只读 vs 写入）路由：一句话 fan-out（调研/审查/比对）走分片分解 + 告知式预告 + 直接分批分发 + 分片清单勾销核对，写入任务仍走 Step 0-5 完整流程；判定需显式锚点（`路由判定: 只读 → Fast Path`），并发 ≤2 硬约束不变
- 触发词对齐官方 Tip 与中文口语（"fan out subagents"、"派团队"、"扇出"等）
- agent 映射表重写为**动态发现优先**（旧 voltagent 插件映射已失效，不在可用列表一律降级 general-purpose），修复照抄旧表导致 Agent 调用直接失败的问题
- 新增 **pane 生命周期自动化** —— `scripts/spawn-pane.sh` 一条命令开观察窗（自动命名、登记表、静默降级），watcher 检测输出静默 120s 自杀回收 pane，`reap-panes.sh` 登记表制兜底（绝不触碰主 pane）；修正"harness 自动分配 pane"的失效声明
- 正文新增 **Agent 深度要求（digs deep）** 章节 + Prompt 模板深度块 —— 穷尽分片不抽样、结论带证据锚点（file:line / URL）、深挖优先于罗列，写进每个 fan-out Agent 的 prompt

### v1.2.1 (2026-08-21)

**multi-agent / flow / flow-deep**
- **弱化 tmux 硬依赖** —— 执行模式改为环境自适应双模式：有 tmux 走 tmux-split 团队分屏；无 tmux **静默降级**为同消息无分屏并发（不提示安装、不要求重试）
- 降级模式保留规模档位硬约束（同消息 ≤ 4 防 429）与 Delegate 协调协议；pane 清理步骤自动跳过
- why: tmux 只是可视化增强而非能力前提，多数环境本就没有 tmux，强制提示会打断任务流

### v1.2.0 (2026-08-21)

**flow**
- Grilling 新增 **防拷打三律** —— 增量披露（每问前说明上一答更新了什么判断）、改变结论判据（只问可能改变结论的问题）、显式停止（信息足够立刻收束不凑满）；吸收自苏格拉底提问法，解决"无限追问导致用户被问爆"
- 需求探索收束新增 **问诊六件套** —— 原问题/真问题/已确认事实/未验证假设/关键变量/可行动新问题，后续 Stage 直接拿到澄清后的新问题
- 三角色讨论升级 —— 每角色四项陈述（新增**可证伪声明**：什么证据会让我改变判断）；第二轮先挖**分歧三件套**（共同事实/真正分歧/分歧背后假设）再调和，未消解的分歧显式记录而非过早掩盖

**prompt**
- 新增 **交互节奏控制** 检查项（多轮对话型专项）—— 延迟结论 / 一次一问 / 反形式主义 / 信息密度判据，补齐 Johari+3S 之外的多轮交互质量维度

### v1.1.0 (2026-08-21)

**flow-deep**
- 新增 **Context Guard（上下文容量守卫）** —— Stage/Phase 边界用 `scripts/check_context.py` 从会话 transcript usage 真值检测 context 占用百分比（精确值，非模型自估），超 70% 时 AskUserQuestion 三选项：保存并继续 / 保存并交接（生成 HANDOFF.md 衔接 prompt 给下一个 agent）/ 跳过
- 新增 **主动 Checkpoint 与 Handoff 协议** —— 保存动作清单、HANDOFF.md 模板（路径引用不复制内容）、同 Stage 节流、AskUserQuestion 不可用时的无交互降级、检测失败静默降级（exit 0/1/2 契约）
- 新增 **prime-agent 集成（C34）** —— capability-registry 注册 + skill-routing 自动路由：`security-audit` / `code-verification` 任务在 C34 可用时自动走 prime-agent（IPython 实际运行代码验证），`--no-prime` 可禁用
- 触发条件表 P0 升级为脚本实测，替换不可靠的"人工判断"预估

### v1.0.0 (2026-07-16)

**flow-deep**
- 新增 **Goal Contract（目标契约）** —— 防止 agent 做大量"看起来正确但偏离用户真实目标"的工作；提供 Objective / Success Criteria / Non-goals / Verification Plan 模板
- 新增 **Workflow Script Patterns（工作流脚本模式）** —— Stage 4 选 Workflow 后端时的 Review Workflow / Execution Workflow 模式参考
- `SKILL.md` 大幅更新（532 → 694 行）；capability-registry / context-management / panel-review 同步增强

**flow**
- 新增 **选型指南（selection-guide）** —— flow-deep vs flow vs grill-me 的入口决策依据、升级/降级信号、组合用法与三种误用
- `SKILL.md` 更新；cleanup-procedure / needs-exploration / stage55-iteration 同步增强

**multi-agent**
- `SKILL.md` 更新（315 → 328 行）



## [