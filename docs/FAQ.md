# ❓ FAQ - ClawMissionPanel

**常见问题解答**

---

## 📋 目录

1. [安装部署](#安装部署)
2. [使用问题](#使用问题)
3. [任务管理](#任务管理)
4. [Agent 相关](#agent 相关)
5. [API 使用](#api 使用)
6. [性能优化](#性能优化)
7. [故障排查](#故障排查)

---

## 安装部署

### Q: Node.js 版本要求是什么？

**A**: 需要 Node.js >= 18.0.0。

检查版本：
```bash
node --version
```

升级 Node.js：
```bash
# 使用 nvm
nvm install 18
nvm use 18
```

### Q: 提示 "pnpm: command not found"

**A**: 需要安装 pnpm。

```bash
# 使用 npm 安装
npm install -g pnpm

# 或使用 curl
curl -f https://get.pnpm.io/v6.js | node - add --global pnpm
```

### Q: 端口 3000 已被占用

**A**: 修改端口配置。

方法 1: 修改 .env 文件
```bash
PORT=3001
```

方法 2: 启动时指定
```bash
PORT=3001 pnpm run start
```

方法 3: 查找并关闭占用进程
```bash
# 查找占用进程
lsof -i :3000

# 关闭进程
kill -9 <PID>
```

### Q: 数据库初始化失败

**A**: 检查文件权限和磁盘空间。

```bash
# 检查目录权限
ls -la database/

# 修复权限
chmod 755 database/
chmod 644 database/task-board.db

# 检查磁盘空间
df -h

# 重新初始化
rm database/task-board.db
pnpm run init-db
```

### Q: 如何配置 Nginx 反向代理？

**A**: 参考 [部署指南](./DEPLOYMENT.md#nginx-配置)。

关键配置：
```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
}
```

### Q: 如何实现开机自启？

**A**: 使用 PM2。

```bash
# 启动应用
pm2 start ecosystem.config.js --env production

# 设置开机自启
pm2 startup
pm2 save
```

---

## 使用问题

### Q: 如何查看任务板？

**A**: 访问 http://localhost:3000

如果看不到任务：
1. 检查服务是否启动
2. 运行 `pnpm run sync-tasks`
3. 刷新浏览器

### Q: 任务状态不更新

**A**: 可能原因：

1. **未同步任务**
   ```bash
   pnpm run sync-tasks
   ```

2. **浏览器缓存**
   - 强制刷新 (Ctrl+F5)
   - 清除缓存

3. **WebSocket 未连接**
   - 检查浏览器控制台
   - 刷新页面

### Q: 如何筛选任务？

**A**: 使用 URL 参数。

```
# 只看待处理任务
http://localhost:3000/?status=PENDING

# 只看 P1 优先级
http://localhost:3000/?priority=P1

# 组合筛选
http://localhost:3000/?status=PENDING&priority=P1
```

### Q: 如何导出任务数据？

**A**: 使用 API。

```bash
# 导出为 JSON
curl http://localhost:3000/api/tasks/export > tasks.json

# 导出为 CSV
pnpm run export-csv
```

### Q: 支持移动端吗？

**A**: 目前前端是响应式设计，支持基本移动浏览。完整移动端支持在开发中。

---

## 任务管理

### Q: 如何创建任务？

**A**: 三种方法：

**方法 1**: 命令行
```bash
cat > tasks/TASK-20260313-001.md << EOF
# 任务名称
**任务 ID**: TASK-20260313-001
**状态**: PENDING
**执行者**: xiaoyun-dev
EOF

pnpm run sync-tasks
```

**方法 2**: API
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "TASK-20260313-001",
    "name": "任务名称",
    "assignee": "xiaoyun-dev"
  }'
```

**方法 3**: 直接编辑文件
```bash
vim tasks/TASK-20260313-001.md
pnpm run sync-tasks
```

### Q: 任务 ID 格式是什么？

**A**: `TASK-YYYYMMDD-XXX`

示例：
- `TASK-20260313-001` (2026 年 3 月 13 日第 1 个任务)
- `TASK-20260313-002` (2026 年 3 月 13 日第 2 个任务)

### Q: 如何更新任务状态？

**A**: 编辑任务文件。

```bash
vim tasks/TASK-20260313-001.md

# 修改状态
**状态**: IN_PROGRESS
**进度**: 50

# 同步
pnpm run sync-tasks
```

### Q: 如何删除任务？

**A**: 

方法 1: 删除文件
```bash
rm tasks/TASK-20260313-001.md
pnpm run sync-tasks
```

方法 2: API
```bash
curl -X DELETE http://localhost:3000/api/tasks/TASK-20260313-001
```

### Q: 任务延期如何处理？

**A**: 

1. **更新截止时间**
   ```bash
   vim tasks/TASK-20260313-001.md
   # 修改截止时间
   **截止时间**: 2026-03-15 12:00
   ```

2. **重新分配**
   ```bash
   # 修改执行者
   **执行者**: xiaoyun-test
   ```

3. **调整优先级**
   ```bash
   # 提升优先级
   **优先级**: P0
   ```

### Q: 如何批量创建任务？

**A**: 使用脚本。

```bash
#!/bin/bash
# scripts/batch-create.sh

for i in {1..10}; do
  cat > tasks/TASK-20260313-$(printf "%03d" $i).md << EOF
# 批量任务 $i
**任务 ID**: TASK-20260313-$(printf "%03d" $i)
**状态**: PENDING
**执行者**: xiaoyun-dev
EOF
done

pnpm run sync-tasks
echo "创建了 10 个任务"
```

---

## Agent 相关

### Q: 如何添加新 Agent？

**A**: 

1. 编辑 `backend/src/agent-status.js`
   ```javascript
   agents: [
     {
       id: 'xiaoyun-new',
       name: '小云新',
       emoji: '🆕',
       status: 'idle'
     }
   ]
   ```

2. 创建 Agent 目录
   ```bash
   mkdir -p workspace/agents/xiaoyun-new/{inbox,tasks,memory,docs}
   ```

3. 重启服务

### Q: Agent 状态显示离线

**A**: 可能原因：

1. **Agent 未启动**
   - 检查 Agent 进程
   - 重启 Agent

2. **心跳超时**
   - 检查网络连接
   - 查看 Agent 日志

3. **配置错误**
   - 检查 Agent ID 是否匹配
   - 验证配置文件

### Q: 如何查看 Agent 历史任务？

**A**: 使用 API。

```bash
curl http://localhost:3000/api/agents/xiaoyun-dev/tasks
```

### Q: Agent 负载均衡如何实现？

**A**: 查看各 Agent 任务数，手动或自动分配。

```bash
# 查看统计
curl http://localhost:3000/api/agents/stats

# 分配给任务最少的 Agent
# (需要自定义逻辑)
```

---

## API 使用

### Q: API 认证如何使用？

**A**: 在请求头中添加 API Key。

```bash
curl -X GET http://localhost:3000/api/agents/status \
  -H "Authorization: Bearer your_api_key"
```

### Q: 如何获取任务列表？

**A**: 

```bash
# 获取所有任务
curl http://localhost:3000/api/tasks

# 筛选待处理任务
curl "http://localhost:3000/api/tasks?status=PENDING"

# 分页
curl "http://localhost:3000/api/tasks?page=1&limit=20"
```

### Q: WebSocket 如何连接？

**A**: 

```javascript
const ws = new WebSocket('ws://localhost:3000');

ws.on('open', () => {
  console.log('连接成功');
});

ws.on('message', (data) => {
  console.log('收到消息:', JSON.parse(data));
});
```

### Q: API 速率限制是多少？

**A**: 

- 普通 API: 100 次/分钟
- 写操作：30 次/分钟
- WebSocket: 1000 条/分钟

超限会返回 429 错误。

---

## 性能优化

### Q: 任务多了之后系统变慢

**A**: 优化建议：

1. **数据库优化**
   ```sql
   -- 添加索引
   CREATE INDEX idx_status ON tasks(status);
   CREATE INDEX idx_assignee ON tasks(assignee);
   
   -- 清理旧数据
   DELETE FROM tasks 
   WHERE status='COMPLETED' 
   AND completed_at < datetime('now', '-90 days');
   ```

2. **启用缓存**
   ```javascript
   const taskCache = new NodeCache({ stdTTL: 300 });
   ```

3. **分页加载**
   ```javascript
   // 每次只加载 20 个任务
   GET /api/tasks?limit=20&page=1
   ```

### Q: 内存占用过高

**A**: 

1. **限制 PM2 内存**
   ```javascript
   // ecosystem.config.js
   max_memory_restart: '500M'
   ```

2. **定期重启**
   ```bash
   pm2 restart claw-mission-panel --time 03:00
   ```

3. **检查内存泄漏**
   ```bash
   pm2 monit
   ```

### Q: 如何优化数据库性能？

**A**: 

```bash
# 1. 启用 WAL 模式
sqlite3 database/task-board.db "PRAGMA journal_mode = WAL;"

# 2. 增加缓存
sqlite3 database/task-board.db "PRAGMA cache_size = -64000;"

# 3. 分析表
sqlite3 database/task-board.db "ANALYZE;"

# 4. 定期清理
sqlite3 database/task-board.db "VACUUM;"
```

---

## 故障排查

### Q: 服务无法启动

**A**: 检查步骤：

1. **查看错误日志**
   ```bash
   pm2 logs claw-mission-panel --err
   ```

2. **检查端口占用**
   ```bash
   lsof -i :3000
   ```

3. **验证 Node.js 版本**
   ```bash
   node --version
   ```

4. **重新安装依赖**
   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

### Q: 页面显示空白

**A**: 

1. **检查浏览器控制台**
   - F12 打开开发者工具
   - 查看 Console 和 Network 标签

2. **验证服务状态**
   ```bash
   curl http://localhost:3000/api/health
   ```

3. **清除浏览器缓存**
   - Ctrl+Shift+Delete
   - 或使用无痕模式

### Q: 任务详情页 404

**A**: 

1. **生成详情页**
   ```bash
   pnpm run generate-html
   ```

2. **检查文件是否存在**
   ```bash
   ls -la frontend/tasks/
   ```

3. **检查 Nginx 配置**
   ```bash
   sudo nginx -t
   ```

### Q: WebSocket 连接失败

**A**: 

1. **检查 Nginx 配置**
   ```nginx
   location /ws {
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "Upgrade";
   }
   ```

2. **验证防火墙**
   ```bash
   sudo ufw status
   ```

3. **查看 WebSocket 日志**
   ```bash
   pm2 logs | grep WebSocket
   ```

### Q: 数据丢失

**A**: 

1. **检查备份**
   ```bash
   ls -la backup/
   ```

2. **恢复数据库**
   ```bash
   cp backup/task-board.db.latest database/task-board.db
   pm2 restart claw-mission-panel
   ```

3. **从 Git 恢复任务文件**
   ```bash
   git checkout tasks/
   pnpm run sync-tasks
   ```

---

## 其他问题

### Q: 如何贡献代码？

**A**: 参考 [开发指南](./DEVELOPER-GUIDE.md)。

1. Fork 项目
2. 创建分支
3. 提交更改
4. 创建 PR

### Q: 有商业支持吗？

**A**: 是的，联系邮箱获取商业支持信息。

### Q: 如何报告 Bug？

**A**: 在 GitHub 提交 Issue。

https://github.com/d9g/ClawMissionPanel/issues

提供：
- Bug 描述
- 复现步骤
- 预期行为
- 实际行为
- 环境信息

### Q: 更新频率如何？

**A**: 每月发布一个版本，紧急 Bug 随时修复。

---

## 获取帮助

如果以上 FAQ 没有解决你的问题：

- 📖 查看 [文档中心](./README.md)
- 💬 提交 [Issue](https://github.com/d9g/ClawMissionPanel/issues)
- 📧 联系技术支持

---

_常见问题解答，快速解决问题。_ 🦞
