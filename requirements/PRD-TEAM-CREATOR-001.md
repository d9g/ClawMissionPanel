# 🚀 Agent 团队创建器 - 产品需求文档

**文档 ID**: PRD-TEAM-CREATOR-001  
**版本**: v1.0  
**创建时间**: 2026-03-14  
**状态**: 🟡 待评审  
**优先级**: P1  

---

## 📋 目录

1. [产品概述](#产品概述)
2. [用户需求](#用户需求)
3. [功能需求](#功能需求)
4. [非功能需求](#非功能需求)
5. [技术方案](#技术方案)
6. [项目计划](#项目计划)
7. [验收标准](#验收标准)
8. [风险评估](#风险评估)

---

## 产品概述

### 背景

当前多 Agent 团队（小云开发/测试/记录/评委/调度）的创建过程繁琐：

**痛点**:
- ❌ 手动复制目录结构，容易出错
- ❌ 逐个修改配置文件，效率低下
- ❌ 重复编写相似文档，工作量大
- ❌ 容易遗漏关键配置，导致 Agent 无法正常工作
- ❌ 无法快速复制团队模式到新项目

**现状**:
- 创建一个新 Agent 需要手动操作 10+ 个文件
- 需要熟悉 OpenClaw 配置结构
- 需要 30-60 分钟才能完成一个 Agent 的创建
- 新团队成员上手成本高

### 产品定位

**Agent 团队创建器**是一个 CLI 工具，让用户通过配置文件一键部署完整的多 Agent 团队。

**价值主张**:
- ✅ **5 分钟创建团队** - 配置文件驱动，自动化生成
- ✅ **零技术门槛** - 无需了解 OpenClaw 内部结构
- ✅ **标准化** - 统一的 Agent 目录结构和配置规范
- ✅ **可复用** - 模板化设计，快速复制到新项目
- ✅ **安全可靠** - 权限控制、配置校验、回滚机制

### 目标用户

| 用户类型 | 需求 | 使用场景 |
|---------|------|---------|
| **项目管理者** | 快速组建团队 | 新项目启动时创建完整团队 |
| **开发者** | 添加新角色 | 项目扩展时增加新 Agent |
| **技术爱好者** | 实验不同团队配置 | 测试不同角色组合的效果 |

---

## 用户需求

### 用户故事

#### US-001: 基础团队创建
> 作为项目管理者  
> 我希望通过配置文件定义团队角色  
> 以便快速创建完整的多 Agent 团队

**验收标准**:
- 提供 YAML 配置文件模板
- 支持定义多个角色
- 一键执行创建命令
- 每个 Agent 有独立工作空间

#### US-002: 角色定制
> 作为用户  
> 我希望自定义每个角色的特性  
> 以便满足特定项目需求

**验收标准**:
- 支持自定义角色名称、Emoji、职责
- 支持指定不同模型
- 支持添加特殊规则

#### US-003: 继承主 Agent
> 作为用户  
> 我希望新 Agent 继承主 Agent 的基础特性  
> 以便保持团队一致性

**验收标准**:
- 可选择继承 SOUL.md、AGENTS.md 等文件
- 支持覆盖特定文件
- 继承过程自动化

#### US-004: OpenClaw 集成
> 作为用户  
> 我希望新 Agent 自动注册到 OpenClaw  
> 以便立即投入使用

**验收标准**:
- 自动更新 openclaw.json 配置
- 创建 inbox 和 sessions 目录
- 可选触发 Gateway 重启

#### US-005: 验证和回滚
> 作为用户  
> 我希望创建失败时可以回滚  
> 以避免系统处于不一致状态

**验收标准**:
- 创建前自动备份
- 创建后自动验证
- 提供回滚命令

---

## 功能需求

### 功能清单

| ID | 功能 | 描述 | 优先级 |
|----|------|------|--------|
| F-001 | 配置解析 | 读取 YAML/JSON 配置文件并校验 | P0 |
| F-002 | 模板加载 | 加载预定义角色模板 | P0 |
| F-003 | 目录生成 | 创建 Agent 工作空间目录结构 | P0 |
| F-004 | 文件生成 | 生成 IDENTITY.md、SOUL.md 等文件 | P0 |
| F-005 | 继承机制 | 从主 Agent 继承指定文件 | P1 |
| F-006 | OpenClaw 注册 | 更新配置注册新 Agent | P0 |
| F-007 | 权限设置 | 设置目录和文件权限 | P1 |
| F-008 | 验证器 | 创建后验证可用性 | P1 |
| F-009 | 回滚机制 | 失败时恢复到创建前状态 | P2 |
| F-010 | 预览模式 | --dry-run 预览创建内容 | P2 |
| F-011 | 团队文档 | 生成团队协作规范文档 | P2 |
| F-012 | 配置导出 | 导出当前团队配置 | P3 |
| F-013 | 团队克隆 | 基于现有团队创建新团队 | P3 |

### 功能详细说明

#### F-001: 配置解析

**输入**: YAML 或 JSON 配置文件  
**处理**:
1. 读取文件内容
2. 解析为对象
3. 使用 JSON Schema 校验
4. 合并默认配置

**输出**: 校验通过的配置对象

**错误处理**:
- 文件不存在 → 提示路径错误
- 格式错误 → 提示具体错误位置
- Schema 校验失败 → 列出所有校验错误

#### F-002: 模板加载

**预定义模板**:
| 模板名 | 角色类型 | 核心职责 |
|--------|---------|---------|
| developer | 开发 | 功能开发、Bug 修复、代码审查 |
| tester | 测试 | 功能测试、异常监控、质量报告 |
| recorder | 记录 | 文档编写、知识整理、归档管理 |
| judge | 评审 | 方案评审、代码审查、风险评估 |
| dispatcher | 调度 | 任务分发、进度追踪、资源协调 |

**处理**:
1. 根据 role_type 加载对应模板
2. 合并用户自定义配置
3. 渲染模板变量

#### F-003: 目录生成

**目录结构**:
```
workspace/agents/{agent-id}/
├── inbox/              # 收件箱
├── sessions/           # 会话记录
├── memory/             # 记忆文件
├── projects/           # 项目文件 (可选)
├── IDENTITY.md         # 身份信息
├── SOUL.md             # 核心信念
├── AGENTS.md           # 工作指南
├── HEARTBEAT.md        # 心跳任务
├── MEMORY.md           # 长期记忆
├── USER.md             # 用户信息
└── TOOLS.md            # 工具配置
```

**处理**:
1. 创建基础目录
2. 设置目录权限 (700)
3. 验证创建成功

#### F-004: 文件生成

**模板引擎**: Handlebars

**生成流程**:
```
读取模板 → 渲染变量 → 写入文件 → 设置权限 (600)
```

**文件列表**:
| 文件 | 模板来源 | 变量 |
|------|---------|------|
| IDENTITY.md | templates/agent/IDENTITY.md.tpl | name, id, emoji, role_type |
| SOUL.md | templates/agent/SOUL.md.tpl | name, team_name |
| AGENTS.md | templates/agent/AGENTS.md.tpl | core_responsibilities |
| HEARTBEAT.md | templates/agent/HEARTBEAT.md.tpl | responsibilities, intervals |
| MEMORY.md | templates/agent/MEMORY.md.tpl | created_at |
| USER.md | 继承或默认 | - |

#### F-005: 继承机制

**配置示例**:
```yaml
inheritance:
  base_agent: "main"
  inherit_files:
    - SOUL.md
    - AGENTS.md
    - USER.md
  override_files:
    - IDENTITY.md
    - HEARTBEAT.md
```

**处理**:
1. 读取基 Agent 目录
2. 复制继承文件
3. 生成覆盖文件
4. 记录继承关系

#### F-006: OpenClaw 注册

**配置文件**: `~/.openclaw/openclaw.json`

**更新内容**:
```json
{
  "agents": {
    "xiaoyun-dev": {
      "model": "alibaba-cloud/qwen3.5-plus",
      "workspace": "workspace/agents/xiaoyun-dev",
      "inbox": "workspace/agents/xiaoyun-dev/inbox",
      "enabled": true
    }
  }
}
```

**处理**:
1. 读取现有配置
2. 添加新 Agent 配置
3. 写回配置文件
4. 可选触发 Gateway 重启

#### F-007: 权限设置

**权限规范**:
| 类型 | 权限 | 说明 |
|------|------|------|
| 目录 | 700 | 仅所有者可读写执行 |
| 配置文件 | 600 | 仅所有者可读写 |
| 文档文件 | 644 | 所有者读写，其他人只读 |

**处理**:
1. 创建完成后统一设置权限
2. 验证权限设置正确

#### F-008: 验证器

**验证项**:
- [ ] 目录结构完整
- [ ] 所有必需文件存在
- [ ] 配置文件格式正确
- [ ] 权限设置正确
- [ ] OpenClaw 配置已更新

**输出**: 验证报告（成功/失败 + 详细信息）

#### F-009: 回滚机制

**触发条件**:
- 创建过程失败
- 验证未通过
- 用户手动请求回滚

**处理**:
1. 恢复备份的配置
2. 删除创建的目录
3. 验证回滚成功

#### F-010: 预览模式

**命令**: `team-creator create config.yaml --dry-run`

**输出**:
- 将要创建的目录列表
- 将要生成的文件列表
- 配置变更预览

#### F-011: 团队文档

**生成文档**:
- TEAM-WORKFLOW.md - 团队协作流程
- ROLE-RESPONSIBILITIES.md - 角色职责说明
- TASK-ASSIGNMENT-RULES.md - 任务分配规则

#### F-012: 配置导出

**命令**: `team-creator export output.yaml`

**用途**:
- 备份当前团队配置
- 分享给其他项目
- 版本控制

#### F-013: 团队克隆

**命令**: `team-creator clone source.yaml --name "新团队"`

**处理**:
1. 读取源配置
2. 应用覆盖配置
3. 创建新团队

---

## 非功能需求

### 性能需求

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 创建单个 Agent | < 5 秒 | 包含文件生成和注册 |
| 创建 5 人团队 | < 30 秒 | 批量创建优化 |
| 验证时间 | < 3 秒 | 快速反馈 |

### 可靠性需求

- **成功率**: > 99% (正常配置下)
- **回滚成功率**: 100%
- **配置校验**: 100% 拦截无效配置

### 安全性需求

- **权限控制**: 严格遵循 700/600 规范
- **敏感信息**: 不复制主 Agent 的敏感配置
- **配置校验**: Schema 校验防止恶意配置
- **备份机制**: 创建前自动备份

### 可用性需求

- **CLI 友好**: 清晰的命令和错误提示
- **文档完整**: README + 示例配置
- **错误提示**: 具体、可操作的错误信息

### 可维护性需求

- **代码规范**: ESLint + Prettier
- **测试覆盖**: > 80%
- **模块化**: 清晰的模块划分
- **日志记录**: 关键操作记录日志

---

## 技术方案

### 技术栈

| 层级 | 技术选型 | 理由 |
|------|---------|------|
| **运行时** | Node.js 18+ | 与 OpenClaw 一致 |
| **CLI 框架** | commander.js | 成熟、易用 |
| **配置解析** | js-yaml | YAML 解析标准库 |
| **Schema 校验** | Ajv | JSON Schema 校验 |
| **模板引擎** | Handlebars | 强大、灵活 |
| **文件操作** | fs-extra | 增强的 fs 模块 |
| **测试框架** | Jest | 主流测试框架 |

### 项目结构

```
team-creator/
├── src/
│   ├── cli.js              # CLI 入口
│   ├── parser.js           # 配置解析器
│   ├── generator.js        # 文件生成器
│   ├── registrar.js        # OpenClaw 注册器
│   ├── validator.js        # 验证器
│   ├── rollback.js         # 回滚器
│   └── utils.js            # 工具函数
├── templates/
│   ├── agent/              # Agent 文件模板
│   │   ├── IDENTITY.md.tpl
│   │   ├── SOUL.md.tpl
│   │   └── ...
│   ├── roles/              # 角色模板
│   │   ├── developer.yaml
│   │   ├── tester.yaml
│   │   └── ...
│   └── team/               # 团队文档模板
│       └── ...
├── config/
│   ├── schema.json         # 配置校验 Schema
│   └── defaults.yaml       # 默认配置
├── tests/
│   ├── parser.test.js
│   ├── generator.test.js
│   └── ...
├── package.json
├── README.md
└── .gitignore
```

### 核心流程

```
用户命令
   ↓
CLI 解析
   ↓
配置解析 + 校验
   ↓
加载模板
   ↓
生成目录和文件
   ↓
注册到 OpenClaw
   ↓
验证创建结果
   ↓
输出报告
```

### 接口设计

#### CLI 命令

```bash
# 初始化配置
team-creator init [team-name]

# 创建团队
team-creator create <config.yaml> [options]
  --dry-run          预览模式
  --skip-validation  跳过验证
  --no-backup        不创建备份
  --verbose          详细输出

# 添加单个 Agent
team-creator add <role> [options]
  --id <agent-id>    自定义 ID
  --model <model>    指定模型

# 验证团队
team-creator validate [team-name]

# 回滚
team-creator rollback [backup-id]

# 导出配置
team-creator export <output.yaml>

# 克隆团队
team-creator clone <source.yaml> [options]
  --name <new-name>
  --override <key=value>
```

---

## 项目计划

### Phase 1: 核心功能 (3 天)

**目标**: 实现基础创建功能

**任务**:
| 任务 ID | 任务 | 执行者 | 预计工时 |
|--------|------|--------|---------|
| TASK-20260314-001 | 项目初始化和结构设计 | xiaoyun-dev | 4h |
| TASK-20260314-002 | 配置解析器实现 | xiaoyun-dev | 6h |
| TASK-20260314-003 | 文件生成器实现 | xiaoyun-dev | 8h |
| TASK-20260314-004 | OpenClaw 注册器实现 | xiaoyun-dev | 4h |
| TASK-20260314-005 | 基础角色模板创建 (5 个) | xiaoyun-recorder | 4h |

**交付物**:
- 可运行的 CLI 工具
- 5 个角色模板
- 基础文档

### Phase 2: 增强功能 (2 天)

**目标**: 完善验证、回滚、文档

**任务**:
| 任务 ID | 任务 | 执行者 | 预计工时 |
|--------|------|--------|---------|
| TASK-20260314-006 | 验证器实现 | xiaoyun-dev | 6h |
| TASK-20260314-007 | 回滚机制实现 | xiaoyun-dev | 4h |
| TASK-20260314-008 | 团队文档生成 | xiaoyun-recorder | 4h |
| TASK-20260314-009 | 错误处理完善 | xiaoyun-dev | 4h |
| TASK-20260314-010 | 单元测试编写 | xiaoyun-test | 8h |

**交付物**:
- 完整的 CLI 工具
- 验证和回滚功能
- 测试用例

### Phase 3: 优化和发布 (2 天)

**目标**: 用户体验优化、发布到 ClawHub

**任务**:
| 任务 ID | 任务 | 执行者 | 预计工时 |
|--------|------|--------|---------|
| TASK-20260314-011 | 预览模式实现 | xiaoyun-dev | 4h |
| TASK-20260314-012 | 交互式向导 | xiaoyun-dev | 6h |
| TASK-20260314-013 | 文档完善 | xiaoyun-recorder | 6h |
| TASK-20260314-014 | 真实团队测试 | xiaoyun-test | 4h |
| TASK-20260314-015 | ClawHub 发布 | xiaoyun-dev | 2h |

**交付物**:
- 用户友好的 CLI
- 完整文档
- ClawHub 技能包

### 里程碑

| 里程碑 | 时间 | 交付物 |
|--------|------|--------|
| M1: 核心功能完成 | Day 3 | 可创建基础团队 |
| M2: 增强功能完成 | Day 5 | 验证 + 回滚可用 |
| M3: 正式发布 | Day 7 | ClawHub 可安装 |

---

## 验收标准

### 功能验收

- [ ] 能通过 YAML 配置创建完整团队
- [ ] 每个 Agent 有独立工作空间
- [ ] 自动注册到 OpenClaw
- [ ] 创建失败可回滚
- [ ] 预览模式正常工作

### 质量验收

- [ ] 代码测试覆盖率 > 80%
- [ ] 所有单元测试通过
- [ ] 文档完整清晰
- [ ] 错误提示友好

### 性能验收

- [ ] 创建单个 Agent < 5 秒
- [ ] 创建 5 人团队 < 30 秒
- [ ] 验证时间 < 3 秒

### 安全验收

- [ ] 目录权限正确 (700)
- [ ] 文件权限正确 (600/644)
- [ ] 配置校验有效
- [ ] 备份机制可靠

---

## 风险评估

### 技术风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| OpenClaw 配置冲突 | 中 | 高 | 创建前备份 + 回滚机制 |
| 模板渲染失败 | 低 | 中 | 严格的模板测试 |
| Gateway 重启失败 | 中 | 高 | 手动重启指南 + 自动检测 |
| 权限设置错误 | 低 | 中 | 标准化权限设置 + 验证 |

### 使用风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 创建过多 Agent 消耗资源 | 中 | 中 | 默认限制 + 警告提示 |
| 角色职责重叠 | 中 | 低 | 模板设计时避免重叠 |
| 配置过于复杂 | 高 | 低 | 提供简化模式 + 默认值 |

### 应对措施

1. **严格测试**: 每个功能模块编写单元测试
2. **渐进发布**: 先内部测试，再发布到 ClawHub
3. **文档完善**: 提供详细的使用指南和故障排除
4. **用户反馈**: 建立反馈渠道，快速响应用户问题

---

## 附录

### A. 配置文件示例

#### 最小配置
```yaml
roles:
  - developer
  - tester
  - recorder
```

#### 完整配置
```yaml
team:
  name: "小云开发团队"
  version: "1.0.0"
  description: "多 Agent 协作开发团队"

inheritance:
  base_agent: "main"
  inherit_files:
    - SOUL.md
    - AGENTS.md

roles:
  - id: "xiaoyun-dev"
    name: "小云开发"
    emoji: "💻"
    role_type: "developer"
    model: "alibaba-cloud/qwen3.5-plus"
    custom:
      core_responsibilities:
        - "功能开发"
        - "Bug 修复"
        - "代码审查"

collaboration:
  task_assignment: "auto"
  communication_channel: "inbox"
  progress_update_interval: "30m"

advanced:
  create_docs: true
  validate_after: true
  backup_before: true
```

### B. 角色模板清单

| 模板 | 职责 | 适用场景 |
|------|------|---------|
| developer | 功能开发、Bug 修复 | 软件开发项目 |
| tester | 功能测试、质量报告 | 质量保障 |
| recorder | 文档编写、知识管理 | 文档密集型项目 |
| judge | 方案评审、风险评估 | 重要决策评审 |
| dispatcher | 任务调度、资源协调 | 多团队协作 |
| researcher | 市场调研、竞品分析 | 市场研究 |
| designer | UI/UX设计、原型制作 | 产品设计 |
| devops | 部署、监控、自动化 | 运维自动化 |

### C. 参考资料

- [OpenClaw Agent 结构文档](https://docs.openclaw.ai/agents)
- [ClawHub 技能开发指南](https://clawhub.com/docs)
- [Handlebars 模板引擎](https://handlebarsjs.com/)
- [JSON Schema 规范](https://json-schema.org/)

---

**文档状态**: 🟡 待评审  
**评审任务**: REVIEW-20260314-001  
**评审者**: xiaoyun-judge  
**评审截止**: 2026-03-14 18:00

---

_Made with ☁️ by 小云团队_
