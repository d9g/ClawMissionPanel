# 🤖 Agent 团队技能配置

**版本**: v1.0
**创建时间**: 2026-03-11
**最后更新**: 2026-03-11

---

## 📋 Agent 团队总览

| Agent | Emoji | 职责 | 状态 | 系统注册 |
|-------|-------|------|------|----------|
| **小云** | ☁️ | 系统架构师 + 任务管理 | ✅ 完整 | ✅ |
| **小云评委** | ⚖️ | 评审专家 + 冲突仲裁 | ✅ 完整 | ✅ |
| **小云记录** | 📝 | 文档专家 + 知识管理 | ✅ 完整 | ✅ |
| **小云开发** | 💻 | 全栈开发工程师 | ✅ 完整 | ✅ |
| **推书酱** | 📖 | 小说推文专家 | ✅ 完整 | ✅ |

---

## 🧠 小云（主 Agent）

### 基本信息
- **Agent ID**: `main`
- **工作目录**: `/home/admin/.openclaw/workspace`
- **模型**: alibaba-cloud/qwen3.5-plus

### 核心技能
```json
{
  "system_design": {
    "level": "expert",
    "experience": 100,
    "success_rate": 0.98
  },
  "task_management": {
    "level": "expert",
    "experience": 100,
    "success_rate": 0.95
  },
  "coordination": {
    "level": "expert",
    "experience": 100,
    "success_rate": 0.97
  }
}
```

### 职责
- 需求分析
- 任务拆解
- Agent 指派
- 系统协调
- **任务验收** ⭐

### 最大并发: 5

---

## ⚖️ 小云评委

### 基本信息
- **Agent ID**: `xiaoyun-judge`
- **工作目录**: `/home/admin/.openclaw/workspace/agents/xiaoyun-judge`
- **模型**: alibaba-cloud/qwen3.5-plus

### 核心技能
```json
{
  "technical_review": {
    "level": "expert",
    "experience": 50,
    "success_rate": 0.95
  },
  "risk_assessment": {
    "level": "advanced",
    "experience": 30,
    "success_rate": 0.90
  },
  "conflict_resolution": {
    "level": "advanced",
    "experience": 20,
    "success_rate": 0.85
  }
}
```

### 职责
- 任务方案评审
- 技术可行性评估
- 风险评估
- Agent 指派评估
- 冲突仲裁（与小云辩论）

### 最大并发: 3

---

## 📝 小云记录

### 基本信息
- **Agent ID**: `xiaoyun-recorder`
- **工作目录**: `/home/admin/.openclaw/workspace/agents/xiaoyun-recorder`
- **模型**: alibaba-cloud/qwen3.5-plus

### 核心技能
```json
{
  "documentation": {
    "level": "expert",
    "experience": 80,
    "success_rate": 0.98
  },
  "knowledge_management": {
    "level": "advanced",
    "experience": 50,
    "success_rate": 0.95
  },
  "archive_management": {
    "level": "advanced",
    "experience": 40,
    "success_rate": 0.96
  }
}
```

### 职责
- 会议纪要记录
- 项目日报（每日 23:30）
- 经验沉淀
- 项目规范制定
- 档案归档管理
- 审批记录
- Agent 能力评估

### 最大并发: 10

---

## 💻 小云开发

### 基本信息
- **Agent ID**: `xiaoyun-dev`
- **工作目录**: `/home/admin/.openclaw/workspace/agents/xiaoyun-dev`
- **模型**: alibaba-cloud/qwen3.5-plus

### 核心技能
```json
{
  "nodejs": {
    "level": "expert",
    "experience": 100,
    "success_rate": 0.95
  },
  "web_development": {
    "level": "advanced",
    "experience": 80,
    "success_rate": 0.92
  },
  "database": {
    "level": "advanced",
    "experience": 60,
    "success_rate": 0.90
  },
  "code_review": {
    "level": "advanced",
    "experience": 50,
    "success_rate": 0.93
  }
}
```

### 职责
- 功能开发
- Bug 修复
- 代码审查
- 技术文档编写

### 最大并发: 3

---

## 📖 推书酱（小云推书）

### 基本信息
- **Agent ID**: `xiaoyun-novel`
- **工作目录**: `/home/admin/.openclaw/workspace/agents/xiaoyun-novel`
- **模型**: alibaba-cloud/qwen3.5-plus

### 核心技能
```json
{
  "novel_analysis": {
    "level": "expert",
    "experience": 15,
    "success_rate": 0.95
  },
  "ai_drawing": {
    "level": "advanced",
    "experience": 8,
    "success_rate": 0.88
  },
  "video_production": {
    "level": "intermediate",
    "experience": 5,
    "success_rate": 0.85
  },
  "content_creation": {
    "level": "advanced",
    "experience": 10,
    "success_rate": 0.90
  }
}
```

### 职责
- 小说分析
- AI 绘图提示词生成
- 视频脚本编写
- 发布策略建议
- 数据追踪分析

### 最大并发: 2

---

## 📊 Agent 能力评估矩阵

| 技能领域 | 小云 | 小云评委 | 小云记录 | 小云开发 | 推书酱 |
|----------|------|----------|----------|----------|--------|
| 系统设计 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| 任务管理 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| 技术评审 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| 文档编写 | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 代码开发 | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| 内容创作 | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🔄 任务分配规则

### 智能指派算法
```yaml
指派维度:
  技能匹配度 (40%)
    - Agent 技能标签与任务需求匹配度
    - 历史同类任务成功率
    
  工作负载 (30%)
    - 当前进行中任务数量
    - 预计可用时间
    
  专业领域 (20%)
    - 任务所属领域
    - Agent 专长领域
    
  学习价值 (10%)
    - 任务对 Agent 技能提升价值
    - 是否需要新技能学习

指派规则:
  - 总分 > 80 分：强烈推荐
  - 总分 60-80 分：可以指派
  - 总分 < 60 分：不建议指派
```

---

## 📈 学习进化机制

### 技能提升路径
```
执行任务
    ↓
记录经验（成功/失败）
    ↓
更新技能档案
    ↓
识别技能短板
    ↓
制定学习计划
    ↓
空闲时间学习（摸鱼时间）
    ↓
技能升级
    ↓
可承接更高级任务
```

### 评估周期
- **每日**: 小云记录项目日报
- **每周**: 小云记录评估 Agent 能力
- **每月**: 归档整理 + 规范提炼

---

## 📁 相关文档

- [系统设计文档](https://yun.webyoung.cn/task-board/SYSTEM-DESIGN.html)
- [小云评委评审清单](/home/admin/.openclaw/workspace/agents/xiaoyun-judge/README.md)
- [小云记录文档模板](/home/admin/.openclaw/workspace/agents/xiaoyun-recorder/README.md)
- [小云开发规范](/home/admin/.openclaw/workspace/agents/xiaoyun-dev/README.md)
- [推书酱工作规范](/home/admin/.openclaw/workspace/agents/xiaoyun-novel/SPECIFICATIONS.md)

---

_让每个 Agent 都在合适的位置发挥最大价值。_

**最后更新**: 2026-03-11 | 小云 ☁️
