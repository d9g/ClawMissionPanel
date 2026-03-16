# 📋 任务公共版 - 产品需求文档

**版本**: v2.0  
**最后更新**: 2026-03-13  
**项目**: ClawMissionPanel  
**状态**: 进行中

---

## 🎯 产品定位

**任务公共版**是一个多 Agent 协作的任务管理系统，提供完整的任务创建、分配、执行、验收流程，支持多个 Agent 并行工作，自动追踪任务进度和阻塞状态。

---

## 👥 目标用户

1. **项目管理者** - 创建任务、审批方案、验收成果
2. **开发 Agent** - 执行开发任务（xiaoyun-dev）
3. **测试 Agent** - 执行测试任务（xiaoyun-test）
4. **文档 Agent** - 执行文档任务（xiaoyun-recorder）
5. **评审 Agent** - 评审技术方案（xiaoyun-judge）

---

## 📊 核心功能

### 1. 任务管理

#### 1.1 任务创建
- **功能**: 创建任务 Markdown 文件
- **字段**:
  - task_id: 任务编号（自动生成）
  - title: 任务标题
  - description: 任务描述
  - assignee: 执行者
  - priority: 优先级（P0/P1/P2）
  - status: 状态（DRAFT/PENDING/APPROVED/IN_PROGRESS/BLOCKED/COMPLETED）
  - created_at: 创建时间
  - updated_at: 更新时间

#### 1.2 任务状态流转
```
DRAFT → PENDING → APPROVED → IN_PROGRESS → COMPLETED
                              ↓
                          BLOCKED（自动检测）
```

#### 1.3 任务分配
- **手动分配**: 创建任务时指定 assignee
- **自动分配**: 调度 Agent 根据能力分配（待实现）

#### 1.4 任务详情页面
- **自动生成**: 任务文件更新时自动生成 HTML
- **访问**: `/task-board/tasks/TASK-XXX.html`
- **内容**: 任务信息、进度、状态历史

---

### 2. Agent 管理

#### 2.1 Agent 状态监控
- **状态**: working/inactive/idle/pending/error
- **当前任务**: 显示执行中的任务
- **进度**: 实时进度百分比
- **预计完成**: 基于进度的时间估算

#### 2.2 Agent 健康检查
- **检查频率**: 每 5 分钟
- **检测项**:
  - 进程是否运行
  - inbox 是否有新消息
  - memory 是否更新
- **告警**: 30 分钟无响应 → 告警

#### 2.3 Agent 唤醒机制
- **唤醒方式**: Gateway CLI 调用
- **触发条件**:
  - inbox 有新消息
  - 有待处理任务（待实现）
- **频率**: 每 5 分钟

---

### 3. 进度追踪

#### 3.1 自动进度更新
- **触发**: 任务文件更新
- **同步**: 自动同步到数据库
- **展示**: 实时显示在仪表板

#### 3.2 阻塞检测
- **规则**: 2 小时未更新 → BLOCKED
- **检查频率**: 每 5 分钟
- **告警**: 首页红色卡片显示

#### 3.3 延期检测
- **规则**: 超过预计时间未完成
- **计算**: 基于 created_at 和预计工时
- **展示**: 延期任务列表

---

### 4. 仪表板

#### 4.1 统计卡片
- **全部任务**: 总任务数
- **阻塞中**: 阻塞任务数（红色，可点击）
- **进行中**: IN_PROGRESS 任务数
- **等待中**: PENDING 任务数
- **已完成**: COMPLETED 任务数

#### 4.2 任务列表
- **进行中列**: 显示所有 IN_PROGRESS 任务
- **等待中列**: 显示所有 PENDING 任务
- **已完成列**: 显示所有 COMPLETED 任务
- **任务卡片**: 任务 ID、标题、优先级、执行者

#### 4.3 阻塞任务监控页
- **URL**: `/task-board/blocked.html`
- **内容**:
  - 阻塞任务列表
  - 阻塞原因
  - 阻塞时间
  - 执行者
- **链接**: 点击任务跳转到详情页

---

### 5. 自动部署

#### 5.1 开发目录
- **位置**: `<workspace>/task-board/public/`
- **内容**: HTML、CSS、JS 源代码

#### 5.2 HTTP 目录
- **位置**: `<fileserver>/files/task-board/`
- **同步**: 文件保存后 1-2 秒自动部署

#### 5.3 访问 URL
- **首页**: https://yun.webyoung.cn/task-board/
- **阻塞页**: https://yun.webyoung.cn/task-board/blocked.html
- **详情页**: https://yun.webyoung.cn/task-board/tasks/TASK-XXX.html

---

## 🔧 技术架构

### 前端
- **技术**: HTML5 + CSS3 + JavaScript (原生)
- **文件**:
  - `public/index.html` - 首页
  - `public/blocked.html` - 阻塞任务页
  - `public/js/dashboard.js` - 仪表板逻辑
  - `public/js/task-lists.js` - 任务列表渲染
  - `public/js/update-stats.js` - 统计更新

### 后端
- **技术**: Node.js + Express
- **文件**:
  - `src/server.js` - API 服务器
  - `src/blocked-tasks-api.js` - 阻塞任务 API
  - `src/task-manager.js` - 任务管理
  - `src/agent-status.js` - Agent 状态

### 数据库
- **类型**: SQLite
- **位置**: `<database>/tasks.db`
- **表**:
  - tasks - 任务信息
  - agents - Agent 信息
  - task_progress - 任务进度
  - status_history - 状态历史

### 服务
- **任务追踪**: `scripts/task-tracker.js` - 监听文件变化
- **页面生成**: `scripts/generate-task-pages.js` - 生成 HTML
- **自动部署**: `scripts/auto-deploy.js` - 同步文件
- **Agent 唤醒**: `scripts/gateway-agent-wakeup.js` - 唤醒 Agent

---

## 📋 功能清单

### 已实现 ✅

| 功能 | 状态 | 说明 |
|------|------|------|
| 任务创建 | ✅ | Markdown 文件 |
| 任务详情页面 | ✅ | 自动生成 HTML |
| 任务状态同步 | ✅ | 自动同步到数据库 |
| 阻塞任务检测 | ✅ | 2 小时未更新 |
| 阻塞任务监控页 | ✅ | blocked.html |
| 仪表板统计 | ✅ | 5 个统计卡片 |
| 任务列表展示 | ✅ | 3 列 Kanban |
| 自动部署 | ✅ | 文件保存即发布 |
| Agent 状态监控 | ✅ | 实时显示 |
| Agent 唤醒服务 | ✅ | 每 5 分钟 |

### 待实现 🚧

| 功能 | 优先级 | 说明 |
|------|--------|------|
| 任务自动分配 | P1 | 调度 Agent 根据能力分配 |
| 任务依赖检测 | P1 | 识别任务间依赖关系 |
| 邮件/消息通知 | P2 | 任务变更通知 |
| 任务时间线可视化 | P2 | 详情页显示时间线 |
| Agent 健康告警 | P2 | 30 分钟无响应告警 |
| 任务评审流程 | P1 | 技术方案评审 |
| 任务验收流程 | P1 | 成果验收 |
| 任务延期预测 | P3 | 基于进度预测 |

---

## 🎯 验收标准

### 功能验收

1. **任务创建**
   - [ ] 创建任务文件后自动生成 HTML
   - [ ] 任务同步到数据库
   - [ ] 页面可访问

2. **任务分配**
   - [ ] 指定 assignee 后 Agent 能收到通知
   - [ ] Agent 能开始执行任务

3. **进度追踪**
   - [ ] 任务更新后进度实时显示
   - [ ] 2 小时未更新自动标记 BLOCKED
   - [ ] 阻塞任务在首页显示

4. **Agent 管理**
   - [ ] Agent 状态实时显示
   - [ ] Agent 能被唤醒执行任务
   - [ ] 假死 Agent 能告警

### 性能验收

- [ ] 页面加载 < 2 秒
- [ ] API 响应 < 500ms
- [ ] 文件部署 < 2 秒
- [ ] 阻塞检测 < 1 分钟

### 用户体验验收

- [ ] 统计卡片样式统一
- [ ] 任务链接可点击
- [ ] 无"加载中"卡住问题
- [ ] 无 404 链接
- [ ] 中文显示正常

---

## 📝 更新日志

### v2.0 (2026-03-13)
- ✅ 新增阻塞任务监控系统
- ✅ 新增任务详情页面自动生成
- ✅ 新增自动部署系统
- ✅ 新增任务列表展示
- ✅ 修复 UI Bug（统计数字、加载中、链接）
- ✅ 统一项目名称为"任务公共版"

### v1.0 (2026-03-11)
- ✅ 初始版本
- ✅ 基础任务管理
- ✅ Agent 状态监控
- ✅ 仪表板

---

## 🔗 相关文档

- [任务状态流转设计](./TASK-LIFECYCLE-DESIGN.md)
- [详情页面生成规则](./TASK-PAGE-GENERATION-RULES.md)
- [自动部署规则](./AUTO-DEPLOY-RULES.md)
- [部署检查清单](./DEPLOY-CHECKLIST.md)
- [任务格式标准](./TASK-FORMAT-STANDARD.md)

---

_让每个任务都有完整的记忆，让每个 Agent 都高效协作。_
