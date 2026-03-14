#!/usr/bin/env node
/**
 * Agent 状态 API
 * 获取所有 Agent 的工作状态和进度
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const WORKSPACE = '/home/admin/.openclaw/workspace';
const DB_PATH = path.join(WORKSPACE, 'task-board/database/task-board.db');
const AGENTS_DIR = path.join(WORKSPACE, 'agents');

// 已配置的 Agent 列表
const AGENTS = [
  { id: 'xiaoyun-dev', name: '小云开发', emoji: '💻' },
  { id: 'xiaoyun-test', name: '小云测试', emoji: '✅' },
  { id: 'xiaoyun-recorder', name: '小云记录', emoji: '📝' },
  { id: 'xiaoyun-judge', name: '小云评委', emoji: '⚖️' },
  { id: 'xiaoyun-novel', name: '小云推书', emoji: '📖' }
];

/**
 * 获取 Agent 的当前任务
 */
function getAgentTask(agentId) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);
    
    const sql = `
      SELECT task_id, title, status, priority, 
             created_at, updated_at, deadline
      FROM tasks 
      WHERE assignee = ? 
        AND status != 'CANCELLED'
      ORDER BY 
        CASE status 
          WHEN 'IN_PROGRESS' THEN 1 
          WHEN 'COMPLETED' THEN 2 
          ELSE 3 
        END,
        CASE priority 
          WHEN 'P0' THEN 1 
          WHEN 'P1' THEN 2 
          ELSE 3 
        END,
        updated_at DESC
      LIMIT 1
    `;
    
    db.get(sql, [agentId], (err, row) => {
      db.close();
      if (err) reject(err);
      else resolve(row);
    });
  });
}

/**
 * 获取任务详细信息 (包括 Markdown 中的进度)
 */
async function getTaskDetails(task) {
  if (!task) return null;
  
  // 解析 Markdown 文件获取详细信息
  const markdownInfo = parseTaskMarkdown(task.task_id);
  
  // 计算进度
  const progress = calculateProgress(task, markdownInfo);
  
  // 计算剩余时间
  const remainingTime = calculateRemainingTime(markdownInfo.estimatedComplete);
  
  return {
    ...task,
    progress: progress,
    estimatedComplete: markdownInfo.estimatedComplete,
    startTime: markdownInfo.startTime,
    statusText: markdownInfo.statusText,
    remainingTime: remainingTime
  };
}

/**
 * 解析任务 Markdown 文件获取详细信息
 */
function parseTaskMarkdown(taskId) {
  const fs = require('fs');
  const path = require('path');
  
  // 可能的任务文件路径
  const possiblePaths = [
    path.join(WORKSPACE, 'task-board', 'tasks', `${taskId}.md`),
    path.join(WORKSPACE, 'agents', 'xiaoyun-dev', 'tasks', `${taskId}.md`),
    path.join(WORKSPACE, 'agents', 'xiaoyun-test', 'tasks', `${taskId}.md`),
    path.join(WORKSPACE, 'agents', 'xiaoyun-recorder', 'tasks', `${taskId}.md`),
    path.join(WORKSPACE, 'agents', 'xiaoyun-judge', 'tasks', `${taskId}.md`)
  ];
  
  for (const taskPath of possiblePaths) {
    if (fs.existsSync(taskPath)) {
      try {
        const content = fs.readFileSync(taskPath, 'utf8');
        
        // 提取进度
        const progressMatch = content.match(/\*\*进度\*\*:\s*(\d+)%/);
        const progress = progressMatch ? parseInt(progressMatch[1]) : null;
        
        // 提取预计完成时间
        const dueMatch = content.match(/\*\*预计完成\*\*:\s*(\d{4}-\d{2}-\d{2} \d{2}:\d{2})/);
        const estimatedComplete = dueMatch ? dueMatch[1] : null;
        
        // 提取开始时间
        const startMatch = content.match(/\*\*开始时间\*\*:\s*(\d{4}-\d{2}-\d{2} \d{2}:\d{2})/);
        const startTime = startMatch ? startMatch[1] : null;
        
        // 提取状态描述
        const statusMatch = content.match(/\*\*状态\*\*:\s*(.+)/);
        const statusText = statusMatch ? statusMatch[1].trim() : null;
        
        return { progress, estimatedComplete, startTime, statusText };
      } catch (error) {
        console.error(`解析 ${taskId} 失败:`, error);
      }
    }
  }
  
  return { progress: null, estimatedComplete: null, startTime: null, statusText: null };
}

/**
 * 计算任务进度
 */
function calculateProgress(task, markdownInfo) {
  if (!task) return 0;
  
  // 优先使用 Markdown 中的进度
  if (markdownInfo.progress !== null) {
    return markdownInfo.progress;
  }
  
  // 否则根据状态估算
  const statusMap = {
    'PENDING': 0,
    'AVAILABLE': 10,
    'IN_PROGRESS': 50,
    'PAUSED': 40,
    'BLOCKED': 30,
    'COMPLETED': 100
  };
  
  return statusMap[task.status] || 0;
}

/**
 * 计算剩余时间
 */
function calculateRemainingTime(estimatedComplete) {
  if (!estimatedComplete) return null;
  
  try {
    const now = new Date();
    const due = new Date(estimatedComplete.replace(' ', 'T'));
    const diffMs = due - now;
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 0) {
      return { overdue: true, hours: Math.abs(diffHours), text: `已延期 ${Math.abs(diffHours)}小时` };
    } else if (diffHours < 24) {
      return { overdue: false, hours: diffHours, text: `剩余 ${diffHours}小时` };
    } else {
      const days = Math.round(diffHours / 24);
      return { overdue: false, hours: diffHours, text: `剩余 ${days}天` };
    }
  } catch (error) {
    return null;
  }
}

/**
 * 检查是否延期
 */
function checkOverdue(task) {
  if (!task || !task.deadline) return { overdue: false };
  
  const now = new Date();
  const deadline = new Date(task.deadline);
  const overdueMs = now - deadline;
  const overdueHours = Math.round(overdueMs / (1000 * 60 * 60));
  
  return {
    overdue: overdueMs > 0,
    overdueHours: Math.max(0, overdueHours)
  };
}

/**
 * 确定 Agent 状态
 */
function determineAgentStatus(task, overdue) {
  if (!task) return 'idle'; // 无任务
  if (task.status === 'COMPLETED') return 'idle';
  if (overdue) return 'inactive'; // 有任务但未响应/延期
  if (task.status === 'IN_PROGRESS') return 'working';
  return 'pending';
}

/**
 * 获取所有 Agent 状态
 */
async function getAgentsStatus() {
  const results = [];
  
  for (const agent of AGENTS) {
    try {
      const task = await getAgentTask(agent.id);
      
      if (task) {
        // 获取任务详细信息
        const taskDetails = await getTaskDetails(task);
        const { overdue, overdueHours } = checkOverdue(task);
        const status = determineAgentStatus(task, overdue);
        
        results.push({
          id: agent.id,
          name: agent.name,
          emoji: agent.emoji,
          status: status,
          currentTask: taskDetails.task_id,
          taskTitle: taskDetails.title,
          progress: taskDetails.progress,
          estimatedComplete: taskDetails.estimatedComplete,
          startTime: taskDetails.startTime,
          statusText: taskDetails.statusText,
          remainingTime: taskDetails.remainingTime,
          overdue: overdue,
          overdueHours: overdueHours
        });
      } else {
        results.push({
          id: agent.id,
          name: agent.name,
          emoji: agent.emoji,
          status: 'idle',
          currentTask: null,
          taskTitle: null,
          progress: 0,
          estimatedComplete: null,
          startTime: null,
          statusText: null,
          remainingTime: null,
          overdue: false
        });
      }
    } catch (error) {
      console.error(`获取 ${agent.id} 状态失败:`, error);
      results.push({
        id: agent.id,
        name: agent.name,
        emoji: agent.emoji,
        status: 'error',
        currentTask: null,
        progress: 0,
        overdue: false
      });
    }
  }
  
  return results;
}

// 如果是直接运行此脚本
if (require.main === module) {
  getAgentsStatus()
    .then(data => {
      console.log(JSON.stringify({ success: true, data }, null, 2));
    })
    .catch(err => {
      console.error(JSON.stringify({ success: false, error: err.message }));
      process.exit(1);
    });
}

module.exports = { getAgentsStatus };
