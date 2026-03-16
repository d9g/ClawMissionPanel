/**
 * 任务管理 CRUD 模块
 * 版本：v1.0
 * 创建：2026-03-11
 * 开发：小云开发 💻
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../database/task-board.db');

class TaskManager {
  constructor() {
    this.db = new sqlite3.Database(DB_PATH);
  }

  // 创建任务
  async createTask(taskData) {
    return new Promise((resolve, reject) => {
      const {
        task_id, title, description, category, priority,
        requester, assignee, estimated_hours, deadline
      } = taskData;

      const sql = `
        INSERT INTO tasks (
          task_id, title, description, category, priority,
          requester, assignee, estimated_hours, deadline
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(sql, [
        task_id, title, description || null, category || 'general',
        priority || 'P2', requester, assignee, estimated_hours || null, deadline || null
      ], function(err) {
        if (err) reject(err);
        else resolve({ task_id, created: true });
      });
    });
  }

  // 读取任务
  async getTask(taskId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM tasks WHERE task_id = ?';
      
      this.db.get(sql, [taskId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // 获取任务列表
  async getTaskList(filters = {}) {
    return new Promise((resolve, reject) => {
      let sql = 'SELECT * FROM tasks WHERE 1=1';
      const params = [];

      if (filters.status) {
        sql += ' AND status = ?';
        params.push(filters.status);
      }

      if (filters.priority) {
        sql += ' AND priority = ?';
        params.push(filters.priority);
      }

      if (filters.assignee) {
        sql += ' AND assignee = ?';
        params.push(filters.assignee);
      }

      sql += ' ORDER BY created_at DESC';

      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // 更新任务
  async updateTask(taskId, updates) {
    return new Promise((resolve, reject) => {
      const allowedFields = ['title', 'description', 'category', 'priority', 'status', 'assignee', 'estimated_hours', 'actual_hours', 'deadline'];
      const fields = [];
      const values = [];

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }

      if (fields.length === 0) {
        reject(new Error('No valid fields to update'));
        return;
      }

      values.push(taskId);

      const sql = `UPDATE tasks SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE task_id = ?`;

      this.db.run(sql, values, function(err) {
        if (err) reject(err);
        else resolve({ task_id: taskId, updated: true, changes: this.changes });
      });
    });
  }

  // 删除任务
  async deleteTask(taskId) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM tasks WHERE task_id = ?';
      
      this.db.run(sql, [taskId], function(err) {
        if (err) reject(err);
        else resolve({ task_id: taskId, deleted: true, changes: this.changes });
      });
    });
  }

  // 获取子任务
  async getSubtasks(taskId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM subtasks WHERE task_id = ? ORDER BY created_at';
      
      this.db.all(sql, [taskId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // 创建子任务
  async createSubtask(subtaskData) {
    return new Promise((resolve, reject) => {
      const {
        subtask_id, task_id, title, description,
        assigned_to, assigned_reason, dependencies
      } = subtaskData;

      const sql = `
        INSERT INTO subtasks (
          subtask_id, task_id, title, description,
          assigned_to, assigned_reason, dependencies
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(sql, [
        subtask_id, task_id, title, description || null,
        assigned_to, assigned_reason || null,
        JSON.stringify(dependencies || [])
      ], function(err) {
        if (err) reject(err);
        else resolve({ subtask_id, created: true });
      });
    });
  }

  // 关闭数据库连接
  close() {
    this.db.close();
  }
}

module.exports = TaskManager;
