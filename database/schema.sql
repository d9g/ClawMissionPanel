-- ========================================
-- 任务管理系统数据库 Schema
-- 版本：v1.0
-- 创建时间：2026-03-11
-- 设计：小云开发 💻
-- ========================================

-- 任务表
CREATE TABLE IF NOT EXISTS tasks (
    task_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    priority TEXT DEFAULT 'P2',  -- P0/P1/P2/P3
    status TEXT DEFAULT 'DRAFT',  -- 状态枚举
    requester TEXT,
    assignee TEXT,
    reviewer TEXT DEFAULT 'xiaoyun-judge',
    approver TEXT,
    estimated_hours REAL,
    actual_hours REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deadline DATETIME,
    completed_at DATETIME
);

-- 子任务表
CREATE TABLE IF NOT EXISTS subtasks (
    subtask_id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to TEXT,
    assigned_reason TEXT,
    status TEXT DEFAULT 'AVAILABLE',
    dependencies TEXT,  -- JSON 数组 ["TASK-001-1", "TASK-001-2"]
    output TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE
);

-- 审批记录表
CREATE TABLE IF NOT EXISTS approvals (
    approval_id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    approval_type TEXT NOT NULL,  -- requirement/task_details
    status TEXT NOT NULL,  -- APPROVED/REJECTED/PENDING
    approved_by TEXT,
    approved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    comments TEXT,
    FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE
);

-- Agent 表
CREATE TABLE IF NOT EXISTS agents (
    agent_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    skills TEXT,  -- JSON 对象 {"skill1": "expert", "skill2": "advanced"}
    max_concurrent INTEGER DEFAULT 3,
    current_load INTEGER DEFAULT 0,
    status TEXT DEFAULT 'AVAILABLE',  -- BUSY/AVAILABLE/LEARNING/OFFLINE
    specialties TEXT,  -- JSON 数组
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 经验沉淀表
CREATE TABLE IF NOT EXISTS lessons_learned (
    lesson_id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    type TEXT NOT NULL,  -- SUCCESS/FAILURE
    content TEXT,
    reusable_assets TEXT,  -- JSON 数组
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE
);

-- 会议纪要表
CREATE TABLE IF NOT EXISTS meetings (
    meeting_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    meeting_time DATETIME,
    attendees TEXT,  -- JSON 数组
    content TEXT,
    decisions TEXT,  -- JSON 数组
    action_items TEXT,  -- JSON 数组
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 项目日报表
CREATE TABLE IF NOT EXISTS daily_reports (
    report_id TEXT PRIMARY KEY,
    report_date DATE NOT NULL,
    completed_tasks TEXT,  -- JSON 数组
    in_progress_tasks TEXT,  -- JSON 数组
    issues TEXT,  -- JSON 数组
    statistics TEXT,  -- JSON 对象
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 全程记录表（核心！每个环节都要记录）
CREATE TABLE IF NOT EXISTS task_records (
    record_id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    stage TEXT NOT NULL,  -- 环节标识
    stage_name TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    actor TEXT NOT NULL,  -- 实施者
    action TEXT NOT NULL,  -- 动作
    result TEXT,  -- 结果
    details TEXT,  -- JSON 详细内容
    attachments TEXT,  -- JSON 数组
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_approvals_task_id ON approvals(task_id);
CREATE INDEX IF NOT EXISTS idx_records_task_id ON task_records(task_id);
CREATE INDEX IF NOT EXISTS idx_records_stage ON task_records(stage);

-- 插入初始 Agent 数据
INSERT OR IGNORE INTO agents (agent_id, name, skills, max_concurrent, specialties) VALUES
('main', '小云', '{"system_design": "expert", "task_management": "expert", "coordination": "expert"}', 5, '["系统架构", "任务管理"]'),
('xiaoyun-judge', '小云评委', '{"technical_review": "expert", "risk_assessment": "advanced", "conflict_resolution": "advanced"}', 3, '["技术评审", "风险评估"]'),
('xiaoyun-recorder', '小云记录', '{"documentation": "expert", "knowledge_management": "advanced", "archive_management": "advanced"}', 10, '["文档编写", "知识管理"]'),
('xiaoyun-dev', '小云开发', '{"nodejs": "expert", "web_development": "advanced", "database": "advanced", "code_review": "advanced"}', 3, '["全栈开发"]'),
('xiaoyun-novel', '推书酱', '{"novel_analysis": "expert", "ai_drawing": "advanced", "video_production": "intermediate", "content_creation": "advanced"}', 2, '["小说推文"]'),
('xiaoyun-test', '小云测试', '{"functional_testing": "expert", "acceptance_verification": "expert", "quality_assurance": "expert", "issue_detection": "advanced"}', 3, '["功能测试", "验收验证", "质量保障"]');

-- 插入示例任务（可选）
-- INSERT INTO tasks (task_id, title, description, priority, status, requester, assignee) VALUES
-- ('TASK-20260311-001', 'Phase 1 基础框架开发', '实现任务管理系统基础框架', 'P0', 'IN_PROGRESS', '用户', 'xiaoyun-dev');
