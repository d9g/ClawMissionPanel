# 🔐 安全配置指南

**重要**: 本文档说明如何安全地配置 ClawMissionPanel，避免敏感信息泄露。

---

## ⚠️ 绝对不要提交到 Git 的文件

### 1. 环境配置文件
- `.env`
- `.env.local`
- `.env.production`
- `config.json`（包含密码的）

### 2. 密钥文件
- `*.pem`
- `*.key`
- `credentials.json`
- `service-account.json`

### 3. OpenClaw 配置
- `openclaw.json`（包含 gateway token）
- `agents/*/inbox/*`（包含任务通知）
- `agents/*/sessions/*`（包含会话记录）

### 4. 数据库文件
- `database/*.db`（可能包含敏感数据）
- `*.sqlite`

### 5. 日志文件
- `*.log`
- `logs/`

---

## ✅ 正确的配置方式

### 1. 使用环境变量

**创建 .env 文件**（不要提交）:

```bash
# 复制示例文件
cp .env.example .env

# 编辑 .env 文件
vim .env
```

**.env 内容**:

```bash
# 服务器配置
PORT=3000
NODE_ENV=production

# OpenClaw 网关配置
OPENCLAW_GATEWAY_HOST=127.0.0.1
OPENCLAW_GATEWAY_PORT=18789
OPENCLAW_GATEWAY_TOKEN=your_actual_token_here

# 认证配置
AUTH_SECRET=your_secret_key_here
API_KEY=your_api_key_here
```

### 2. 在代码中读取

```javascript
// ✅ 正确的做法
const PORT = process.env.PORT || 3000;
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN;

// ❌ 错误的做法（硬编码）
const GATEWAY_TOKEN = 'clh_xxxxx';  // 绝对不要这样写！
```

### 3. 使用配置管理

```javascript
// config.js
const config = {
  port: process.env.PORT || 3000,
  gateway: {
    host: process.env.OPENCLAW_GATEWAY_HOST || '127.0.0.1',
    port: process.env.OPENCLAW_GATEWAY_PORT || 18789,
    token: process.env.OPENCLAW_GATEWAY_TOKEN
  }
};

module.exports = config;
```

---

## 🔍 提交前检查清单

### Git 提交前

- [ ] 运行 `git status` 检查文件列表
- [ ] 确认没有 `.env` 文件
- [ ] 确认没有 `openclaw.json`
- [ ] 确认没有 `*.log` 文件
- [ ] 确认没有数据库文件
- [ ] 使用 `git diff --cached` 预览更改

### 自动化检查

```bash
# 安装 git-secrets（可选）
brew install git-secrets

# 初始化
git secrets --install

# 扫描历史提交
git secrets --scan
```

---

## 🚨 如果已经泄露了

### 1. 立即撤销

- **GitHub Token**: https://github.com/settings/tokens
- **API Key**: 联系服务提供商
- **数据库密码**: 立即修改

### 2. 删除泄露的文件

```bash
# 从 Git 历史中删除文件
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch path/to/secret/file' \
  --prune-empty --tag-name-filter cat -- --all

# 强制推送
git push origin --force --all
```

### 3. 通知用户

- 发布安全公告
- 说明泄露的内容
- 说明已采取的措施

---

## 📋 安全检查脚本

```bash
#!/bin/bash
# security-check.sh

echo "🔍 检查敏感文件..."

# 检查 .env 文件
if [ -f ".env" ]; then
  echo "⚠️  发现 .env 文件，请确认未提交"
fi

# 检查 openclaw.json
if [ -f "openclaw.json" ]; then
  echo "⚠️  发现 openclaw.json，请确认未提交"
fi

# 检查日志文件
if ls *.log 1> /dev/null 2>&1; then
  echo "⚠️  发现日志文件，请确认未提交"
fi

echo "✅ 检查完成"
```

---

## 🎯 最佳实践

1. **最小权限原则** - 只授予必要的权限
2. **定期轮换密钥** - 每 90 天更换一次
3. **使用密钥管理服务** - 如 AWS Secrets Manager
4. **代码审查** - 提交前必须审查
5. **自动化扫描** - 使用工具检测敏感信息

---

**安全第一，预防为主！** 🔒

