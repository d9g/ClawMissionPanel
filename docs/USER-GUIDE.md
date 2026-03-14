# 📖 用户手册 - ClawMissionPanel

**完整使用指南**

---

## 📋 目录

1. [系统概述](#系统概述)
2. [核心功能](#核心功能)
3. [任务管理](#任务管理)
4. [Agent 管理](#agent 管理)
5. [监控与告警](#监控与告警)
6. [最佳实践](#最佳实践)

---

## 系统概述

### 什么是 ClawMissionPanel？

ClawMissionPanel 是一个多 Agent 任务调度与监控系统，帮助你：
- 🎯 统一管理多个 Agent 的工作状态
- 📊 实时追踪任务进度
- ⚠️ 自动检测延期和异常
- 🤖 智能分配任务到合适的 Agent

### 适用场景

- ✅ 多 Agent 协作开发
- ✅ 任务进度追踪
- ✅ 团队工作管理
- ✅ 自动化任务调度

---

## 核心功能

### 1. 任务看板 (Kanban)

任务看板提供直观的任务管理界面，支持以下状态：

| 状态 | 说明 | 颜色 |
|------|------|------|
| PENDING | 待处理 | 🟡 黄色 |
| IN_PROGRESS | 进行中 | 🔵 蓝色 |
| COMPLETED | 已完成 | 🟢 绿色 |
| OVERDUE | 已延期 | 🔴 红色 |

**使用方法**:
- 点击任务 ID 查看详细信息
- 拖拽任务卡片改变状态 (开发中)
- 使用筛选器查看特定状态的任务

### 2. Agent 状态监控

实时显示所有 Agent 的工作状态：

```
Agent 列表:
┌─────────────┬────────┬──────────────┬─────────┐
│ Agent       │ 状态   │ 当前任务     │ 进度    │
├─────────────┼────────┼──────────────┼─────────┤
│ 小云开发 💻 │ 忙碌   │ TASK-001     │ 75%     │
│ 小云测试 ✅ │ 空闲   │ -            │ -       │
│ 小云记录 📝 │ 忙碌   │ TASK-002     │ 50%     │
│ 小云评委 ⚖️│ 空闲   │ -            │ -       │
└─────────────┴────────┴──────────────┴─────────┘
```

**状态说明**:
- 🟢 空闲 (idle): 可以接受新任务
- 🔵 忙碌 (busy): 正在执行任务
- 🟡 暂停 (paused): 任务暂停
- 🔴 离线 (offline): Agent 未响应

### 3. 任务进度追踪

每个任务都有详细的进度信息：

- **进度百分比**: 0-100%
- **开始时间**: 任务开始执行的时间
- **预计完成**: 计划完成时间
- **实际完成**: 实际完成时间
- **执行者**: 负责的 Agent

### 4. 延期告警

系统自动检测延期任务并标记：

- ⚠️ **即将延期**: 距离截止时间 < 2 小时
- 🔴 **已延期**: 超过截止时间未完成

---

## 任务管理

### 创建任务

#### 方法 1: 命令行创建

```bash
# 创建任务文件
cat > tasks/TASK-20260313-001.md << EOF
# 任务名称
**任务 ID**: TASK-20260313-001
**任务名称**: 完成 API 文档
**优先级**: P1
**状态**: PENDING
**执行者**: xiaoyun-dev
**截止时间**: 2026-03-14 12:00
**描述**: 编写完整的 API 参考文档
EOF

# 同步到数据库
pnpm run sync-tasks
```

#### 方法 2: 使用 API

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "TASK-20260313-001",
    "name": "完成 API 文档",
    "priority": "P1",
    "assignee": "xiaoyun-dev",
    "deadline": "2026-03-14T12:00:00Z"
  }'
```

### 任务文件结构

```markdown
# 任务标题

**任务 ID**: TASK-YYYYMMDD-XXX
**任务名称**: [任务名称]
**优先级**: P0|P1|P2|P3
**状态**: PENDING|IN_PROGRESS|COMPLETED
**执行者**: [Agent ID]
**创建时间**: YYYY-MM-DD HH:MM
**截止时间**: YYYY-MM-DD HH:MM
**进度**: 0-100

---

## 任务描述
[详细说明]

## 验收标准
- [ ] 标准 1
- [ ] 标准 2

## 备注
[额外信息]
```

### 更新任务状态

```bash
# 编辑任务文件
vim tasks/TASK-20260313-001.md

# 修改状态和进度
**状态**: IN_PROGRESS
**进度**: 50

# 同步到数据库
pnpm run sync-tasks
```

### 查看任务详情

1. 访问任务板首页
2. 点击任务 ID
3. 查看完整任务信息

或访问：http://localhost:3000/tasks/TASK-20260313-001.html

---

## Agent 管理

### 注册新 Agent

1. 编辑 `backend/src/agent-status.js`
2. 添加 Agent 配置：

```javascript
agents: [
  {
    id: 'xiaoyun-dev',
    name: '小云开发',
    emoji: '💻',
    status: 'idle',
    currentTask: null,
    progress: 0
  },
  // 添加新 Agent...
]
```

3. 创建 Agent 目录结构：

```bash
mkdir -p workspace/agents/xiaoyun-new/{inbox,tasks,memory,docs}
```

4. 重启服务

### 查看 Agent 详情

访问 API:

```bash
GET /api/agents/xiaoyun-dev
```

响应：

```json
{
  "success": true,
  "data": {
    "id": "xiaoyun-dev",
    "name": "小云开发",
    "emoji": "💻",
    "status": "busy",
    "currentTask": "TASK-20260313-001",
    "progress": 75,
    "completedTasks": 15,
    "totalTasks": 20
  }
}
```

### Agent 状态说明

| 状态 | 说明 | 自动转换 |
|------|------|----------|
| idle | 空闲，可接受任务 | → busy (分配任务时) |
| busy | 忙碌，执行任务中 | → idle (任务完成时) |
| paused | 暂停，任务暂停 | → busy (恢复时) |
| offline | 离线，未响应 | → idle (恢复连接时) |

---

## 监控与告警

### 健康检查

系统每 5 分钟自动检查 Agent 健康状态：

```bash
# 手动触发健康检查
pnpm run health-check
```

### 告警类型

#### 1. Agent 假死告警

当 Agent 超过 30 分钟未更新状态时触发：

```
⚠️ 警告：Agent 小云开发 已 35 分钟未更新状态
任务 ID: TASK-20260313-001
最后活跃：2026-03-13 10:25
```

**处理建议**:
1. 检查 Agent 日志
2. 重启 Agent 服务
3. 重新分配任务

#### 2. 任务延期告警

当任务超过截止时间未完成时触发：

```
🔴 紧急：任务 TASK-20260313-001 已延期 2 小时
执行者：小云开发
截止时间：2026-03-13 12:00
当前时间：2026-03-13 14:00
```

**处理建议**:
1. 联系执行者了解进度
2. 调整任务优先级
3. 考虑重新分配

#### 3. 队列堆积告警

当待处理任务超过 100 个时触发：

```
⚠️ 警告：待处理任务队列堆积 (120 个)
建议：增加 Agent 数量或提高处理速度
```

### 查看告警历史

访问 API:

```bash
GET /api/alerts/history
```

---

## 最佳实践

### 任务管理

1. **明确任务描述**
   - 清晰的验收标准
   - 具体的输出物说明
   - 合理的时间估算

2. **优先级管理**
   - P0: 紧急且重要 (立即处理)
   - P1: 重要不紧急 (今天完成)
   - P2: 紧急不重要 (委托处理)
   - P3: 不紧急不重要 (后续处理)

3. **及时更新状态**
   - 开始任务时更新为 IN_PROGRESS
   - 完成 50% 时更新进度
   - 完成任务时更新为 COMPLETED

### Agent 协作

1. **负载均衡**
   - 避免单个 Agent 过载
   - 根据能力分配任务
   - 定期轮询任务分配

2. **任务交接**
   - 任务变更时及时通知
   - 保留完整的任务历史
   - 文档化交接过程

3. **异常处理**
   - 设置合理的超时时间
   - 实现失败重试机制
   - 记录详细的错误日志

### 性能优化

1. **数据库优化**
   - 定期清理已完成任务
   - 建立合适的索引
   - 备份重要数据

2. **缓存策略**
   - 缓存 Agent 状态
   - 缓存任务统计
   - 设置合理的过期时间

3. **监控指标**
   - 任务完成率
   - Agent 响应时间
   - 系统资源使用率

---

## 常见问题

### Q: 如何批量创建任务？

```bash
# 创建批量任务脚本
cat > scripts/batch-create.sh << 'EOF'
#!/bin/bash
for i in {1..10}; do
  cat > tasks/TASK-20260313-$(printf "%03d" $i).md << TASK
# 批量任务 $i
**任务 ID**: TASK-20260313-$(printf "%03d" $i)
**状态**: PENDING
**执行者**: xiaoyun-dev
TASK
done
pnpm run sync-tasks
EOF

chmod +x scripts/batch-create.sh
./scripts/batch-create.sh
```

### Q: 如何导出任务数据？

```bash
# 导出为 JSON
curl http://localhost:3000/api/tasks/export > tasks-export.json

# 导出为 CSV
pnpm run export-csv
```

### Q: 如何设置定时任务？

使用 OpenClaw 的 cron 功能：

```bash
# 添加定时任务
openclaw cron add --schedule "0 9 * * *" \
  --command "pnpm run sync-tasks"
```

---

## 相关文档

- [🚀 快速开始](./QUICKSTART.md)
- [🏗️ 架构设计](./ARCHITECTURE.md)
- [📡 API 参考](./API-REFERENCE.md)
- [❓ FAQ](./FAQ.md)

---

_让每个 Agent 都高效协作，让每个任务都有完整的记忆。_ 🦞
