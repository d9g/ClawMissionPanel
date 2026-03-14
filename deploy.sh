#!/bin/bash
# ClawMissionPanel 一键部署脚本
# 用途：快速部署多 Agent 任务调度与监控系统

set -e

echo "========================================"
echo "🦞 ClawMissionPanel 一键部署"
echo "========================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Node.js
echo -n "📦 检查 Node.js... "
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装${NC}"
    echo "请先安装 Node.js (>=18.0.0)"
    exit 1
fi
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js 版本过低 (需要 >=18.0.0)${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

# 检查 pnpm
echo -n "📦 检查 pnpm... "
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}⚠️  pnpm 未安装，尝试安装...${NC}"
    if command -v npm &> /dev/null; then
        npm install -g pnpm
    else
        echo -e "${RED}❌ npm 也未安装${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✅ pnpm $(pnpm --version)${NC}"

# 安装依赖
echo ""
echo "📦 安装依赖..."
pnpm install

# 初始化数据库
echo ""
echo "🗄️  初始化数据库..."
if [ ! -f "database/task-board.db" ]; then
    node backend/scripts/init-database.js
    echo -e "${GREEN}✅ 数据库已创建${NC}"
else
    echo -e "${YELLOW}⚠️  数据库已存在，跳过${NC}"
fi

# 同步任务
echo ""
echo "🔄 同步任务到数据库..."
pnpm run sync-tasks

# 生成任务详情页
echo ""
echo "📄 生成任务详情页..."
pnpm run generate-html

# 启动服务
echo ""
echo "🚀 启动服务..."
echo -e "${YELLOW}提示：按 Ctrl+C 停止服务${NC}"
echo ""

# 检查是否在生产环境
if [ "$NODE_ENV" = "production" ]; then
    echo -e "${GREEN}✅ 生产环境部署完成${NC}"
    echo ""
    echo "========================================"
    echo "📋 部署信息"
    echo "========================================"
    echo "访问地址：http://localhost:3000"
    echo "文档中心：http://localhost:3000/docs/"
    echo "API 地址：http://localhost:3000/api/"
    echo ""
    echo "使用 systemd 管理服务:"
    echo "  sudo systemctl start claw-mission-panel"
    echo "  sudo systemctl enable claw-mission-panel"
    echo "========================================"
else
    pnpm run start
fi

echo ""
echo -e "${GREEN}✅ 部署完成！${NC}"
