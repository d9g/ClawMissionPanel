#!/bin/bash
# OpenMOSS 所有服务启动脚本

echo "🚀 启动 OpenMOSS 所有服务..."
echo ""

# 检查依赖
echo "📦 检查依赖..."
if ! python3 -c "import fastapi" 2>/dev/null; then
    echo "⚠️  缺少 FastAPI，正在安装..."
    pip3 install fastapi uvicorn requests
fi

cd /home/admin/.openclaw/workspace/task-board/backend

# 停止旧进程
echo "🛑 停止旧进程..."
pkill -f "python3.*-api.py" 2>/dev/null
sleep 1

# 启动数据库 API (端口 6568) - 必须
echo "🔵 启动数据库 API (端口 6568)..."
nohup python3 dashboard-data-api.py > /tmp/dashboard-api.log 2>&1 &
DASHBOARD_PID=$!
sleep 2

# 验证 API
echo "✅ 验证 API 服务..."
if curl -s "http://localhost:6568/" > /dev/null 2>&1; then
    echo "   ✅ 数据库 API 已启动 (PID: $DASHBOARD_PID)"
else
    echo "   ❌ 数据库 API 启动失败，请检查日志：/tmp/dashboard-api.log"
fi

echo ""
echo "=========================================="
echo "✅ 服务启动完成!"
echo "=========================================="
echo ""
echo "📊 服务状态:"
echo "   - 数据库 API: http://localhost:6568 (PID: $DASHBOARD_PID)"
echo ""
echo "📖 API 文档:"
echo "   - http://localhost:6568/docs"
echo ""
echo "🌐 访问地址:"
echo "   - 首页：https://yun.webyoung.cn/task-board/"
echo "   - 评审：https://yun.webyoung.cn/task-board/reviewing.html"
echo "   - 活动日志：https://yun.webyoung.cn/task-board/feed.html"
echo ""
echo "⚠️  如果页面还有错误，请按 Ctrl+F5 强制刷新！"
echo ""
