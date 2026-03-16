/**
 * 阻塞任务 API
 * 提供阻塞任务查询和解除阻塞接口
 */

const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../database/task-board.db');

/**
 * 获取阻塞任务列表
 */
router.get('/', (req, res) => {
  const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY);

  const sql = `
    SELECT 
      id as task_id,
      title,
      assignee,
      priority,
      status,
      blocked_reason,
      blocked_at,
      updated_at,
      ROUND((julianday('now') - julianday(updated_at)) * 24, 1) as hours_blocked
    FROM tasks
    WHERE status = 'BLOCKED'
    ORDER BY 
      CASE priority WHEN 'P0' THEN 0 WHEN 'P1' THEN 1 WHEN 'P2' THEN 2 ELSE 3 END,
      blocked_at DESC
  `;

  db.all(sql, [], (err, rows) => {
    db.close();

    if (err) {
      return res.status(500).json({
        success: false,
        error: err.message
      });
    }

    res.json({
      success: true,
      data: rows,
      count: rows.length
    });
  });
});

/**
 * 获取所有任务（包含阻塞状态）
 */
router.get('/all', (req, res) => {
  const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY);

  const sql = `
    SELECT
      id as task_id,
      title,
      status,
      assignee,
      priority,
      blocked_reason,
      blocked_at,
      created_at,
      updated_at,
      ROUND((julianday('now') - julianday(updated_at)) * 24, 1) as hours_since_update
    FROM tasks
    WHERE status NOT LIKE '%COMPLETED%' AND status NOT LIKE '%CANCELLED%'
    ORDER BY
      CASE priority WHEN 'P0' THEN 0 WHEN 'P1' THEN 1 WHEN 'P2' THEN 2 ELSE 3 END,
      CASE status
        WHEN 'BLOCKED' THEN 0
        WHEN 'IN_PROGRESS' THEN 1
        WHEN 'PENDING' THEN 2
        ELSE 3
      END,
      created_at DESC
  `;

  db.all(sql, [], (err, rows) => {
    db.close();

    if (err) {
      return res.status(500).json({
        success: false,
        error: err.message
      });
    }

    // 分类任务
    const blocked = rows.filter(r => r.status === 'BLOCKED');
    const inProgress = rows.filter(r => r.status === 'IN_PROGRESS');
    const pending = rows.filter(r => r.status === 'PENDING' || r.status === 'ASSIGNED');

    res.json({
      success: true,
      data: {
        all: rows,
        blocked,
        inProgress,
        pending
      },
      stats: {
        total: rows.length,
        blocked: blocked.length,
        inProgress: inProgress.length,
        pending: pending.length
      }
    });
  });
});

/**
 * 解除阻塞
 */
router.post('/:taskId/unblock', (req, res) => {
  const { taskId } = req.params;
  const { reason, unblocked_by } = req.body;

  const db = new sqlite3.Database(DB_PATH);

  const sql = `
    UPDATE tasks
    SET status = 'IN_PROGRESS',
        blocked_reason = NULL,
        blocked_at = NULL,
        unblock_reason = ?,
        unblocked_at = datetime('now'),
        unblocked_by = ?
    WHERE id = ? AND status = 'BLOCKED'
  `;

  db.run(sql, [reason || '手动解除', unblocked_by || 'system', taskId], function(err) {
    db.close();

    if (err) {
      return res.status(500).json({
        success: false,
        error: err.message
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        error: '任务未找到或不是阻塞状态'
      });
    }

    res.json({
      success: true,
      message: `任务 ${taskId} 已解除阻塞`
    });
  });
});

module.exports = router;
