# 🦞 ClawMissionPanel

**OpenClaw Multi-Agent Mission Control Panel**

多 Agent 任务调度与监控系统 - 让每个 Agent 都高效协作，让每个任务都有完整的记忆。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green.svg)](https://nodejs.org/)
[![Stars](https://img.shields.io/github/stars/d9g/ClawMissionPanel?style=flat)](https://github.com/d9g/ClawMissionPanel/stargazers)
[![Issues](https://img.shields.io/github/issues/d9g/ClawMissionPanel)](https://github.com/d9g/ClawMissionPanel/issues)
[![Last Commit](https://img.shields.io/github/last-commit/d9g/ClawMissionPanel)](https://github.com/d9g/ClawMissionPanel/commits/main)

---

## 🚀 快速开始

### 一键部署

```bash
git clone https://github.com/d9g/ClawMissionPanel.git
cd ClawMissionPanel
bash deploy.sh
```

### 手动安装

```bash
# 安装依赖
pnpm install

# 初始化数据库
pnpm run init-db

# 启动服务
pnpm run start
```

访问：http://localhost:3000

---

## 📋 功能特性

### 🎯 核心功能

- **多 Agent 管理** - 统一管理 5+ 个 Agent 的工作状态
- **任务调度系统** - 智能分配任务到合适的 Agent
- **实时监控** - WebSocket 实时更新 Agent 状态和任务进度
- **健康监控** - 自动检测 Agent 假死并告警
- **服务自愈** - 服务挂了自动重启

### 📊 任务板

- **Kanban 风格** - 直观的任务看板
- **进度追踪** - 实时显示任务进度百分比
- **延期告警** - 自动检测并标记延期任务
- **任务详情** - 点击任务 ID 查看完整信息

### 🤖 Agent 支持

| Agent | 职责 | 状态 |
|-------|------|------|
| **小云开发** 💻 | 开发任务 | ✅ |
| **小云测试** ✅ | 测试任务 | ✅ |
| **小云记录** 📝 | 文档任务 | ✅ |
| **小云评委** ⚖️ | 评审任务 | ✅ |
| **小云调度** 🎯 | 任务分发 | 🚧 开发中 |

---

## 🏗️ 项目结构

```
ClawMissionPanel/
├── frontend/           # 前端代码
│   ├── index.html      # 任务板首页
│   ├── css/
│   │   └── dashboard.css
│   ├── js/
│   │   └── dashboard.js
│   └── tasks/          # 任务详情页
├── backend/            # 后端代码
│   ├── src/
│   │   ├── server.js
│   │   ├── agent-status.js
│   │   └── task-stats.js
│   └── scripts/
│       ├── sync-all-tasks.js
│       └── generate-task-html.js
├── database/           # SQLite 数据库
│   └── task-board.db
├── scripts/            # 部署和工具脚本
│   └── deploy.sh
├── docs/               # 文档
└── package.json
```

---

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | HTML5, CSS3, JavaScript (原生) |
| **后端** | Node.js, Express |
| **数据库** | SQLite (better-sqlite3) |
| **部署** | Bash 脚本，Nginx |
| **监控** | 自定义健康检查脚本 |

---

## 📖 文档

- [🛡️ 服务健康监控方案](docs/SERVICE-MONITORING.md)
- [🎯 Mission Control 分析](docs/MISSION-CONTROL-ANALYSIS.md)
- [🤖 小云调度 Agent 设计](docs/DISPATCH-AGENT-DESIGN.md)
- [💓 Agent 健康监控](docs/AGENT-HEALTH-MONITOR.md)
- [📡 任务状态 API](docs/api-task-status.md)
- [🚀 部署指南](docs/DEPLOY-GUIDE.md)

**完整文档**: https://yun.webyoung.cn/docs/

---

## 🔧 开发指南

### 添加新任务

```bash
# 创建任务 Markdown 文件
cat > tasks/TASK-20260313-001.md << EOF
# 任务名称
**任务 ID**: TASK-20260313-001
**状态**: PENDING
**执行者**: xiaoyun-dev
EOF

# 同步到数据库
pnpm run sync-tasks

# 生成详情页
pnpm run generate-html
```

### 添加新 Agent

1. 在 `backend/src/agent-status.js` 添加 Agent 配置
2. 创建 Agent 目录结构
3. 更新文档

---

## 🚀 部署

### 环境要求

- Node.js >= 18.0.0
- pnpm (推荐) 或 npm
- Nginx (生产环境)

### 生产部署

```bash
# 1. 克隆项目
git clone https://github.com/d9g/ClawMissionPanel.git
cd ClawMissionPanel

# 2. 运行部署脚本
bash deploy.sh

# 3. 配置 Nginx (可选)
sudo cp nginx.conf /etc/nginx/conf.d/
sudo nginx -s reload
```

---

## 📊 API 文档

### 获取 Agent 状态

```bash
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
      "status": "idle",
      "currentTask": "TASK-20260312-008",
      "progress": 50
    }
  ]
}
```

### 获取任务统计

```bash
GET /api/tasks/stats
```

**响应**:
```json
{
  "success": true,
  "data": {
    "total": 10,
    "completed": 7,
    "inProgress": 1,
    "pending": 0,
    "overdue": 0
  }
}
```

---

## 🎯 路线图

### ✅ 已完成 (Phase 1-2)

- [x] 基础框架 (数据库、API、前端)
- [x] Agent 集成与协作
- [x] 任务板进度展示
- [x] 服务健康监控
- [x] 任务详情页生成

### 🚧 进行中 (Phase 3)

- [ ] 小云调度 Agent 实施
- [ ] 任务自动分发
- [ ] Agent 忙闲管理
- [ ] 自然语言定时任务

### 📅 计划中 (Phase 4)

- [ ] 多 Agent 生成技能
- [ ] WebSocket 实时更新
- [ ] 移动端适配
- [ ] 数据可视化

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

详见 [贡献指南](CONTRIBUTING.md)

---

## 📝 更新日志

### v1.0.0 (2026-03-12)

- ✅ 初始版本发布
- ✅ 多 Agent 管理系统
- ✅ 任务板功能
- ✅ 服务健康监控
- ✅ 文档中心

[查看完整更新日志](CHANGELOG.md)

---

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=d9g/ClawMissionPanel&type=Date)](https://star-history.com/#d9g/ClawMissionPanel&Date)

如果这个项目对你有帮助，请给个 **Star** ⭐ 支持一下！

---

## 💖 支持项目

如果这个项目对你有帮助，欢迎以各种方式支持：

### ☕ 请作者喝杯咖啡

<div align="center">
  <img src="assets/alipay-qrcode.jpg" alt="支付宝打赏二维码" width="200"/>
  <p>扫码请作者喝杯咖啡 ☕</p>
</div>

### 📱 关注公众号

获取更多 OpenClaw 实战教程和最新更新：

<div align="center">
  <img src="assets/qrcode-wechat.jpg" alt="公众号二维码" width="200"/>
  <p>扫码关注，获取最新文章 📖</p>
</div>

### 🤝 商业合作

- **技术支持**: 邮箱联系
- **定制开发**: 邮箱联系
- **企业培训**: 邮箱联系

### 🔗 友情链接

- **文档中心**: https://yun.webyoung.cn/docs/
- **任务板演示**: https://yun.webyoung.cn/task-board/
- **博客文章**: [链接位置 - 请自行补充]

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)

**商业使用**: 
- ✅ 允许免费用于学习和研究
- ✅ 允许免费用于内部项目
- ⚠️ 用于商业产品请联系作者

---

## 👥 团队

- **小云** ☁️ - 主开发
- **小云开发** 💻 - 核心开发
- **小云测试** ✅ - 测试
- **小云记录** 📝 - 文档

---

## 📬 联系方式

- **Email**: [请自行补充]
- **GitHub Issues**: [提交 Issue](https://github.com/d9g/ClawMissionPanel/issues)
- **微信公众号**: [请自行补充]

---

## 🙏 致谢

感谢所有贡献者和支持者！

---

_让每个 Agent 都高效协作，让每个任务都有完整的记忆。_ 🦞

**Made with ❤️ by 小云团队**
