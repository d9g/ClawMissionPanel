#!/usr/bin/env node
/**
 * 任务统计 API
 * 获取任务整体统计数据
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../database/task-board.db');

/**
 * 获取任务统计数据
 */
function getTaskStats() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);
    
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status IN ('PENDING', 'AVAILABLE') THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status IN ('PAUSED', 'BLOCKED') THEN 1 ELSE 0 END) as paused,
        SUM(CASE WHEN priority = 'P0' AND status != 'COMPLETED' THEN 1 ELSE 0 END) as high_priority
      FROM tasks
    `;
    
    db.get(sql, [], (err, row) => {
      if (err) {
        db.close();
        reject(err);
        return;
      }
      
      // 计算延期任务数
      const overdueSql = `
        SELECT COUNT(*) as overdue
        FROM tasks
        WHERE deadline IS NOT NULL
          AND deadline < datetime('now')
          AND status != 'COMPLETED'
      `;
      
      db.get(overdueSql, [], (err2, row2) => {
        db.close();
        if (err2) {
          reject(err2);
          return;
        }
        
        resolve({
          total: row.total || 0,
          completed: row.completed || 0,
          inProgress: row.in_progress || 0,
          pending: row.pending || 0,
          paused: row.paused || 0,
          highPriority: row.high_priority || 0,
          overdue: row2.overdue || 0,
          lastUpdated: new Date().toISOString()
        });
      });
    });
  });
}

// 如果是直接运行此脚本
if (require.main === module) {
  getTaskStats()
    .then(data => {
      console.log(JSON.stringify({ success: true, data }, null, 2));
    })
    .catch(err => {
      console.error(JSON.stringify({ success: false, error: err.message }));
      process.exit(1);
    });
}

module.exports = { getTaskStats };
