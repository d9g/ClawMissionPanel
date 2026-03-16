# 🚀 Agent 团队创建器技能设计方案

**版本**: v1.0 (草案)  
**创建时间**: 2026-03-14  
**评审状态**: 待评审 (xiaoyun-judge)  
**评审任务**: REVIEW-20260314-001

---

## 📋 目录

1. [项目概述](#项目概述)
2. [核心功能](#核心功能)
3. [架构设计](#架构设计)
4. [配置文件格式](#配置文件格式)
5. [工作流程](#工作流程)
6. [技术实现](#技术实现)
7. [优化空间](#优化空间)
8. [风险评估](#风险评估)
9. [实施计划](#实施计划)

---

## 项目概述

### 背景

当前多 Agent 团队（小云开发/测试/记录/评委/调度）的创建过程：
- ❌ 手动复制目录结构
- ❌ 逐个修改配置文件
- ❌ 重复编写相似文档
- ❌ 容易遗漏关键配置
- ❌ 无法快速复制团队模式

### 目标

创建一个通用技能，实现：
- ✅ **一键部署** - 配置文件驱动，自动创建整个团队
- ✅ **模板化** - 预定义角色模板，快速复用
- ✅ **可定制** - 支持自定义角色特性
- ✅ **继承机制** - 默认继承主 Agent 特性
- ✅ **独立工作空间** - 每个 Agent 独立目录，可单独管理

### 价值

| 受益方 | 价值 |
|--------|------|
| **用户** | 5 分钟创建完整团队，无需技术细节 |
| **开发者** | 标准化 Agent 结构，减少错误 |
| **系统** | 统一的注册和管理机制 |
| **扩展性** | 轻松添加新角色或调整团队结构 |

---

## 核心功能

### 功能清单

| 功能 | 描述 | 优先级 |
|------|------|--------|
| **团队配置解析** | 读取 YAML/JSON 配置文件 | P0 |
| **Agent 目录生成** | 创建独立工作空间 | P0 |
| **配置文件生成** | 自动生成 IDENTITY.md、SOUL.md 等 | P0 |
| **OpenClaw 注册** | 更新主配置，注册新 Agent | P0 |
| **模板继承** | 继承主 Agent 基础特性 | P1 |
| **角色模板库** | 预定义常见角色模板 | P1 |
| **任务规则生成** | 为每个角色生成任务分配规则 | P1 |
| **团队协作文档** | 自动生成团队管理规范 | P2 |
| **验证机制** | 创建后自动验证可用性 | P2 |
| **回滚支持** | 创建失败可回滚 | P3 |

---

## 架构设计

### 系统架构

```
┌─────────────────────────────────────────────────────┐
│                    用户界面                          │
│  (CLI / Web UI / 配置文件)                          │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│              团队创建器 (Team Creator)               │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ 配置解析器   │  │ 模板引擎     │  │ 验证器    │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ 目录生成器   │  │ 注册器       │  │ 回滚器    │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│                    输出产物                          │
│  • agents/{agent-id}/ 目录结构                      │
│  • OpenClaw 配置更新                                │
│  • 团队协作文档                                     │
│  • 验证报告                                         │
└─────────────────────────────────────────────────────┘
```

### 模块划分

```
team-creator/
├── src/
│   ├── cli.js              # 命令行入口
│   ├── parser.js           # 配置文件解析
│   ├── generator.js        # 文件生成器
│   ├── registrar.js        # OpenClaw 注册器
│   ├── validator.js        # 验证器
│   └── rollback.js         # 回滚器
├── templates/
│   ├── agent/
│   │   ├── IDENTITY.md.tpl
│   │   ├── SOUL.md.tpl
│   │   ├── AGENTS.md.tpl
│   │   ├── HEARTBEAT.md.tpl
│   │   ├── MEMORY.md.tpl
│   │   └── USER.md.tpl
│   ├── roles/
│   │   ├── developer.yaml
│   │   ├── tester.yaml
│   │   ├── recorder.yaml
│   │   ├── judge.yaml
│   │   └── dispatcher.yaml
│   └── team/
│       ├── workflow.md.tpl
│       └── rules.md.tpl
├── config/
│   ├── default-team.yaml   # 默认团队配置
│   └── schema.json         # 配置校验 Schema
└── README.md
```

---

## 配置文件格式

### 团队配置文件 (team.yaml)

```yaml
# 团队基本信息
team:
  name: "小云开发团队"
  version: "1.0.0"
  description: "多 Agent 协作开发团队"
  created: "2026-03-14"

# 主 Agent 继承配置
inheritance:
  base_agent: "main"  # 继承自主 Agent
  inherit_files:      # 继承的文件
    - SOUL.md
    - AGENTS.md
    - USER.md
  override_files:     # 覆盖的文件
    - IDENTITY.md
    - HEARTBEAT.md

# 角色定义
roles:
  - id: "xiaoyun-dev"
    name: "小云开发"
    emoji: "💻"
    role_type: "developer"  # 使用预定义模板
    model: "alibaba-cloud/qwen3.5-plus"
    custom:
      core_responsibilities:
        - "功能开发"
        - "Bug 修复"
        - "代码审查"
      work_rules:
        - "严格按照评审通过的需求执行"
        - "不实现需求里不存在的功能"

  - id: "xiaoyun-test"
    name: "小云测试"
    emoji: "✅"
    role_type: "tester"
    model: "alibaba-cloud/qwen3.5-plus"
    custom:
      core_responsibilities:
        - "功能测试"
        - "异常监控"
        - "质量报告"

  - id: "xiaoyun-recorder"
    name: "小云记录"
    emoji: "📝"
    role_type: "recorder"
    model: "alibaba-cloud/qwen3.5-plus"

  - id: "xiaoyun-judge"
    name: "小云评委"
    emoji: "⚖️"
    role_type: "judge"
    model: "alibaba-cloud/qwen3.5-plus"

  - id: "xiaoyun-dispatch"
    name: "小云调度"
    emoji: "🎯"
    role_type: "dispatcher"
    model: "alibaba-cloud/qwen3.5-plus"

# 团队协作规则
collaboration:
  task_assignment: "auto"  # auto/manual
  communication_channel: "inbox"
  progress_update_interval: "30m"
  health_check_interval: "15m"

# 高级选项
advanced:
  create_docs: true       # 生成团队协作文档
  validate_after: true    # 创建后验证
  backup_before: true     # 创建前备份
  dry_run: false          # 预览模式
```

### 简化模式 (最小配置)

```yaml
# 快速创建 - 只指定角色
roles:
  - developer
  - tester
  - recorder

# 其他全部使用默认值
```

---

## 工作流程

### 完整流程

```
1. 用户创建配置文件 (team.yaml)
         ↓
2. 解析配置 + 校验 Schema
         ↓
3. 加载角色模板 (预定义 + 自定义)
         ↓
4. 生成 Agent 目录结构
   ├── 创建目录 agents/{agent-id}/
   ├── 生成基础文件 (IDENTITY.md, SOUL.md, etc.)
   ├── 生成角色特定文件 (MEMORY.md, HEARTBEAT.md)
   └── 设置权限 (700/600)
         ↓
5. 注册到 OpenClaw
   ├── 更新 openclaw.json (agents 配置)
   ├── 创建 inbox 目录
   └── 初始化 sessions
         ↓
6. 生成团队文档
   ├── TEAM-WORKFLOW.md
   ├── ROLE-RESPONSIBILITIES.md
   └── TASK-ASSIGNMENT-RULES.md
         ↓
7. 验证创建结果
   ├── 检查目录结构
   ├── 检查文件完整性
   ├── 检查配置有效性
   └── 生成验证报告
         ↓
8. 输出结果
   ├── 成功：打印摘要 + 下一步建议
   └── 失败：回滚 + 错误报告
```

### 命令行示例

```bash
# 1. 创建默认团队配置
team-creator init

# 2. 编辑配置文件
vim team.yaml

# 3. 预览（不实际创建）
team-creator create --dry-run

# 4. 创建团队
team-creator create team.yaml

# 5. 验证创建结果
team-creator validate

# 6. 回滚（如有问题）
team-creator rollback
```

---

## 技术实现

### 核心代码结构

#### 1. 配置解析器 (parser.js)

```javascript
const fs = require('fs');
const yaml = require('js-yaml');
const Ajv = require('ajv');

class ConfigParser {
  constructor() {
    this.schema = require('../config/schema.json');
    this.ajv = new Ajv();
  }

  parse(configPath) {
    const content = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(content);
    
    const validate = this.ajv.compile(this.schema);
    const valid = validate(config);
    
    if (!valid) {
      throw new Error(`配置校验失败：${validate.errors}`);
    }
    
    return config;
  }

  mergeWithDefaults(config) {
    const defaults = require('../config/default-team.yaml');
    return { ...defaults, ...config };
  }
}
```

#### 2. 文件生成器 (generator.js)

```javascript
const fs = require('fs-extra');
const path = require('path');
const Handlebars = require('handlebars');

class FileGenerator {
  constructor(templateDir) {
    this.templateDir = templateDir;
  }

  async generateAgent(agentConfig, baseAgentPath) {
    const agentDir = path.join('workspace/agents', agentConfig.id);
    
    // 创建目录结构
    await fs.ensureDir(agentDir);
    await fs.ensureDir(path.join(agentDir, 'inbox'));
    await fs.ensureDir(path.join(agentDir, 'sessions'));
    await fs.ensureDir(path.join(agentDir, 'memory'));
    
    // 继承基础文件
    if (agentConfig.inheritance) {
      await this.inheritFiles(agentConfig, baseAgentPath, agentDir);
    }
    
    // 生成角色特定文件
    await this.generateIdentity(agentConfig, agentDir);
    await this.generateSoul(agentConfig, agentDir);
    await this.generateMemory(agentConfig, agentDir);
    await this.generateHeartbeat(agentConfig, agentDir);
    
    // 设置权限
    await this.setPermissions(agentDir);
  }

  async inheritFiles(config, baseDir, targetDir) {
    for (const file of config.inheritance.inherit_files) {
      const src = path.join(baseDir, file);
      const dst = path.join(targetDir, file);
      
      if (await fs.pathExists(src)) {
        await fs.copy(src, dst);
      }
    }
  }
}
```

#### 3. OpenClaw 注册器 (registrar.js)

```javascript
class OpenClawRegistrar {
  constructor(openclawConfigPath) {
    this.configPath = openclawConfigPath;
  }

  async registerAgent(agentConfig) {
    const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
    
    // 添加 Agent 配置
    if (!config.agents) {
      config.agents = {};
    }
    
    config.agents[agentConfig.id] = {
      model: agentConfig.model,
      workspace: `workspace/agents/${agentConfig.id}`,
      inbox: `workspace/agents/${agentConfig.id}/inbox`,
      enabled: true
    };
    
    // 写回配置
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    
    // 触发 Gateway 重启（可选）
    if (agentConfig.restart_gateway) {
      await this.restartGateway();
    }
  }
}
```

### 模板示例

#### IDENTITY.md.tpl

```markdown
# IDENTITY.md - {{name}}

- **名称**: {{name}}
- **代号**: {{id}}
- **角色**: {{role_type}}
- **Emoji**: {{emoji}}
- **团队**: {{team_name}}

---

**创建时间**: {{created_at}}
**模型**: {{model}}
**职责**: 
{{#each core_responsibilities}}
- {{this}}
{{/each}}
```

#### HEARTBEAT.md.tpl

```markdown
# HEARTBEAT.md - {{name}} 心跳任务

## 职责范围
{{#each core_responsibilities}}
- [ ] {{this}}
{{/each}}

## 检查频率
- **任务进度**: 每 30 分钟
- **健康状态**: 每 15 分钟
- **Inbox 检查**: 持续监听

## 告警规则
- 任务超过预计时间 50% → 🟠 提醒
- 任务超过截止时间 → 🔴 告警
- 连续 2 次无进展 → 🔴 检查状态
```

---

## 优化空间

### 当前方案的改进点

#### 1. **智能推荐系统** ⭐⭐⭐

**问题**: 用户可能不知道需要哪些角色

**方案**:
```yaml
# 根据项目类型推荐团队
project_type: "web_development"  # 推荐：dev + test + recorder

project_type: "content_creation"  # 推荐：writer + editor + publisher

project_type: "data_analysis"     # 推荐：analyst + validator + reporter
```

#### 2. **角色模板市场** ⭐⭐

**问题**: 预定义模板有限

**方案**:
- 创建 ClawHub 技能包：`team-templates`
- 社区贡献角色模板（产品经理、运维、安全专家等）
- 一键下载和应用模板

#### 3. **渐进式创建** ⭐⭐

**问题**: 一次性创建所有 Agent 可能浪费资源

**方案**:
```bash
# 先创建核心角色
team-creator create --roles dev,test

# 按需添加
team-creator add --role recorder
team-creator add --role judge
```

#### 4. **Agent 间依赖关系** ⭐

**问题**: 某些角色需要特定协作关系

**方案**:
```yaml
roles:
  - id: xiaoyun-dev
    dependencies: []
    
  - id: xiaoyun-test
    dependencies: [xiaoyun-dev]  # 测试依赖开发
    
  - id: xiaoyun-judge
    dependencies: [xiaoyun-dev, xiaoyun-test]  # 评审依赖开发和测试
```

#### 5. **动态负载均衡** ⭐⭐⭐

**问题**: 固定分配可能导致某些 Agent 过载

**方案**:
```yaml
collaboration:
  load_balancing: "dynamic"
  max_tasks_per_agent: 5
  overflow_strategy: "redirect_to_main"  # 超载时转给主 Agent
```

#### 6. **角色权限分级** ⭐

**问题**: 所有 Agent 权限相同，不够安全

**方案**:
```yaml
roles:
  - id: xiaoyun-dev
    permissions:
      file_read: ["workspace/**"]
      file_write: ["workspace/projects/**"]
      exec_allowed: false
      
  - id: xiaoyun-dispatch
    permissions:
      file_read: ["workspace/**"]
      file_write: ["workspace/tasks/**"]
      exec_allowed: true
      exec_whitelist: ["git", "pnpm"]
```

#### 7. **团队克隆功能** ⭐⭐

**问题**: 想为不同项目创建相似团队

**方案**:
```bash
# 导出当前团队配置
team-creator export my-team.yaml

# 基于现有团队创建新团队（修改部分角色）
team-creator clone my-team.yaml --name "新项目团队" --override "xiaoyun-dev.model=gpt-4"
```

#### 8. **可视化配置界面** ⭐

**问题**: YAML 配置对非技术用户不友好

**方案**:
- Web UI 拖拽式配置
- 实时预览团队结构
- 一键部署

---

## 风险评估

### 技术风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| OpenClaw 配置冲突 | 中 | 高 | 创建前备份 + 回滚机制 |
| Agent 目录权限错误 | 低 | 中 | 标准化权限设置 + 验证 |
| 模板渲染失败 | 低 | 中 | 严格的模板测试 |
| Gateway 重启失败 | 中 | 高 | 手动重启指南 + 自动检测 |

### 使用风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 创建过多 Agent 消耗资源 | 中 | 中 | 默认限制 + 警告提示 |
| 角色职责重叠 | 中 | 低 | 模板设计时避免重叠 |
| 配置过于复杂 | 高 | 低 | 提供简化模式 + 默认值 |

### 安全风险

| 风险 | 缓解措施 |
|------|---------|
| 恶意 Agent 配置 | Schema 校验 + 权限限制 |
| 敏感信息泄露 | 不复制主 Agent 的敏感配置 |
| 未授权访问 | 目录权限 700/600 |

---

## 实施计划

### Phase 1: 核心功能 (3 天)

**任务**:
- [ ] 创建项目结构
- [ ] 实现配置解析器
- [ ] 实现文件生成器
- [ ] 实现 OpenClaw 注册器
- [ ] 创建基础角色模板 (dev/test/recorder)

**交付物**:
- `team-creator` CLI 工具
- 基础模板库
- 使用文档

### Phase 2: 增强功能 (2 天)

**任务**:
- [ ] 添加验证器
- [ ] 添加回滚机制
- [ ] 创建更多角色模板 (judge/dispatcher)
- [ ] 生成团队协作文档
- [ ] 完善错误处理

**交付物**:
- 完整的 CLI 工具
- 5 个角色模板
- 验证和回滚功能

### Phase 3: 优化体验 (2 天)

**任务**:
- [ ] 添加 --dry-run 预览模式
- [ ] 添加交互式配置向导
- [ ] 创建 Web UI (可选)
- [ ] 编写详细文档
- [ ] 发布到 ClawHub

**交付物**:
- 用户友好的 CLI
- ClawHub 技能包
- 完整文档

---

## 附录

### A. 预定义角色模板清单

| 模板名 | 适用场景 | 核心职责 |
|--------|---------|---------|
| `developer` | 功能开发 | 编码、调试、单元测试 |
| `tester` | 质量保障 | 测试用例、执行测试、报告 |
| `recorder` | 文档管理 | 编写文档、整理归档、知识库 |
| `judge` | 质量评审 | 方案评审、代码审查、风险评估 |
| `dispatcher` | 任务调度 | 任务分发、进度追踪、资源协调 |
| `researcher` | 信息收集 | 市场调研、竞品分析、趋势研究 |
| `designer` | 产品设计 | UI/UX 设计、原型制作、用户研究 |
| `devops` | 运维部署 | 部署、监控、自动化、安全 |

### B. 配置文件 Schema (简化版)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["roles"],
  "properties": {
    "team": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "version": { "type": "string" },
        "description": { "type": "string" }
      }
    },
    "roles": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "name"],
        "properties": {
          "id": { "type": "string", "pattern": "^[a-z0-9-]+$" },
          "name": { "type": "string" },
          "emoji": { "type": "string" },
          "role_type": { "type": "string", "enum": ["developer", "tester", "recorder", "judge", "dispatcher"] },
          "model": { "type": "string" }
        }
      }
    }
  }
}
```

### C. 命令参考

```bash
# 初始化配置
team-creator init [team-name]

# 创建团队
team-creator create <config.yaml> [options]
  --dry-run          预览模式
  --skip-validation  跳过验证
  --no-backup        不创建备份

# 添加单个 Agent
team-creator add <role> [options]
  --id <agent-id>    自定义 Agent ID
  --model <model>    指定模型

# 验证团队
team-creator validate [team-name]

# 回滚
team-creator rollback [backup-id]

# 导出配置
team-creator export <output.yaml>

# 克隆团队
team-creator clone <source.yaml> [options]
  --name <new-name>  新团队名称
  --override <key=value>  覆盖配置
```

---

## 总结

### 方案优势

✅ **标准化**: 统一的 Agent 创建流程  
✅ **可复用**: 模板化设计，快速复制  
✅ **灵活**: 支持自定义和继承  
✅ **安全**: 权限控制和回滚机制  
✅ **易用**: 简化模式 + 详细文档  

### 待评审问题

1. **角色模板粒度**: 预定义模板应该多细？(粗粒度 vs 细粒度)
2. **继承范围**: 应该继承主 Agent 的哪些文件？(全部 vs 部分)
3. **注册方式**: 自动更新配置 vs 手动确认？
4. **验证深度**: 轻量验证 vs 完整功能测试？
5. **优先级**: 哪些优化功能应该放入 v1.0？

---

**下一步**: 提交给小云评委 (xiaoyun-judge) 评审

**评审任务**: REVIEW-20260314-001  
**评审重点**: 方案完整性、安全性、可行性、优化建议

---

_Made with ☁️ by 小云团队_
