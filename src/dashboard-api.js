/**
 * Dashboard 数据聚合 API
 * 提供首页仪表板所需的所有数据
 */

const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../database/task-board.db');

/**
 * 获取仪表板数据
 * GET /api/dashboard/data
 */
router.get('/data', async (req, res) => {
  try {
    const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY);
    
    // 1. 获取任务统计
    const taskStats = await new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'BLOCKED' THEN 1 ELSE 0 END) as blocked,
          SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN status IN ('PENDING', 'ASSIGNED') THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status LIKE '%REVIEW%' THEN 1 ELSE 0 END) as reviewing
        FROM tasks
        WHERE status NOT LIKE '%CANCELLED%'
      `;
      
      db.get(sql, [], (err, row) => {
        if (err) reject(err);
        else resolve(row || { total: 0, blocked: 0, in_progress: 0, pending: 0, completed: 0, reviewing: 0 });
      });
    });
    
    // 2. 获取 Agent 状态
    const agents = await getAgentsFromFiles();
    
    // 3. 获取延期任务
    const overdueTasks = await new Promise((resolve, reject) => {
      const sql = `
        SELECT id, title, assignee, deadline, progress
        FROM tasks
        WHERE deadline < datetime('now')
          AND status NOT IN ('COMPLETED', 'CANCELLED')
        ORDER BY deadline ASC
        LIMIT 10
      `;
      
      db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
    
    db.close();
    
    // 4. 构造响应
    res.json({
      success: true,
      data: {
        stats: {
          stats: taskStats
        },
        agents: {
          details: agents.reduce((acc, agent) => {
            acc[agent.id] = agent;
            return acc;
          }, {})
        },
        overdue: overdueTasks,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('[Dashboard API] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 从文件读取 Agent 状态
 */
async function getAgentsFromFiles() {
  const agentsDir = path.join(__dirname, '../inbox');
  const agents = [
    { id: 'xiaoyun-dev', name: '小云开发', emoji: '💻', status: 'idle', current_task_id: null, progress: 0 },
    { id: 'xiaoyun-test', name: '小云测试', emoji: '✅', status: 'idle', current_task_id: null, progress: 0 },
    { id: 'xiaoyun-recorder', name: '小云记录', emoji: '📝', status: 'idle', current_task_id: null, progress: 0 },
    { id: 'xiaoyun-judge', name: '小云评委', emoji: '⚖️', status: 'idle', current_task_id: null, progress: 0 },
    { id: 'xiaoyun-novel', name: '小云推书', emoji: '📖', status: 'idle', current_task_id: null, progress: 0 }
  ];
  
  // 尝试从 inbox 读取最新状态
  try {
    if (fs.existsSync(agentsDir)) {
      const files = fs.readdirSync(agentsDir);
      // 这里可以解析 inbox 文件获取 Agent 状态
      // 暂时返回默认状态
    }
  } catch (error) {
    console.error('[Dashboard API] Failed to read agents:', error);
  }
  
  return agents;
}

module.exports = router;
