/**
 * 用户审批确认页面
 * 版本：v1.0
 * 创建：2026-03-11
 * 开发：小云开发 💻
 * 
 * 功能：用户盖章确认 HTTP 界面
 */

const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const router = express.Router();
const DB_PATH = path.join(__dirname, '../database/task-board.db');

/**
 * 获取审批确认页面
 */
router.get('/:taskId', async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const db = new sqlite3.Database(DB_PATH);
    
    // 获取任务详情
    const task = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM tasks WHERE task_id = ?', [taskId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!task) {
      return res.status(404).send('任务不存在');
    }
    
    // 获取审批记录
    const approvals = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM approvals WHERE task_id = ? ORDER BY created_at DESC', [taskId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    db.close();
    
    // 生成 HTML 页面
    const html = generateApprovalPage(task, approvals);
    res.send(html);
  } catch (error) {
    console.error('获取审批页面失败:', error);
    res.status(500).send('服务器错误');
  }
});

/**
 * 提交审批
 */
router.post('/:taskId/approve', async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const { action, comments, approved_by } = req.body;
    
    const db = new sqlite3.Database(DB_PATH);
    const approvalId = `APPR-${Date.now()}`;
    const status = action === 'approve' ? 'APPROVED' : 'REJECTED';
    
    // 创建审批记录
    await new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO approvals (
          approval_id, task_id, approval_type, status,
          approved_by, comments, approved_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;
      
      db.run(sql, [
        approvalId, taskId, 'task_details', status,
        approved_by || 'user', comments || ''
      ], function(err) {
        if (err) reject(err);
        else resolve({ approval_id: approvalId, status });
      });
    });
    
    // 更新任务状态
    if (action === 'approve') {
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE task_id = ?',
          ['AVAILABLE', taskId],
          function(err) {
            if (err) reject(err);
            else resolve({ changes: this.changes });
          }
        );
      });
    }
    
    db.close();
    
    res.json({
      success: true,
      approval_id: approvalId,
      status: status,
      message: action === 'approve' ? '审批通过' : '审批驳回'
    });
  } catch (error) {
    console.error('提交审批失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 生成审批确认页面 HTML
 */
function generateApprovalPage(task, approvals) {
  const approvalHistory = approvals.map(a => `
    <div class="approval-record ${a.status.toLowerCase()}">
      <div class="status">${a.status === 'APPROVED' ? '✅ 通过' : '❌ 驳回'}</div>
      <div class="info">
        <div>审批人：${a.approved_by}</div>
        <div>时间：${a.approved_at}</div>
        <div>意见：${a.comments || '无'}</div>
      </div>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>任务审批 - ${task.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    .approval-card {
      background: white;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 {
      color: #667eea;
      margin-bottom: 10px;
    }
    .task-info {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }
    .task-info h2 {
      color: #333;
      margin-bottom: 10px;
    }
    .meta {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-top: 15px;
    }
    .meta-item {
      background: white;
      padding: 10px;
      border-radius: 8px;
    }
    .meta-label {
      font-size: 12px;
      color: #666;
    }
    .meta-value {
      font-weight: bold;
      color: #333;
    }
    .priority {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-weight: bold;
    }
    .priority-P0 { background: #ff4757; color: white; }
    .priority-P1 { background: #ffa502; color: white; }
    .priority-P2 { background: #2ed573; color: white; }
    .priority-P3 { background: #1e90ff; color: white; }
    .actions {
      display: flex;
      gap: 15px;
      margin: 30px 0;
    }
    .btn {
      flex: 1;
      padding: 15px;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .btn:hover {
      transform: translateY(-2px);
    }
    .btn-approve {
      background: linear-gradient(135deg, #2ed573 0%, #17c964 100%);
      color: white;
    }
    .btn-reject {
      background: linear-gradient(135deg, #ff4757 0%, #ff3838 100%);
      color: white;
    }
    .btn-modify {
      background: linear-gradient(135deg, #ffa502 0%, #ff9500 100%);
      color: white;
    }
    .comments {
      margin-top: 20px;
    }
    .comments label {
      display: block;
      margin-bottom: 10px;
      font-weight: bold;
      color: #333;
    }
    textarea {
      width: 100%;
      min-height: 120px;
      padding: 15px;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      font-size: 14px;
      resize: vertical;
    }
    textarea:focus {
      outline: none;
      border-color: #667eea;
    }
    .approval-history {
      margin-top: 40px;
      padding-top: 30px;
      border-top: 2px solid #e0e0e0;
    }
    .approval-history h3 {
      margin-bottom: 20px;
      color: #667eea;
    }
    .approval-record {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 15px;
      margin-bottom: 15px;
      border-left: 4px solid #ccc;
    }
    .approval-record.approved {
      border-left-color: #2ed573;
    }
    .approval-record.rejected {
      border-left-color: #ff4757;
    }
    .approval-record .status {
      font-weight: bold;
      margin-bottom: 10px;
    }
    .approval-record .info {
      font-size: 14px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="approval-card">
      <h1>📋 任务审批</h1>
      <p>L4 权限 - 用户盖章确认</p>
      
      <div class="task-info">
        <h2>${task.title}</h2>
        <p>${task.description || '无描述'}</p>
        <div class="meta">
          <div class="meta-item">
            <div class="meta-label">优先级</div>
            <div class="meta-value">
              <span class="priority priority-${task.priority}">${task.priority}</span>
            </div>
          </div>
          <div class="meta-item">
            <div class="meta-label">执行者</div>
            <div class="meta-value">${task.assignee || '未分配'}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">请求者</div>
            <div class="meta-value">${task.requester || '用户'}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">预估工时</div>
            <div class="meta-value">${task.estimated_hours || 0} 小时</div>
          </div>
        </div>
      </div>
      
      <div class="actions">
        <button class="btn btn-approve" onclick="submitApproval('approve')">✅ 通过</button>
        <button class="btn btn-reject" onclick="submitApproval('reject')">❌ 驳回</button>
        <button class="btn btn-modify" onclick="submitApproval('modify')">✏️ 修改</button>
      </div>
      
      <div class="comments">
        <label for="comments">审批意见：</label>
        <textarea id="comments" placeholder="请输入审批意见..."></textarea>
      </div>
      
      <div class="approval-history">
        <h3>审批历史</h3>
        ${approvalHistory || '<p>暂无审批记录</p>'}
      </div>
    </div>
  </div>
  
  <script>
    async function submitApproval(action) {
      const comments = document.getElementById('comments').value;
      
      try {
        const response = await fetch('/task-board-api/approvals/${task.taskId}/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: action,
            comments: comments,
            approved_by: 'user'
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          alert(result.message);
          location.reload();
        } else {
          alert('审批失败：' + result.error);
        }
      } catch (error) {
        alert('提交失败：' + error.message);
      }
    }
  </script>
</body>
</html>
  `;
}

module.exports = router;
