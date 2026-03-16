/**
 * 通知服务
 * 版本：v1.0
 * 创建：2026-03-11
 * 开发：小云开发 💻
 * 
 * 功能：任务通知、状态变更通知、审批结果通知
 */

class NotificationService {
  constructor() {
    this.channels = ['log']; // 当前仅支持日志，未来可扩展
    this.queue = [];
  }

  /**
   * 发送通知
   */
  async send(recipient, notification) {
    const message = {
      id: `NOTIF-${Date.now()}`,
      recipient: recipient,
      ...notification,
      sent_at: new Date().toISOString()
    };

    console.log(`\n📬 [通知] 发送给 ${recipient}:`);
    console.log(`   类型：${message.type}`);
    console.log(`   标题：${message.title || '无'}`);
    console.log(`   内容：${JSON.stringify(message.data || {})}`);

    // 发送到所有渠道
    for (const channel of this.channels) {
      await this.sendToChannel(channel, message);
    }

    // 加入队列（用于历史记录）
    this.queue.push(message);

    return message;
  }

  /**
   * 广播通知
   */
  async broadcast(notification) {
    console.log(`\n📢 [广播] ${notification.type}:`, notification.title || '');
    
    // TODO: 发送给所有在线 Agent
    return notification;
  }

  /**
   * 发送到指定渠道
   */
  async sendToChannel(channel, message) {
    switch (channel) {
      case 'log':
        this.sendToLog(message);
        break;
      case 'email':
        await this.sendToEmail(message);
        break;
      case 'webhook':
        await this.sendToWebhook(message);
        break;
    }
  }

  /**
   * 日志渠道
   */
  sendToLog(message) {
    // 已在上游处理
  }

  /**
   * 邮件渠道（预留）
   */
  async sendToEmail(message) {
    console.log(`   📧 邮件发送：${message.recipient}`);
    // TODO: 实现邮件发送
  }

  /**
   * Webhook 渠道（预留）
   */
  async sendToWebhook(message) {
    console.log(`   🔗 Webhook 发送：${message.recipient}`);
    // TODO: 实现 Webhook 发送
  }

  /**
   * 任务分配通知
   */
  async notifyTaskAssigned(agentId, task) {
    return await this.send(agentId, {
      type: 'TASK_ASSIGNED',
      title: task.title,
      data: {
        task_id: task.task_id,
        task_title: task.title,
        task_priority: task.priority,
        assigned_at: new Date().toISOString()
      }
    });
  }

  /**
   * 状态变更通知
   */
  async notifyStatusChanged(taskId, oldStatus, newStatus, task) {
    return await this.broadcast({
      type: 'STATUS_CHANGED',
      title: `任务状态变更：${oldStatus} → ${newStatus}`,
      data: {
        task_id: taskId,
        old_status: oldStatus,
        new_status: newStatus,
        task_title: task?.title,
        changed_at: new Date().toISOString()
      }
    });
  }

  /**
   * 审批结果通知
   */
  async notifyApprovalResult(taskId, result, task) {
    return await this.send(task?.requester, {
      type: 'APPROVAL_RESULT',
      title: `任务审批${result === 'APPROVED' ? '通过' : '驳回'}`,
      data: {
        task_id: taskId,
        task_title: task?.title,
        result: result,
        approved_at: new Date().toISOString()
      }
    });
  }

  /**
   * 验收结果通知
   */
  async notifyAcceptanceResult(taskId, result, task) {
    return await this.send(task?.assignee, {
      type: 'ACCEPTANCE_RESULT',
      title: `任务验收${result === 'ACCEPTED' ? '通过' : '驳回'}`,
      data: {
        task_id: taskId,
        task_title: task?.title,
        result: result,
        accepted_at: new Date().toISOString()
      }
    });
  }

  /**
   * 获取通知历史
   */
  getHistory(recipient = null, limit = 50) {
    let messages = this.queue;
    
    if (recipient) {
      messages = messages.filter(m => m.recipient === recipient);
    }
    
    return messages.slice(-limit);
  }
}

module.exports = NotificationService;
