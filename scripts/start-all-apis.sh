#!/bin/bash
# OpenMOSS 所有 API 服务启动脚本

echo "🚀 启动 OpenMOSS 所有 API 服务..."
echo ""

# 检查依赖
echo "📦 检查依赖..."
if ! python3 -c "import fastapi" 2>/dev/null; then
    echo "⚠️  缺少 FastAPI，正在安装..."
    pip3 install fastapi uvicorn
fi

echo ""
echo "🌐 启动服务:"
echo "   - 任务 API:    http://localhost:6565"
echo "   - 评审 API:    http://localhost:6566"
echo "   - 循环 API:    http://localhost:6567"
echo ""
echo "📖 API 文档:"
echo "   - http://localhost:6565/docs"
echo "   - http://localhost:6566/docs"
echo "   - http://localhost:6567/docs"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo ""

cd /home/admin/.openclaw/workspace/task-board/backend

# 启动任务 API
echo "🔵 启动任务 API (端口 6565)..."
python3 claim-api.py &
TASK_PID=$!
echo "   ✅ 任务 API 已启动 (PID: $TASK_PID)"

# 等待 2 秒
sleep 2

# 启动评审 API
echo "🟣 启动评审 API (端口 6566)..."
python3 review-api.py &
REVIEW_PID=$!
echo "   ✅ 评审 API 已启动 (PID: $REVIEW_PID)"

# 等待 2 秒
sleep 2

# 启动循环 API
echo "🟢 启动循环 API (端口 6567)..."
python3 recurring-api.py &
RECURRING_PID=$!
echo "   ✅ 循环 API 已启动 (PID: $RECURRING_PID)"

echo ""
echo "=========================================="
echo "✅ 所有 API 服务已启动!"
echo "=========================================="
echo ""
echo "📊 服务状态:"
echo "   - 任务 API:    http://localhost:6565 (PID: $TASK_PID)"
echo "   - 评审 API:    http://localhost:6566 (PID: $REVIEW_PID)"
echo "   - 循环 API:    http://localhost:6567 (PID: $RECURRING_PID)"
echo ""
echo "📖 Swagger UI:"
echo "   - http://localhost:6565/docs"
echo "   - http://localhost:6566/docs"
echo "   - http://localhost:6567/docs"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo ""

# 等待所有后台进程
wait
