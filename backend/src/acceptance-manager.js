/**
 * 验收管理模块
 * 版本：v1.0
 * 创建：2026-03-11
 * 开发：小云开发 💻
 */

class AcceptanceManager {
  constructor(taskManager) {
    this.taskManager = taskManager;
  }

  /**
   * 提交验收
   */
  async submitForAcceptance(taskId, submitter, deliverables = {}) {
    const task = await this.taskManager.getTask(taskId);
    
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    // 检查任务是否在执行中
    if (task.status !== 'IN_PROGRESS') {
      throw new Error(`Task status is ${task.status}, must be IN_PROGRESS to submit for acceptance`);
    }

    // 更新状态为待验收
    await this.taskManager.updateTask(taskId, {
      status: 'PENDING_REVIEW',
      completed_at: new Date().toISOString()
    });

    // 记录提交验收
    const recordData = {
      record_id: `REC-${Date.now()}`,
      task_id: taskId,
      stage: 'TASK_SUBMITTED',
      stage_name: '任务提交',
      actor: submitter,
      action: '提交验收',
      result: '成功',
      details: JSON.stringify({
        deliverables: deliverables
      })
    };

    // TODO: 调用 record-keeper 记录

    return {
      task_id: taskId,
      status: 'PENDING_REVIEW',
      submitted_at: new Date().toISOString()
    };
  }

  /**
   * 验收通过
   */
  async accept(taskId, acceptor, acceptanceReport = {}) {
    const task = await this.taskManager.getTask(taskId);
    
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    // 检查任务状态
    if (task.status !== 'PENDING_REVIEW') {
      throw new Error(`Task status is ${task.status}, must be PENDING_REVIEW to accept`);
    }

    // 更新状态为已完成
    await this.taskManager.updateTask(taskId, {
      status: 'COMPLETED'
    });

    // 记录验收通过
    const recordData = {
      record_id: `REC-${Date.now()}`,
      task_id: taskId,
      stage: 'ACCEPTANCE_BY_XIAOYUN',
      stage_name: '小云验收',
      actor: acceptor,
      action: '验收通过',
      result: '成功',
      details: JSON.stringify({
        acceptance_report: acceptanceReport
      })
    };

    // TODO: 调用 record-keeper 记录

    return {
      task_id: taskId,
      status: 'COMPLETED',
      accepted_at: new Date().toISOString()
    };
  }

  /**
   * 验收驳回
   */
  async reject(taskId, rejector, reasons = '', suggestions = '') {
    const task = await this.taskManager.getTask(taskId);
    
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    // 检查任务状态
    if (task.status !== 'PENDING_REVIEW') {
      throw new Error(`Task status is ${task.status}, must be PENDING_REVIEW to reject`);
    }

    // 更新状态为进行中（需要重做）
    await this.taskManager.updateTask(taskId, {
      status: 'IN_PROGRESS'
    });

    // 记录验收驳回
    const recordData = {
      record_id: `REC-${Date.now()}`,
      task_id: taskId,
      stage: 'ACCEPTANCE_REJECTED',
      stage_name: '验收驳回',
      actor: rejector,
      action: '验收驳回',
      result: '需要重做',
      details: JSON.stringify({
        reasons: reasons,
        suggestions: suggestions
      })
    };

    // TODO: 调用 record-keeper 记录

    return {
      task_id: taskId,
      status: 'IN_PROGRESS',
      rejected_at: new Date().toISOString(),
      reasons: reasons,
      suggestions: suggestions
    };
  }
}

module.exports = AcceptanceManager;
