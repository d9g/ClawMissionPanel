# 🏗️ 架构设计 - ClawMissionPanel

**系统架构与技术设计文档**

---

## 📋 目录

1. [系统概述](#系统概述)
2. [架构分层](#架构分层)
3. [核心模块](#核心模块)
4. [数据模型](#数据模型)
5. [API 设计](#api 设计)
6. [部署架构](#部署架构)

---

## 系统概述

### 系统定位

ClawMissionPanel 是一个多 Agent 任务调度与监控系统，作为 OpenClaw 生态的可视化前端，提供：
- 任务管理界面
- Agent 状态监控
- 进度追踪与告警
- 数据统计分析

### 设计原则

1. **简洁性** - 使用原生技术栈，避免过度工程
2. **可扩展性** - 模块化设计，易于添加新功能
3. **可靠性** - 数据持久化，故障恢复
4. **易用性** - 直观的界面，简单的部署

---

## 架构分层

```
┌─────────────────────────────────────────┐
│          Presentation Layer             │
│  ┌─────────────┐  ┌─────────────────┐  │
│  │  Task Board │  │  Task Details   │  │
│  │   (HTML)    │  │     (HTML)      │  │
│  └─────────────┘  └─────────────────┘  │
│         CSS             JavaScript       │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│            API Layer                    │
│  ┌─────────────────────────────────┐    │
│  │        Express Server           │    │
│  │  /api/agents  /api/tasks  ...   │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│          Business Logic Layer           │
│  ┌──────────┐  ┌──────────┐  ┌───────┐ │
│  │  Agent   │  │  Task    │  │ Alert │ │
│  │ Manager  │  │ Manager  │  │System │ │
│  └──────────┘  └──────────┘  └───────┘ │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│           Data Access Layer             │
│  ┌─────────────────────────────────┐    │
│  │      SQLite Database            │    │
│  │   (better-sqlite3)              │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

---

## 核心模块

### 1. 前端模块 (frontend/)

```
frontend/
├── index.html          # 任务板首页
├── css/
│   └── dashboard.css   # 样式表
├── js/
│   └── dashboard.js    # 前端逻辑
└── tasks/              # 任务详情页
    └── *.html
```

**职责**:
- 渲染任务看板
- 显示 Agent 状态
- 实时更新数据 (WebSocket)
- 用户交互处理

**技术栈**:
- HTML5 + CSS3
- 原生 JavaScript (无框架)
- Fetch API (HTTP 请求)
- WebSocket (实时更新)

### 2. 后端服务 (backend/)

```
backend/
├── src/
│   ├── server.js           # Express 服务器
│   ├── agent-status.js     # Agent 状态管理
│   ├── task-stats.js       # 任务统计
│   └── health-check.js     # 健康检查
├── scripts/
│   ├── sync-all-tasks.js   # 任务同步脚本
│   └── generate-task-html.js  # 生成详情页
└── package.json
```

#### 2.1 服务器模块 (server.js)

**职责**:
- HTTP 服务器 (Express)
- RESTful API 路由
- WebSocket 连接管理
- 静态文件服务

**核心代码结构**:

```javascript
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// API 路由
app.use('/api/agents', agentsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/alerts', alertsRouter);

// WebSocket 广播
function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// 定时更新
setInterval(() => {
  const status = getAgentStatus();
  broadcast({ type: 'agent-update', data: status });
}, 5000);
```

#### 2.2 Agent 状态管理 (agent-status.js)

**职责**:
- 维护 Agent 状态列表
- 检测 Agent 心跳
- 计算任务进度
- 生成状态报告

**数据结构**:

```javascript
{
  agents: [
    {
      id: 'xiaoyun-dev',
      name: '小云开发',
      emoji: '💻',
      status: 'idle|busy|paused|offline',
      currentTask: 'TASK-XXX',
      progress: 0-100,
      lastHeartbeat: timestamp,
      completedTasks: 0,
      totalTasks: 0
    }
  ]
}
```

**心跳检测逻辑**:

```javascript
function checkAgentHealth() {
  const now = Date.now();
  agents.forEach(agent => {
    const diff = now - agent.lastHeartbeat;
    if (diff > 30 * 60 * 1000) {  // 30 分钟
      agent.status = 'offline';
      triggerAlert('agent-offline', agent);
    }
  });
}
```

#### 2.3 任务统计模块 (task-stats.js)

**职责**:
- 聚合任务数据
- 计算统计数据
- 生成进度报告

**统计指标**:

```javascript
{
  total: 100,
  completed: 70,
  inProgress: 10,
  pending: 15,
  overdue: 5,
  completionRate: 70,
  avgCompletionTime: '2.5h'
}
```

### 3. 数据库模块 (database/)

```
database/
└── task-board.db   # SQLite 数据库
```

**表结构**:

```sql
-- 任务表
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  priority TEXT DEFAULT 'P2',
  status TEXT DEFAULT 'PENDING',
  assignee TEXT,
  progress INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deadline DATETIME,
  completed_at DATETIME
);

-- Agent 表
CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT,
  status TEXT DEFAULT 'idle',
  current_task TEXT,
  progress INTEGER DEFAULT 0,
  last_heartbeat DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 告警表
CREATE TABLE alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT,
  context TEXT,  -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME
);
```

---

## 数据模型

### 任务 (Task)

```typescript
interface Task {
  id: string;              // TASK-YYYYMMDD-XXX
  name: string;            // 任务名称
  priority: 'P0'|'P1'|'P2'|'P3';
  status: 'PENDING'|'IN_PROGRESS'|'COMPLETED'|'OVERDUE';
  assignee: string;        // Agent ID
  progress: number;        // 0-100
  createdAt: Date;
  updatedAt: Date;
  deadline?: Date;
  completedAt?: Date;
  description?: string;
  acceptanceCriteria?: string[];
}
```

### Agent

```typescript
interface Agent {
  id: string;              // xiaoyun-dev
  name: string;            // 小云开发
  emoji: string;           // 💻
  status: 'idle'|'busy'|'paused'|'offline';
  currentTask?: string;    // Task ID
  progress: number;        // 0-100
  lastHeartbeat: Date;
  completedTasks: number;
  totalTasks: number;
}
```

### 告警 (Alert)

```typescript
interface Alert {
  id: number;
  type: 'agent-offline'|'task-overdue'|'queue-backup';
  severity: 'info'|'warning'|'critical';
  message: string;
  context: object;         // 相关数据
  createdAt: Date;
  resolvedAt?: Date;
}
```

---

## API 设计

### RESTful API

#### 获取 Agent 状态

```http
GET /api/agents/status
```

**响应**:

```json
{
  "success": true,
  "data": [
    {
      "id": "xiaoyun-dev",
      "name": "小云开发",
      "emoji": "💻",
      "status": "busy",
      "currentTask": "TASK-20260313-001",
      "progress": 75
    }
  ]
}
```

#### 获取任务统计

```http
GET /api/tasks/stats
```

**响应**:

```json
{
  "success": true,
  "data": {
    "total": 100,
    "completed": 70,
    "inProgress": 10,
    "pending": 15,
    "overdue": 5
  }
}
```

#### 获取任务列表

```http
GET /api/tasks?status=PENDING&priority=P1
```

**查询参数**:
- `status`: 任务状态筛选
- `priority`: 优先级筛选
- `assignee`: 执行者筛选
- `limit`: 返回数量限制

#### 创建任务

```http
POST /api/tasks
Content-Type: application/json

{
  "taskId": "TASK-20260313-001",
  "name": "完成 API 文档",
  "priority": "P1",
  "assignee": "xiaoyun-dev",
  "deadline": "2026-03-14T12:00:00Z"
}
```

#### 更新任务状态

```http
PUT /api/tasks/TASK-20260313-001
Content-Type: application/json

{
  "status": "IN_PROGRESS",
  "progress": 50
}
```

### WebSocket API

#### 连接

```javascript
const ws = new WebSocket('ws://localhost:3000');
```

#### 消息格式

**服务器 → 客户端**:

```json
{
  "type": "agent-update",
  "data": [...]
}

{
  "type": "task-update",
  "data": {...}
}

{
  "type": "alert",
  "data": {...}
}
```

---

## 部署架构

### 开发环境

```
┌─────────────────┐
│   Developer     │
│    Browser      │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Node.js Server │
│  (localhost:    │
│   3000)         │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  SQLite DB      │
│  (local file)   │
└─────────────────┘
```

### 生产环境

```
┌─────────────────┐
│     Users       │
│    Browser      │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│    Nginx        │
│  (Reverse Proxy)│
│  Port 80/443    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Node.js Server │
│  (PM2管理)      │
│  Port 3000      │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  SQLite DB      │
│  (persistent)   │
└─────────────────┘
```

### 高可用架构 (未来)

```
┌─────────────────┐
│  Load Balancer  │
│   (Nginx/HA)    │
└────────┬────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌─────────┐ ┌─────────┐
│ Node #1 │ │ Node #2 │
│ (PM2)   │ │ (PM2)   │
└────┬────┘ └────┬────┘
     │           │
     └─────┬─────┘
           ↓
     ┌───────────┐
     │  SQLite   │
     │ (WAL 模式)│
     └───────────┘
```

---

## 安全设计

### 1. 输入验证

```javascript
// 验证任务 ID 格式
function validateTaskId(id) {
  return /^TASK-\d{8}-\d{3}$/.test(id);
}

// 验证优先级
const VALID_PRIORITIES = ['P0', 'P1', 'P2', 'P3'];
if (!VALID_PRIORITIES.includes(priority)) {
  throw new Error('Invalid priority');
}
```

### 2. SQL 注入防护

```javascript
// 使用参数化查询
const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
const task = stmt.get(taskId);
```

### 3. 文件访问控制

```javascript
// 限制文件访问范围
app.use('/tasks', express.static('tasks', {
  dotfiles: 'deny',
  extensions: ['html']
}));
```

---

## 性能优化

### 1. 数据库优化

- 使用 WAL 模式提高并发
- 为常用查询创建索引
- 定期清理历史数据

```sql
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assignee ON tasks(assignee);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);
```

### 2. 缓存策略

```javascript
// 缓存 Agent 状态 (5 秒)
const agentStatusCache = new NodeCache({ stdTTL: 5 });

function getAgentStatus() {
  const cached = agentStatusCache.get('status');
  if (cached) return cached;
  
  const status = calculateStatus();
  agentStatusCache.set('status', status);
  return status;
}
```

### 3. 批量操作

```javascript
// 批量同步任务
function syncTasksBatch(tasks) {
  const insert = db.prepare('INSERT OR REPLACE INTO tasks ...');
  const updateMany = db.transaction((tasks) => {
    for (const task of tasks) {
      insert.run(task);
    }
  });
  updateMany(tasks);
}
```

---

## 扩展性设计

### 插件系统 (未来)

```javascript
// 插件接口
interface Plugin {
  name: string;
  version: string;
  onLoad(app: Express): void;
  onTaskCreate(task: Task): void;
  onTaskComplete(task: Task): void;
}

// 插件注册
const plugins = [];
function registerPlugin(plugin: Plugin) {
  plugins.push(plugin);
  plugin.onLoad(app);
}
```

### 分布式支持 (未来)

- Redis 作为共享状态存储
- 消息队列处理任务分发
- 多节点负载均衡

---

## 相关文档

- [📡 API 参考](./API-REFERENCE.md)
- [🔧 开发指南](./DEVELOPER-GUIDE.md)
- [🚀 部署指南](./DEPLOYMENT.md)

---

_架构设计文档，指导系统开发与演进。_ 🦞
