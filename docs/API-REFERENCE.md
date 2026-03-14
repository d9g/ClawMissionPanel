# 📡 API 参考 - ClawMissionPanel

**完整的 API 接口文档**

---

## 📋 目录

1. [概述](#概述)
2. [认证](#认证)
3. [Agent 相关 API](#agent 相关-api)
4. [任务相关 API](#任务相关-api)
5. [告警相关 API](#告警相关-api)
6. [统计相关 API](#统计相关-api)
7. [WebSocket API](#websocket-api)
8. [错误处理](#错误处理)

---

## 概述

### Base URL

```
开发环境：http://localhost:3000/api
生产环境：https://your-domain.com/api
```

### 请求格式

- Content-Type: `application/json`
- 字符编码：`UTF-8`

### 响应格式

所有 API 响应遵循统一格式：

```json
{
  "success": true|false,
  "data": {...}|[...],
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述"
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 认证

### API Key 认证

在请求头中添加 API Key：

```http
Authorization: Bearer YOUR_API_KEY
```

### 示例

```bash
curl -X GET http://localhost:3000/api/agents/status \
  -H "Authorization: Bearer your_api_key_here"
```

---

## Agent 相关 API

### 获取所有 Agent 状态

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
      "progress": 75,
      "lastHeartbeat": "2026-03-13T10:30:00Z",
      "completedTasks": 15,
      "totalTasks": 20
    },
    {
      "id": "xiaoyun-test",
      "name": "小云测试",
      "emoji": "✅",
      "status": "idle",
      "currentTask": null,
      "progress": 0,
      "lastHeartbeat": "2026-03-13T10:29:00Z",
      "completedTasks": 10,
      "totalTasks": 10
    }
  ]
}
```

### 获取单个 Agent 详情

```http
GET /api/agents/:agentId
```

**路径参数**:
- `agentId`: Agent ID (如：xiaoyun-dev)

**响应**:

```json
{
  "success": true,
  "data": {
    "id": "xiaoyun-dev",
    "name": "小云开发",
    "emoji": "💻",
    "status": "busy",
    "currentTask": {
      "id": "TASK-20260313-001",
      "name": "完成 API 文档",
      "progress": 75
    },
    "recentTasks": [
      {
        "id": "TASK-20260312-008",
        "name": "修复 Bug",
        "status": "COMPLETED",
        "completedAt": "2026-03-12T18:00:00Z"
      }
    ],
    "statistics": {
      "completedTasks": 15,
      "totalTasks": 20,
      "completionRate": 75,
      "avgCompletionTime": "2.5h"
    }
  }
}
```

### 更新 Agent 状态

```http
PUT /api/agents/:agentId/status
Content-Type: application/json

{
  "status": "busy",
  "currentTask": "TASK-20260313-001",
  "progress": 50
}
```

**请求体**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | idle\|busy\|paused\|offline |
| currentTask | string | 否 | 任务 ID |
| progress | number | 否 | 0-100 |

**响应**:

```json
{
  "success": true,
  "data": {
    "id": "xiaoyun-dev",
    "status": "busy",
    "updatedAt": "2026-03-13T10:30:00Z"
  }
}
```

### 发送心跳

```http
POST /api/agents/:agentId/heartbeat
Content-Type: application/json

{
  "currentTask": "TASK-20260313-001",
  "progress": 50,
  "message": "正常执行中"
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "acknowledged": true,
    "timestamp": "2026-03-13T10:30:00Z"
  }
}
```

---

## 任务相关 API

### 获取任务列表

```http
GET /api/tasks
```

**查询参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| status | string | 状态筛选：PENDING\|IN_PROGRESS\|COMPLETED |
| priority | string | 优先级筛选：P0\|P1\|P2\|P3 |
| assignee | string | 执行者筛选 |
| overdue | boolean | 是否只返回延期任务 |
| page | number | 页码 (默认 1) |
| limit | number | 每页数量 (默认 20) |
| sort | string | 排序字段：created_at\|deadline\|priority |
| order | string | 排序方向：asc\|desc |

**示例**:

```bash
GET /api/tasks?status=PENDING&priority=P1&page=1&limit=10
```

**响应**:

```json
{
  "success": true,
  "data": [
    {
      "id": "TASK-20260313-001",
      "name": "完成 API 文档",
      "priority": "P1",
      "status": "PENDING",
      "assignee": "xiaoyun-dev",
      "progress": 0,
      "createdAt": "2026-03-13T08:00:00Z",
      "deadline": "2026-03-14T12:00:00Z",
      "isOverdue": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25
  }
}
```

### 获取任务详情

```http
GET /api/tasks/:taskId
```

**路径参数**:
- `taskId`: 任务 ID

**响应**:

```json
{
  "success": true,
  "data": {
    "id": "TASK-20260313-001",
    "name": "完成 API 文档",
    "priority": "P1",
    "status": "IN_PROGRESS",
    "assignee": {
      "id": "xiaoyun-dev",
      "name": "小云开发"
    },
    "progress": 50,
    "createdAt": "2026-03-13T08:00:00Z",
    "updatedAt": "2026-03-13T10:00:00Z",
    "deadline": "2026-03-14T12:00:00Z",
    "description": "编写完整的 API 参考文档",
    "acceptanceCriteria": [
      "包含所有 API 接口",
      "提供请求示例",
      "包含响应示例"
    ],
    "history": [
      {
        "timestamp": "2026-03-13T08:00:00Z",
        "action": "created",
        "by": "system"
      },
      {
        "timestamp": "2026-03-13T09:00:00Z",
        "action": "started",
        "by": "xiaoyun-dev"
      },
      {
        "timestamp": "2026-03-13T10:00:00Z",
        "action": "progress_updated",
        "progress": 50,
        "by": "xiaoyun-dev"
      }
    ]
  }
}
```

### 创建任务

```http
POST /api/tasks
Content-Type: application/json
```

**请求体**:

```json
{
  "taskId": "TASK-20260313-001",
  "name": "完成 API 文档",
  "priority": "P1",
  "assignee": "xiaoyun-dev",
  "deadline": "2026-03-14T12:00:00Z",
  "description": "编写完整的 API 参考文档",
  "acceptanceCriteria": [
    "包含所有 API 接口",
    "提供请求示例"
  ]
}
```

**必填字段**:
- `taskId`: 任务 ID (格式：TASK-YYYYMMDD-XXX)
- `name`: 任务名称

**可选字段**:
- `priority`: 优先级 (默认 P2)
- `assignee`: 执行者
- `deadline`: 截止时间
- `description`: 任务描述
- `acceptanceCriteria`: 验收标准

**响应**:

```json
{
  "success": true,
  "data": {
    "id": "TASK-20260313-001",
    "createdAt": "2026-03-13T08:00:00Z"
  },
  "message": "任务创建成功"
}
```

### 更新任务

```http
PUT /api/tasks/:taskId
Content-Type: application/json
```

**请求体**:

```json
{
  "status": "IN_PROGRESS",
  "progress": 50,
  "assignee": "xiaoyun-dev"
}
```

**可更新字段**:
- `status`: 任务状态
- `progress`: 进度百分比
- `assignee`: 执行者
- `priority`: 优先级
- `deadline`: 截止时间

**响应**:

```json
{
  "success": true,
  "data": {
    "id": "TASK-20260313-001",
    "updatedAt": "2026-03-13T10:00:00Z"
  }
}
```

### 删除任务

```http
DELETE /api/tasks/:taskId
```

**响应**:

```json
{
  "success": true,
  "message": "任务已删除"
}
```

### 批量更新任务状态

```http
POST /api/tasks/batch-update
Content-Type: application/json
```

**请求体**:

```json
{
  "taskIds": ["TASK-001", "TASK-002", "TASK-003"],
  "updates": {
    "status": "COMPLETED",
    "completedAt": "2026-03-13T18:00:00Z"
  }
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "updated": 3,
    "failed": 0
  }
}
```

---

## 告警相关 API

### 获取告警列表

```http
GET /api/alerts
```

**查询参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| type | string | 告警类型筛选 |
| severity | string | 严重程度：info\|warning\|critical |
| resolved | boolean | 是否只返回已解决 |
| page | number | 页码 |
| limit | number | 每页数量 |

**响应**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "task-overdue",
      "severity": "critical",
      "message": "任务 TASK-20260312-005 已延期 2 小时",
      "context": {
        "taskId": "TASK-20260312-005",
        "assignee": "xiaoyun-dev",
        "deadline": "2026-03-13T12:00:00Z"
      },
      "createdAt": "2026-03-13T14:00:00Z",
      "resolvedAt": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5
  }
}
```

### 获取告警详情

```http
GET /api/alerts/:alertId
```

**响应**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "type": "task-overdue",
    "severity": "critical",
    "message": "任务 TASK-20260312-005 已延期 2 小时",
    "context": {...},
    "createdAt": "2026-03-13T14:00:00Z",
    "resolvedAt": null,
    "actions": [
      {
        "type": "reassign",
        "label": "重新分配任务"
      },
      {
        "type": "extend",
        "label": "延长截止时间"
      }
    ]
  }
}
```

### 解决告警

```http
POST /api/alerts/:alertId/resolve
Content-Type: application/json
```

**请求体**:

```json
{
  "resolution": "已重新分配任务",
  "resolvedBy": "admin"
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "resolvedAt": "2026-03-13T15:00:00Z",
    "resolvedBy": "admin"
  }
}
```

---

## 统计相关 API

### 获取任务统计

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
    "overdue": 5,
    "completionRate": 70,
    "avgCompletionTime": "2.5h",
    "byPriority": {
      "P0": {"total": 5, "completed": 5},
      "P1": {"total": 20, "completed": 18},
      "P2": {"total": 50, "completed": 35},
      "P3": {"total": 25, "completed": 12}
    },
    "byAssignee": [
      {
        "assignee": "xiaoyun-dev",
        "total": 30,
        "completed": 25,
        "inProgress": 3
      }
    ]
  }
}
```

### 获取 Agent 统计

```http
GET /api/agents/stats
```

**响应**:

```json
{
  "success": true,
  "data": {
    "totalAgents": 5,
    "activeAgents": 3,
    "idleAgents": 2,
    "offlineAgents": 0,
    "totalTasksCompleted": 150,
    "avgTasksPerAgent": 30,
    "topPerformers": [
      {
        "id": "xiaoyun-dev",
        "name": "小云开发",
        "completedTasks": 50,
        "completionRate": 85
      }
    ]
  }
}
```

### 获取趋势数据

```http
GET /api/stats/trend?metric=tasks&period=7d
```

**查询参数**:
- `metric`: 指标类型 (tasks\|agents\|alerts)
- `period`: 时间周期 (7d\|30d\|90d)

**响应**:

```json
{
  "success": true,
  "data": {
    "metric": "tasks",
    "period": "7d",
    "points": [
      {"date": "2026-03-07", "value": 80},
      {"date": "2026-03-08", "value": 85},
      {"date": "2026-03-09", "value": 90},
      {"date": "2026-03-10", "value": 95},
      {"date": "2026-03-11", "value": 98},
      {"date": "2026-03-12", "value": 100},
      {"date": "2026-03-13", "value": 105}
    ]
  }
}
```

---

## WebSocket API

### 连接

```javascript
const ws = new WebSocket('ws://localhost:3000');
```

### 连接成功

```javascript
ws.on('open', () => {
  console.log('WebSocket 连接成功');
});
```

### 接收消息

```javascript
ws.on('message', (data) => {
  const message = JSON.parse(data);
  
  switch (message.type) {
    case 'agent-update':
      // Agent 状态更新
      console.log('Agent 状态更新:', message.data);
      break;
    case 'task-update':
      // 任务更新
      console.log('任务更新:', message.data);
      break;
    case 'alert':
      // 告警通知
      console.log('告警:', message.data);
      break;
  }
});
```

### 消息类型

#### agent-update

```json
{
  "type": "agent-update",
  "data": [
    {
      "id": "xiaoyun-dev",
      "status": "busy",
      "progress": 75
    }
  ]
}
```

#### task-update

```json
{
  "type": "task-update",
  "data": {
    "id": "TASK-20260313-001",
    "status": "IN_PROGRESS",
    "progress": 50
  }
}
```

#### alert

```json
{
  "type": "alert",
  "data": {
    "id": 1,
    "type": "task-overdue",
    "severity": "critical",
    "message": "任务已延期"
  }
}
```

### 发送心跳

```javascript
ws.send(JSON.stringify({
  type: 'heartbeat',
  agentId: 'xiaoyun-dev',
  timestamp: Date.now()
}));
```

---

## 错误处理

### 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "INVALID_TASK_ID",
    "message": "任务 ID 格式不正确",
    "details": {
      "field": "taskId",
      "value": "INVALID-123"
    }
  }
}
```

### 常见错误码

| 错误码 | 说明 | HTTP 状态码 |
|--------|------|-------------|
| INVALID_TASK_ID | 任务 ID 格式错误 | 400 |
| TASK_NOT_FOUND | 任务不存在 | 404 |
| AGENT_NOT_FOUND | Agent 不存在 | 404 |
| INVALID_STATUS | 状态值无效 | 400 |
| INVALID_PRIORITY | 优先级无效 | 400 |
| UNAUTHORIZED | 未授权 | 401 |
| FORBIDDEN | 禁止访问 | 403 |
| INTERNAL_ERROR | 服务器内部错误 | 500 |

### 错误处理示例

```javascript
try {
  const response = await fetch('/api/tasks/INVALID-ID');
  const data = await response.json();
  
  if (!data.success) {
    console.error('错误:', data.error.message);
  }
} catch (error) {
  console.error('请求失败:', error);
}
```

---

## 速率限制

### 限制规则

- 普通 API: 100 次/分钟
- 写操作 API: 30 次/分钟
- WebSocket: 1000 条消息/分钟

### 超限响应

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "请求频率超限，请稍后重试",
    "retryAfter": 60
  }
}
```

---

## 相关文档

- [🏗️ 架构设计](./ARCHITECTURE.md)
- [🔧 开发指南](./DEVELOPER-GUIDE.md)
- [📖 用户手册](./USER-GUIDE.md)

---

_API 参考文档，完整接口说明。_ 🦞
