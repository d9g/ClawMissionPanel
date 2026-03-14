# 🔧 开发指南 - ClawMissionPanel

**开发者贡献指南**

---

## 📋 目录

1. [开发环境设置](#开发环境设置)
2. [项目结构](#项目结构)
3. [编码规范](#编码规范)
4. [Git 工作流](#git 工作流)
5. [测试指南](#测试指南)
6. [调试技巧](#调试技巧)
7. [提交代码](#提交代码)
8. [代码审查](#代码审查)

---

## 开发环境设置

### 1. 克隆项目

```bash
git clone https://github.com/d9g/ClawMissionPanel.git
cd ClawMissionPanel
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境

```bash
cp .env.example .env
vim .env
```

**开发环境配置**:

```bash
NODE_ENV=development
PORT=3000
DATABASE_PATH=./database/task-board.db
```

### 4. 初始化数据库

```bash
pnpm run init-db
```

### 5. 启动开发服务器

```bash
pnpm run dev
```

服务器将在 http://localhost:3000 启动，支持热重载。

### 6. 安装开发工具

```bash
# ESLint (代码检查)
pnpm add -D eslint

# Prettier (代码格式化)
pnpm add -D prettier

# Husky (Git hooks)
pnpm add -D husky
```

---

## 项目结构

```
ClawMissionPanel/
├── frontend/               # 前端代码
│   ├── index.html          # 任务板首页
│   ├── css/
│   │   └── dashboard.css   # 样式表
│   ├── js/
│   │   └── dashboard.js    # 前端逻辑
│   └── tasks/              # 任务详情页
├── backend/                # 后端代码
│   ├── src/
│   │   ├── server.js       # Express 服务器
│   │   ├── agent-status.js # Agent 状态管理
│   │   ├── task-stats.js   # 任务统计
│   │   └── health-check.js # 健康检查
│   └── scripts/            # 工具脚本
├── database/               # 数据库
│   └── task-board.db
├── tasks/                  # 任务 Markdown 文件
├── docs/                   # 文档
├── scripts/                # 部署脚本
├── .env.example            # 环境配置示例
├── .gitignore              # Git 忽略文件
├── package.json            # 项目配置
└── README.md               # 项目说明
```

---

## 编码规范

### JavaScript 规范

遵循 Airbnb JavaScript Style Guide：

```javascript
// ✅ 好的写法
const getAgentStatus = (agentId) => {
  const agent = agents.find(a => a.id === agentId);
  if (!agent) {
    throw new Error(`Agent ${agentId} not found`);
  }
  return agent.status;
};

// ❌ 避免的写法
function getAgentStatus(agentId) {
  let agent = agents.find(function(a) {
    return a.id == agentId;
  });
  if (agent == null) {
    throw new Error('Agent not found');
  }
  return agent.status;
}
```

### 命名规范

```javascript
// 变量和函数：camelCase
const taskCount = 10;
function getTaskStatus() {}

// 类：PascalCase
class TaskManager {}

// 常量：UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;

// 文件：kebab-case
// agent-status.js
// task-manager.js
```

### 注释规范

```javascript
/**
 * 获取 Agent 状态
 * @param {string} agentId - Agent ID
 * @returns {Object} Agent 状态对象
 * @throws {Error} 当 Agent 不存在时
 */
function getAgentStatus(agentId) {
  // 实现代码
}
```

### 错误处理

```javascript
// ✅ 好的写法
try {
  const task = await getTask(taskId);
  return task;
} catch (error) {
  logger.error(`Failed to get task ${taskId}:`, error);
  throw new Error(`TASK_NOT_FOUND: ${taskId}`);
}

// ❌ 避免的写法
try {
  const task = getTask(taskId);
  return task;
} catch (e) {
  console.log('error');
}
```

---

## Git 工作流

### 分支策略

```
main              # 主分支，生产环境代码
├── develop       # 开发分支
│   ├── feature/  # 功能分支
│   ├── bugfix/   # 修复分支
│   └── hotfix/   # 热修复分支
```

### 创建功能分支

```bash
# 基于 develop 创建功能分支
git checkout develop
git pull origin develop
git checkout -b feature/add-websocket-support
```

### 分支命名

- `feature/xxx` - 新功能
- `bugfix/xxx` - Bug 修复
- `hotfix/xxx` - 紧急修复
- `docs/xxx` - 文档更新
- `refactor/xxx` - 代码重构

示例：
- `feature/task-batch-import`
- `bugfix/agent-status-sync`
- `docs/api-reference-update`

---

## 测试指南

### 单元测试

```javascript
// test/agent-status.test.js
const { expect } = require('chai');
const { getAgentStatus } = require('../backend/src/agent-status');

describe('Agent Status', () => {
  describe('getAgentStatus', () => {
    it('should return agent status', () => {
      const status = getAgentStatus('xiaoyun-dev');
      expect(status).to.have.property('id');
      expect(status).to.have.property('name');
    });

    it('should throw error for non-existent agent', () => {
      expect(() => getAgentStatus('non-existent'))
        .to.throw('Agent not found');
    });
  });
});
```

### 运行测试

```bash
# 运行所有测试
pnpm test

# 运行特定测试
pnpm test -- --grep "Agent Status"

# 生成覆盖率报告
pnpm test -- --coverage
```

### 集成测试

```javascript
// test/integration/api.test.js
const request = require('supertest');
const app = require('../backend/src/server');

describe('API Endpoints', () => {
  describe('GET /api/agents/status', () => {
    it('should return agent list', async () => {
      const res = await request(app)
        .get('/api/agents/status');
      
      expect(res.statusCode).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array');
    });
  });
});
```

---

## 调试技巧

### 日志调试

```javascript
const logger = {
  info: (msg, ...args) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, ...args);
  },
  error: (msg, ...args) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, ...args);
  },
  debug: (msg, ...args) => {
    if (process.env.DEBUG) {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${msg}`, ...args);
    }
  }
};

// 使用
logger.info('Task created', { taskId: 'TASK-001' });
logger.error('Database connection failed', error);
```

### Chrome DevTools 调试

```javascript
// 在代码中添加断点
debugger;

// 或使用 console
console.log('Current state:', state);
console.table(agentList);
```

### 远程调试

```bash
# 启动 Node.js 调试模式
node --inspect=0.0.0.0:9229 backend/src/server.js

# 或使用 nodemon
nodemon --inspect=0.0.0.0:9229 backend/src/server.js
```

在 Chrome 中访问 `chrome://inspect` 连接调试器。

### 数据库调试

```bash
# 查看 SQL 查询
sqlite3 database/task-board.db
SQLite> .mode column
SQLite> .headers on
SQLite> SELECT * FROM tasks WHERE status='PENDING';
```

---

## 提交代码

### 提交信息规范

遵循 Conventional Commits 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type**:
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建/工具

**示例**:

```bash
# 新功能
git commit -m "feat(task): add batch import functionality"

# Bug 修复
git commit -m "fix(agent): resolve status sync issue"

# 文档更新
git commit -m "docs(api): update API reference"

# 完整提交信息
git commit -m "feat(task): add WebSocket real-time updates

- Implement WebSocket server
- Add client-side event handlers
- Update dashboard with real-time data

Closes #123"
```

### 提交前检查

```bash
# 1. 运行代码检查
pnpm run lint

# 2. 运行测试
pnpm test

# 3. 格式化代码
pnpm run format

# 4. 检查 Git 状态
git status

# 5. 预览提交
git diff --cached
```

### 推送代码

```bash
# 推送功能分支
git push origin feature/add-websocket-support

# 推送并设置上游
git push -u origin feature/add-websocket-support
```

---

## 代码审查

### 审查清单

#### 代码质量

- [ ] 代码是否遵循编码规范？
- [ ] 是否有适当的注释？
- [ ] 是否有重复代码？
- [ ] 函数是否足够简洁？
- [ ] 变量命名是否清晰？

#### 功能正确性

- [ ] 功能是否按预期工作？
- [ ] 边界条件是否处理？
- [ ] 错误处理是否完善？
- [ ] 是否有安全漏洞？
- [ ] 性能是否可接受？

#### 测试覆盖

- [ ] 是否添加了单元测试？
- [ ] 测试是否覆盖边界情况？
- [ ] 测试是否通过？
- [ ] 覆盖率是否达标？

#### 文档

- [ ] 是否更新了相关文档？
- [ ] API 文档是否同步？
- [ ] 注释是否清晰？
- [ ] README 是否需要更新？

### 审查流程

1. **创建 Pull Request**
   ```bash
   # GitHub 上创建 PR
   # 从 feature 分支合并到 develop
   ```

2. **填写 PR 描述**
   ```markdown
   ## 变更说明
   - 添加了 WebSocket 实时通知功能
   
   ## 相关 Issue
   Closes #123
   
   ## 测试计划
   - [x] 单元测试通过
   - [x] 手动测试 WebSocket 连接
   - [x] 验证浏览器兼容性
   
   ## 截图
   [如有 UI 变更]
   ```

3. **等待审查**
   - 至少 1 人审查通过
   - 所有 CI 检查通过
   - 解决所有评论

4. **合并代码**
   - Squash and merge (推荐)
   - 删除功能分支

### 审查意见示例

```markdown
✅ 好的意见：
- "这个函数逻辑清晰，命名准确"
- "错误处理很完善"
- "测试覆盖全面"

⚠️ 改进建议：
- "建议将这个函数拆分为两个小函数"
- "这里可能需要添加空值检查"
- "考虑添加性能优化"

❌ 避免的意见：
- "我不喜欢这样写" (主观)
- "应该用 XXX 库" (无具体理由)
```

---

## 性能优化

### 前端优化

```javascript
// 1. 防抖处理
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 2. 懒加载
const taskList = document.getElementById('task-list');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadMoreTasks();
    }
  });
});

// 3. 缓存 DOM 查询
const taskListCache = document.getElementById('task-list');
// 避免重复查询
```

### 后端优化

```javascript
// 1. 数据库查询优化
const stmt = db.prepare(`
  SELECT * FROM tasks 
  WHERE status = ? 
  ORDER BY created_at DESC
  LIMIT ?
`);
const tasks = stmt.all('PENDING', 20);

// 2. 缓存热点数据
const NodeCache = require('node-cache');
const taskCache = new NodeCache({ stdTTL: 300 });

function getTaskStats() {
  const cached = taskCache.get('stats');
  if (cached) return cached;
  
  const stats = calculateStats();
  taskCache.set('stats', stats);
  return stats;
}

// 3. 批量操作
const insertMany = db.transaction((tasks) => {
  for (const task of tasks) {
    insert.run(task);
  }
});
```

---

## 常见问题

### Q: 如何添加新功能？

1. 创建功能分支
2. 编写代码
3. 添加测试
4. 提交代码
5. 创建 PR

### Q: 如何修复 Bug？

1. 复现 Bug
2. 定位问题
3. 创建 bugfix 分支
4. 修复并测试
5. 提交代码

### Q: 如何更新文档？

1. 修改 docs/ 下的文件
2. 运行文档构建 (如有)
3. 提交代码

### Q: 如何贡献？

1. Fork 项目
2. 创建分支
3. 提交更改
4. 创建 PR

---

## 相关文档

- [🏗️ 架构设计](./ARCHITECTURE.md)
- [📡 API 参考](./API-REFERENCE.md)
- [📖 用户手册](./USER-GUIDE.md)

---

_开发指南，助力高效代码开发。_ 🦞
