# 📋 任务管理系统设计文档 v3.0

**版本**: v3.0 - 多 Agent 协作版
**创建时间**: 2026-03-11
**创建者**: 小云
**状态**: 设计评审中

---

## 📋 目录

1. [系统概述](#系统概述)
2. [Agent 团队](#agent 团队)
3. [核心流程](#核心流程)
4. [数据库设计](#数据库设计)
5. [HTTP 服务设计](#http 服务设计)
6. [权限系统](#权限系统)
7. [实施计划](#实施计划)

---

## 系统概述

### 目标
构建一个规范化的任务管理系统，实现：
- ✅ 需求审批流程化
- ✅ 任务拆解专业化（小云评委评审）
- ✅ 执行过程可追踪
- ✅ 经验沉淀自动化（小云记录）
- ✅ 文档管理规范化

### 核心价值
| 价值 | 说明 |
|------|------|
| **规范化** | 所有任务按流程执行 |
| **专业化** | 专业 Agent 做专业事 |
| **可追溯** | 所有决策有记录 |
| **可进化** | 经验沉淀成规范 |

---

## Agent 团队

### 组织架构图

```
👤 用户（最终决策者）
    ↑
    │ 审批/决策
    ↓
🧠 小云（系统架构师 + 任务管理）
    ├─ ⚖️ 小云评委（评审专家）
    ├─ 📝 小云记录（文档专家）
    ├─ 💻 小云开发（开发工程师）
    └─ 📖 推书酱（小说推文专家）
```

### Agent 职责矩阵

| Agent | 职责 | 技能 | 最大并发 |
|-------|------|------|----------|
| **小云** | 需求分析、任务拆解、系统协调 | 系统设计、任务管理 | 5 |
| **小云评委** | 方案评审、技术评估、冲突仲裁 | 技术评审、风险评估 | 3 |
| **小云记录** | 会议纪要、项目日报、经验沉淀 | 文档编写、知识管理 | 10 |
| **小云开发** | 功能开发、Bug 修复、代码审查 | Node.js、HTML/CSS | 3 |
| **推书酱** | 小说分析、AI 绘图、视频制作 | 内容创作、AI 工具 | 2 |

---

## 核心流程

### 1. 需求评审流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    需求评审流程                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  用户提出需求                                                   │
│      ↓                                                          │
│  小云组织需求分析会                                             │
│      ↓                                                          │
│  小云拆解任务 + 指派 Agent                                       │
│      ↓                                                          │
│  小云评委评审                                                   │
│      ↓                                                          │
│  ┌─────────────────────────────────────────┐                   │
│  │  评审结果                                │                   │
│  ├─────────────────────────────────────────┤                   │
│  │  ✅ 通过 → 进入用户确认环节              │                   │
│  │  ❌ 驳回 → 小云修改方案                  │                   │
│  │  ⚖️ 争议 → 辩论会 → 用户决策            │                   │
│  └─────────────────────────────────────────┘                   │
│      ↓                                                          │
│  小云记录会议纪要                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 2. 辩论会流程

```
┌─────────────────────────────────────────────────────────────────┐
│                      辩论会流程                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  小云提出方案 A                                                 │
│      ↓                                                          │
│  小云评委提出方案 B（或质疑）                                   │
│      ↓                                                          │
│  双方辩论（摆事实讲道理）                                       │
│      ↓                                                          │
│  ┌─────────────────────────────────────────┐                   │
│  │  评估结果                                │                   │
│  ├─────────────────────────────────────────┤                   │
│  │  明显优劣（非五五开）                    │                   │
│  │  → 采纳优方案                            │                   │
│  │  → 小云记录辩论过程                      │                   │
│  ├─────────────────────────────────────────┤                   │
│  │  难分伯仲（五五开）                      │                   │
│  │  → 提交用户决策                          │                   │
│  │  → 说明各自优劣                          │                   │
│  │  → 用户选择后执行                        │                   │
│  └─────────────────────────────────────────┘                   │
│      ↓                                                          │
│  小云记录决策原因                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 3. 用户盖章确认流程

```
┌─────────────────────────────────────────────────────────────────┐
│                  用户盖章确认流程                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  小云创建确认书                                                 │
│      ↓                                                          │
│  生成 HTTP 确认页面                                              │
│      ↓                                                          │
│  发送确认链接给用户                                             │
│      ↓                                                          │
│  ┌─────────────────────────────────────────┐                   │
│  │  用户查看确认书                          │                   │
│  │  - 需求信息                              │                   │
│  │  - 任务拆解明细                          │                   │
│  │  - 执行者指派                            │                   │
│  │  - 资源需求                              │                   │
│  │  - 风险评估                              │                   │
│  └─────────────────────────────────────────┘                   │
│      ↓                                                          │
│  ┌──────────────┬──────────────┐                               │
│  │  ✅ 批准实施  │  ❌ 驳回修改  │                               │
│  └──┬───────────┴──────┬───────┘                               │
│     ↓                  ↓                                         │
│  签署确认          填写驳回原因                                 │
│     ↓                  ↓                                         │
│  状态→待领取        状态→已驳回                                 │
│     ↓                  ↓                                         │
│  通知 Agent          小云修改重提                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 4. 项目日报流程

```
┌─────────────────────────────────────────────────────────────────┐
│                      项目日报流程                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  每日 23:00 - 小云记录开始收集                                   │
│      ↓                                                          │
│  收集各 Agent 进度                                               │
│      ↓                                                          │
│  - 小云：今日任务完成情况                                       │
│  - 小云评委：今日评审任务                                       │
│  - 小云开发：今日开发进度                                       │
│  - 推书酱：今日推文产出                                         │
│      ↓                                                          │
│  汇总项目整体进度                                               │
│      ↓                                                          │
│  生成日报草稿                                                   │
│      ↓                                                          │
│  23:30 - 发布日报                                               │
│      ↓                                                          │
│  归档存储                                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 数据库设计

### 方案选择

**推荐**: SQLite + JSON 混合存储

| 数据类型 | 存储方式 | 说明 |
|----------|----------|------|
| **任务数据** | SQLite | 结构化查询 |
| **文档内容** | JSON 文件 | 易于编辑 |
| **审批记录** | SQLite | 需要关联查询 |
| **日志文件** | JSONL | 顺序写入 |

---

### SQLite 表结构

```sql
-- 任务表
CREATE TABLE tasks (
    task_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    priority TEXT,  -- P0/P1/P2/P3
    status TEXT,    -- 状态枚举
    requester TEXT,
    assignee TEXT,
    reviewer TEXT,
    approver TEXT,
    estimated_hours REAL,
    actual_hours REAL,
    created_at DATETIME,
    updated_at DATETIME,
    deadline DATETIME
);

-- 子任务表
CREATE TABLE subtasks (
    subtask_id TEXT PRIMARY KEY,
    task_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to TEXT,
    status TEXT,
    dependencies TEXT,  -- JSON 数组
    output TEXT,
    created_at DATETIME,
    completed_at DATETIME,
    FOREIGN KEY (task_id) REFERENCES tasks(task_id)
);

-- 审批记录表
CREATE TABLE approvals (
    approval_id TEXT PRIMARY KEY,
    task_id TEXT,
    approval_type TEXT,  -- requirement/task_details
    status TEXT,         -- APPROVED/REJECTED/PENDING
    approved_by TEXT,
    approved_at DATETIME,
    comments TEXT,
    FOREIGN KEY (task_id) REFERENCES tasks(task_id)
);

-- Agent 表
CREATE TABLE agents (
    agent_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    skills TEXT,         -- JSON 对象
    max_concurrent INTEGER,
    current_load INTEGER,
    status TEXT,         -- BUSY/AVAILABLE/LEARNING/OFFLINE
    created_at DATETIME
);

-- 经验沉淀表
CREATE TABLE lessons_learned (
    lesson_id TEXT PRIMARY KEY,
    task_id TEXT,
    type TEXT,           -- SUCCESS/FAILURE
    content TEXT,
    reusable_assets TEXT,  -- JSON 数组
    created_by TEXT,
    created_at DATETIME,
    FOREIGN KEY (task_id) REFERENCES tasks(task_id)
);

-- 会议纪要表
CREATE TABLE meetings (
    meeting_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    meeting_time DATETIME,
    attendees TEXT,      -- JSON 数组
    content TEXT,
    decisions TEXT,      -- JSON 数组
    action_items TEXT,   -- JSON 数组
    created_at DATETIME
);

-- 项目日报表
CREATE TABLE daily_reports (
    report_id TEXT PRIMARY KEY,
    report_date DATE,
    completed_tasks TEXT,  -- JSON 数组
    in_progress_tasks TEXT, -- JSON 数组
    issues TEXT,           -- JSON 数组
    statistics TEXT,       -- JSON 对象
    created_at DATETIME
);
```

---

### JSON 文件结构

```
/data/
├── tasks/
│   └── 202603/
│       └── TASK-20260311-002.json    # 完整任务数据
├── meetings/
│   └── 202603/
│       └── 20260311-requirements-review.md
├── daily-reports/
│   └── 202603/
│       └── 20260311.md
├── lessons-learned/
│   └── 202603/
│       └── TASK-20260311-001.md
└── approvals/
    └── 202603/
        └── TASK-20260311-002.json
```

---

## HTTP 服务设计

### 页面结构

```
https://yun.webyoung.cn/task-board/
├── /                           # 主公告板
├── /tasks/
│   ├── /                       # 任务列表
│   └── /:taskId                # 任务详情
├── /approval/
│   ├── /pending                # 待审批列表
│   └── /:taskId                # 审批确认页（需权限）
├── /agents/
│   ├── /                       # Agent 列表
│   └── /:agentId               # Agent 详情
├── /reports/
│   ├── /daily/                 # 日报列表
│   └── /:date                  # 日报详情
├── /meetings/
│   └── /:meetingId             # 会议纪要
└── /stats/                     # 统计数据
```

---

### 权限设计

```yaml
权限级别:
  L0 - 公开:
    - 公告板概览
    - 任务列表（脱敏）
    
  L1 - 登录用户:
    - 任务详情
    - Agent 状态
    - 项目日报
    
  L2 - 项目成员:
    - 领取任务
    - 提交进度
    - 查看内部文档
    
  L3 - 管理员（小云）:
    - 任务管理
    - Agent 管理
    - 审批管理
    
  L4 - 超级管理员（用户）:
    - 盖章审批 ✅
    - 系统配置
    - 权限管理
```

---

### 快捷审批接口

```javascript
// POST /api/approvals/:taskId/approve
{
  "action": "approve",  // approve/reject/modify
  "comments": "方案可行，注意保证人物一致性",
  "approved_by": "user_id"
}

// 响应
{
  "success": true,
  "approval_id": "APPR-20260311-001",
  "status": "APPROVED"
}
```

---

### 任务变更接口

```javascript
// POST /api/tasks/:taskId/change
{
  "change_type": "assignee",  // assignee/time/scope/acceptance
  "old_value": "推书酱",
  "new_value": "小云开发",
  "reason": "任务需要 API 集成技能",
  "requires_user_approval": true
}
```

---

## 权限系统

### 认证方式

| 阶段 | 认证方式 | 说明 |
|------|----------|------|
| **当前** | 本地 Token | 简单实现 |
| **未来** | 微信公众号 OAuth | 关注后访问 |

---

### 权限验证流程

```
用户请求
    ↓
检查登录状态
    ↓
┌──────────────┐
│ 已登录？     │
└──┬───────┬───┘
   │ Yes   │ No
   ↓       ↓
检查权限   重定向到登录
   ↓
┌──────────────┐
│ 有权限？     │
└──┬───────┬───┘
   │ Yes   │ No
   ↓       ↓
允许访问   403 拒绝
```

---

### 盖章审批权限

```javascript
// 仅用户有盖章权限
const userPermissions = {
  'TASK_APPROVAL': true,      // 任务审批
  'REQUIREMENT_APPROVAL': true, // 需求审批
  'ASSIGNEE_CHANGE': true,    // 执行者变更
  'SCOPE_CHANGE': true,       // 范围变更
  'SYSTEM_CONFIG': true       // 系统配置
};

// Agent 权限
const agentPermissions = {
  'xiaoyun': {
    'TASK_CREATE': true,
    'TASK_ASSIGN': true,
    'TASK_REVIEW': true
  },
  'xiaoyun-judge': {
    'TASK_REVIEW': true,
    'RISK_ASSESS': true
  },
  'xiaoyun-recorder': {
    'DOCUMENT_CREATE': true,
    'ARCHIVE_MANAGE': true
  }
};
```

---

## 实施计划

### Phase 1: 基础框架（2 天）🔴 优先

| 任务 | 执行者 | 预估 | 状态 |
|------|--------|------|------|
| 设计数据库 schema | 小云 | 2h | ⬜️ |
| 创建 SQLite 数据库 | 小云开发 | 2h | ⬜️ |
| 实现任务 CRUD | 小云开发 | 4h | ⬜️ |
| 实现状态流转 | 小云开发 | 2h | ⬜️ |
| **实现用户盖章确认** | 小云开发 | 4h | ⬜️ |

---

### Phase 2: Agent 集成（2 天）

| 任务 | 执行者 | 预估 | 状态 |
|------|--------|------|------|
| 创建小云评委 Agent | 小云 | 2h | ✅ |
| 创建小云记录 Agent | 小云 | 2h | ✅ |
| 创建小云开发 Agent | 小云 | 2h | ✅ |
| 实现任务领取接口 | 小云开发 | 3h | ⬜️ |
| 实现定时轮询 | 小云开发 | 2h | ⬜️ |

---

### Phase 3: HTTP 服务（2 天）

| 任务 | 执行者 | 预估 | 状态 |
|------|--------|------|------|
| 设计 HTML 模板 | 小云开发 | 3h | ⬜️ |
| 实现公告板页面 | 小云开发 | 4h | ⬜️ |
| **实现审批页面** | 小云开发 | 4h | ⬜️ |
| 实现权限控制 | 小云开发 | 3h | ⬜️ |

---

### Phase 4: 评审流程（1 天）

| 任务 | 执行者 | 预估 | 状态 |
|------|--------|------|------|
| 实现评审接口 | 小云开发 | 3h | ⬜️ |
| 实现辩论会流程 | 小云 + 评委 | 2h | ⬜️ |
| 实现冲突解决 | 小云 + 评委 | 2h | ⬜️ |

---

### Phase 5: 文档系统（1 天）

| 任务 | 执行者 | 预估 | 状态 |
|------|--------|------|------|
| 会议纪要模板 | 小云记录 | 2h | ⬜️ |
| 项目日报模板 | 小云记录 | 2h | ⬜️ |
| 经验沉淀模板 | 小云记录 | 2h | ⬜️ |
| 定时日报任务 | 小云记录 | 2h | ⬜️ |

---

### Phase 6: 完善优化（1 天）

| 任务 | 执行者 | 预估 | 状态 |
|------|--------|------|------|
| 统计分析 | 小云开发 | 3h | ⬜️ |
| 通知机制 | 小云 | 2h | ⬜️ |
| 使用文档 | 小云记录 | 3h | ⬜️ |

---

**总预估**: 9 天
**关键路径**: Phase 1 → Phase 3 → Phase 4

---

## 下一步行动

### 立即可做
1. ✅ 创建三个新 Agent（已完成）
2. ⬜️ 小云开发实现数据库 schema
3. ⬜️ 小云评委设计评审检查清单
4. ⬜️ 小云记录设计文档模板

### 需要用户决策
1. ⬜️ 确认数据库方案（SQLite+JSON）
2. ⬜️ 确认权限设计方案
3. ⬜️ 确认 HTTP 服务部署方式

---

_最后更新：2026-03-11 | 小云 ☁️_
