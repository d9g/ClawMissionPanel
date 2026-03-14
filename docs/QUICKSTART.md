# 🚀 快速开始 - ClawMissionPanel

**5 分钟快速部署你的多 Agent 任务管理系统**

---

## ⚡ 一键部署 (推荐)

### 步骤 1: 克隆项目

```bash
git clone https://github.com/d9g/ClawMissionPanel.git
cd ClawMissionPanel
```

### 步骤 2: 运行部署脚本

```bash
bash deploy.sh
```

部署脚本会自动：
- ✅ 检查 Node.js 版本
- ✅ 安装依赖
- ✅ 初始化数据库
- ✅ 启动服务

### 步骤 3: 访问系统

打开浏览器访问：http://localhost:3000

🎉 完成！你现在可以看到任务板界面了。

---

## 🛠️ 手动安装

如果自动部署失败，请按以下步骤手动安装：

### 前置要求

- Node.js >= 18.0.0
- pnpm (推荐) 或 npm
- Git

### 步骤 1: 检查环境

```bash
# 检查 Node.js 版本
node --version  # 应该 >= v18.0.0

# 检查 pnpm
pnpm --version  # 如果未安装，运行：npm install -g pnpm
```

### 步骤 2: 安装依赖

```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install
```

### 步骤 3: 配置环境变量

```bash
# 复制示例配置
cp .env.example .env

# 编辑配置文件
vim .env
```

**.env 配置示例**:

```bash
# 服务端口
PORT=3000

# 运行环境
NODE_ENV=development

# OpenClaw 网关配置 (可选)
OPENCLAW_GATEWAY_HOST=127.0.0.1
OPENCLAW_GATEWAY_PORT=18789
```

### 步骤 4: 初始化数据库

```bash
# 使用 pnpm
pnpm run init-db

# 或使用 npm
npm run init-db
```

### 步骤 5: 启动服务

```bash
# 开发环境
pnpm run dev

# 或生产环境
pnpm run start
```

### 步骤 6: 验证安装

访问 http://localhost:3000，应该看到任务板界面。

---

## 🎯 快速使用

### 1. 查看任务板

访问首页 http://localhost:3000，可以看到：
- Agent 状态列表
- 任务统计信息
- 任务看板 (Kanban)

### 2. 添加新任务

```bash
# 创建任务文件
cat > tasks/TASK-20260313-001.md << EOF
# 任务名称
**任务 ID**: TASK-20260313-001
**状态**: PENDING
**执行者**: xiaoyun-dev
**截止时间**: 2026-03-14 12:00
EOF

# 同步到数据库
pnpm run sync-tasks

# 生成详情页
pnpm run generate-html
```

### 3. 查看 Agent 状态

访问 API: http://localhost:3000/api/agents/status

### 4. 查看任务统计

访问 API: http://localhost:3000/api/tasks/stats

---

## 🔧 常用命令

```bash
# 启动服务
pnpm run start

# 开发模式 (热重载)
pnpm run dev

# 同步任务到数据库
pnpm run sync-tasks

# 生成任务详情页
pnpm run generate-html

# 初始化数据库
pnpm run init-db

# 查看日志
tail -f logs/app.log
```

---

## 📋 下一步

- 📖 阅读 [用户手册](./USER-GUIDE.md) 了解详细功能
- 🏗️ 查看 [架构设计](./ARCHITECTURE.md) 了解系统结构
- 🔧 参考 [开发指南](./DEVELOPER-GUIDE.md) 贡献代码
- ❓ 查看 [FAQ](./FAQ.md) 解决常见问题

---

## 🆘 遇到问题？

### 常见问题

**Q: 端口 3000 已被占用**
```bash
# 修改 .env 文件中的 PORT
PORT=3001
```

**Q: 数据库初始化失败**
```bash
# 删除旧数据库，重新初始化
rm database/task-board.db
pnpm run init-db
```

**Q: 依赖安装失败**
```bash
# 清除缓存，重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### 获取帮助

- 📖 查看 [故障排查](./TROUBLESHOOTING.md)
- 💬 提交 [Issue](https://github.com/d9g/ClawMissionPanel/issues)
- 📧 联系技术支持

---

_5 分钟部署，开始高效的多 Agent 协作！_ 🦞
