#!/bin/bash
# OpenMOSS 任务认领 API 启动脚本

echo "🚀 启动 OpenMOSS 任务认领 API..."
echo "📂 工作目录：/home/admin/.openclaw/workspace/task-board"
echo "🌐 访问地址：http://localhost:6565"
echo "📖 API 文档：http://localhost:6565/docs"
echo ""

cd /home/admin/.openclaw/workspace/task-board/backend

# 检查依赖
if ! python3 -c "import fastapi" 2>/dev/null; then
    echo "❌ 缺少 FastAPI，正在安装..."
    pip3 install fastapi uvicorn
fi

# 启动 API
python3 claim-api.py
