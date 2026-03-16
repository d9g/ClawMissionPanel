#!/bin/bash
#
# 任务公告板健康检查脚本
# 用法：./health-check.sh
#

echo "🔍 任务公告板健康检查"
echo "===================="
echo ""

# 检查服务状态
echo "[1/4] 检查 Systemd 服务状态..."
if sudo systemctl is-active --quiet task-board; then
    echo "✅ 服务运行中"
else
    echo "❌ 服务未运行，尝试启动..."
    sudo systemctl start task-board
    sleep 3
fi

# 检查端口
echo ""
echo "[2/4] 检查端口 3000..."
if netstat -tlnp 2>/dev/null | grep -q ":3000"; then
    echo "✅ 端口 3000 已监听"
else
    echo "❌ 端口 3000 未监听"
fi

# 检查 HTTP 访问
echo ""
echo "[3/4] 检查 HTTP 访问..."
if curl -s -o /dev/null -w "%{http_code}" https://yun.webyoung.cn/task-board/ | grep -q "200"; then
    echo "✅ 文档页面可访问"
else
    echo "❌ 文档页面无法访问"
fi

if curl -s -o /dev/null -w "%{http_code}" https://yun.webyoung.cn/task-board-api/api/health | grep -q "200"; then
    echo "✅ API 健康检查通过"
else
    echo "❌ API 无法访问"
fi

# 检查文件
echo ""
echo "[4/4] 检查 Web 目录文件..."
FILE_COUNT=$(ls -1 /var/www/yun.webyoung.cn/task-board/*.html 2>/dev/null | wc -l)
if [ $FILE_COUNT -gt 0 ]; then
    echo "✅ Web 目录有 $FILE_COUNT 个 HTML 文件"
else
    echo "❌ Web 目录无 HTML 文件"
fi

echo ""
echo "===================="
echo "健康检查完成！"
