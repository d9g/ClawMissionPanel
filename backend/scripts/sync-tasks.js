#!/usr/bin/env node
/**
 * 任务状态同步脚本
 * 将 Markdown 任务文件同步到 SQLite 数据库
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const TASK_DIR = path.join(__dirname, '../tasks');
const DB_PATH = path.join(__dirname, '../database/task-board.db');

const db = new sqlite3.Database(DB_PATH);

/**
 * 解析 Markdown 任务文件
 */
function parseTaskFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  const extract = (regex) => {
    const match = content.match(regex);
    return match ? match[1].trim() : null;
  };
  
  const taskId = path.basename(filePath, '.md');
  const title = extract(/\*\*任务名称\*\*:\s*(.+)/);
  const priority = extract(/\*\*优先级\*\*:\s*(.+)/);
  const assigneeMatch = extract(/\*\*执行者\*\*:\s*(.+)/);
  const statusMatch = extract(/\*\*状态\*\*:\s*(.+)/);
  
  // 清理 assignee 和 status（移除 emoji 和括号内容）
  let assignee = assigneeMatch || 'unknown';
  assignee = assignee.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu, '').trim();
  assignee = assignee.split(' ')[0]; // 只取第一个词（如"小云开发" → "小云开发"）
  
  // 映射到英文 ID
  const assigneeMap = {
    '小云开发': 'xiaoyun-dev',
    '小云测试': 'xiaoyun-test',
    '小云记录': 'xiaoyun-recorder',
    '小云评委': 'xiaoyun-judge',
    '小云推书': 'xiaoyun-novel'
  };
  assignee = assigneeMap[assignee] || assignee;
  
  let status = statusMatch || 'IN_PROGRESS';
  // 提取状态关键词
  if (status.includes('COMPLETED') || status.includes('✅')) {
    status = 'COMPLETED';
  } else if (status.includes('PAUSED') || status.includes('暂停')) {
    status = 'PAUSED';
  } else if (status.includes('PENDING') || status.includes('等待')) {
    status = 'PENDING';
  } else if (status.includes('AVAILABLE') || status.includes('可开始')) {
    status = 'AVAILABLE';
  } else if (status.includes('URGENT') || status.includes('紧急')) {
    status = 'URGENT';
  } else if (status.includes('IN_PROGRESS') || status.includes('进行中')) {
    status = 'IN_PROGRESS';
  }
  
  return {
    task_id: taskId,
    title,
    priority,
    assignee,
    status,
    updated_at: new Date().toISOString().replace('T', ' ').substr(0, 19)
  };
}

/**
 * 同步任务到数据库
 */
function syncTask(task) {
  return new Promise((resolve, reject) => {
    // 先检查任务是否存在
    db.get('SELECT task_id FROM tasks WHERE task_id = ?', [task.task_id], (err, row) => {
      if (err) reject(err);
      else if (row) {
        // 更新现有任务
        const sql = `
          UPDATE tasks 
          SET status = ?, assignee = ?, priority = ?, updated_at = ?
          WHERE task_id = ?
        `;
        db.run(sql, [task.status, task.assignee, task.priority, task.updated_at, task.task_id], function(err) {
          if (err) reject(err);
          else resolve({ action: 'updated', ...task });
        });
      } else {
        // 跳过不存在的任务（需要手动创建）
        console.log(`⚠️ 跳过新任务 ${task.task_id} (数据库中不存在)`);
        resolve({ action: 'skipped', ...task });
      }
    });
  });
}

/**
 * 主函数
 */
async function main() {
  console.log('🔄 开始同步任务状态...\n');
  
  const files = fs.readdirSync(TASK_DIR).filter(f => f.startsWith('TASK-') && f.endsWith('.md'));
  const results = { updated: 0, skipped: 0, errors: 0 };
  
  for (const file of files) {
    const filePath = path.join(TASK_DIR, file);
    try {
      const task = parseTaskFile(filePath);
      const result = await syncTask(task);
      
      if (result.action === 'updated') {
        console.log(`✅ ${task.task_id}: ${task.status} → ${task.assignee}`);
        results.updated++;
      } else {
        results.skipped++;
      }
    } catch (error) {
      console.error(`❌ ${file}: ${error.message}`);
      results.errors++;
    }
  }
  
  console.log(`\n📊 同步完成：${results.updated} 更新，${results.skipped} 跳过，${results.errors} 错误`);
  db.close();
}

main().catch(console.error);
