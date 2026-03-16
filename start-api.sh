#!/bin/bash
# 任务板 API 启动脚本

cd /home/admin/.openclaw/workspace/task-board

# 检查是否已在运行
if pgrep -f "node.*server.js" > /dev/null; then
    echo "⚠️  服务已在运行"
    exit 0
fi

# 启动服务
nohup node src/server.js > logs/server.log 2>&1 &
echo "✅ 服务已启动 (PID: $!)"

# 等待服务启动
sleep 3
if pgrep -f "node.*server.js" > /dev/null; then
    echo "✅ 服务运行正常"
else
    echo "❌ 服务启动失败"
    exit 1
fi
