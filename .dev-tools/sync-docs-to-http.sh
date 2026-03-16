#!/bin/bash
#
# 文档同步脚本 - 将 Markdown 文档同步到 HTTP 服务目录并生成 HTML
#
# 用法：./sync-docs-to-http.sh
#

set -e

# 配置
SOURCE_DIR="/home/admin/.openclaw/workspace/task-board/docs"
TARGET_DIR="/home/admin/fileserver/files/docs"
WORKSPACE_DIR="/home/admin/.openclaw/workspace"

echo "📚 开始同步文档..."
echo "源目录：$SOURCE_DIR"
echo "目标目录：$TARGET_DIR"
echo ""

# 确保目标目录存在
mkdir -p "$TARGET_DIR"

# 同步 Markdown 文件
echo "📄 同步 Markdown 文件..."
cp -v "$SOURCE_DIR"/*.md "$TARGET_DIR/" 2>/dev/null || echo "无 MD 文件需要同步"

# 设置权限
chmod 644 "$TARGET_DIR"/*.md 2>/dev/null || true

echo ""
echo "✅ Markdown 文件同步完成"
echo ""

# 生成 HTML 版本
echo "🌐 生成 HTML 版本..."

# 检查是否有 markdown 命令
if command -v markdown &> /dev/null; then
    for md_file in "$TARGET_DIR"/*.md; do
        if [ -f "$md_file" ]; then
            base_name=$(basename "$md_file" .md)
            html_file="$TARGET_DIR/$base_name.html"
            
            echo "  转换：$base_name.md → $base_name.html"
            markdown "$md_file" > "$html_file"
            chmod 644 "$html_file"
        fi
    done
    echo ""
    echo "✅ HTML 生成完成 (使用 markdown 命令)"
else
    echo "⚠️  markdown 命令未安装，跳过 HTML 生成"
    echo "💡 提示：安装 markdown: sudo apt-get install markdown"
fi

echo ""
echo "📊 同步统计:"
echo "  MD 文件数量：$(ls -1 "$TARGET_DIR"/*.md 2>/dev/null | wc -l)"
echo "  HTML 文件数量：$(ls -1 "$TARGET_DIR"/*.html 2>/dev/null | wc -l)"
echo ""
echo "🔗 访问地址：https://yun.webyoung.cn/docs/"
echo ""
