# 🚀 任务公告板 - 快速部署指南

**适用**: 生产环境部署
**环境**: yun.webyoung.cn

---

## 📋 部署清单

### 1. 前端文件部署

```bash
# 复制前端文件
cp <workspace>/task-board/public/index.html \
   <fileserver>/files/task-board/

cp <workspace>/task-board/public/css/dashboard.css \
   <fileserver>/files/task-board/css/

cp <workspace>/task-board/public/js/dashboard.js \
   <fileserver>/files/task-board/js/

# 复制需求公告板
cp -r <workspace>/task-board/public/requirements \
   <fileserver>/files/task-board/
```

### 2. 后端服务部署

```bash
# 启动后端 API
cd <workspace>/task-board
./start-api.sh

# 验证服务
ps aux | grep "node.*server.js"
```

### 3. 验证部署

```bash
# 验证前端
curl -s https://yun.webyoung.cn/task-board/ | grep "dashboard"

# 验证 API
curl -s https://yun.webyoung.cn/task-board-api/api/agents/status

# 应该返回 JSON 数据
```

---

## 🔧 服务管理

### 启动
```bash
./start-api.sh
```

### 停止
```bash
pkill -f "node.*server.js"
```

### 重启
```bash
pkill -f "node.*server.js"
./start-api.sh
```

### 查看状态
```bash
ps aux | grep "node.*server.js"
```

### 查看日志
```bash
tail -f logs/server.log
```

---

## 📁 目录结构

```
<workspace>/task-board/
├── src/                    # 后端代码
│   ├── server.js          # 主服务
│   ├── agent-status.js    # Agent 状态 API
│   └── task-stats.js      # 任务统计 API
├── public/                 # 前端文件
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── requirements/
├── logs/                   # 日志目录
└── start-api.sh           # 启动脚本
```

---

## ⚠️ 注意事项

1. **单环境** - 开发和生产是同一个环境
2. **测试 URL** - 测试 https://yun.webyoung.cn/ 域名
3. **端口** - Node.js 使用 3000 端口
4. **Nginx** - API 通过 Nginx 代理到 3000 端口

---

**维护**: 小云开发 💻
**更新**: 2026-03-12
