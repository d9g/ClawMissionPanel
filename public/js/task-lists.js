/**
 * 任务列表渲染脚本
 * v2.0 - 适配统一服务 API 格式
 */

/**
 * 更新阻塞任务告警
 */
function updateBlockedAlert(data) {
  const container = document.getElementById('blocked-alert');
  const listContainer = document.getElementById('blocked-tasks-list');
  
  if (!container || !listContainer) return;
  
  const allTasks = data.data?.all || [];
  const blocked = allTasks.filter(t => t.status === 'BLOCKED' || t.status === 'ON_HOLD');
  
  if (blocked.length === 0) {
    container.style.display = 'none';
    return;
  }
  
  container.style.display = 'block';
  listContainer.innerHTML = blocked.map(task => `
    <div class="blocked-item">
      <a href="/task-board/tasks/${task.task_id}.html" target="_blank">
        ${task.task_id} - ${task.title.substring(0, 50)}${task.title.length > 50 ? '...' : ''}
      </a>
      <div class="blocked-reason">
        🔒 ${task.blocked_reason || '未知原因'} | 执行者：${task.assignee || '未分配'}
      </div>
    </div>
  `).join('');
}

/**
 * 更新任务列表
 */
function updateTaskLists(data) {
  const progressColumn = document.getElementById('progress-column');
  const pendingColumn = document.getElementById('pending-column');
  const completedColumn = document.getElementById('completed-column');
  
  if (!progressColumn || !pendingColumn || !completedColumn) return;
  
  const allTasks = data.data?.all || [];
  
  console.log('[TaskLists] 任务列表:', allTasks.length, '个任务');
  
  // 进行中任务
  const inProgress = allTasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'REVIEWING');
  progressColumn.innerHTML = inProgress.map(task => createTaskCard(task)).join('') || 
    '<div class="empty-column">暂无任务</div>';
  
  // 等待中任务（PENDING 和 AVAILABLE）
  const pending = allTasks.filter(t => t.status === 'PENDING' || t.status === 'AVAILABLE');
  pendingColumn.innerHTML = pending.map(task => createTaskCard(task)).join('') || 
    '<div class="empty-column">暂无任务</div>';
  
  // 已完成任务
  const completed = allTasks.filter(t => t.status === 'COMPLETED');
  completedColumn.innerHTML = completed.map(task => createTaskCard(task)).join('') || 
    '<div class="empty-column">暂无任务</div>';
}

/**
 * 创建任务卡片
 */
function createTaskCard(task) {
  const statusColors = {
    'IN_PROGRESS': '#f39c12',
    'ASSIGNED': '#2ecc71',
    'PENDING': '#3498db',
    'COMPLETED': '#27ae60'
  };
  
  const color = statusColors[task.status] || '#95a5a6';
  
  return `
    <div class="task-card" style="border-left-color: ${color}">
      <div class="task-title">
        <a href="/task-board/tasks/${task.task_id}.html" target="_blank" style="color: #333; text-decoration: none;">
          ${task.task_id}
        </a>
      </div>
      <div class="task-title" style="font-size: 14px; margin: 8px 0;">
        ${task.title.substring(0, 40)}${task.title.length > 40 ? '...' : ''}
      </div>
      <div class="task-meta">
        <span class="priority priority-${task.priority}">${task.priority}</span>
        <span>${task.assignee || '未分配'}</span>
      </div>
    </div>
  `;
}

// 注意：updateStatsDisplay 函数已移到 dashboard.js 统一定义
// 避免多个文件定义同名函数造成冲突
