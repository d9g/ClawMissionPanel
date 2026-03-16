-- ========================================
-- 辩论会流程数据库扩展
-- 版本：v1.0
-- 创建时间：2026-03-11
-- 设计：小云开发 💻
-- ========================================

-- 辩论会表
CREATE TABLE IF NOT EXISTS debates (
    debate_id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    topic TEXT NOT NULL,
    proposer TEXT NOT NULL,
    status TEXT DEFAULT 'OPEN',  -- OPEN/DECIDED/CLOSED
    winner_proposal_id TEXT,
    closed_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME,
    FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE
);

-- 方案表
CREATE TABLE IF NOT EXISTS proposals (
    proposal_id TEXT PRIMARY KEY,
    debate_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    content TEXT NOT NULL,
    rationale TEXT,
    support_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (debate_id) REFERENCES debates(debate_id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id)
);

-- 辩论评论表
CREATE TABLE IF NOT EXISTS debate_comments (
    comment_id TEXT PRIMARY KEY,
    debate_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    content TEXT NOT NULL,
    target_proposal_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (debate_id) REFERENCES debates(debate_id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id),
    FOREIGN KEY (target_proposal_id) REFERENCES proposals(proposal_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_debates_task_id ON debates(task_id);
CREATE INDEX IF NOT EXISTS idx_debates_status ON debates(status);
CREATE INDEX IF NOT EXISTS idx_proposals_debate_id ON proposals(debate_id);
CREATE INDEX IF NOT EXISTS idx_comments_debate_id ON debate_comments(debate_id);

-- 插入示例辩论会数据（可选）
-- INSERT INTO debates (debate_id, task_id, topic, proposer) VALUES
-- ('DEBATE-20260311-001', 'TASK-20260311-003', '技术选型：SQLite vs MySQL', 'xiaoyun');
