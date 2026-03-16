#!/usr/bin/env node
/**
 * 任务执行验证 v1.0
 * 
 * 功能:
 * 1. 检查任务状态是否更新
 * 2. 检查 Memory 文件是否更新
 * 3. 检查进度是否更新
 * 4. 超时告警
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = '/home/admin/.openclaw/workspace';
const TASKS_DIR = path.join(WORKSPACE, 'task-board', 'tasks');
const AGENTS_DIR = path.join(WORKSPACE, 'agents');

/**
 * 检查任务文件是否更新
 */
function checkTaskUpdated(taskId, afterTime) {
  const taskFile = path.join(TASKS_DIR, `${taskId}.md`);
  if (!fs.existsSync(taskFile)) {
    console.log(`❌ [${taskId}] 任务文件不存在`);
    return false;
  }
  
  const stat = fs.statSync(taskFile);
  const mtime = stat.mtimeMs;
  
  if (mtime > afterTime) {
    console.log(`✅ [${taskId}] 任务文件已更新 (${new Date(mtime).toISOString()})`);
    return true;
  }
  
  console.log(`❌ [${taskId}] 任务文件未更新 (最后更新：${new Date(mtime).toISOString()})`);
  return false;
}

/**
 * 检查 Agent Memory 是否更新
 */
function checkMemoryUpdated(agentId, afterTime) {
  const today = new Date().toISOString().split('T')[0];
  const memoryFile = path.join(AGENTS_DIR, agentId, 'memory', `${today}.md`);
  
  if (!fs.existsSync(memoryFile)) {
    console.log(`❌ [${agentId}] Memory 文件不存在`);
    return false;
  }
  
  const stat = fs.statSync(memoryFile);
  const mtime = stat.mtimeMs;
  
  if (mtime > afterTime) {
    console.log(`✅ [${agentId}] Memory 已更新 (${new Date(mtime).toISOString()})`);
    return true;
  }
  
  const age = Math.floor((Date.now() - mtime) / 60000);
  console.log(`❌ [${agentId}] Memory 未更新 (已过时 ${age} 分钟)`);
  return false;
}

/**
 * 检查任务进度是否更新
 */
function checkProgressUpdated(taskId, expectedProgress) {
  const taskFile = path.join(TASKS_DIR, `${taskId}.md`);
  if (!fs.existsSync(taskFile)) {
    return false;
  }
  
  const content = fs.readFileSync(taskFile, 'utf-8');
  const progressMatch = content.match(/\*\*进度\*\*: (\d+)%/);
  
  if (!progressMatch) {
    console.log(`❌ [${taskId}] 未找到进度字段`);
    return false;
  }
  
  const currentProgress = parseInt(progressMatch[1]);
  
  if (currentProgress >= expectedProgress) {
    console.log(`✅ [${taskId}] 进度已更新 (${currentProgress}% >= ${expectedProgress}%)`);
    return true;
  }
  
  console.log(`❌ [${taskId}] 进度未更新 (${currentProgress}% < ${expectedProgress}%)`);
  return false;
}

/**
 * 综合验证任务执行
 */
function validateTaskExecution(taskId, agentId, sentAt, expectedProgress = 0) {
  const sentTime = new Date(sentAt).getTime();
  
  const checks = {
    taskUpdated: checkTaskUpdated(taskId, sentTime),
    memoryUpdated: checkMemoryUpdated(agentId, sentTime),
    progressUpdated: checkProgressUpdated(taskId, expectedProgress)
  };
  
  const passed = Object.values(checks).some(v => v); // 至少一项通过
  
  console.log(`\n📊 [${taskId}] 验证结果:`);
  console.log(`   任务文件：${checks.taskUpdated ? '✅' : '❌'}`);
  console.log(`   Memory: ${checks.memoryUpdated ? '✅' : '❌'}`);
  console.log(`   进度：${checks.progressUpdated ? '✅' : '❌'}`);
  console.log(`   总体：${passed ? '✅ 通过' : '❌ 失败'}`);
  
  return { passed, checks };
}

/**
 * 生成超时告警
 */
function generateTimeoutAlert(taskId, agentId, elapsedMinutes) {
  let level = '';
  let message = '';
  
  if (elapsedMinutes > 30) {
    level = 'CRITICAL';
    message = `🔴 严重：${agentId} 超过 30 分钟未执行任务 ${taskId}`;
  } else if (elapsedMinutes > 15) {
    level = 'WARNING';
    message = `🟠 警告：${agentId} 超过 15 分钟未执行任务 ${taskId}`;
  } else if (elapsedMinutes > 5) {
    level = 'INFO';
    message = `🟡 提醒：${agentId} 超过 5 分钟未执行任务 ${taskId}`;
  }
  
  if (level) {
    console.log(message);
    return { level, message, elapsedMinutes };
  }
  
  return null;
}

module.exports = {
  checkTaskUpdated,
  checkMemoryUpdated,
  checkProgressUpdated,
  validateTaskExecution,
  generateTimeoutAlert
};
