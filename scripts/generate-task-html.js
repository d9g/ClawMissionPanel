#!/usr/bin/env node
/**
 * 生成任务详情 HTML 页面
 * 将 Markdown 任务文件转换为 HTML
 */

const fs = require('fs');
const path = require('path');

const TASKS_DIR = path.join(__dirname, '../tasks');
const OUTPUT_DIR = path.join(__dirname, '../public/tasks');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log('✅ 创建输出目录:', OUTPUT_DIR);
}

// 读取所有任务文件
const taskFiles = fs.readdirSync(TASKS_DIR).filter(f => f.endsWith('.md'));
console.log(`📄 发现 ${taskFiles.length} 个任务文件`);

for (const file of taskFiles) {
  const taskId = path.basename(file, '.md');
  const content = fs.readFileSync(path.join(TASKS_DIR, file), 'utf-8');
  
  // 解析任务信息
  const extract = (regex) => {
    const match = content.match(regex);
    return match ? match[1].trim() : null;
  };
  
  const taskInfo = {
    id: taskId,
    title: extract(/\*\*任务名称\*\*:\s*(.+)/) || extract(/\*\*任务 ID\*\*:\s*(.+)/) || taskId,
    status: extract(/\*\*状态\*\*:\s*(.+)/) || 'PENDING',
    priority: extract(/\*\*优先级\*\*:\s*(.+)/) || 'P2',
    assignee: extract(/\*\*执行者\*\*:\s*(.+)/) || '未分配',
    created: extract(/\*\*创建时间\*\*:\s*(.+)/) || extract(/\*\*开始时间\*\*:\s*(.+)/) || '-',
    completed: extract(/\*\*完成时间\*\*:\s*(.+)/) || extract(/\*\*取消时间\*\*:\s*(.+)/) || '-'
  };
  
  // 生成 HTML
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${taskInfo.id} - ${taskInfo.title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
        }
        .header {
            background: white;
            border-radius: 16px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .task-id {
            color: #667eea;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 10px;
        }
        .task-title {
            font-size: 28px;
            color: #333;
            margin-bottom: 20px;
        }
        .meta-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        .meta-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
        }
        .meta-label {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 5px;
        }
        .meta-value {
            font-size: 16px;
            color: #374151;
            font-weight: 600;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }
        .status-completed { background: #10b981; color: white; }
        .status-in_progress { background: #f59e0b; color: white; }
        .status-pending { background: #3b82f6; color: white; }
        .status-cancelled { background: #6b7280; color: white; }
        .content {
            background: white;
            border-radius: 16px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .content h2 { margin-top: 20px; margin-bottom: 10px; color: #333; }
        .content h3 { margin-top: 15px; margin-bottom: 8px; color: #555; }
        .content p { margin-bottom: 10px; line-height: 1.6; color: #4b5563; }
        .content ul, .content ol { margin-left: 20px; margin-bottom: 10px; line-height: 1.8; }
        .content code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: 'Courier New', monospace; }
        .content pre { background: #f3f4f6; padding: 15px; border-radius: 8px; overflow-x: auto; margin: 10px 0; }
        .back-link {
            display: inline-block;
            margin-bottom: 20px;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            background: rgba(255,255,255,0.2);
            border-radius: 8px;
            transition: background 0.2s;
        }
        .back-link:hover { background: rgba(255,255,255,0.3); }
    </style>
</head>
<body>
    <div class="container">
        <a href="/task-board/" class="back-link">← 返回任务板</a>
        
        <div class="header">
            <div class="task-id">${taskInfo.id}</div>
            <h1 class="task-title">${taskInfo.title}</h1>
            
            <div class="meta-grid">
                <div class="meta-item">
                    <div class="meta-label">状态</div>
                    <div class="meta-value">
                        <span class="status-badge status-${taskInfo.status.toLowerCase().replace(/\\s+/g, '_').replace('✅','completed').replace('❌','cancelled')}">${taskInfo.status}</span>
                    </div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">优先级</div>
                    <div class="meta-value">${taskInfo.priority}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">执行者</div>
                    <div class="meta-value">${taskInfo.assignee}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">创建时间</div>
                    <div class="meta-value">${taskInfo.created}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">完成时间</div>
                    <div class="meta-value">${taskInfo.completed}</div>
                </div>
            </div>
        </div>
        
        <div class="content">
            ${content.split('\n').map(line => {
              if (line.startsWith('# ')) return '<h2>' + line.substring(2) + '</h2>';
              if (line.startsWith('## ')) return '<h3>' + line.substring(3) + '</h3>';
              if (line.startsWith('- ')) return '<li>' + line.substring(2) + '</li>';
              if (line.startsWith('**')) return '<p><strong>' + line + '</strong></p>';
              if (line.trim()) return '<p>' + line + '</p>';
              return '';
            }).join('\n')}
        </div>
    </div>
</body>
</html>`;
  
  // 写入文件
  const outputPath = path.join(OUTPUT_DIR, `${taskId}.html`);
  fs.writeFileSync(outputPath, html);
  console.log(`✅ ${taskId}.html`);
}

console.log(`\\n🎉 生成完成！共 ${taskFiles.length} 个任务页面`);
console.log(`📁 输出目录：${OUTPUT_DIR}`);
