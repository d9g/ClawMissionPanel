# 评审流程设计规范

**版本**: v1.0  
**创建日期**: 2026-03-13  
**设计者**: xiaoyun-judge ⚖️  
**状态**: 待开发

---

## 📋 概述

本文档定义任务评审流程的完整设计规范，包括状态机、API 接口、页面交互和数据存储。

> **职责说明**: 本文档由 xiaoyun-judge 设计，开发工作由 xiaoyun-dev 负责（见 TASK-20260313-006）。

---

## 🔄 评审状态机设计

### 状态枚举

```javascript
const TaskReviewStatus = {
  PENDING_REVIEW: 'PENDING_REVIEW',     // 待评审
  REVIEWING: 'REVIEWING',               // 评审中
  REVIEW_APPROVED: 'REVIEW_APPROVED',   // 评审通过
  REVIEW_REJECTED: 'REVIEW_REJECTED'    // 评审驳回
};
```

### 状态流转图

```
┌─────────────────┐
│   PENDING       │
│   (待开始)       │
└────────┬────────┘
         │ 任务启动
         ↓
┌─────────────────┐
│ PENDING_REVIEW  │
│   (待评审)       │
└────────┬────────┘
         │ 开始评审
         ↓
┌─────────────────┐
│   REVIEWING     │
│   (评审中)       │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ↓         ↓
┌─────────┐ ┌──────────────┐
│REVIEW_  │ │REVIEW_       │
│APPROVED │ │REJECTED      │
│(通过)   │ │(驳回)        │
└────┬────┘ └───────┬──────┘
     │              │
     │ 任务启动     │ 重新提交
     ↓              ↓
┌─────────────────┐
│  IN_PROGRESS    │
│   (进行中)       │
└─────────────────┘
```

### 流转规则

| 当前状态 | 触发动作 | 目标状态 | 说明 |
|---------|---------|---------|------|
| PENDING | 任务启动 | PENDING_REVIEW | 任务完成后进入评审队列 |
| PENDING_REVIEW | 开始评审 | REVIEWING | 评审员接手评审 |
| REVIEWING | 评审通过 | REVIEW_APPROVED | 方案通过评审 |
| REVIEWING | 评审驳回 | REVIEW_REJECTED | 方案需要修改 |
| REVIEW_APPROVED | 任务启动 | IN_PROGRESS | 进入开发阶段 |
| REVIEW_REJECTED | 重新提交 | PENDING_REVIEW | 修改后重新评审 |

---

## 🌐 评审 API 设计规范

### 接口列表

#### 1. 开始评审

```http
POST /api/tasks/:taskId/review/start
```

**请求**:
```json
{
  "reviewer": "xiaoyun-judge"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "taskId": "TASK-20260313-002",
    "status": "REVIEWING",
    "reviewer": "xiaoyun-judge",
    "startedAt": "2026-03-13T16:35:00Z"
  }
}
```

**错误码**:
- `400` - 任务状态不允许开始评审
- `409` - 已有评审进行中

---

#### 2. 评审通过

```http
POST /api/tasks/:taskId/review/approve
```

**请求**:
```json
{
  "reviewer": "xiaoyun-judge",
  "comments": "方案设计合理，状态机清晰，API 规范完整。",
  "attachments": []
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "taskId": "TASK-20260313-002",
    "status": "REVIEW_APPROVED",
    "reviewId": "REV-20260313-001",
    "approvedAt": "2026-03-13T17:00:00Z"
  }
}
```

**错误码**:
- `400` - 任务不在评审中状态
- `403` - 无评审权限

---

#### 3. 评审驳回

```http
POST /api/tasks/:taskId/review/reject
```

**请求**:
```json
{
  "reviewer": "xiaoyun-judge",
  "reasons": ["状态流转不完整", "缺少错误处理设计"],
  "suggestions": ["补充异常状态处理", "增加超时机制"],
  "comments": "整体设计良好，但需要补充以下细节..."
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "taskId": "TASK-20260313-002",
    "status": "REVIEW_REJECTED",
    "reviewId": "REV-20260313-001",
    "rejectedAt": "2026-03-13T17:00:00Z"
  }
}
```

**错误码**:
- `400` - 任务不在评审中状态 / reasons 不能为空
- `403` - 无评审权限

---

#### 4. 获取评审历史

```http
GET /api/tasks/:taskId/reviews
```

**响应**:
```json
{
  "success": true,
  "data": {
    "taskId": "TASK-20260313-002",
    "reviews": [
      {
        "id": "REV-20260313-001",
        "reviewer": "xiaoyun-judge",
        "result": "approved",
        "comments": "方案设计合理",
        "createdAt": "2026-03-13T17:00:00Z"
      }
    ]
  }
}
```

---

#### 5. 获取评审详情

```http
GET /api/tasks/:taskId/reviews/:reviewId
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "REV-20260313-001",
    "taskId": "TASK-20260313-002",
    "reviewer": "xiaoyun-judge",
    "result": "approved",
    "comments": "方案设计合理",
    "reasons": [],
    "suggestions": [],
    "createdAt": "2026-03-13T17:00:00Z",
    "updatedAt": "2026-03-13T17:00:00Z"
  }
}
```

---

## 🖥️ 评审页面交互设计

### 页面 URL

```
/task-board/review/TASK-XXX.html
```

### 页面布局

```
┌────────────────────────────────────────────┐
│  🔙 返回任务列表    任务评审    ⚙️ 设置    │
├────────────────────────────────────────────┤
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │ 任务信息卡片                          │  │
│  │ TASK-20260313-002: 评审流程设计      │  │
│  │ 执行者：xiaoyun-judge                │  │
│  │ 状态：REVIEWING                      │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │ 评审标准                              │  │
│  │ □ 任务目标明确                        │  │
│  │ □ 技术方案可行                        │  │
│  │ □ 风险评估完整                        │  │
│  │ □ 验收标准清晰                        │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │ 评审意见                              │  │
│  │ ┌────────────────────────────────┐   │  │
│  │ │                                │   │  │
│  │ │  (多行文本输入框)               │   │  │
│  │ │                                │   │  │
│  │ └────────────────────────────────┘   │  │
│  │                                      │  │
│  │ [📎 添加附件]                         │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │ 评审历史                              │  │
│  │ ───────────────────────────────────  │  │
│  │ 2026-03-13 17:00 - xiaoyun-judge     │  │
│  │ ✅ 评审通过                           │  │
│  │ "方案设计合理，状态机清晰"            │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │         [❌ 驳回]    [✅ 通过]        │  │
│  └──────────────────────────────────────┘  │
│                                            │
└────────────────────────────────────────────┘
```

### 交互流程

```
1. 评审员进入评审页面
   ↓
2. 查看任务详情和评审标准
   ↓
3. 填写评审意见
   ↓
4. 选择操作（通过/驳回）
   ↓
5. 确认提交
   ↓
6. 系统更新任务状态
   ↓
7. 通知相关人员
```

### 用户体验要点

1. **状态可视化**: 当前评审状态醒目展示
2. **评审标准**: 清晰列出评审要点，支持勾选
3. **意见必填**: 提交评审时必须填写意见
4. **驳回必填原因**: 驳回时必须填写原因和建议
5. **历史记录**: 完整展示评审历史时间线
6. **实时通知**: 评审结果实时通知相关人员

---

## 💾 评审记录数据设计

### 数据表结构

```sql
CREATE TABLE task_reviews (
  id              VARCHAR(32) PRIMARY KEY,
  task_id         VARCHAR(32) NOT NULL,
  reviewer        VARCHAR(64) NOT NULL,
  result          ENUM('approved', 'rejected') NOT NULL,
  comments        TEXT,
  reasons         JSON,           -- 驳回原因数组
  suggestions     JSON,           -- 改进建议数组
  attachments     JSON,           -- 附件列表
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_task_id (task_id),
  INDEX idx_reviewer (reviewer),
  INDEX idx_created_at (created_at)
);
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|-----|------|-----|------|
| id | VARCHAR(32) | ✅ | 评审记录 ID，格式：REV-YYYYMMDD-XXX |
| task_id | VARCHAR(32) | ✅ | 关联任务 ID |
| reviewer | VARCHAR(64) | ✅ | 评审员 ID/名称 |
| result | ENUM | ✅ | 评审结果：approved/rejected |
| comments | TEXT | ❌ | 评审意见 |
| reasons | JSON | ❌ | 驳回原因数组（仅驳回时） |
| suggestions | JSON | ❌ | 改进建议数组（仅驳回时） |
| attachments | JSON | ❌ | 附件列表（URL 数组） |
| created_at | TIMESTAMP | ✅ | 创建时间 |
| updated_at | TIMESTAMP | ✅ | 更新时间 |

### 示例数据

```json
{
  "id": "REV-20260313-001",
  "task_id": "TASK-20260313-002",
  "reviewer": "xiaoyun-judge",
  "result": "approved",
  "comments": "方案设计合理，状态机清晰，API 规范完整。",
  "reasons": null,
  "suggestions": null,
  "attachments": [],
  "created_at": "2026-03-13T17:00:00Z",
  "updated_at": "2026-03-13T17:00:00Z"
}
```

---

## 🔔 通知机制

### 评审开始通知

**触发**: 任务状态变更为 `REVIEWING`  
**接收人**: 任务执行者、项目负责人  
**内容**: "您的任务 TASK-XXX 已进入评审阶段，评审员：xxx"

### 评审通过通知

**触发**: 评审结果为 `approved`  
**接收人**: 任务执行者、项目负责人  
**内容**: "您的任务 TASK-XXX 已通过评审，可以开始实施。"

### 评审驳回通知

**触发**: 评审结果为 `rejected`  
**接收人**: 任务执行者、项目负责人  
**内容**: "您的任务 TASK-XXX 评审未通过，请根据意见修改后重新提交。"

---

## 📊 统计指标

### 评审效率指标

- **平均评审时长**: 从开始评审到完成评审的平均时间
- **评审通过率**: 通过评审数 / 总评审数
- **评审驳回率**: 驳回评审数 / 总评审数
- **评审积压数**: 当前 `PENDING_REVIEW` 状态的任务数

### 评审质量指标

- **一次通过率**: 首次评审即通过的比例
- **平均修改次数**: 驳回后重新提交的平均次数
- **评审意见完整度**: 包含原因和建议的评审比例

---

## 🔗 相关文档

- [任务状态流转设计](./TASK-LIFECYCLE-DESIGN.md)
- [产品需求文档](./PRODUCT-REQUIREMENTS.md)
- [任务格式规范](./TASK-FORMAT-STANDARD.md)

---

_让每个技术方案都经过严格评审。_ ⚖️
