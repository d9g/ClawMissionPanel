/**
 * 审批管理模块
 * 版本：v1.0
 * 创建：2026-03-11
 * 开发：小云开发 💻
 */

class ApprovalManager {
  constructor(taskManager) {
    this.taskManager = taskManager;
  }

  /**
   * 创建审批请求
   */
  async createApproval(taskId, approvalType, approver, comments = '') {
    const approvalId = `APPR-${Date.now()}`;
    
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO approvals (
          approval_id, task_id, approval_type, status,
          approved_by, comments
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;

      this.taskManager.db.run(sql, [
        approvalId, taskId, approvalType, 'PENDING',
        approver, comments
      ], function(err) {
        if (err) reject(err);
        else resolve({ approval_id: approvalId, status: 'PENDING' });
      });
    });
  }

  /**
   * 审批通过
   */
  async approve(approvalId, approvedBy, comments = '') {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE approvals 
        SET status = 'APPROVED', 
            approved_by = ?, 
            comments = ?,
            approved_at = CURRENT_TIMESTAMP
        WHERE approval_id = ?
      `;

      this.taskManager.db.run(sql, [approvedBy, comments, approvalId], function(err) {
        if (err) reject(err);
        else resolve({ approval_id: approvalId, status: 'APPROVED' });
      });
    });
  }

  /**
   * 审批驳回
   */
  async reject(approvalId, rejectedBy, comments = '') {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE approvals 
        SET status = 'REJECTED', 
            approved_by = ?, 
            comments = ?,
            approved_at = CURRENT_TIMESTAMP
        WHERE approval_id = ?
      `;

      this.taskManager.db.run(sql, [rejectedBy, comments, approvalId], function(err) {
        if (err) reject(err);
        else resolve({ approval_id: approvalId, status: 'REJECTED' });
      });
    });
  }

  /**
   * 获取审批记录
   */
  async getApprovals(taskId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM approvals WHERE task_id = ? ORDER BY created_at';
      
      this.taskManager.db.all(sql, [taskId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

module.exports = ApprovalManager;
