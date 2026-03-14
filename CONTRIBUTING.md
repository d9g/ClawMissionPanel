# 🤝 贡献指南

欢迎参与 ClawMissionPanel 项目！本指南帮助你快速开始贡献。

---

## 📋 目录

- [行为准则](#行为准则)
- [我能贡献什么](#我能贡献什么)
- [开发环境设置](#开发环境设置)
- [提交流程](#提交流程)
- [代码规范](#代码规范)
- [Issue 规范](#issue-规范)
- [PR 规范](#pr-规范)

---

## 🎯 行为准则

本项目采用 [贡献者公约](https://www.contributor-covenant.org/) 行为准则：

- 使用友好和包容的语言
- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

---

## 💡 我能贡献什么

### 1. 报告 Bug

发现 Bug？请提交 Issue：

- 使用清晰的标题
- 描述复现步骤
- 提供预期行为和实际行为
- 附上截图或日志（如适用）
- 标注环境信息（Node.js 版本、操作系统等）

### 2. 提出新功能

有新想法？欢迎提交 Issue：

- 描述功能需求
- 说明使用场景
- 提供实现思路（可选）
- 标注优先级

### 3. 提交代码

- 修复 Bug
- 添加新功能
- 改进文档
- 优化性能
- 添加测试

### 4. 改进文档

- 修正错别字
- 补充说明
- 添加示例
- 翻译文档

### 5. 分享经验

- 写教程文章
- 录制视频
- 在社区推广
- 提供使用反馈

---

## 🛠️ 开发环境设置

### 1. Fork 项目

```bash
# 在 GitHub 上点击 Fork 按钮
```

### 2. 克隆到本地

```bash
git clone https://github.com/YOUR_USERNAME/ClawMissionPanel.git
cd ClawMissionPanel
```

### 3. 安装依赖

```bash
pnpm install
```

### 4. 启动开发服务器

```bash
pnpm run dev
```

### 5. 创建分支

```bash
git checkout -b feature/your-feature-name
```

---

## 📝 提交流程

### 1. 修改代码

在本地进行修改和测试。

### 2. 提交更改

```bash
git add .
git commit -m "feat: 添加新功能

- 功能描述 1
- 功能描述 2"
```

**Commit 信息规范**:

- `feat:` 新功能
- `fix:` Bug 修复
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建/工具相关

### 3. 推送到远程

```bash
git push origin feature/your-feature-name
```

### 4. 创建 Pull Request

在 GitHub 上：

1. 点击 "New Pull Request"
2. 选择分支
3. 填写 PR 描述
4. 等待审核

---

## 📏 代码规范

### JavaScript 规范

- 使用 ES6+ 语法
- 使用单引号
- 语句末尾加分号
- 使用 2 空格缩进
- 函数使用驼峰命名
- 类使用大驼峰命名
- 常量使用全大写

**示例**:

```javascript
// ✅ 好的写法
const MAX_RETRY = 3;

function getUserInfo(userId) {
  return db.get('SELECT * FROM users WHERE id = ?', [userId]);
}

class TaskManager {
  constructor() {
    this.tasks = [];
  }
}

// ❌ 不好的写法
const max_retry = 3;
function getuserinfo(UserId) {
  return db.get('SELECT * FROM users WHERE id = ?', [UserId])
}
```

### 文件命名

- JavaScript 文件：`camelCase.js`
- CSS 文件：`kebab-case.css`
- Markdown 文件：`kebab-case.md`
- 测试文件：`*.test.js`

### 注释规范

```javascript
/**
 * 获取用户信息
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 用户信息对象
 */
async function getUserInfo(userId) {
  // 实现代码
}
```

---

## 📋 Issue 规范

### Bug 报告模板

```markdown
**问题描述**
[清晰描述问题]

**复现步骤**
1. ...
2. ...
3. ...

**预期行为**
[应该发生什么]

**实际行为**
[实际发生了什么]

**环境信息**
- Node.js 版本：
- 操作系统：
- 浏览器（如适用）：

**截图**
[如适用，添加截图]
```

### 功能请求模板

```markdown
**功能描述**
[清晰描述你想要的功能]

**使用场景**
[为什么需要这个功能]

**实现建议**
[可选：如何实现]

**替代方案**
[可选：考虑过哪些替代方案]
```

---

## 📤 PR 规范

### PR 标题

使用统一的格式：

```
<type>(<scope>): <subject>
```

**示例**:
- `feat(agent): 添加小云调度 Agent`
- `fix(api): 修复任务状态更新 Bug`
- `docs(readme): 更新安装说明`

### PR 描述

```markdown
## 📋 变更内容

[描述你的更改]

## 🎯 相关 Issue

Fixes #123

## 🧪 测试

[说明你做了哪些测试]

## 📸 截图（如适用）

[添加截图]

## ✅ 检查清单

- [ ] 代码通过测试
- [ ] 添加了必要的测试
- [ ] 文档已更新
- [ ] 遵循代码规范
```

---

## 🚀 发布流程

1. PR 被合并到主分支
2. 自动触发 CI/CD
3. 创建新的 Release
4. 发布到 npm（如适用）

---

## 💬 沟通渠道

- **GitHub Issues**: 讨论功能和 Bug
- **GitHub Discussions**: 一般讨论
- **邮箱**: [请自行补充]
- **微信公众号**: [请自行补充]

---

## 🙏 致谢

感谢所有贡献者！

[![Contributors](https://contrib.rocks/image?repo=d9g/ClawMissionPanel)](https://github.com/d9g/ClawMissionPanel/graphs/contributors)

---

_让协作更高效，让代码更优雅！_ 🦞
