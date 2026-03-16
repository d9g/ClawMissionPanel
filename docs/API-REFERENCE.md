# API 接口文档

📖 **统一数据 API 接口规范**

**版本**: 2.0.0  
**端口**: 6568  
**协议**: HTTP/HTTPS  
**基础路径**: `/api`

---

## 🌐 API 概览

### 服务地址

| 环境 | 地址 |
|------|------|
| **本地** | `http://localhost:6568` |
| **线上** | `https://yun.webyoung.cn/api` |

---

### 所有端点

| 端点 | 方法 | 说明 | 页面 |
|------|------|------|------|
| `/api/dashboard/data` | GET | 仪表板完整数据 | index.html |
| `/api/tasks` | GET | 任务列表 | progress.html |
| `/api/agents` | GET | Agent 列表 | - |
| `/api/reviews` | GET | 评审数据 | reviewing.html |
| `/api/recurring` | GET | 循环任务 | - |
| `/api/stats` | GET | 统计数据 | - |

---

## 📊 接口详细定义

### 1. GET /api/dashboard/data

**说明**: 获取仪表板完整数据（首页使用）

**请求**:
```http
GET /api/dashboard/data
Host: yun.webyoung.cn
```

**响应**:
```json
{
  "success": true,
  "updatedAt": "2026-03-15T23:05:00.000Z",
  "data": {
    "stats": {
      "total": 21,
      "pending": 20,
      "in_progress": 1,
      "completed": 0,
      "blocked": 0
    },
    "total": 21,
    "all": [
      {
        "task_id": "TASK-20260311-001",
        "title": "Phase 1 基础框架 - 开发任务",
        "description": "**任务 ID**: TASK-20260311-001",
        "priority": "P0",
        "status": "IN_PROGRESS",
        "assignee": "小云开发",
        "claimed_by": null,
        "progress": 0,
        "created_at": "2026-03-15 12:31:48",
        "updated_at": "2026-03-15 12:31:48"
      }
    ],
    "in_progress": [],
    "pending": [],
    "completed": [],
    "blocked": [],
    "agents": {
      "total": 6,
      "details": {
        "xiaoyun-dev": {
          "id": "xiaoyun-dev",
          "name": "小云开发",
          "role": "developer",
          "status": "BUSY",
          "current_task_id": "TASK-20260312-001",
          "score": 100,
          "last_active_at": "2026-03-15T21:10:05.802474"
        }
      }
    },
    "activity_logs": [
      {
        "id": 3,
        "agent_id": "xiaoyun-dev",
        "action": "claim",
        "task_id": "TASK-20260312-001",
        "details": "{\"task_title\": \"任务状态更新问题定位与改进\"}",
        "created_at": "2026-03-15 13:10:05"
      }
    ]
  }
}
```

**前端使用**:
```javascript
// 文件：js/dashboard.js
const API_DASHBOARD_DATA = '/api/dashboard/data';

async function loadData() {
  const response = await fetch(API_DASHBOARD_DATA);
  const data = await response.json();
  
  // 注意：数据在 data.data 中
  const stats = data.data.stats;
  const agents = data.data.agents.details;
  const tasks = data.data.all;
  const activityLogs = data.data.activity_logs;
}
```

**常见问题**:
- ❌ 错误：读取 `data.stats` → 应该是 `data.data.stats`
- ✅ 正确：读取 `data.data.stats`

---

### 2. GET /api/tasks

**说明**: 获取任务列表（支持筛选）

**请求**:
```http
GET /api/tasks?status=IN_PROGRESS&priority=P0
Host: yun.webyoung.cn
```

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `status` | string | 否 | 任务状态筛选 |
| `priority` | string | 否 | 优先级筛选 |
| `assignee` | string | 否 | 执行者筛选 |

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "task_id": "TASK-20260311-001",
      "title": "Phase 1 基础框架 - 开发任务",
      "status": "IN_PROGRESS",
      "priority": "P0",
      "assignee": "小云开发",
      "progress": 0
    }
  ],
  "count": 1
}
```

**前端使用**:
```javascript
// 文件：progress.html
const API_ALL = '/api/tasks';

async function loadTasks() {
  const response = await fetch(API_ALL);
  const result = await response.json();
  
  if (result.success && result.data) {
    const inProgress = result.data.filter(t => t.status === 'IN_PROGRESS');
    renderTaskList(inProgress);
  }
}
```

---

### 3. GET /api/agents

**说明**: 获取所有 Agent 信息

**请求**:
```http
GET /api/agents
Host: yun.webyoung.cn
```

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "xiaoyun-dev",
      "name": "小云开发",
      "role": "developer",
      "status": "BUSY",
      "current_task_id": "TASK-20260312-001",
      "score": 100,
      "last_active_at": "2026-03-15T21:10:05.802474"
    }
  ],
  "count": 6
}
```

---

### 4. GET /api/reviews

**说明**: 获取评审数据（从活动日志中提取）

**请求**:
```http
GET /api/reviews
Host: yun.webyoung.cn
```

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "agent_id": "xiaoyun-dev",
      "action": "claim",
      "task_id": "TASK-20260312-001",
      "details": "{\"task_title\": \"任务状态更新问题定位与改进\"}",
      "created_at": "2026-03-15 13:10:05"
    }
  ],
  "count": 3
}
```

**前端使用**:
```javascript
// 文件：reviewing.html
const API_DASHBOARD_DATA = '/api/dashboard/data';

async function loadReviews() {
  const response = await fetch(API_DASHBOARD_DATA);
  const data = await response.json();
  
  if (data.success) {
    // 注意：数据在 data.data.activity_logs 中
    const activityLogs = data.data.activity_logs || [];
    const reviews = activityLogs.filter(log => 
      log.action === 'review' || 
      log.action === 'claim' || 
      log.action === 'complete'
    );
    renderReviewList(reviews);
  }
}
```

---

### 5. GET /api/recurring

**说明**: 获取循环任务

**请求**:
```http
GET /api/recurring
Host: yun.webyoung.cn
```

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "每日任务板检查",
      "cron": "0 */4 * * *",
      "next_run": "2026-03-16T00:00:00Z",
      "enabled": true
    }
  ],
  "count": 1
}
```

---

### 6. GET /api/stats

**说明**: 获取统计数据

**请求**:
```http
GET /api/stats
Host: yun.webyoung.cn
```

**响应**:
```json
{
  "success": true,
  "data": {
    "tasks": {
      "total": 21,
      "available": 19,
      "assigned": 1,
      "in_progress": 1,
      "completed": 0,
      "blocked": 0
    },
    "agents": {
      "total": 6,
      "busy": 1,
      "idle": 5
    }
  }
}
```

---

## 🔧 故障排查指南

### 问题 1: 数据显示为 0

**症状**: 页面显示所有数据为 0

**原因**: 数据格式读取错误

**解决**:
```javascript
// ❌ 错误
const stats = data.stats;

// ✅ 正确
const stats = data.data.stats;
```

---

### 问题 2: API 404 错误

**症状**: `GET /api/xxx` 返回 404

**检查**:
1. API 服务是否运行：`curl http://localhost:6568/`
2. nginx 配置是否正确：`sudo nginx -t`
3. location 路径是否匹配

**解决**:
```bash
# 重启 API 服务
cd /home/admin/.openclaw/workspace/task-board/backend
python3 unified-api.py

# 重载 nginx
sudo nginx -t && sudo systemctl reload nginx
```

---

### 问题 3: CORS 错误

**症状**: 浏览器控制台显示 CORS 错误

**原因**: 跨域请求被阻止

**解决**:
- ✅ API 已配置 CORS（允许所有来源）
- ✅ 使用相对路径 `/api/xxx`
- ✅ nginx 已配置反向代理

---

### 问题 4: 502 Bad Gateway

**症状**: 页面显示 502 错误

**原因**: API 服务未运行

**解决**:
```bash
# 检查 API 服务
ps aux | grep unified-api

# 启动 API 服务
cd /home/admin/.openclaw/workspace/task-board/backend
python3 unified-api.py
```

---

## 📝 页面与 API 对应关系

| 页面 | 使用的 API | JS 文件 |
|------|-----------|---------|
| **index.html** | `/api/dashboard/data` | `js/dashboard.js` |
| **progress.html** | `/api/tasks` | `progress.html` (内嵌) |
| **reviewing.html** | `/api/dashboard/data` | `reviewing.html` (内嵌) |
| **feed.html** | - | - |
| **requirements.html** | - | - |

---

## 🚀 服务管理

### 启动 API 服务

```bash
cd /home/admin/.openclaw/workspace/task-board/backend
python3 unified-api.py
```

**端口**: 6568  
**进程**: 1 个

---

### 检查服务状态

```bash
# 检查进程
ps aux | grep unified-api

# 检查端口
netstat -tlnp | grep 6568

# 测试 API
curl -s "http://localhost:6568/" | jq .message
```

---

### 停止服务

```bash
pkill -f "python3.*unified-api"
```

---

## 📖 相关文档

| 文档 | 路径 | 说明 |
|------|------|------|
| **API 源码** | `task-board/backend/unified-api.py` | 统一 API (7.5KB) |
| **修复报告** | `docs/ISSUE-FIX-20260315-005-FINAL-FIX.md` | 最终修复报告 |
| **优化报告** | `docs/API-OPTIMIZATION-20260315.md` | 端口优化报告 |

---

## 🎯 数据格式规范

### 统一响应格式

**所有 API 响应**:
```json
{
  "success": true,
  "data": { ... },
  "count": 0,
  "message": "可选消息"
}
```

**错误响应**:
```json
{
  "success": false,
  "error": "错误描述",
  "code": "错误代码"
}
```

---

### 前端读取规范

**统一读取方式**:
```javascript
const response = await fetch('/api/xxx');
const result = await response.json();

if (result.success) {
  const data = result.data;  // 实际数据在 result.data 中
  // 处理数据...
}
```

**注意**:
- ✅ 始终检查 `result.success`
- ✅ 数据在 `result.data` 中
- ✅ 列表数据在 `result.data` 或 `result.data.data` 中

---

**文档版本**: 2.0.0  
**最后更新**: 2026-03-15 23:10  
**维护人**: 小云 ☁️

---

_所有 API 接口定义已记录！后续问题可直接查阅此文档！_ ✅☁️
