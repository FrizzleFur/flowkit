# FlowKit Evals 体系

> flowkit 管别人验证已经很强（Stage 5 验证 / IL-4 审查 / Auto-Decide 面板），唯独不验证 skill 本体。
> 本目录补的正是那个空位：**skill 的回归测试**。evals 是仓库的开发期工具，不进 Stage 流程，
> 用户安装 skill 时完全无感（宪法自检 2026-09-01 通过）。

## 三层结构

| 层 | 防什么回归 | 成本 | 落点 | 现状 |
|---|---|---|---|---|
| L0 静态断言 | SKILL.md 行数爆炸 / references 断链 / codex-compat 失同步 / frontmatter 漂移 | 零 LLM，秒级 | `scripts/lint_flowkit.py`（L1-L7）+ `.github/workflows/lint.yml` | 已落地 |
| L1 触发层 | description 改动导致误触发/漏触发（should / should-not near-miss 集） | ~20 次小模型调用 | `evals/trigger/`（T-302 已建：eval-set-v1 + runner + 两轮 results） | 已跑三轮（2026-09 停在竞技场注入失效归因，结论见 CHANGELOG T-302 条目；恢复跑前先修 `.claude/skills` 进 `claude -p` 技能视野的问题） |
| L2 行为层 | stage 纪律丢失 / 五件套不落盘 / handoff 断链 | 会话级，手动触发 | `evals/<skill>/evals.json`（T-301） | 建设中 |

L2 采用**单臂回归结构**（2026-09-09 用户裁决，替代原双臂 ≥4 会话方案）：
单臂迷你任务 1 次起步、Stage 3 落盘完成即截断；双臂对照降为**可选背书件**——只在要对外宣称
「相比裸跑 X」时才跑（baseline 缓存复用：裸跑行为不随 flowkit 改动而变，跑一次反复用）。
日常 eval 成本 ≈ 原案 1/15。

## 五条防漂移规则（eval 有效性问题在这里闭环）

eval 有效性不靠「任务不变」来保证——flow-deep 的设计目标就是任务千变万化、纪律始终不变。
要分清两种「变」：任务变化是白给的测试多样性；**契约变化才是威胁**。五条规则：

1. **断言只锚不变量**（纪律协议 / 产物 schema / stage 顺序），不锚具体任务的输出内容——
   「五件套存在吗」没法靠应试通过，必须真做。锚对了不变量，任务变化是工作介质，不是敌人。
2. **谁改契约谁带测试**：SKILL.md / references 改动若触碰合同（stage 划分 / 五件套协议 /
   STATE.md schema / 触发 description），**同 commit 必须更新对应断言或评测集**——
   与「代码变了单测跟着变」同构，防 eval staleness 的主规则。
3. **评测集是活水**：定期（建议每月）从 auto-skill 经验库 / LINUX DO 反馈捞真实失败案例入集；
   老 case 长期 pass 且不再代表当前用法 → 归档不清仓。评测集代表「你现在怎么用它」。
4. **留 held-out 小集**：约 10-20% 的 case 不参与日常迭代，只发版前跑——防「对着考纲刷题」，
   没见过的那组才说真话。
5. **环境三元组钉住**：每次跑 eval 记录（flowkit 版本 / Claude Code 版本 / 模型），
   不记环境的跑分不可比；模型或 CC 大版本升级 → 重跑 baseline 刷新缓存 + 全量复验一次。

## 失效报警信号（何时停下来修 eval 本身）

1. 绿灯但用户在骂（LINUX DO 有真实翻车反馈而 eval 全 pass）→ 触发规则 3
2. 改契约忘了改断言，CI 却还绿 → 触发规则 2
3. 同一断言连续多版本 pass 率恒 100% 且从没 catch 过任何东西 → 断言退化为恒真，删或收紧

## 护栏选型判据（P-17，2026-09-14 成文）

> 来源：graph-loop 审计复核项 #2——实践在而显式判据缺（散在 lint docstring 与 REC 提案）。本条款为**追认 + 提炼**，非新机制。
> 适用面：「代码护栏」统称四类确定性机械——lint 断言 / CI 门禁 / evals 评测集 / 运行时 hook。

**升级判据**（组合规则：D1 必要 + D2/D3 至少其一；D4 是立项后的设计验收约束）：

- **D1 已付学费或已识别盲区**——同一条文本纪律被实际违反 ≥2 次（或 1 次即事故），或验证空位被显式识别（A 无法验证 A）。脚本有维护成本，只有对抗已发生的回归才回本；「技术上可脚本化」不构成立项理由。*锚点：断链是最高频回归（lint L5 注）；evals 立项「管别人验证已经很强，唯独不验证 skill 本体」*
- **D2 判定可机械、修复可内嵌**——违反形态能写成无歧义断言，报错信息自带修复指引落进 agent 上下文。机器只能强制机器能判的事；需要品味判断的纪律硬上脚本，产出只有恒真或误报。*锚点：REC-10「人类品味捕获一次，机械处处强制」*
- **D3 检测点在模型自感之外**——待检测事实物理上超出 LLM 感知（transcript 占用、跨文件引用、多平台回归面），或慢性渐变（体量膨胀）。SOP 依赖「记得且能查」，感知不到的事实文本纪律够不着。*锚点：「模型无法自感 context 占用，必须脚本实测」（flow-deep SKILL.md）；SIZE_BUDGET 源于 733 行已超宪法线才被察觉*
- **D4 护栏自身失败模式安全**——秒级零 LLM；失败静默降级不阻塞主管道；留逃生阀与退化检测。护栏成为新故障源比没有护栏更糟。*锚点：hook 静默失败+去抖；check_context exit 2 降级；waiver 过期自动失效*

**反向条款**（何时不升级）：

- **R1 无学费不立项**——预想中的回归留给 REC 提案带触发条件待命（propositions.md「不达条件不实施」）
- **R2 品味判定留人类**——需要上下文权衡的纪律（如 loop boundary 契约对照）保持 SOP + 独立评审形态
- **R3 执行型升级须过宪法四问**——护栏从「检测告警」升级到「接管动作」时过设计宪法四问；检测型可静默，执行型必须留 `--no-xxx` 逃生阀
- **R4 路线级取舍**——与「约定级、不上引擎」不匹配的重型机械刻意不吸收，缺口如实标注为路线取舍而非待补欠账

*案例验证：Context Guard 机械化四条全中（D1=85% 未触发事故 / D2=数值断言 / D3=「无法自感」原句 / D4=静默降级），且其 needs_calibration 后续暴露反向印证 D4 退化检测的必要性——判据覆盖力双向验证。*

## Loops 层（2026-09-10 吸收 graph loop：cron trigger + signal 登记）

flowkit 的 loop graph 定位（研究仓 09 收官篇裁决）：**任务（flow/flow-deep）与 loop（永续监守）是两种本体，正交共存**。已有循环资产：管道 = L2 执行 loop、evals = 其 verifier、auto-skill = 共享 brain。本目录补的是 trigger 维度与跨 loop 边的显式登记：

| Loop | Trigger | 监控对象 | Contract |
|---|---|---|---|
| repo-integrity | CI cron（每周一） | 仓内 skills 结构（lint L1-L7） | `loops/repo-integrity-loop.md` |
| brain-integrity | launchd/手动（挂载由用户定） | auto-skill 双库断链/陈旧度 | `loops/brain-integrity-loop.md` |

### signal 登记总表（谁写谁读——边的事实+登记）

| 信号 | 写者 | 读者 | 载体 |
|---|---|---|---|
| lint 战果 | repo-integrity loop | L3 研究吸收 loop | Actions 日志 + CHANGELOG |
| 行数台账（P3 触发数据） | repo-integrity loop | 下沉决策 | Actions 日志 L3 节 |
| 双库健康报告 | brain-integrity loop | L1 召回置信 / REC-8 健康分 | integrity-report.md |
| evals benchmark | L2 行为 evals | L3 改进迭代（绿基线对照） | `flow-deep/benchmarks/` |
| trigger 测量结果 | T-302 竞技场 | description 优化（低优先级） | `trigger/results-*.json` |

新 loop 的准入纪律：one loop = one separable workstream；单层起步（"Build the 1-layer version first"），no-op 是有效 run，验证靠确定性脚本（evidence not vibes）。

## 目录约定

```
flowkit/
├── scripts/lint_flowkit.py        # L0：七项断言（L1-L7），退出码作 CI gate
├── .github/workflows/lint.yml     # L0 的 CI 门禁（push/PR）
├── evals/
│   ├── README.md                  # 本文件——体系总纲
│   └── flow-deep/                 # T-301：行为 evals（本仓首个）
│       ├── evals.json             # 评测集（skill-creator schema）
│       └── workspace/             # 跑测产物（gitignore，本地跑）
└── skills/<name>/evals/           # （如需 skill 级随包分发时用，当前不用）
```

环境三元组随 benchmark 报告留痕；跨技能引用断链类回归由 L0 兜底（首跑已抓到 2 条真断链）。
