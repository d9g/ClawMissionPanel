# 🚀 部署指南 - ClawMissionPanel

**生产环境部署完整指南**

---

## 📋 目录

1. [系统要求](#系统要求)
2. [快速部署](#快速部署)
3. [手动部署](#手动部署)
4. [Nginx 配置](#nginx 配置)
5. [PM2 进程管理](#pm2 进程管理)
6. [数据库管理](#数据库管理)
7. [监控与日志](#监控与日志)
8. [备份与恢复](#备份与恢复)
9. [升级指南](#升级指南)
10. [故障排查](#故障排查)

---

## 系统要求

### 硬件要求

| 环境 | CPU | 内存 | 磁盘 |
|------|-----|------|------|
| 开发 | 1 核 | 512MB | 1GB |
| 生产 | 2 核 | 1GB | 5GB |
| 高负载 | 4 核 | 2GB | 10GB |

### 软件要求

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0 (推荐) 或 npm >= 9.0.0
- **Git**: 任意版本
- **Nginx**: >= 1.18.0 (生产环境)
- **PM2**: >= 5.0.0 (生产环境)

### 操作系统

- ✅ Ubuntu 20.04+
- ✅ Debian 10+
- ✅ CentOS 7+
- ✅ macOS 10.15+
- ✅ Windows 10+ (开发环境)

---

## 快速部署

### 一键部署脚本

```bash
# 克隆项目
git clone https://github.com/d9g/ClawMissionPanel.git
cd ClawMissionPanel

# 运行部署脚本
bash deploy.sh

# 验证安装
curl http://localhost:3000/api/agents/status
```

### 部署脚本说明

`deploy.sh` 自动执行以下步骤：

1. ✅ 检查 Node.js 版本
2. ✅ 安装依赖 (pnpm install)
3. ✅ 复制环境配置
4. ✅ 初始化数据库
5. ✅ 启动服务
6. ✅ 验证安装

---

## 手动部署

### 步骤 1: 安装依赖

```bash
# 安装 Node.js (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 pnpm
npm install -g pnpm

# 验证安装
node --version  # v18.x.x
pnpm --version  # 8.x.x
```

### 步骤 2: 克隆项目

```bash
git clone https://github.com/d9g/ClawMissionPanel.git
cd ClawMissionPanel
```

### 步骤 3: 安装项目依赖

```bash
pnpm install

# 或使用 npm
npm install
```

### 步骤 4: 配置环境变量

```bash
# 复制示例配置
cp .env.example .env

# 编辑配置
vim .env
```

**.env 配置**:

```bash
# 服务端口
PORT=3000

# 运行环境
NODE_ENV=production

# 数据库路径
DATABASE_PATH=./database/task-board.db

# OpenClaw 网关 (可选)
OPENCLAW_GATEWAY_HOST=127.0.0.1
OPENCLAW_GATEWAY_PORT=18789

# API Key (可选，用于认证)
API_KEY=your_secret_api_key
```

### 步骤 5: 初始化数据库

```bash
pnpm run init-db
```

### 步骤 6: 启动服务

```bash
# 开发环境
pnpm run dev

# 生产环境
pnpm run start
```

### 步骤 7: 验证安装

```bash
# 检查服务状态
curl http://localhost:3000/api/agents/status

# 应该返回 JSON 数据
{
  "success": true,
  "data": [...]
}
```

---

## Nginx 配置

### 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install nginx

# CentOS
sudo yum install nginx
```

### 配置反向代理

创建配置文件 `/etc/nginx/conf.d/claw-mission-panel.conf`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 日志配置
    access_log /var/log/nginx/claw-mission-panel.access.log;
    error_log /var/log/nginx/claw-mission-panel.error.log;

    # 静态文件
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket 支持
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|html)$ {
        proxy_pass http://localhost:3000;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 启用 HTTPS (推荐)

使用 Let's Encrypt 免费证书：

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

### 测试配置

```bash
# 测试 Nginx 配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

### 验证

访问 https://your-domain.com，应该看到任务板界面。

---

## PM2 进程管理

### 安装 PM2

```bash
npm install -g pm2
```

### 启动应用

```bash
# 使用 PM2 启动
pm2 start backend/src/server.js --name claw-mission-panel

# 或使用 ecosystem 配置
pm2 start ecosystem.config.js
```

### ecosystem.config.js

```javascript
module.exports = {
  apps: [{
    name: 'claw-mission-panel',
    script: './backend/src/server.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    autorestart: true,
    max_memory_restart: '500M',
    watch: false
  }]
};
```

### 常用命令

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs claw-mission-panel

# 重启应用
pm2 restart claw-mission-panel

# 停止应用
pm2 stop claw-mission-panel

# 删除应用
pm2 delete claw-mission-panel

# 开机自启
pm2 startup
pm2 save
```

### 监控

```bash
# 实时监控
pm2 monit

# 生成报告
pm2 report
```

---

## 数据库管理

### 数据库位置

```
./database/task-board.db
```

### 备份数据库

```bash
# 手动备份
cp database/task-board.db database/task-board.db.backup.$(date +%Y%m%d)

# 自动备份 (cron)
0 2 * * * cp /path/to/database/task-board.db /backup/task-board.db.$(date +\%Y\%m\%d)
```

### 查看数据库

```bash
# 安装 SQLite
sudo apt-get install sqlite3

# 打开数据库
sqlite3 database/task-board.db

# 查看表
.tables

# 查看数据
SELECT * FROM tasks LIMIT 10;
```

### 数据库优化

```sql
-- 启用 WAL 模式 (提高并发)
PRAGMA journal_mode = WAL;

-- 分析表 (优化查询)
ANALYZE;

-- 清理未完成的事务
PRAGMA wal_checkpoint(TRUNCATE);
```

### 数据迁移

```bash
# 导出数据
sqlite3 database/task-board.db ".dump" > backup.sql

# 导入数据
sqlite3 database/task-board-new.db < backup.sql
```

---

## 监控与日志

### 应用日志

```bash
# 查看实时日志
tail -f logs/app.log

# 查看错误日志
tail -f logs/error.log

# 按日期查看
cat logs/app-$(date +%Y%m%d).log
```

### 日志轮转

配置 `/etc/logrotate.d/claw-mission-panel`:

```
/var/log/claw-mission-panel/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 admin admin
    postrotate
        pm2 reload claw-mission-panel
    endscript
}
```

### 系统监控

```bash
# 监控 CPU 和内存
top -p $(pgrep -f 'node.*server.js')

# 监控网络连接
netstat -tlnp | grep 3000

# 监控磁盘使用
df -h
```

### 健康检查端点

```bash
# 检查服务健康状态
curl http://localhost:3000/api/health

# 响应示例
{
  "status": "healthy",
  "uptime": 86400,
  "database": "connected",
  "timestamp": "2026-03-13T10:00:00Z"
}
```

### 监控告警

使用监控工具 (如 Prometheus + Grafana):

```yaml
# prometheus.yml 配置
scrape_configs:
  - job_name: 'claw-mission-panel'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
```

---

## 备份与恢复

### 备份策略

#### 完整备份 (每日)

```bash
#!/bin/bash
# backup-daily.sh

BACKUP_DIR="/backup/claw-mission-panel"
DATE=$(date +%Y%m%d)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
cp database/task-board.db $BACKUP_DIR/task-board.db.$DATE

# 备份配置文件
cp .env $BACKUP_DIR/env.$DATE
cp ecosystem.config.js $BACKUP_DIR/ecosystem.$DATE

# 备份任务文件
tar -czf $BACKUP_DIR/tasks.$DATE.tar.gz tasks/

# 删除 7 天前的备份
find $BACKUP_DIR -name "*.db.*" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "备份完成：$DATE"
```

#### 定时备份

```bash
# 添加到 crontab
crontab -e

# 每天凌晨 2 点备份
0 2 * * * /path/to/backup-daily.sh
```

### 恢复流程

```bash
# 1. 停止服务
pm2 stop claw-mission-panel

# 2. 恢复数据库
cp /backup/task-board.db.20260312 database/task-board.db

# 3. 恢复配置文件
cp /backup/env.20260312 .env

# 4. 恢复任务文件
tar -xzf /backup/tasks.20260312.tar.gz

# 5. 启动服务
pm2 start claw-mission-panel
```

### 灾难恢复

```bash
# 1. 重新克隆项目
git clone https://github.com/d9g/ClawMissionPanel.git
cd ClawMissionPanel

# 2. 安装依赖
pnpm install

# 3. 恢复备份
cp /backup/task-board.db.latest database/task-board.db
cp /backup/env.latest .env

# 4. 启动服务
pm2 start ecosystem.config.js --env production
```

---

## 升级指南

### 版本检查

```bash
# 查看当前版本
git describe --tags

# 查看最新版本
git fetch --tags
git tag -l | tail -n 5
```

### 升级步骤

```bash
# 1. 备份当前版本
cp -r . ../claw-mission-panel-backup

# 2. 拉取最新代码
git pull origin main

# 3. 安装新依赖
pnpm install

# 4. 运行数据库迁移 (如有)
pnpm run migrate

# 5. 重启服务
pm2 restart claw-mission-panel

# 6. 验证升级
curl http://localhost:3000/api/health
```

### 回滚

```bash
# 1. 停止服务
pm2 stop claw-mission-panel

# 2. 恢复备份
cd ../claw-mission-panel-backup
pm2 start ecosystem.config.js --env production
```

---

## 故障排查

### 常见问题

#### 1. 服务无法启动

```bash
# 检查端口占用
lsof -i :3000

# 查看错误日志
pm2 logs claw-mission-panel --err

# 检查 Node.js 版本
node --version

# 重新安装依赖
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### 2. 数据库连接失败

```bash
# 检查数据库文件
ls -la database/task-board.db

# 检查文件权限
chmod 644 database/task-board.db

# 验证数据库
sqlite3 database/task-board.db "SELECT 1;"
```

#### 3. 内存泄漏

```bash
# 监控内存使用
pm2 monit

# 限制最大内存
# 在 ecosystem.config.js 中添加
max_memory_restart: '500M'

# 定期重启
pm2 restart claw-mission-panel --time 03:00
```

#### 4. WebSocket 连接失败

```bash
# 检查 Nginx 配置
sudo nginx -t

# 验证 WebSocket 升级头
# 确保配置中包含：
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "Upgrade";
```

#### 5. 任务同步失败

```bash
# 手动同步
pnpm run sync-tasks

# 检查任务文件格式
cat tasks/TASK-*.md | head -20

# 查看详细错误
NODE_ENV=development pnpm run sync-tasks
```

### 性能优化

```bash
# 1. 启用数据库缓存
sqlite3 database/task-board.db "PRAGMA cache_size = -64000;"

# 2. 优化查询索引
sqlite3 database/task-board.db "CREATE INDEX IF NOT EXISTS idx_status ON tasks(status);"

# 3. 清理旧数据
sqlite3 database/task-board.db "DELETE FROM tasks WHERE status='COMPLETED' AND completed_at < datetime('now', '-90 days');"
```

### 获取帮助

- 📖 查看 [FAQ](./FAQ.md)
- 💬 提交 [Issue](https://github.com/d9g/ClawMissionPanel/issues)
- 📧 联系技术支持

---

## 相关文档

- [🔐 安全配置](./SECURITY-CONFIG.md)
- [🔧 故障排查](./TROUBLESHOOTING.md)
- [🏗️ 架构设计](./ARCHITECTURE.md)

---

_部署指南，助力生产环境稳定运行。_ 🦞
