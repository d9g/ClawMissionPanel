# 📚 ClawMissionPanel 文档中心

本文档中心包含 ClawMissionPanel 项目的所有技术文档。

**项目地址**: https://github.com/d9g/ClawMissionPanel  
**在线访问**: https://yun.webyoung.cn/task-board/

---

## 📋 文档分类

### 核心文档 ⭐

| 文档 | 说明 | 重要性 |
|------|------|--------|
| [API-REFERENCE.md](./API-REFERENCE.md) | 完整 API 接口文档 | ⭐⭐⭐⭐⭐ |
| [DATABASE-DESIGN.md](./DATABASE-DESIGN.md) | 数据库设计文档 | ⭐⭐⭐⭐⭐ |
| [DEPLOY-GUIDE.md](./DEPLOY-GUIDE.md) | 部署指南 | ⭐⭐⭐⭐⭐ |
| [DEVELOPMENT-PRINCIPLES.md](./DEVELOPMENT-PRINCIPLES.md) | 开发原则 | ⭐⭐⭐⭐ |

### 设计文档 🏗️

| 文档 | 说明 |
|------|------|
| [DISPATCH-AGENT-DESIGN-v3.md](./DISPATCH-AGENT-DESIGN-v3.md) | 调度 Agent 设计 v3 |
| [TASK-LIFECYCLE-DESIGN.md](./TASK-LIFECYCLE-DESIGN.md) | 任务生命周期设计 |
| [REVIEW-FLOW-DESIGN.md](./REVIEW-FLOW-DESIGN.md) | 评审流程设计 |
| [MONITOR-CHECKLIST.md](./MONITOR-CHECKLIST.md) | 监控检查清单 |

### 产品文档 📱

| 文档 | 说明 |
|------|------|
| [PRODUCT-REQUIREMENTS.md](./PRODUCT-REQUIREMENTS.md) | 产品需求文档 |
| [TEAM-CREATOR-DESIGN.md](./TEAM-CREATOR-DESIGN.md) | 团队创建器设计 |
| [SPEC-PROJECT-ARCHITECTURE-20260316.md](./SPEC-PROJECT-ARCHITECTURE-20260316.md) | 项目架构规范 |

---

## 🔍 快速查找

### 我想了解...

- **API 怎么用？** → [API-REFERENCE.md](./API-REFERENCE.md)
- **数据库结构？** → [DATABASE-DESIGN.md](./DATABASE-DESIGN.md)
- **如何部署？** → [DEPLOY-GUIDE.md](./DEPLOY-GUIDE.md)
- **开发规范？** → [DEVELOPMENT-PRINCIPLES.md](./DEVELOPMENT-PRINCIPLES.md)
- **任务流程？** → [TASK-LIFECYCLE-DESIGN.md](./TASK-LIFECYCLE-DESIGN.md)
- **评审流程？** → [REVIEW-FLOW-DESIGN.md](./REVIEW-FLOW-DESIGN.md)
- **调度系统？** → [DISPATCH-AGENT-DESIGN-v3.md](./DISPATCH-AGENT-DESIGN-v3.md)

---

## 🌐 在线资源

### 访问地址

| 资源 | URL |
|------|-----|
| **任务公告板** | https://yun.webyoung.cn/task-board/ |
| **阻塞任务页** | https://yun.webyoung.cn/task-board/blocked.html |
| **进行中任务** | https://yun.webyoung.cn/task-board/progress.html |
| **待处理任务** | https://yun.webyoung.cn/task-board/pending.html |
| **已完成任务** | https://yun.webyoung.cn/task-board/completed.html |
| **评审中任务** | https://yun.webyoung.cn/task-board/reviewing.html |

### API 端点

| API | URL |
|-----|-----|
| **Dashboard 数据** | https://yun.webyoung.cn/task-board/api/dashboard/data |
| **任务列表** | https://yun.webyoung.cn/task-board/api/tasks |
| **Agent 状态** | https://yun.webyoung.cn/task-board/api/agents/status |
| **阻塞任务** | https://yun.webyoung.cn/task-board/api/tasks/blocked |

---

## 📝 文档维护

### 文档规范

1. **命名规范**: `文档类型-描述.md`
2. **标题格式**: 包含日期和版本号
3. **内容结构**: 问题→原因→解决方案→验证
4. **更新频率**: 功能变更立即更新

### 文档分类

- **核心文档**: 必须保持最新
- **设计文档**: 设计变更后更新
- **修复报告**: 修复完成后创建
- **临时文档**: 可归档或删除

---

## 🤝 参与贡献

### 提交规范

```
<type>(<scope>): <subject>

<body>

<footer>
```

**type**: feat | fix | docs | style | refactor | test | chore

### 开发流程

1. Fork 项目
2. 创建分支
3. 提交代码
4. 发起 Pull Request

---

## 📊 项目状态

| 指标 | 状态 |
|------|------|
| **版本** | v1.0 |
| **任务管理** | ✅ 已完成 |
| **Agent 管理** | ✅ 已完成 |
| **评审流程** | ✅ 已完成 |
| **验收流程** | ✅ 已完成 |
| **调度系统** | 🚧 开发中 |

---

_文档是项目的记忆，保持文档更新就是保持项目健康！_ 📚☁️