/**
 * 任务状态机模块
 * 版本：v1.0
 * 创建：2026-03-11
 * 开发：小云开发 💻
 */

// 状态枚举
const TASK_STATUS = {
  DRAFT: 'DRAFT',                    // 待拆解
  PENDING_APPROVAL: 'PENDING_APPROVAL', // 待审批
  REJECTED: 'REJECTED',              // 已驳回
  AVAILABLE: 'AVAILABLE',             // 待领取
  IN_PROGRESS: 'IN_PROGRESS',         // 进行中
  PENDING_REVIEW: 'PENDING_REVIEW',   // 待验收
  ON_HOLD: 'ON_HOLD',                 // 已挂起
  COMPLETED: 'COMPLETED',             // 已完成
  CANCELLED: 'CANCELLED'              // 已取消
};

// 状态流转规则
const STATE_TRANSITIONS = {
  [TASK_STATUS.DRAFT]: [TASK_STATUS.PENDING_APPROVAL, TASK_STATUS.CANCELLED],
  [TASK_STATUS.PENDING_APPROVAL]: [TASK_STATUS.AVAILABLE, TASK_STATUS.REJECTED],
  [TASK_STATUS.REJECTED]: [TASK_STATUS.DRAFT],
  [TASK_STATUS.AVAILABLE]: [TASK_STATUS.IN_PROGRESS],
  [TASK_STATUS.IN_PROGRESS]: [TASK_STATUS.PENDING_REVIEW, TASK_STATUS.ON_HOLD, TASK_STATUS.CANCELLED],
  [TASK_STATUS.PENDING_REVIEW]: [TASK_STATUS.COMPLETED, TASK_STATUS.IN_PROGRESS],
  [TASK_STATUS.ON_HOLD]: [TASK_STATUS.IN_PROGRESS, TASK_STATUS.CANCELLED],
  [TASK_STATUS.COMPLETED]: [],
  [TASK_STATUS.CANCELLED]: []
};

class TaskStateMachine {
  /**
   * 检查状态流转是否合法
   */
  canTransition(fromStatus, toStatus) {
    const allowedTransitions = STATE_TRANSITIONS[fromStatus] || [];
    return allowedTransitions.includes(toStatus);
  }

  /**
   * 执行状态流转
   */
  async transition(taskManager, taskId, newStatus, actor, reason = '') {
    const task = await taskManager.getTask(taskId);
    
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const currentStatus = task.status;
    
    if (!this.canTransition(currentStatus, newStatus)) {
      throw new Error(
        `Invalid state transition from ${currentStatus} to ${newStatus}. ` +
        `Allowed transitions: ${STATE_TRANSITIONS[currentStatus]?.join(', ') || 'none'}`
      );
    }

    // 执行状态更新
    await taskManager.updateTask(taskId, { status: newStatus });

    // 记录状态变更
    const recordData = {
      record_id: `REC-${Date.now()}`,
      task_id: taskId,
      stage: 'STATE_CHANGE',
      stage_name: '状态变更',
      actor: actor,
      action: `状态变更：${currentStatus} → ${newStatus}`,
      result: '成功',
      details: JSON.stringify({
        from_status: currentStatus,
        to_status: newStatus,
        reason: reason
      })
    };

    // TODO: 调用 record-keeper 记录

    return {
      task_id: taskId,
      from_status: currentStatus,
      to_status: newStatus,
      success: true
    };
  }

  /**
   * 获取状态说明
   */
  getStatusDescription(status) {
    const descriptions = {
      [TASK_STATUS.DRAFT]: '待拆解 - 刚提出的需求，等待拆解',
      [TASK_STATUS.PENDING_APPROVAL]: '待审批 - 拆解完成，等待审批',
      [TASK_STATUS.REJECTED]: '已驳回 - 审批未通过，需要修改',
      [TASK_STATUS.AVAILABLE]: '待领取 - 审批通过，等待领取',
      [TASK_STATUS.IN_PROGRESS]: '进行中 - 已领取，正在执行',
      [TASK_STATUS.PENDING_REVIEW]: '待验收 - 执行完成，等待验收',
      [TASK_STATUS.ON_HOLD]: '已挂起 - 执行失败，等待协助',
      [TASK_STATUS.COMPLETED]: '已完成 - 验收通过，任务完成',
      [TASK_STATUS.CANCELLED]: '已取消 - 任务取消'
    };

    return descriptions[status] || '未知状态';
  }
}

module.exports = {
  TASK_STATUS,
  STATE_TRANSITIONS,
  TaskStateMachine
};
