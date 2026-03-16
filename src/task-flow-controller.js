/**
 * 任务状态流转控制
 * 版本：v1.0
 * 创建：2026-03-11 23:08
 * 开发：小云开发 💻
 * 
 * 功能：每个任务节点自动更新状态，无需手工修改
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../database/task-board.db');

class TaskFlowController {
  constructor() {
    this.db = new sqlite3.Database(DB_PATH);
  }

  /**
   * 用户审批通过 → AVAILABLE
   */
  async approveTask(taskId, approvedBy, comments = '') {
    return await this._updateStatus(taskId, 'AVAILABLE', approvedBy, {
      action: '用户审批通过',
      comments: comments
    });
  }

  /**
   * 用户审批驳回 → DRAFT
   */
  async rejectTask(taskId, rejectedBy, comments = '') {
    return await this._updateStatus(taskId, 'DRAFT', rejectedBy, {
      action: '用户审批驳回',
      comments: comments
    });
  }

  /**
   * Agent 领取任务 → IN_PROGRESS (自动)
   */
  async claimTask(taskId, agentId) {
    console.log(`\n🤖 [Agent 领取] ${agentId} 领取任务 ${taskId}`);
    
    return await this._updateStatus(taskId, 'IN_PROGRESS', agentId, {
      action: 'Agent 领取任务',
      agent_id: agentId
    });
  }

  /**
   * 开发完成 → PENDING_REVIEW (自动)
   */
  async completeTask(taskId, agentId, deliverables = {}) {
    console.log(`\n✅ [开发完成] ${agentId} 完成任务 ${taskId}`);
    
    return await this._updateStatus(taskId, 'PENDING_REVIEW', agentId, {
      action: '开发完成，提交验收',
      deliverables: deliverables
    });
  }

  /**
   * 验收通过 → COMPLETED (自动)
   */
  async acceptTask(taskId, acceptor, acceptanceReport = {}) {
    console.log(`\n✅ [验收通过] ${acceptor} 验收任务 ${taskId}`);
    
    return await this._updateStatus(taskId, 'COMPLETED', acceptor, {
      action: '验收通过',
      acceptance_report: acceptanceReport
    });
  }

  /**
   * 验收驳回 → IN_PROGRESS (自动)
   */
  async rejectAcceptance(taskId, rejector, reasons = '', suggestions = '') {
    console.log(`\n❌ [验收驳回] ${rejector} 驳回任务 ${taskId}`);
    
    return await this._updateStatus(taskId, 'IN_PROGRESS', rejector, {
      action: '验收驳回，需要重做',
      reasons: reasons,
      suggestions: suggestions
    });
  }

  /**
   * 挂起任务 → ON_HOLD
   */
  async holdTask(taskId, agentId, reason = '') {
    return await this._updateStatus(taskId, 'ON_HOLD', agentId, {
      action: '任务挂起',
      reason: reason
    });
  }

  /**
   * 取消任务 → CANCELLED
   */
  async cancelTask(taskId, canceller, reason = '') {
    return await this._updateStatus(taskId, 'CANCELLED', canceller, {
      action: '任务取消',
      reason: reason
    });
  }

  /**
   * 内部方法：更新状态并记录
   */
  async _updateStatus(taskId, newStatus, actor, details = {}) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE tasks 
        SET status = ?, 
            updated_at = CURRENT_TIMESTAMP
        WHERE task_id = ?
      `;

      this.db.run(sql, [newStatus, taskId], (err) => {
        if (err) {
          reject(err);
          return;
        }

        console.log(`   状态变更：${taskId} → ${newStatus}`);

        // 记录状态变更
        this._recordStatusChange(taskId, newStatus, actor, details);

        resolve({
          task_id: taskId,
          status: newStatus,
          updated_at: new Date().toISOString()
        });
      });
    });
  }

  /**
   * 记录状态变更
   */
  _recordStatusChange(taskId, newStatus, actor, details) {
    const recordId = `REC-${Date.now()}`;
    const sql = `
      INSERT INTO task_records (
        record_id, task_id, stage, stage_name, actor,
        action, result, details, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    this.db.run(sql, [
      recordId, taskId, 'STATUS_CHANGE', '状态变更', actor,
      `状态变更为 ${newStatus}`, '成功',
      JSON.stringify(details)
    ], (err) => {
      if (err) console.error('记录状态变更失败:', err);
    });
  }

  /**
   * 关闭数据库连接
   */
  close() {
    this.db.close();
  }
}

module.exports = TaskFlowController;
