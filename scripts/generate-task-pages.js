#!/usr/bin/env node
/**
 * 任务详情页面生成器
 * 
 * 功能：从 Markdown 任务文件生成 HTML 详情页面
 * 触发时机：任务文件创建/更新时自动调用
 */

const fs = require('fs');
const path = require('path');

const TASKS_MD_DIR = '/home/admin/.openclaw/workspace/task-board/tasks';
const TASKS_HTML_DIR = '/home/admin/fileserver/files/task-board/tasks';

/**
 * 解析 Markdown 任务文件
 */
function parseTaskMarkdown(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath, '.md');
  
  // 提取元数据
  const extract = (patterns, defaultValue = '') => {
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) return match[1].trim();
    }
    return defaultValue;
  };
  
  // 提取进度
  const progressMatch = content.match(/进度[：:]\s*(\d+)%/);
  const progress = progressMatch ? parseInt(progressMatch[1]) : 0;
  
  // 提取状态
  const rawStatus = extract([/\*\*状态\*\*:\s*(.+)/i, /Status:\s*(.+)/i], 'PENDING');
  const statusMap = {
    'DRAFT': '待拆解',
    'PENDING': '待分配',
    'ASSIGNED': '已分配',
    'IN_PROGRESS': '进行中',
    'COMPLETED': '已完成',
    'BLOCKED': '已阻塞',
    'CANCELLED': '已取消'
  };
  const status = statusMap[rawStatus] || rawStatus;
  
  // 提取检查列表
  const checkboxes = [];
  const checkboxRegex = /(- \[[ x]\])\s*(.+)/g;
  let match;
  while ((match = checkboxRegex.exec(content)) !== null) {
    checkboxes.push({
      checked: match[1].includes('[x]'),
      text: match[2].trim()
    });
  }
  
  return {
    task_id: fileName,
    title: extract([/^#\s+(.+)/, /\*\*任务 (?:名称 | 标题)\*\*:\s*(.+)/i], fileName),
    status,
    priority: extract([/\*\*优先级\*\*:\s*(.+)/i, /Priority:\s*(.+)/i], 'P2'),
    assignee: extract([/\*\*执行者\*\*:\s*(.+)/i, /\*\*分配给\*\*:\s*(.+)/i, /Assignee:\s*(.+)/i], '未分配'),
    progress,
    created_at: extract([/\*\*创建时间\*\*:\s*(.+)/i, /Created:\s*(.+)/i], new Date().toLocaleString('zh-CN')),
    updated_at: extract([/\*\*更新时间\*\*:\s*(.+)/i, /Updated:\s*(.+)/i], new Date().toLocaleString('zh-CN')),
    estimated_complete: extract([/\*\*预计完成\*\*:\s*(.+)/i, /Estimated:\s*(.+)/i], '未设定'),
    description: extract([/##.*?(?:目标 | 描述).*?\n\n([\s\S]*?)(?:\n\n##|$)/i], '暂无描述'),
    checkboxes,
    content: content.replace(/^# .+\n/, '').replace(/\*\*.+?\*\*:\s*.+\n/g, '') // 移除标题和元数据
  };
}

/**
 * 生成 HTML 详情页面
 */
function generateTaskHTML(task) {
  const statusColors = {
    '待拆解': '#95a5a6',
    '待分配': '#3498db',
    '已分配': '#2ecc71',
    '进行中': '#f39c12',
    '已完成': '#27ae60',
    '已阻塞': '#e74c3c',
    '已取消': '#95a5a6'
  };
  
  const statusColor = statusColors[task.status] || '#95a5a6';
  
  const checkboxesHTML = task.checkboxes.length > 0 ? `
    <div class="checklist">
      <h3>✅ 验收进度</h3>
      <ul>
        ${task.checkboxes.map(cb => `
          <li class="${cb.checked ? 'checked' : ''}">
            <span class="checkbox">${cb.checked ? '☑️' : '⬜'}</span>
            <span class="text">${cb.text}</span>
          </li>
        `).join('')}
      </ul>
    </div>
  ` : '';
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${task.task_id} - ${task.title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container { max-width: 900px; margin: 0 auto; }
        .header {
            background: white;
            border-radius: 16px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .back-link {
            display: inline-block;
            color: #667eea;
            text-decoration: none;
            margin-bottom: 15px;
        }
        .back-link:hover { text-decoration: underline; }
        .task-title { font-size: 28px; color: #333; margin-bottom: 10px; }
        .task-id {
            background: #667eea;
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 14px;
            display: inline-block;
            margin-bottom: 20px;
        }
        .meta-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        .meta-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid ${statusColor};
        }
        .meta-label { font-size: 12px; color: #999; margin-bottom: 5px; }
        .meta-value { font-size: 16px; color: #333; font-weight: bold; }
        .progress-section {
            background: white;
            border-radius: 16px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .progress-bar {
            background: #e9ecef;
            border-radius: 12px;
            height: 24px;
            margin: 15px 0;
            overflow: hidden;
        }
        .progress-fill {
            background: linear-gradient(90deg, #667eea, #764ba2);
            height: 100%;
            border-radius: 12px;
            transition: width 0.3s;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding-right: 10px;
            color: white;
            font-weight: bold;
            font-size: 14px;
        }
        .checklist {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 12px;
            margin-top: 20px;
        }
        .checklist h3 { color: #333; margin-bottom: 15px; }
        .checklist ul { list-style: none; }
        .checklist li {
            padding: 10px;
            margin-bottom: 8px;
            background: white;
            border-radius: 6px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .checklist li.checked {
            background: #d4edda;
            text-decoration: line-through;
            color: #666;
        }
        .content-section {
            background: white;
            border-radius: 16px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            line-height: 1.8;
        }
        .content-section h2 { color: #667eea; margin: 25px 0 15px; }
        .content-section h3 { color: #333; margin: 20px 0 10px; }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            color: white;
            background: ${statusColor};
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="/task-board/" class="back-link">← 返回任务总览</a>
            <div class="task-id">${task.task_id}</div>
            <h1 class="task-title">${task.title}</h1>
            <div class="status-badge">${task.status}</div>
            
            <div class="meta-grid">
                <div class="meta-item">
                    <div class="meta-label">👤 执行者</div>
                    <div class="meta-value">${task.assignee}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">🎯 优先级</div>
                    <div class="meta-value">${task.priority}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">📊 进度</div>
                    <div class="meta-value">${task.progress}%</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">📅 创建时间</div>
                    <div class="meta-value">${task.created_at}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">🔄 更新时间</div>
                    <div class="meta-value">${task.updated_at}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">⏰ 预计完成</div>
                    <div class="meta-value">${task.estimated_complete}</div>
                </div>
            </div>
        </div>
        
        <div class="progress-section">
            <h2>📈 任务进度</h2>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${task.progress}%">${task.progress}%</div>
            </div>
            ${checkboxesHTML}
        </div>
        
        <div class="content-section">
            <h2>📋 任务详情</h2>
            ${task.content.split('\n').map(line => {
              if (line.startsWith('## ')) return '<h2>' + line.replace('## ', '') + '</h2>';
              if (line.startsWith('### ')) return '<h3>' + line.replace('### ', '') + '</h3>';
              if (line.startsWith('- ')) return '<li>' + line.replace('- ', '') + '</li>';
              if (line.trim()) return '<p>' + line + '</p>';
              return '';
            }).join('')}
        </div>
    </div>
    
    <script>
        // 页面加载时记录访问
        console.log('访问任务详情：${task.task_id}');
    </script>
</body>
</html>`;
}

/**
 * 生成任务的 HTML 页面
 */
function generateTaskPage(filePath) {
  try {
    const task = parseTaskMarkdown(filePath);
    const html = generateTaskHTML(task);
    
    const outputPath = path.join(TASKS_HTML_DIR, `${task.task_id}.html`);
    fs.writeFileSync(outputPath, html);
    
    console.log(`✅ ${task.task_id}: 已生成详情页面`);
    return true;
  } catch (error) {
    console.error(`❌ ${path.basename(filePath)}: ${error.message}`);
    return false;
  }
}

/**
 * 批量生成所有任务的 HTML 页面
 */
function generateAll() {
  console.log('📝 开始生成任务详情页面...\n');
  
  const files = fs.readdirSync(TASKS_MD_DIR).filter(f => f.endsWith('.md'));
  let generated = 0;
  let failed = 0;
  
  for (const file of files) {
    const result = generateTaskPage(path.join(TASKS_MD_DIR, file));
    if (result) generated++;
    else failed++;
  }
  
  console.log(`\n📊 生成完成：${generated} 个成功，${failed} 个失败`);
}

// 命令行调用
if (process.argv[2] === '--all') {
  generateAll();
} else if (process.argv[2]) {
  generateTaskPage(process.argv[2]);
} else {
  console.log('用法：node generate-task-pages.js [--all|<文件路径>]');
}

module.exports = { generateTaskPage, generateAll };
