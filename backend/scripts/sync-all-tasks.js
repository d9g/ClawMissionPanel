#!/usr/bin/env node
/**
 * 任务状态同步脚本 - 完整版
 * 同步所有目录的 Markdown 任务文件到 SQLite 数据库
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, '../database/task-board.db');
const db = new sqlite3.Database(DB_PATH);

// 所有任务目录
const TASK_DIRS = [
  path.join(__dirname, '../tasks'),
  path.join(__dirname, '../../agents/xiaoyun-test/tasks'),
  path.join(__dirname, '../../agents/xiaoyun-recorder/tasks'),
  path.join(__dirname, '../../agents/xiaoyun-dev/tasks'),
  path.join(__dirname, '../../agents/xiaoyun-judge/tasks')
];

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
  const title = extract(/\*\*任务名称\*\*:\s*(.+)/) || taskId;
  const priority = extract(/\*\*优先级\*\*:\s*(.+)/) || 'P2';
  const assigneeMatch = extract(/\*\*执行者\*\*:\s*(.+)/) || 'unknown';
  const statusMatch = extract(/\*\*状态\*\*:\s*(.+)/) || 'IN_PROGRESS';
  
  // 清理 assignee（移除 emoji）
  let assignee = assigneeMatch.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu, '').trim();
  assignee = assignee.split(' ')[0];
  
  // 映射到英文 ID
  const assigneeMap = {
    '小云开发': 'xiaoyun-dev',
    '小云测试': 'xiaoyun-test',
    '小云记录': 'xiaoyun-recorder',
    '小云评委': 'xiaoyun-judge',
    '小云推书': 'xiaoyun-novel',
    '小云写作': 'xiaoyun-recorder'
  };
  assignee = assigneeMap[assignee] || assignee;
  
  // 解析状态
  let status = statusMatch;
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
  
  return { task_id: taskId, title, priority, assignee, status };
}

/**
 * 同步任务到数据库
 */
function syncTask(task) {
  return new Promise((resolve, reject) => {
    db.get('SELECT task_id FROM tasks WHERE task_id = ?', [task.task_id], (err, row) => {
      if (err) reject(err);
      else if (row) {
        const sql = `UPDATE tasks SET status = ?, assignee = ?, priority = ?, updated_at = datetime('now') WHERE task_id = ?`;
        db.run(sql, [task.status, task.assignee, task.priority, task.task_id], function(err) {
          if (err) reject(err);
          else resolve({ action: 'updated', ...task });
        });
      } else {
        console.log(`⚠️ 跳过 ${task.task_id} (数据库中不存在，需要先创建)`);
        resolve({ action: 'skipped', ...task });
      }
    });
  });
}

/**
 * 主函数
 */
async function main() {
  console.log('🔄 开始同步所有任务目录...\n');
  
  const results = { updated: 0, skipped: 0, errors: 0 };
  
  for (const taskDir of TASK_DIRS) {
    if (!fs.existsSync(taskDir)) continue;
    
    const files = fs.readdirSync(taskDir).filter(f => f.startsWith('TASK-') && f.endsWith('.md'));
    
    for (const file of files) {
      const filePath = path.join(taskDir, file);
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
  }
  
  console.log(`\n📊 同步完成：${results.updated} 更新，${results.skipped} 跳过，${results.errors} 错误`);
  console.log('\n💡 提示：新任务需要先在数据库中创建，可以使用 create-task.js 脚本');
  db.close();
}

main().catch(console.error);
