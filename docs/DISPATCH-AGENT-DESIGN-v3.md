# 调度 Agent 设计文档 v3.0 - 事件驱动的动态调度

**版本**: v3.0 (最终版)  
**创建时间**: 2026-03-15 11:35  
**设计者**: 小云 (主 Agent) + 用户  
**状态**: ✅ 评审通过  
**实施者**: 小云 (主 Agent 代劳开发)

---

## 📋 架构演进

### v1.0 (废弃) ❌

**设计**: 外部脚本 + inbox 文件通知
```
外部脚本 → inbox 文件 → Agent 读取
```
**问题**: isolated agents 不读取 inbox，任务卡住

### v2.0 (废弃) ❌

**设计**: 固定频率轮询
```
cron (每分钟) → 调度器 → 检查任务 → 发送
```
**问题**: 资源浪费，响应延迟

### v3.0 (正确) ✅

**设计**: 事件驱动 + 动态调度
```
事件触发 (任务创建/完成)
  ↓
调度器唤醒
  ↓
发送任务 → 统计任务量
  ↓
注册一次性 cron (动态频率)
```

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────┐
│           事件触发器                             │
│  - 任务创建 (task-board/tasks/*.md)             │
│  - 任务完成 (状态变更)                           │
│  - 任务分配完成 (sessions_send 结束)             │
└─────────────────────────────────────────────────┘
                      ↓ 触发
┌─────────────────────────────────────────────────┐
│         xiaoyun-dispatch (调度 Agent)            │
│  ┌─────────────────────────────────────────┐   │
│  │  dispatcher.js (调度逻辑)                │   │
│  │    - 读取任务板                          │   │
│  │    - 优先级排序 (P0>P1>P2>P3)            │   │
│  │    - Agent 状态检测                       │   │
│  │    - sessions_send 发送任务              │   │
│  │    - 统计剩余任务量                      │   │
│  └─────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────┐   │
│  │  scheduler.js (动态频率)                 │   │
│  │    - 计算下次调度时间                    │   │
│  │    - 注册一次性 cron                     │   │
│  └─────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────┐   │
│  │  state-manager.js (状态追踪)             │   │
│  │    - dispatcher-state.json               │   │
│  │    - Agent 状态缓存                       │   │
│  │    - 忙碌计数器                          │   │
│  └─────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────┐   │
│  │  alert.js (告警模块)                     │   │
│  │    - QQ 通知 (message 工具)               │   │
│  │    - 飞书通知 (message 工具)              │   │
│  │    - 告警冷却 (10 分钟)                   │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                      ↓ sessions_send
┌─────────────────────────────────────────────────┐
│         执行者 Agents                            │
│  xiaoyun-dev  │  xiaoyun-test  │  xiaoyun-recorder │
└─────────────────────────────────────────────────┘
```

---

## 🎯 调度逻辑

### 核心流程

```
1. 事件触发 (任务创建/完成/分配结束)
   ↓
2. 调度器唤醒 (OpenClaw cron)
   ↓
3. 读取任务板 (task-board/tasks/)
   ↓
4. 过滤活跃任务 (非 COMPLETED/CANCELLED)
   ↓
5. 任务优先级排序 (P0 > P1 > P2 > P3)
   ↓
6. 遍历任务队列
   ├─ 检查执行者状态
   │   ├─ busy → 计数器 +1
   │   │         ├─ 计数器 > 3 → 告警
   │   │         └─ 跳过，下一个
   │   │
   │   └─ idle → sessions_send 发送
   │             ↓
   │           更新状态
   │             ↓
   │           计数器清零
   │
   ↓
7. 统计剩余任务量
   ↓
8. 计算下次调度时间
   | 任务量 | 频率 |
   |--------|------|
   | 0      | 30 分钟 |
   | 1      | 5 分钟  |
   | 2-3    | 3 分钟  |
   | ≥4     | 1 分钟  |
   ↓
9. 注册一次性 cron
   ↓
10. 调度周期结束
```

### 动态频率配置

```javascript
const SCHEDULE_CONFIG = {
  TASK_COUNT_0: { count: 0, interval: 30 * 60 * 1000 },   // 30 分钟
  TASK_COUNT_1: { count: 1, interval: 5 * 60 * 1000 },    // 5 分钟
  TASK_COUNT_2_3: { count: 3, interval: 3 * 60 * 1000 },  // 3 分钟
  TASK_COUNT_4_PLUS: { count: Infinity, interval: 60 * 1000 } // 1 分钟
};

function calculateNextSchedule(taskCount) {
  if (taskCount === 0) return SCHEDULE_CONFIG.TASK_COUNT_0.interval;
  if (taskCount === 1) return SCHEDULE_CONFIG.TASK_COUNT_1.interval;
  if (taskCount <= 3) return SCHEDULE_CONFIG.TASK_COUNT_2_3.interval;
  return SCHEDULE_CONFIG.TASK_COUNT_4_PLUS.interval;
}
```

---

## 📁 数据格式

### dispatcher-state.json

```json
{
  "lastUpdate": "2026-03-15T11:35:00Z",
  "lastSchedule": "2026-03-15T11:35:00Z",
  "nextSchedule": "2026-03-15T11:36:00Z",
  "taskCount": 5,
  "agents": {
    "xiaoyun-dev": {
      "status": "busy",
      "currentTask": "TASK-20260314-007",
      "busyCount": 2,
      "lastActive": "2026-03-15T11:30:00Z",
      "tasksCompleted": 15,
      "tasksFailed": 0
    },
    "xiaoyun-test": {
      "status": "idle",
      "currentTask": null,
      "busyCount": 0,
      "lastActive": "2026-03-15T11:00:00Z",
      "tasksCompleted": 8,
      "tasksFailed": 0
    }
  },
  "taskQueue": [
    {
      "taskId": "TASK-20260314-007",
      "priority": "P1",
      "assignee": "xiaoyun-dev",
      "status": "IN_PROGRESS",
      "sentAt": "2026-03-15T11:35:00Z",
      "retryCount": 0
    }
  ],
  "alerts": [
    {
      "type": "BUSY_TIMEOUT",
      "agent": "xiaoyun-dev",
      "message": "连续 3 次忙碌，任务积压",
      "timestamp": "2026-03-15T11:32:00Z",
      "resolved": false
    }
  ]
}
```

### 任务消息格式 (sessions_send)

```json
{
  "type": "TASK_ASSIGN",
  "taskId": "TASK-20260314-007",
  "taskName": "回滚机制增强",
  "priority": "P1",
  "description": "实现选择性恢复和增量备份",
  "deadline": "2026-03-15T18:00:00Z",
  "sentAt": "2026-03-15T11:35:00Z",
  "sender": "xiaoyun-dispatch"
}
```

---

## 🔧 实施步骤

### Phase 1: 创建调度 Agent (11:35-12:30)

- [ ] 创建 `agents/xiaoyun-dispatch/` 工作空间
- [ ] 创建基础文件:
  - IDENTITY.md
  - SOUL.md
  - AGENTS.md
  - HEARTBEAT.md
  - MEMORY.md
  - USER.md
- [ ] 创建 package.json

### Phase 2: 实现核心模块 (14:00-17:00)

- [ ] `src/dispatcher.js` - 调度逻辑
  - 读取任务板
  - 优先级排序
  - Agent 状态检测
  - sessions_send 发送
  - 忙碌计数器管理

- [ ] `src/scheduler.js` - 动态频率
  - 统计任务量
  - 计算下次调度时间
  - 注册一次性 cron

- [ ] `src/state-manager.js` - 状态管理
  - dispatcher-state.json 读写
  - Agent 状态缓存
  - 计数器管理

- [ ] `src/alert.js` - 告警模块
  - QQ 通知 (message 工具)
  - 飞书通知 (message 工具)
  - 告警冷却 (10 分钟)

### Phase 3: 集成测试 (17:00-18:00)

- [ ] 测试事件触发
- [ ] 测试动态 cron 注册
- [ ] 测试任务分发
- [ ] 测试告警发送
- [ ] 测试状态追踪

### Phase 4: 上线运行 (明天)

- [ ] 监控运行状态
- [ ] 优化调整

---

## ⚠️ 关键设计决策

### 1. 为什么不使用常驻进程？

**决策**: 使用唤醒模式 (OpenClaw cron)

**理由**:
- ✅ 符合 OpenClaw 架构设计
- ✅ 节省资源
- ✅ 易于管理和调试
- ❌ 响应有延迟 (可接受，<1 分钟)

**未来优化**: 如果性能不够，可考虑常驻模式

### 2. 为什么使用一次性 cron？

**决策**: 每次调度后注册一次性 cron

**理由**:
- ✅ 频率动态调整
- ✅ 无任务时减少唤醒
- ✅ 避免固定轮询浪费

**实现**:
```javascript
await gateway.cron.add({
  name: 'dispatcher-next',
  schedule: {
    kind: 'at',
    at: new Date(Date.now() + interval).toISOString()
  },
  payload: {
    kind: 'agentTurn',
    agentId: 'xiaoyun-dispatch',
    message: '执行任务调度'
  }
});
```

### 3. 为什么告警使用 message 工具？

**决策**: 使用 OpenClaw message 工具

**理由**:
- ✅ OpenClaw 内部机制
- ✅ 无需第三方客户端
- ✅ 已配置 QQBot 和飞书
- ✅ 统一接口

**实现**:
```javascript
await message.send({
  channel: 'qqbot',
  to: 'qqbot:c2c:8A5DAA7AE70283C50EFF941E21784C47',
  message: alertMessage
});
```

### 4. 如何判断 Agent 忙碌？

**决策**: 检查 memory 文件更新时间

**理由**:
- ✅ 简单可靠
- ✅ 无需额外状态管理
- ✅ 符合 OpenClaw 设计

**实现**:
```javascript
const memoryPath = `agents/${agentId}/memory/${today}.md`;
const stats = await fs.stat(memoryPath);
const minutesAgo = (Date.now() - stats.mtimeMs) / 60000;

if (minutesAgo < 2) return 'busy';
if (minutesAgo < 5) return 'idle';
return 'unknown';
```

### 5. 忙碌计数器阈值为什么是 3？

**决策**: n=3

**理由**:
- ✅ 容错 2 次忙碌 (可能是正常任务执行)
- ✅ 第 3 次告警 (可能有问题)
- ✅ 平衡敏感度和误报率

**告警级别**:
- 3 次：警告 (QQ/飞书通知)
- 5 次：严重 (任务公共板 + QQ/飞书)
- >5 次：紧急 (用户直接通知)

---

## 📊 监控指标

| 指标 | 目标值 | 告警阈值 |
|------|--------|----------|
| 任务分发延迟 | < 1 分钟 | > 5 分钟 |
| 消息送达率 | 100% | < 95% |
| Agent 响应时间 | < 2 分钟 | > 10 分钟 |
| 忙碌计数器 | < 3 | > 5 |
| 调度器开销 | < 5 秒/周期 | > 30 秒 |
| 任务完成率 | > 90% | < 80% |

---

## 🔄 与 team-creator 集成

### team-creator 创建团队时

```bash
# 创建团队时自动注册调度配置
team-creator create team.yaml

# 注册到 dispatcher-state.json
{
  "agents": ["xiaoyun-dev", "xiaoyun-test", ...],
  "schedule": "dynamic"  # 动态频率
}
```

---

## 📝 变更历史

| 版本 | 日期 | 变更内容 | 状态 |
|------|------|----------|------|
| v1.0 | 2026-03-14 | 外部脚本 + inbox | ❌ 废弃 |
| v2.0 | 2026-03-15 11:15 | 固定频率轮询 | ❌ 废弃 |
| v3.0 | 2026-03-15 11:35 | 事件驱动 + 动态调度 | ✅ 最终版 |

---

## ✅ 验收标准

### 功能验收
- [ ] 事件触发正确 (任务创建/完成)
- [ ] 任务按优先级排序
- [ ] Agent 状态检测准确 (误差 < 1 分钟)
- [ ] sessions_send 消息送达率 100%
- [ ] 动态频率调整正确
- [ ] 忙碌计数器正常工作
- [ ] 告警机制触发正确

### 性能验收
- [ ] 调度周期 < 5 秒
- [ ] 任务分发延迟 < 1 分钟
- [ ] Agent 响应时间 < 2 分钟
- [ ] 状态文件更新及时
- [ ] 无任务时 30 分钟唤醒一次

### 质量验收
- [ ] 代码测试覆盖率 > 80%
- [ ] 所有测试通过
- [ ] 文档完整清晰

---

## 💡 未来优化空间

### 已识别的优化点

1. **任务优先级队列** - 维护有序队列，避免每次排序
2. **Agent 状态缓存** - 缓存状态，减少文件读取
3. **批量任务发送** - 空闲 Agent 一次发送多个任务
4. **任务超时自动重新分配** - 超时任务自动转给其他 Agent
5. **任务依赖自动解析** - 自动检测依赖链
6. **智能负载均衡** - 根据 Agent 负载动态分配

### 实施策略

**当前**: 先实现核心功能 (v3.0)  
**未来**: 根据运行情况选择性实施优化

**原则**: 有问题再优化，避免过度设计

---

_事件驱动的动态调度架构 - 按需调度，资源高效_ ☁️📡
