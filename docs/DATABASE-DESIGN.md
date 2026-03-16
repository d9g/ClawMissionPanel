# ClawMissionPanel 数据库设计文档

**版本**: v1.0  
**创建时间**: 2026-03-16  
**最后更新**: 2026-03-16  
**数据库**: SQLite (`task-board.db`)

---

## 📊 数据库概述

ClawMissionPanel 使用 SQLite 作为数据存储，支持多 Agent 任务调度与监控系统的核心功能。

**数据库位置**: `/home/admin/.openclaw/workspace/task-board/database/task-board.db`

**设计原则**:
- 轻量级、嵌入式、无需独立数据库服务
- 支持事务和并发读写
- 易于备份和恢复
- 字段扩展性强

---

## 📋 数据表结构

### 1. tasks - 任务主表

**用途**: 存储所有任务的基本信息、状态、进度等

```sql
CREATE TABLE tasks (
    -- 基础信息
    id TEXT PRIMARY KEY,              -- 任务 ID (如：TASK-20260316-001)
    title TEXT NOT NULL,              -- 任务标题
    description TEXT,                 -- 任务描述
    priority TEXT DEFAULT 'P2',       -- 优先级：P0/P1/P2/P3
    status TEXT DEFAULT 'AVAILABLE',  -- 状态：见状态流转说明
    assignee TEXT,                    -- 执行者 (Agent ID)
    
    -- 认领信息
    claimed_by TEXT,                  -- 认领者
    claimed_at TIMESTAMP,             -- 认领时间
    
    -- 时间信息
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 更新时间
    deadline TIMESTAMP,               -- 截止时间
    
    -- 进度与工时
    progress INTEGER DEFAULT 0,       -- 进度百分比 (0-100)
    estimated_hours INTEGER,          -- 预计工时
    actual_hours INTEGER,             -- 实际工时
    
    -- 任务关系
    module_id TEXT,                   -- 所属模块
    parent_task_id TEXT,              -- 父任务 ID
    dependencies TEXT,                -- 依赖任务 (JSON 数组)
    metadata TEXT,                    -- 扩展元数据 (JSON)
    
    -- 阻塞相关
    blocked_reason TEXT,              -- 阻塞原因
    blocked_at TIMESTAMP,             -- 阻塞时间
    unblock_reason TEXT,              -- 解除阻塞原因
    unblocked_at TIMESTAMP,           -- 解除阻塞时间
    unblocked_by TEXT,                -- 解除阻塞操作者
    
    -- 评审相关
    reviewed_by TEXT,                 -- 评审者
    reviewed_at TIMESTAMP,            -- 评审时间
    review_result TEXT,               -- 评审结果：approved/rejected
    review_comments TEXT,             -- 评审意见
    
    -- 验收相关
    accepted_by TEXT,                 -- 验收者
    accepted_at TIMESTAMP,            -- 验收时间
    acceptance_result TEXT,           -- 验收结果：accepted/rejected
    acceptance_comments TEXT,         -- 验收意见
    
    --  recurring tasks
    is_recurring INTEGER DEFAULT 0,   -- 是否 recurring 任务
    recurring_config_id INTEGER,      -- recurring 配置 ID
    run_number INTEGER DEFAULT 0      -- 运行次数
);
```

**索引**:
```sql
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_claimed_by ON tasks(claimed_by);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
```

---

### 2. agents - Agent 信息表

**用途**: 存储 Agent 的基本信息和状态

```sql
CREATE TABLE agents (
    id TEXT PRIMARY KEY,              -- Agent ID (如：xiaoyun-dev)
    name TEXT NOT NULL,               -- 显示名称
    emoji TEXT,                       -- Emoji 图标
    status TEXT DEFAULT 'IDLE',       -- 状态：IDLE/BUSY/ERROR/OFFLINE
    current_task TEXT,                -- 当前任务 ID
    progress INTEGER DEFAULT 0,       -- 当前任务进度
    last_seen TIMESTAMP,              -- 最后活跃时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT                     -- 扩展信息 (JSON)
);
```

---

### 3. task_reviews - 评审记录表

**用途**: 存储任务评审的详细记录

```sql
CREATE TABLE task_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,            -- 任务 ID
    reviewer TEXT NOT NULL,           -- 评审者
    result TEXT NOT NULL,             -- 结果：approved/rejected
    comments TEXT,                    -- 评审意见
    reasons TEXT,                     -- 驳回原因
    suggestions TEXT,                 -- 改进建议
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);
```

---

### 4. task_acceptances - 验收记录表

**用途**: 存储任务验收的详细记录

```sql
CREATE TABLE task_acceptances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,            -- 任务 ID
    acceptor TEXT NOT NULL,           -- 验收者
    result TEXT NOT NULL,             -- 结果：accepted/rejected
    comments TEXT,                    -- 验收意见
    reasons TEXT,                     -- 驳回原因
    suggestions TEXT,                 -- 改进建议
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);
```

---

### 5. recurring_tasks - Recurring 任务配置表

**用途**: 存储 recurring 任务的配置信息

```sql
CREATE TABLE recurring_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,               -- recurring 任务名称
    description TEXT,                 -- 描述
    cron_expr TEXT NOT NULL,          -- Cron 表达式
    timezone TEXT DEFAULT 'UTC',      -- 时区
    template_task_id TEXT,            -- 模板任务 ID
    enabled INTEGER DEFAULT 1,        -- 是否启用
    last_run TIMESTAMP,               -- 最后运行时间
    next_run TIMESTAMP,               -- 下次运行时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT                     -- 扩展配置 (JSON)
);
```

---

### 6. task_logs - 任务日志表

**用途**: 存储任务的生命周期日志

```sql
CREATE TABLE task_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,            -- 任务 ID
    action TEXT NOT NULL,             -- 操作：created/started/blocked/unblocked/completed/cancelled
    actor TEXT,                       -- 操作者
    old_value TEXT,                   -- 旧值 (JSON)
    new_value TEXT,                   -- 新值 (JSON)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);
```

---

### 7. modules - 模块表

**用途**: 存储项目模块信息

```sql
CREATE TABLE modules (
    id TEXT PRIMARY KEY,              -- 模块 ID (如：MODULE-001)
    name TEXT NOT NULL,               -- 模块名称
    description TEXT,                 -- 模块描述
    parent_id TEXT,                   -- 父模块 ID
    order_index INTEGER DEFAULT 0,    -- 排序索引
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_id) REFERENCES modules(id)
);
```

---

## 🔄 任务状态流转

### 状态枚举

```
AVAILABLE    - 可认领
ASSIGNED     - 已分配
CLAIMED      - 已认领
IN_PROGRESS  - 进行中
BLOCKED      - 阻塞
PENDING_REVIEW    - 待评审
REVIEWING         - 评审中
REVIEW_APPROVED   - 评审通过
REVIEW_REJECTED   - 评审驳回
PENDING_ACCEPTANCE - 待验收
ACCEPTING          - 验收中
ACCEPTED           - 验收通过
REJECTED           - 验收驳回
COMPLETED    - 已完成
CANCELLED    - 已取消
```

### 状态流转图

```
AVAILABLE → ASSIGNED → CLAIMED → IN_PROGRESS → COMPLETED
                                     ↓
                                  BLOCKED → IN_PROGRESS
                                     ↓
                              PENDING_REVIEW → REVIEWING
                                     ↓              ↓
                              REVIEW_REJECTED ← REVIEW_APPROVED
                                     ↓
                              PENDING_ACCEPTANCE → ACCEPTING
                                     ↓                  ↓
                              REJECTED ←←←←←←←←←←← ACCEPTED → COMPLETED
```

---

## 📝 常用 SQL 查询

### 1. 获取所有活跃任务

```sql
SELECT * FROM tasks 
WHERE status NOT IN ('COMPLETED', 'CANCELLED')
ORDER BY 
    CASE priority WHEN 'P0' THEN 0 WHEN 'P1' THEN 1 WHEN 'P2' THEN 2 ELSE 3 END,
    created_at DESC;
```

### 2. 获取阻塞任务

```sql
SELECT 
    id, title, assignee, priority,
    blocked_reason, blocked_at,
    ROUND((julianday('now') - julianday(blocked_at)) * 24, 1) as hours_blocked
FROM tasks 
WHERE status = 'BLOCKED'
ORDER BY hours_blocked DESC;
```

### 3. 获取 Agent 当前任务

```sql
SELECT t.* 
FROM tasks t
WHERE t.assignee = ? AND t.status = 'IN_PROGRESS';
```

### 4. 获取任务评审历史

```sql
SELECT * FROM task_reviews 
WHERE task_id = ?
ORDER BY created_at DESC;
```

### 5. 获取任务统计

```sql
SELECT 
    status,
    COUNT(*) as count,
    ROUND(AVG(progress), 1) as avg_progress
FROM tasks
GROUP BY status;
```

---

## 🔧 数据库维护

### 备份数据库

```bash
# 备份到指定位置
cp /home/admin/.openclaw/workspace/task-board/database/task-board.db \
   /home/admin/.openclaw/workspace/person/xiaoyun/backups/xiaoyun/database/task-board-$(date +%Y%m%d-%H%M%S).db
```

### 恢复数据库

```bash
# 从备份恢复
cp /path/to/backup.db /home/admin/.openclaw/workspace/task-board/database/task-board.db
```

### 数据库优化

```bash
# 清理未使用的空间
sqlite3 /home/admin/.openclaw/workspace/task-board/database/task-board.db "VACUUM;"

# 检查数据库完整性
sqlite3 /home/admin/.openclaw/workspace/task-board/database/task-board.db "PRAGMA integrity_check;"
```

---

## 📊 数据字典

### 优先级 (priority)

| 值 | 含义 | 响应要求 |
|----|------|----------|
| P0 | 紧急 | 立即处理 |
| P1 | 高 | 2 小时内 |
| P2 | 中 | 24 小时内 |
| P3 | 低 | 本周内 |

### Agent 状态 (agents.status)

| 值 | 含义 |
|----|------|
| IDLE | 空闲，可分配任务 |
| BUSY | 忙碌，有任务在执行 |
| ERROR | 错误，需要检查 |
| OFFLINE | 离线，无法分配 |

### 评审结果 (task_reviews.result)

| 值 | 含义 |
|----|------|
| approved | 评审通过，可以开始开发 |
| rejected | 评审驳回，需要修改 |

### 验收结果 (task_acceptances.result)

| 值 | 含义 |
|----|------|
| accepted | 验收通过，任务完成 |
| rejected | 验收驳回，需要返工 |

---

## 🔗 相关文件

| 文件 | 路径 | 说明 |
|------|------|------|
| **数据库文件** | `task-board/database/task-board.db` | SQLite 数据库 |
| **Schema 导出** | `task-board/docs/DATABASE-SCHEMA.md` | 原始 Schema |
| **API 文档** | `task-board/docs/API-REFERENCE.md` | API 接口说明 |
| **后端代码** | `task-board/src/` | 后端服务代码 |

---

## 📝 变更记录

### v1.0 (2026-03-16)

**新增**:
- ✅ tasks 表完整字段（包含阻塞、评审、验收）
- ✅ agents 表
- ✅ task_reviews 表
- ✅ task_acceptances 表
- ✅ recurring_tasks 表
- ✅ task_logs 表
- ✅ modules 表

**修改**:
- ✅ 添加阻塞相关字段（blocked_reason, blocked_at 等）
- ✅ 添加评审相关字段（reviewed_by, review_result 等）
- ✅ 添加验收相关字段（accepted_by, acceptance_result 等）

---

_让每个任务都有完整的记忆，让每个 Agent 都高效协作！_ 🦞☁️
