# 任务全生命周期自动追踪系统 - 设计方案

**版本**: v2.0
**日期**: 2026-03-13
**目标**: 实现从需求产生到结束的自动追踪，无需手动更新状态

---

## 🎯 核心问题

### 当前问题
1. ❌ 任务状态需要手动运行 `sync-tasks.js` 同步
2. ❌ 阻塞任务没有自动检测和展示
3. ❌ 网页上看不到实时任务列表
4. ❌ 任务环节变更没有自动记录

### 用户需求
> "需要任务产生时就开始记录，在任务的不同环节更新成不同的状态。阻塞的任务能在网页展示出来，不用每次都询问。"

---

## 📋 解决方案

### 1. 任务状态机增强

```
需求提出 → 待审批 → 已审批 → 待分配 → 已分配 → 进行中 → 待验收 → 已完成
                ↓          ↓          ↓          ↓          ↓
            已拒绝    已取消    阻塞中    延期    验收失败
```

### 2. 自动状态更新触发器

| 触发事件 | 自动动作 | 状态变更 |
|---------|---------|---------|
| 创建任务文件 | 自动写入数据库 | DRAFT → PENDING |
| 分配执行者 | 自动记录分配时间 | PENDING → ASSIGNED |
| Agent 开始工作 | 检测文件修改 | ASSIGNED → IN_PROGRESS |
| 任务完成标记 | 自动通知验收 | IN_PROGRESS → COMPLETED |
| 超时未更新 | 自动标记阻塞 | IN_PROGRESS → BLOCKED |
| 依赖任务未完成 | 自动标记阻塞 | ASSIGNED → BLOCKED |

### 3. 阻塞任务自动检测

```javascript
// 阻塞规则
const BLOCKING_RULES = {
  // 规则 1: 超过预计时间未更新
  timeout: { threshold: '2h', action: 'BLOCKED' },
  
  // 规则 2: 依赖任务未完成
  dependency: { check: 'parent_task.status', action: 'BLOCKED' },
  
  // 规则 3: Agent 离线
  agent_offline: { check: 'agent.status', action: 'BLOCKED' },
  
  // 规则 4: 等待审批超时
  approval_timeout: { threshold: '4h', action: 'BLOCKED' }
};
```

### 4. 网页实时展示

#### 首页增加板块
- 🟢 **进行中任务** - 实时显示进度
- 🟡 **等待中任务** - 等待分配/审批
- 🔴 **阻塞任务** - 高亮显示，标注原因
- ✅ **今日完成** - 自动归档

#### 自动刷新
- Agent 状态：每 30 秒
- 任务列表：每 60 秒
- 阻塞告警：实时推送

---

## 🏗️ 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                    任务文件目录                          │
│         <workspace>/tasks/          │
└───────────────────┬─────────────────────────────────────┘
                    │ fs.watch 监听文件变化
                    ▼
┌─────────────────────────────────────────────────────────┐
│              任务追踪服务 (Task Tracker)                 │
│  - 监听任务文件创建/修改                                 │
│  - 自动解析任务状态                                      │
│  - 自动更新数据库                                        │
│  - 检测阻塞任务                                          │
└───────────────────┬─────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│   数据库     │ │ 通知服务 │ │   网页 API   │
│  自动更新    │ │ 阻塞告警 │ │  实时数据    │
└──────────────┘ └──────────┘ └──────────────┘
```

---

## 📝 实施计划

### Phase 1: 核心服务 (今日)
- [ ] 创建 `task-tracker.js` - 文件监听服务
- [ ] 增强状态机 - 添加 BLOCKED 状态
- [ ] API 增加 `/api/tasks/blocked` 接口
- [ ] 网页增加阻塞任务展示区

### Phase 2: 自动检测 (明日)
- [ ] 实现超时检测逻辑
- [ ] 实现依赖检测逻辑
- [ ] Agent 健康检查集成
- [ ] 阻塞原因自动标注

### Phase 3: 可视化 (后日)
- [ ] 任务时间轴展示
- [ ] 进度自动计算
- [ ] 延期预警
- [ ] 完成报告生成

---

## 🔧 技术细节

### 文件监听实现
```javascript
const fs = require('fs');
const chokidar = require('chokidar');

// 监听任务目录
const watcher = chokidar.watch(TASKS_DIR, {
  ignored: /node_modules/,
  persistent: true,
  ignoreInitial: false
});

watcher
  .on('add', path => handleNewTask(path))
  .on('change', path => handleTaskUpdate(path))
  .on('unlink', path => handleTaskDelete(path));
```

### 状态自动解析
```javascript
function parseTaskStatus(content) {
  const statusMatch = content.match(/^status:\s*(.+)/im);
  const assigneeMatch = content.match(/^分配给:\s*(.+)/im);
  const progressMatch = content.match(/^进度:\s*(.+)/im);
  
  return {
    status: statusMatch ? statusMatch[1].trim() : 'UNKNOWN',
    assignee: assigneeMatch ? assigneeMatch[1].trim() : null,
    progress: progressMatch ? parseInt(progressMatch[1]) : 0
  };
}
```

### 阻塞检测逻辑
```javascript
async function checkBlockedTasks() {
  const tasks = await db.all('SELECT * FROM tasks WHERE status = "IN_PROGRESS"');
  const now = Date.now();
  
  for (const task of tasks) {
    const lastUpdate = new Date(task.updated_at).getTime();
    const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);
    
    if (hoursSinceUpdate > 2) {
      await markAsBlocked(task.task_id, `超过${hoursSinceUpdate.toFixed(1)}小时未更新`);
    }
  }
}
```

---

## 📊 预期效果

### 用户视角
1. **创建任务** → 自动出现在网页上
2. **分配执行者** → 状态自动变更为"已分配"
3. **Agent 开始工作** → 状态自动变更为"进行中"
4. **任务阻塞** → 网页红色高亮，标注原因
5. **任务完成** → 自动归档，生成报告

### 管理员视角
- 无需手动同步状态
- 阻塞任务一目了然
- 全生命周期可追踪
- 历史数据完整记录

---

_设计完成，等待实施！_ 🚀
