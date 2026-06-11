# MultiAgent 进阶内容

> 本文件包含编排理论、通信模式、高级技术、设计原则和 Python 参考代码。
> 从 SKILL.md 精简而来，仅在需要深入了解编排理论时阅读。

---

## 编排模式详解

### 1. 顺序编排 (Sequential)

```yaml
模式: Agent A → Agent B → Agent C → 最终结果
适用: 步骤有严格依赖顺序
优点: 简单易懂，每步输出可验证
缺点: 总耗时等于所有步骤之和，无法并行
```

### 2. 并行编排 (Parallel)

```yaml
模式: 多个 Agent 同时工作 → 结果聚合
适用: 无依赖的独立分析
优点: 执行时间短（取最长分支），可交叉验证
缺点: 需要结果聚合机制，可能有冲突
```

### 3. 层级编排 (Hierarchical)

```yaml
模式: Manager Agent → 分配给 Specialist Agents
适用: 大型项目
优点: 清晰的职责划分，便于管理
缺点: 协调开销，Manager 单点故障
```

### 4. 共识编排 (Consensus-Based)

```yaml
模式: 多 Agent 讨论 → 辩论 → 投票/共识
适用: 投资决策、技术选型、风险评估、架构评审
优点: 多视角、减少偏见、决策更稳健
缺点: 耗时较长，可能无法达成共识
```

### 5. 工具中介编排 (Tool-Mediated)

```yaml
模式: Agent 通过共享工具/数据库通信
适用: 大型系统、需要状态持久化、异步协作
优点: 解耦通信、状态可追溯
缺点: 需要额外状态管理，可能有过期数据
```

## Agent 通信模式

### 1. 直接通信
Agent 之间直接传递消息（via SendMessage）。适合需要即时响应的协作。

### 2. 工具中介通信
通过共享文件/TaskList 通信。适合异步协作、多消费者场景。

### 3. 管理者广播通信
协调者向多个 Agent 广播状态变更。适合全局状态更新、优先级调整。

## 常见挑战与解决方案

| 挑战 | 原因 | 解决方案 |
|------|------|----------|
| Agent 冲突 | 角色边界不清 | 清晰的角色分离、明确的决策规则 |
| 执行缓慢 | 串行依赖过多 | 并行执行、缓存结果、预处理数据 |
| 结果质量差 | 上下文不足 | 改进 prompt、增加工具、质量验证 Agent |
| 文件冲突 | 多 Agent 编辑同一文件 | 明确文件边界、使用文件锁 |
| 状态不同步 | 通信延迟 | 共享内存、定期同步、版本控制 |

## 性能评估指标

### 团队指标
- 任务完成率: >95%
- 结果质量: 评分 >8/10
- 执行时间: 最小化（关注并行度和依赖关系）
- 错误率: <5%

### Agent 效能
综合评分 = 成功率 x 0.4 + 质量 x 0.4 + 效率 x 0.2

### 协作指标
- 交互成功率: >90%
- 协作图密度: 实际交互数/可能交互数

## 高级技术

### 自组织团队
Agent 自主决定角色和工作流。适用: 不确定性强、任务多变。

### 自适应工作流
根据执行进度动态调整。监控进度/质量/资源利用率，自动增减 Agent 或插入 review 步骤。

### 跨 Agent 学习
记录执行轨迹 → 提取成功/失败模式 → 更新知识库。适用: 重复任务、知识积累型项目。

## 设计原则

### Agent 设计
必须: 清晰角色、合适工具、明确区分。避免: 角色重叠、工具过多、范围过大。

### 工作流设计
必须: 清晰依赖、明确交接、错误处理、回退策略。优化: 最大化并行、减少等待。

### 通信设计
必须: 结构化消息、清晰上下文、超时处理。最佳实践: 标准化格式、审计日志。

### 编排设计
简单任务 → 顺序编排 | 独立任务 → 并行编排 | 大型项目 → 层级编排 | 复杂决策 → 共识编排

## 实施检查清单

### Agent 定义
- [ ] 角色、目标、专业知识已定义
- [ ] 可用工具、所需上下文已确定
- [ ] 角色之间有明确区分（2-6 个 Agent）

### 工作流设计
- [ ] 依赖关系图已绘制，可并行任务已识别
- [ ] 交接点和成功标准已定义

### 质量保障
- [ ] 错误处理、回退策略、超时逻辑已设置
- [ ] 测试用例和验收标准已准备

## Python 代码参考

> 以下代码来自 multi-agent-orchestration，作为概念参考。Claude Code 实际使用 TeamCreate/Agent/TaskCreate 工具链。

```python
# 顺序编排
class SequentialOrchestrator:
    def execute(self, initial_task: str) -> Dict:
        current_input = initial_task
        for agent in self.agents:
            result = agent.work(current_input)
            current_input = result
        return {"final_output": current_input}

# 并行编排
class ParallelOrchestrator:
    async def execute_async(self, task: str) -> Dict:
        tasks = [agent.work_async(task) for agent in self.agents]
        results = await asyncio.gather(*tasks)
        return {"results": results}

# 层级编排
class HierarchicalOrchestrator:
    def execute(self, main_task: str) -> Dict:
        team_results = {}
        for team_name, agents in self.specialist_teams.items():
            team_result = [agent.work(task) for agent in agents]
            team_results[team_name] = team_result
        return self.manager.synthesize(team_results)

# 共识编排
class ConsensusOrchestrator:
    def execute(self, question: str, rounds: int = 2) -> Dict:
        positions = {a.name: a.argue(question) for a in self.agents}
        for _ in range(rounds - 1):
            for agent in self.agents:
                agent.respond(positions)
        return self.mediator.synthesize_consensus(positions)

# 消息代理
class MessageBroker:
    def send_message(self, message: Message) -> bool:
        self.message_queue.append(message)
        self.agent_inboxes[message.recipient].append(message)
        return True

    def broadcast(self, sender: str, content: str, recipients: List[str]):
        for recipient in recipients:
            self.send_message(Message(sender, recipient, content))

# 共享内存
class SharedMemory:
    def write(self, key: str, value: Any, agent: str):
        self.memory[key] = {"value": value, "writer": agent}

    def read(self, key: str) -> Optional[Any]:
        return self.memory.get(key, {}).get("value")

# 工作流执行器
class WorkflowExecutor:
    def execute_workflow(self, workflow_id: str, executor_func) -> Dict:
        workflow = self.workflows[workflow_id]
        executed = set()
        results = {}
        while len(executed) < len(workflow.tasks):
            ready_tasks = self._get_ready_tasks(workflow, executed)
            for task_id in ready_tasks:
                result = executor_func(workflow.tasks[task_id])
                results[task_id] = result
                executed.add(task_id)
        return results

# 工作流优化器
class WorkflowOptimizer:
    @staticmethod
    def find_parallel_groups(dep_graph: Dict) -> List[List[str]]:
        groups = []
        remaining = set(dep_graph.keys())
        while remaining:
            independent = [t for t in remaining
                          if not any(d in remaining for d in dep_graph.get(t, []))]
            if independent:
                groups.append(independent)
                remaining -= set(independent)
        return groups
```
