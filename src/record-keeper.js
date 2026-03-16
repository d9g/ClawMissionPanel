/**
 * 全程记录模块
 * 版本：v1.0
 * 创建：2026-03-11
 * 开发：小云开发 💻
 */

class RecordKeeper {
  constructor(taskManager) {
    this.taskManager = taskManager;
  }

  /**
   * 记录任务环节
   */
  async record(recordData) {
    const {
      task_id, stage, stage_name, actor, action,
      result, details, attachments
    } = recordData;

    const recordId = `REC-${Date.now()}`;

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO task_records (
          record_id, task_id, stage, stage_name, actor,
          action, result, details, attachments
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.taskManager.db.run(sql, [
        recordId, task_id, stage, stage_name || '', actor,
        action, result || '', 
        JSON.stringify(details || {}),
        JSON.stringify(attachments || [])
      ], function(err) {
        if (err) reject(err);
        else resolve({ record_id: recordId, created: true });
      });
    });
  }

  /**
   * 获取任务的所有记录
   */
  async getRecords(taskId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM task_records WHERE task_id = ? ORDER BY timestamp';
      
      this.taskManager.db.all(sql, [taskId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * 获取任务的完整时间线
   */
  async getTimeline(taskId) {
    const records = await this.getRecords(taskId);
    
    return records.map(record => ({
      time: record.timestamp,
      stage: record.stage_name,
      actor: record.actor,
      action: record.action,
      result: record.result
    }));
  }

  /**
   * 归档任务记录
   */
  async archiveTaskRecords(taskId) {
    // 标记为已归档
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE task_records 
        SET archived = 1 
        WHERE task_id = ?
      `;

      this.taskManager.db.run(sql, [taskId], function(err) {
        if (err) reject(err);
        else resolve({ task_id: taskId, archived: true, changes: this.changes });
      });
    });
  }
}

module.exports = RecordKeeper;
