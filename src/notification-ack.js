#!/usr/bin/env node
/**
 * 通知确认协议 v1.0
 * 
 * 功能:
 * 1. 发送通知时创建确认文件
 * 2. Agent 收到后必须确认
 * 3. 超时未确认自动重试
 * 4. 多次失败告警升级
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = '/home/admin/.openclaw/workspace';
const NOTIFICATIONS_DIR = path.join(WORKSPACE, 'task-board', 'logs', 'notifications');

/**
 * 创建通知确认记录
 */
function createNotificationRecord(taskId, agentId, notificationType, file) {
  const record = {
    taskId,
    agentId,
    notifications: [{
      type: notificationType,
      file,
      sentAt: new Date().toISOString(),
      acknowledged: false,
      startedAt: null,
      completedAt: null,
      retryCount: 0,
      status: 'UNACKNOWLEDGED'
    }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  const recordFile = path.join(NOTIFICATIONS_DIR, `${taskId}.json`);
  fs.writeFileSync(recordFile, JSON.stringify(record, null, 2));
  
  console.log(`📝 [${taskId}] 通知记录已创建`);
  return record;
}

/**
 * Agent 确认通知
 */
function acknowledgeNotification(taskId, agentId) {
  const recordFile = path.join(NOTIFICATIONS_DIR, `${taskId}.json`);
  if (!fs.existsSync(recordFile)) {
    console.log(`❌ [${taskId}] 通知记录不存在`);
    return false;
  }
  
  const record = JSON.parse(fs.readFileSync(recordFile, 'utf-8'));
  const latestNotification = record.notifications[record.notifications.length - 1];
  
  latestNotification.acknowledged = true;
  latestNotification.acknowledgedAt = new Date().toISOString();
  latestNotification.status = 'ACKNOWLEDGED';
  record.updatedAt = new Date().toISOString();
  
  fs.writeFileSync(recordFile, JSON.stringify(record, null, 2));
  console.log(`✅ [${taskId}] 通知已确认`);
  return true;
}

/**
 * 更新任务开始状态
 */
function startTask(taskId, agentId) {
  const recordFile = path.join(NOTIFICATIONS_DIR, `${taskId}.json`);
  if (!fs.existsSync(recordFile)) {
    console.log(`❌ [${taskId}] 通知记录不存在`);
    return false;
  }
  
  const record = JSON.parse(fs.readFileSync(recordFile, 'utf-8'));
  const latestNotification = record.notifications[record.notifications.length - 1];
  
  latestNotification.startedAt = new Date().toISOString();
  latestNotification.status = 'IN_PROGRESS';
  record.updatedAt = new Date().toISOString();
  
  fs.writeFileSync(recordFile, JSON.stringify(record, null, 2));
  console.log(`🟡 [${taskId}] 任务已开始`);
  return true;
}

/**
 * 更新任务完成状态
 */
function completeTask(taskId, agentId) {
  const recordFile = path.join(NOTIFICATIONS_DIR, `${taskId}.json`);
  if (!fs.existsSync(recordFile)) {
    console.log(`❌ [${taskId}] 通知记录不存在`);
    return false;
  }
  
  const record = JSON.parse(fs.readFileSync(recordFile, 'utf-8'));
  const latestNotification = record.notifications[record.notifications.length - 1];
  
  latestNotification.completedAt = new Date().toISOString();
  latestNotification.status = 'COMPLETED';
  record.updatedAt = new Date().toISOString();
  
  fs.writeFileSync(recordFile, JSON.stringify(record, null, 2));
  console.log(`✅ [${taskId}] 任务已完成`);
  return true;
}

/**
 * 检查超时并重试
 */
function checkTimeoutAndRetry(taskId, agentId) {
  const recordFile = path.join(NOTIFICATIONS_DIR, `${taskId}.json`);
  if (!fs.existsSync(recordFile)) {
    return false;
  }
  
  const record = JSON.parse(fs.readFileSync(recordFile, 'utf-8'));
  const latestNotification = record.notifications[record.notifications.length - 1];
  
  if (latestNotification.status === 'COMPLETED') {
    return false; // 已完成，无需检查
  }
  
  const now = Date.now();
  const sentAt = new Date(latestNotification.sentAt).getTime();
  const elapsed = now - sentAt;
  
  // 超时配置
  const ACK_TIMEOUT = 5 * 60 * 1000;    // 5 分钟确认超时
  const START_TIMEOUT = 10 * 60 * 1000; // 10 分钟开始超时
  const COMPLETE_TIMEOUT = 2 * 60 * 60 * 1000; // 2 小时完成超时
  
  let needsRetry = false;
  let alertLevel = '';
  
  if (!latestNotification.acknowledged && elapsed > ACK_TIMEOUT) {
    needsRetry = true;
    alertLevel = 'ACK_TIMEOUT';
  } else if (latestNotification.acknowledged && !latestNotification.startedAt && elapsed > START_TIMEOUT) {
    needsRetry = true;
    alertLevel = 'START_TIMEOUT';
  }
  
  if (needsRetry) {
    console.log(`⚠️ [${taskId}] 超时检测：${alertLevel}, 已过时 ${Math.floor(elapsed / 60000)} 分钟`);
    return { needsRetry, alertLevel, elapsed };
  }
  
  return false;
}

module.exports = {
  createNotificationRecord,
  acknowledgeNotification,
  startTask,
  completeTask,
  checkTimeoutAndRetry
};
