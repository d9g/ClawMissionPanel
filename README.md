# 🦞 ClawMissionPanel

**多 Agent 任务调度与监控系统**

让每个 Agent 都高效协作，让每个任务都有完整的记忆。

---

## 📋 项目简介

ClawMissionPanel 是一个专为多 Agent 团队协作设计的任务管理与监控系统，支持：

- **多 Agent 管理** - 统一管理 5+ 个 Agent 的工作状态
- **任务调度系统** - 智能分配任务到合适的 Agent
- **实时监控** - 实时显示 Agent 状态和任务进度
- **健康监控** - 自动检测 Agent 假死并告警
- **服务自愈** - 服务挂了自动重启

**访问地址**: https://yun.webyoung.cn/task-board/

---

## 🚀 快速开始

### 1. 查看在线文档

- **项目总览**: 本文档
- **API 文档**: [docs/API-REFERENCE.md](docs/API-REFERENCE.md)
- **数据库设计**: [docs/DATABASE-DESIGN.md](docs/DATABASE-DESIGN.md)
- **部署指南**: [docs/DEPLOY-GUIDE.md](docs/DEPLOY-GUIDE.md)

### 2. 本地开发

```bash
# 克隆项目
git clone https://github.com/d9g/ClawMissionPanel.git
cd ClawMissionPanel

# 安装依赖
npm install

# 启动服务
npm start
```

### 3. 访问服务

- **首页**: http://localhost:3000/
- **API**: http://localhost:3000/api/
- **健康检查**: http://localhost:3000/api/health

---

## 📁 项目结构

```
ClawMissionPanel/
├── src/                      # 后端源代码
│   ├── server.js            # 主服务入口
│   ├── dashboard-api.js     # Dashboard API
│   ├── blocked-tasks-api.js # 阻塞任务 API
│   ├── task-manager.js      # 任务管理
│   └── state-machine.js     # 状态机
├── public/                   # 前端静态文件
│   ├── index.html           # 首页
│   ├── js/                  # JavaScript
│   ├── css/                 # 样式
│   └── docs/                # 文档
├── database/                 # 数据库
│   └── task-board.db        # SQLite 数据库
├── docs/                     # 项目文档
│   ├── API-REFERENCE.md     # API 接口文档
│   ├── DATABASE-DESIGN.md   # 数据库设计文档
│   ├── DEPLOY-GUIDE.md      # 部署指南
│   └── ...                  # 其他文档
├── tasks/                    # 任务定义
├── inbox/                    # Agent 通知
├── scripts/                  # 工具脚本
├── tests/                    # 测试文件
├── package.json             # 项目配置
└── README.md                # 本文档
```

---

## 📚 文档索引

### 核心文档

| 文档 | 路径 | 说明 |
|------|------|------|
| **API 文档** | [docs/API-REFERENCE.md](docs/API-REFERENCE.md) | 完整 API 接口说明 |
| **数据库设计** | [docs/DATABASE-DESIGN.md](docs/DATABASE-DESIGN.md) | 数据库表结构与设计 |
| **部署指南** | [docs/DEPLOY-GUIDE.md](docs/DEPLOY-GUIDE.md) | 部署与配置说明 |
| **开发规范** | [docs/DEVELOPMENT-PRINCIPLES.md](docs/DEVELOPMENT-PRINCIPLES.md) | 开发原则与规范 |

### 设计文档

| 文档 | 路径 | 说明 |
|------|------|------|
| **调度 Agent 设计** | [docs/DISPATCH-AGENT-DESIGN-v3.md](docs/DISPATCH-AGENT-DESIGN-v3.md) | 调度系统设计 |
| **任务生命周期** | [docs/TASK-LIFECYCLE-DESIGN.md](docs/TASK-LIFECYCLE-DESIGN.md) | 任务状态流转 |
| **评审流程设计** | [docs/REVIEW-FLOW-DESIGN.md](docs/REVIEW-FLOW-DESIGN.md) | 评审流程规范 |
| **监控检查清单** | [docs/MONITOR-CHECKLIST.md](docs/MONITOR-CHECKLIST.md) | 监控标准 |

### 产品文档

| 文档 | 路径 | 说明 |
|------|------|------|
| **产品需求** | [docs/PRODUCT-REQUIREMENTS.md](docs/PRODUCT-REQUIREMENTS.md) | 产品需求文档 |
| **团队创建器** | [docs/TEAM-CREATOR-DESIGN.md](docs/TEAM-CREATOR-DESIGN.md) | 团队创建工具设计 |

### 修复报告

| 文档 | 路径 | 说明 |
|------|------|------|
| **API 加载修复** | [docs/API-LOAD-FIX.md](docs/API-LOAD-FIX.md) | API 问题修复记录 |
| **备份同步修复** | [docs/BACKUP-SYNC-FIX.md](docs/BACKUP-SYNC-FIX.md) | 备份同步问题修复 |
| **依赖检测修复** | [docs/DEPENDENCY-FORMAT.md](docs/DEPENDENCY-FORMAT.md) | 依赖检测修复 |

---

## 🔧 技术栈

### 后端
- **Node.js** - 运行环境
- **Express** - Web 框架
- **SQLite3** - 数据库
- **Node-Cron** - 定时任务

### 前端
- **HTML5/CSS3** - 页面结构
- **JavaScript (ES6+)** - 交互逻辑
- **原生 Fetch API** - 数据请求

### 部署
- **Systemd** - 服务管理
- **Nginx** - 反向代理
- **GitHub** - 代码托管

---

## 📊 核心功能

### 1. 任务管理

- ✅ 任务创建、分配、认领
- ✅ 状态流转（AVAILABLE → IN_PROGRESS → COMPLETED）
- ✅ 进度追踪
- ✅ 依赖关系管理
- ✅ 截止时间提醒

### 2. Agent 管理

- ✅ Agent 状态监控
- ✅ 任务分配与负载均衡
- ✅ 健康检查
- ✅ 假死检测与告警

### 3. 评审与验收

- ✅ 技术方案评审
- ✅ 开发成果验收
- ✅ 评审记录
- ✅ 验收流程

### 4. 监控告警

- ✅ 延期任务检测
- ✅ 阻塞任务告警
- ✅ Agent 健康监控
- ✅ 服务自愈

---

## 🎯 使用场景

### 多 Agent 团队协作

适用于管理多个 AI Agent 的协作工作流：

1. **任务分配** - 根据 Agent 能力分配任务
2. **进度追踪** - 实时监控任务进度
3. **质量把控** - 评审 + 验收双重保障
4. **问题告警** - 自动检测并通知异常

### 项目管理

- **敏捷开发** - 支持迭代和冲刺
- **任务看板** - Kanban 风格展示
- **进度统计** - 实时数据面板

---

## 📝 开发规范

### 代码规范

- 使用 ESLint 进行代码检查
- 遵循 Node.js 最佳实践
- 函数注释完整
- 错误处理完善

### 提交规范

```
<type>(<scope>): <subject>

<body>

<footer>
```

**type**: feat | fix | docs | style | refactor | test | chore

**示例**:
```
feat(api): 添加 Dashboard 聚合 API

- 实现 /api/dashboard/data 端点
- 聚合任务统计和 Agent 状态
- 支持自动刷新

Closes #123
```

### 文档规范

- 所有功能必须有文档
- API 变更同步更新文档
- 修复问题创建修复报告

---

## 🔗 相关链接

- **GitHub**: https://github.com/d9g/ClawMissionPanel
- **在线访问**: https://yun.webyoung.cn/task-board/
- **API 文档**: https://yun.webyoung.cn/task-board/docs/API-REFERENCE.md
- **数据库设计**: https://yun.webyoung.cn/task-board/docs/DATABASE-DESIGN.md

---

## 📞 支持与反馈

如有问题或建议：

1. 提交 [GitHub Issue](https://github.com/d9g/ClawMissionPanel/issues)
2. 查看 [文档中心](docs/)
3. 检查 [常见问题](docs/FAQ.md)

---

## 📄 许可证

MIT License

---

_让每个 Agent 都高效协作，让每个任务都有完整的记忆！_ 🦞☁️
