#!/usr/bin/env node
/**
 * 任务追踪服务 v2.0
 * 
 * 功能:
 * - 监听任务文件变化，自动更新数据库
 * - 检测阻塞任务，自动标记
 * - 提供实时 API 给网页
 * 
 * 开发：小云开发 💻
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const chokidar = require('chokidar');
const { generateTaskPage } = require('./generate-task-pages');
const { deployFile } = require('./auto-deploy');

// 配置
const CONFIG = {
  tasksDir: '/home/admin/.openclaw/workspace/task-board/tasks',
  dbPath: '/home/admin/.openclaw/workspace/task-board/database/task-board.db',
  checkInterval: 5 * 60 * 1000, // 5 分钟检查一次阻塞
  timeoutThreshold: 2 * 60 * 60 * 1000 // 2 小时无更新视为阻塞
};

// 数据库连接
const db = new sqlite3.Database(CONFIG.dbPath);

/**
 * 解析任务文件
 */
function parseTaskFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath, '.md');
  
  // 提取元数据 - 支持多种格式
  const extract = (patterns) => {
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) return match[1].trim();
    }
    return null;
  };
  
  // 任务状态映射
  const statusMap = {
    '待拆解': 'DRAFT',
    '待审批': 'PENDING_APPROVAL',
    '已审批': 'APPROVED',
    '待分配': 'PENDING',
    '已分配': 'ASSIGNED',
    '进行中': 'IN_PROGRESS',
    '待验收': 'PENDING_ACCEPTANCE',
    '已完成': 'COMPLETED',
    '已取消': 'CANCELLED',
    '阻塞': 'BLOCKED'
  };
  
  const rawStatus = extract([/^status:\s*(.+)/im, /^状态:\s*(.+)/im]) || 'PENDING';
  const mappedStatus = statusMap[rawStatus] || rawStatus;
  
  return {
    task_id: fileName,
    title: extract([/^#\s+(.+)/im, /^##\s+(.+)/im]) || fileName,
    status: mappedStatus,
    assignee: extract([/^分配给:\s*(.+)/im, /^assignee:\s*(.+)/im, /^执行者:\s*(.+)/im]),
    priority: extract([/^优先级:\s*(.+)/im, /^priority:\s*(.+)/im]) || 'P2',
    description: extract([/^##.*?描述.*?\n\n([\s\S]*?)(?:\n\n##|$)/im]),
    created_at: extract([/创建时间:\s*(.+)/im, /created:\s*(.+)/im]),
    updated_at: new Date().toISOString().replace('T', ' ').substr(0, 19)
  };
}

/**
 * 同步任务到数据库
 */
async function syncTask(taskData) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT OR REPLACE INTO tasks (
        task_id, title, description, priority, status, 
        assignee, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(sql, [
      taskData.task_id,
      taskData.title,
      taskData.description,
      taskData.priority,
      taskData.status,
      taskData.assignee,
      taskData.updated_at
    ], function(err) {
      if (err) reject(err);
      else {
        console.log(`✅ ${taskData.task_id}: ${taskData.status} → ${taskData.assignee || '未分配'}`);
        resolve({ task_id: taskData.task_id, updated: true });
      }
    });
  });
}

/**
 * 检测阻塞任务
 */
async function checkBlockedTasks() {
  console.log('\n🔍 检查阻塞任务...');
  
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT task_id, title, assignee, status, updated_at
      FROM tasks 
      WHERE status IN ('IN_PROGRESS', 'ASSIGNED')
    `;
    
    db.all(sql, [], async (err, rows) => {
      if (err) reject(err);
      else {
        const now = Date.now();
        let blockedCount = 0;
        
        for (const task of rows) {
          const lastUpdate = new Date(task.updated_at).getTime();
          const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);
          
          if (hoursSinceUpdate > 2) {
            // 标记为阻塞
            await markAsBlocked(task.task_id, `超过${hoursSinceUpdate.toFixed(1)}小时未更新`);
            blockedCount++;
          }
        }
        
        if (blockedCount > 0) {
          console.log(`🔴 发现 ${blockedCount} 个阻塞任务`);
        } else {
          console.log('✅ 无阻塞任务');
        }
        
        resolve({ blocked: blockedCount });
      }
    });
  });
}

/**
 * 标记任务为阻塞
 */
async function markAsBlocked(taskId, reason) {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE tasks 
      SET status = 'BLOCKED',
          blocked_reason = ?,
          blocked_at = datetime('now')
      WHERE task_id = ? AND status != 'BLOCKED'
    `;
    
    db.run(sql, [reason, taskId], function(err) {
      if (err) reject(err);
      else {
        if (this.changes > 0) {
          console.log(`  🔴 ${taskId}: 已标记为阻塞 - ${reason}`);
        }
        resolve({ task_id: taskId, blocked: this.changes > 0 });
      }
    });
  });
}

/**
 * 初始化数据库表（添加阻塞相关字段）
 */
async function initDatabase() {
  return new Promise((resolve, reject) => {
    const sql = `
      ALTER TABLE tasks ADD COLUMN blocked_reason TEXT;
      ALTER TABLE tasks ADD COLUMN blocked_at DATETIME;
      ALTER TABLE tasks ADD COLUMN started_at DATETIME;
      ALTER TABLE tasks ADD COLUMN completed_at DATETIME;
    `;
    
    db.exec(sql, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        reject(err);
      } else {
        console.log('✅ 数据库初始化完成');
        resolve();
      }
    });
  });
}

/**
 * 处理新任务文件
 */
async function handleNewTask(filePath) {
  try {
    const taskData = parseTaskFile(filePath);
    await syncTask(taskData);
    // 生成 HTML 详情页面
    generateTaskPage(filePath);
    // 自动部署公共文件
    if (filePath.includes('/public/')) {
      deployFile(filePath);
    }
  } catch (error) {
    console.error(`❌ 处理新任务失败 ${path.basename(filePath)}:`, error.message);
  }
}

/**
 * 处理任务文件更新
 */
async function handleTaskUpdate(filePath) {
  // 防抖：等待 1 秒确保文件写入完成
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    const taskData = parseTaskFile(filePath);
    await syncTask(taskData);
    // 生成 HTML 详情页面
    generateTaskPage(filePath);
    // 自动部署公共文件
    if (filePath.includes('/public/')) {
      deployFile(filePath);
    }
  } catch (error) {
    console.error(`❌ 处理任务更新失败 ${path.basename(filePath)}:`, error.message);
  }
}

/**
 * 启动文件监听
 */
function startWatching() {
  console.log('👀 开始监听任务文件变化...');
  
  const watcher = chokidar.watch(CONFIG.tasksDir, {
    ignored: /node_modules|\.git/,
    persistent: true,
    ignoreInitial: false,
    awaitWriteFinish: {
      stabilityThreshold: 1000,
      pollInterval: 100
    }
  });
  
  watcher
    .on('add', filePath => {
      if (filePath.endsWith('.md')) {
        console.log(`📄 新任务文件：${path.basename(filePath)}`);
        handleNewTask(filePath);
      }
    })
    .on('change', filePath => {
      if (filePath.endsWith('.md')) {
        console.log(`📝 任务更新：${path.basename(filePath)}`);
        handleTaskUpdate(filePath);
      }
    })
    .on('unlink', filePath => {
      if (filePath.endsWith('.md')) {
        console.log(`🗑️ 任务删除：${path.basename(filePath)}`);
        // 可以选择软删除或标记为已删除
      }
    });
  
  return watcher;
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 任务追踪服务 v2.0 启动中...\n');
  
  try {
    // 初始化数据库
    await initDatabase();
    
    // 全量同步现有任务
    console.log('\n📋 同步现有任务...');
    const files = fs.readdirSync(CONFIG.tasksDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      await handleNewTask(path.join(CONFIG.tasksDir, file));
    }
    
    // 启动文件监听
    console.log('');
    startWatching();
    
    // 定期检查阻塞任务
    setInterval(async () => {
      await checkBlockedTasks();
    }, CONFIG.checkInterval);
    
    // 立即检查一次
    setTimeout(() => checkBlockedTasks(), 5000);
    
    console.log('\n✅ 服务启动成功！');
    console.log(`   监听目录：${CONFIG.tasksDir}`);
    console.log(`   数据库：${CONFIG.dbPath}`);
    console.log(`   阻塞检查：每${CONFIG.checkInterval / 60000}分钟`);
    
  } catch (error) {
    console.error('❌ 启动失败:', error);
    process.exit(1);
  }
}

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n👋 服务关闭中...');
  db.close();
  process.exit(0);
});

// 启动
main();
