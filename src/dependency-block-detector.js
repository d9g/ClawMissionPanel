#!/usr/bin/env node

/**
 * 任务依赖阻塞检测
 * 
 * 功能:
 * - 检测依赖阻塞
 * - 标记 BLOCKED 状态
 * - 发送阻塞告警
 */

const fs = require('fs');
const path = require('path');
const dependencyParser = require('./dependency-parser');

// 配置
const CONFIG = {
  tasksDir: '/home/admin/.openclaw/workspace/task-board/tasks',
  reportsDir: '/home/admin/.openclaw/workspace/task-board/reports',
};

/**
 * 检测所有任务的依赖阻塞状态
 */
function checkDependencyBlocks() {
  const taskStatuses = dependencyParser.getTaskStatuses();
  const blockedTasks = [];
  const atRiskTasks = [];
  
  for (const [taskId, taskData] of Object.entries(taskStatuses)) {
    // 跳过已完成的任务
    if (taskData.status === 'COMPLETED') {
      continue;
    }
    
    const result = dependencyParser.canTaskStart(taskId, taskStatuses);
    
    if (!result.canStart && result.blockingTasks.length > 0) {
      blockedTasks.push({
        taskId,
        filename: taskData.filename,
        blockingTasks: result.blockingTasks,
      });
    }
  }
  
  return {
    blockedTasks,
    atRiskTasks,
    totalBlocked: blockedTasks.length,
    totalAtRisk: atRiskTasks.length,
  };
}

/**
 * 更新任务状态为 BLOCKED
 */
function updateBlockedStatus(taskId, blockingTasks) {
  const taskFile = path.join(CONFIG.tasksDir, `${taskId}.md`);
  
  if (!fs.existsSync(taskFile)) {
    return false;
  }
  
  let content = fs.readFileSync(taskFile, 'utf8');
  
  // 检查是否已经是 BLOCKED 状态
  const statusMatch = content.match(/状态 [::]\s*(\w+)/i);
  const currentStatus = statusMatch ? statusMatch[1].toUpperCase() : 'UNKNOWN';
  
  if (currentStatus === 'BLOCKED') {
    // 已经是 BLOCKED，更新阻塞原因
    const reasonMatch = content.match(/\*\*阻塞原因\*\*[:：]?\s*([^\n]+)/i);
    if (reasonMatch) {
      const blockingIds = blockingTasks.map(b => b.taskId).join(', ');
      const newReason = `依赖任务未完成：${blockingIds}`;
      content = content.replace(reasonMatch[0], `**阻塞原因**: ${newReason}`);
    }
  } else if (['PENDING', 'IN_PROGRESS', 'AVAILABLE'].includes(currentStatus)) {
    // 更新为 BLOCKED
    const blockingIds = blockingTasks.map(b => b.taskId).join(', ');
    const blockReason = `依赖任务未完成：${blockingIds}`;
    
    // 替换状态行
    content = content.replace(
      /状态 [::]\s*\w+/i,
      `状态：🔴 BLOCKED (依赖阻塞)`
    );
    
    // 添加或更新阻塞原因
    if (content.includes('**阻塞原因**')) {
      content = content.replace(
        /\*\*阻塞原因\*\*[:：]?\s*[^\n]*/i,
        `**阻塞原因**: ${blockReason}`
      );
    } else {
      // 在状态行后添加阻塞原因
      content = content.replace(
        /(状态 [::].+\n)/,
        `$1**阻塞原因**: ${blockReason}\n`
      );
    }
  }
  
  fs.writeFileSync(taskFile, content);
  return true;
}

/**
 * 恢复任务状态 (当依赖完成后)
 */
function restoreTaskStatus(taskId) {
  const taskFile = path.join(CONFIG.tasksDir, `${taskId}.md`);
  
  if (!fs.existsSync(taskFile)) {
    return false;
  }
  
  let content = fs.readFileSync(taskFile, 'utf8');
  
  // 检查是否是 BLOCKED 状态
  const statusMatch = content.match(/状态 [::]\s*🔴 BLOCKED/i);
  if (statusMatch) {
    // 恢复为 PENDING
    content = content.replace(
      /状态 [::]\s*🔴 BLOCKED[^\n]*/i,
      '状态：🟡 PENDING'
    );
    
    // 移除阻塞原因
    content = content.replace(
      /\*\*阻塞原因\*\*[:：]?\s*[^\n]*\n/i,
      ''
    );
  }
  
  fs.writeFileSync(taskFile, content);
  return true;
}

/**
 * 生成阻塞报告
 */
function generateBlockReport(blockResult) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportFile = path.join(CONFIG.reportsDir, `DEPENDENCY-BLOCK-${timestamp}.md`);
  
  let content = `# 🔴 依赖阻塞报告

**生成时间**: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
**阻塞任务数**: ${blockResult.totalBlocked}

---

## 📋 阻塞任务列表

`;
  
  if (blockResult.blockedTasks.length === 0) {
    content += '✅ 暂无依赖阻塞任务\n';
  } else {
    for (const blocked of blockResult.blockedTasks) {
      content += `### ${blocked.taskId}\n\n`;
      content += '**阻塞原因**: 依赖任务未完成\n\n';
      content += '**阻塞任务**:\n';
      
      for (const blocker of blocked.blockingTasks) {
        content += `- ${blocker.taskId} (${blocker.reason})\n`;
      }
      
      content += '\n---\n\n';
    }
  }
  
  content += `## 💡 建议行动

1. 优先完成阻塞任务
2. 检查依赖关系是否合理
3. 考虑并行执行可能性

---

_依赖阻塞检测自动生成_ 🔗
`;
  
  fs.writeFileSync(reportFile, content);
  return reportFile;
}

/**
 * 自动处理依赖阻塞
 */
function autoProcessBlocks() {
  console.log('🔍 开始依赖阻塞检测...');
  
  const blockResult = checkDependencyBlocks();
  console.log(`发现 ${blockResult.totalBlocked} 个阻塞任务`);
  
  // 更新阻塞任务状态
  for (const blocked of blockResult.blockedTasks) {
    const updated = updateBlockedStatus(blocked.taskId, blocked.blockingTasks);
    if (updated) {
      console.log(`  ✓ ${blocked.taskId} → BLOCKED`);
    }
  }
  
  // 生成报告
  if (blockResult.totalBlocked > 0) {
    const reportFile = generateBlockReport(blockResult);
    console.log(`📄 报告已生成：${reportFile}`);
  }
  
  console.log('依赖阻塞检测完成');
  return blockResult;
}

// 导出函数
module.exports = {
  checkDependencyBlocks,
  updateBlockedStatus,
  restoreTaskStatus,
  generateBlockReport,
  autoProcessBlocks,
};

// CLI 模式
if (require.main === module) {
  autoProcessBlocks();
}
