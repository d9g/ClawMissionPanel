#!/bin/bash
#
# 清理文档中的绝对路径和敏感信息
#

set -e

DOCS_DIR="/home/admin/.openclaw/workspace/task-board/docs"

echo "🔒 开始清理文档中的敏感信息..."

# 1. 替换 /home/admin/.openclaw/workspace 为 <workspace>
find "$DOCS_DIR" -name "*.md" -type f -exec sed -i 's|/home/admin/.openclaw/workspace|<workspace>|g' {} \;
echo "✅ 已替换 workspace 路径"

# 2. 替换 /home/admin/fileserver 为 <fileserver>
find "$DOCS_DIR" -name "*.md" -type f -exec sed -i 's|/home/admin/fileserver|<fileserver>|g' {} \;
echo "✅ 已替换 fileserver 路径"

# 3. 替换具体的 cd 命令为相对路径描述
find "$DOCS_DIR" -name "*.md" -type f -exec sed -i 's|cd /home/admin/.openclaw/workspace/task-board &&|cd task-board &&|g' {} \;
echo "✅ 已简化 cd 命令"

# 4. 替换服务器 IP 地址
find "$DOCS_DIR" -name "*.md" -type f -exec sed -i 's|iZ6weg099z8odxhxeq49hzZ|<server-id>|g' {} \;
echo "✅ 已替换服务器 ID"

# 5. 替换具体的日志路径
find "$DOCS_DIR" -name "*.md" -type f -exec sed -i 's|/tmp/task-board.log|<logs>/task-board.log|g' {} \;
echo "✅ 已替换日志路径"

# 6. 替换数据库路径
find "$DOCS_DIR" -name "*.md" -type f -exec sed -i 's|database/task-board.db|<database>/tasks.db|g' {} \;
echo "✅ 已替换数据库路径"

echo ""
echo "📊 清理完成！"
echo "替换统计:"
echo "  - workspace 路径：$(grep -r "<workspace>" "$DOCS_DIR" | wc -l) 处"
echo "  - fileserver 路径：$(grep -r "<fileserver>" "$DOCS_DIR" | wc -l) 处"
echo "  - 服务器 ID: $(grep -r "<server-id>" "$DOCS_DIR" | wc -l) 处"
echo ""
