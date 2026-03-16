/**
 * 任务列表渲染脚本
 * 负责在首页显示任务列表
 */

/**
 * 更新阻塞任务告警
 */
function updateBlockedAlert(data) {
  const container = document.getElementById('blocked-alert');
  const listContainer = document.getElementById('blocked-tasks-list');
  
  if (!container || !listContainer) return;
  
  const blocked = data.data?.blocked || [];
  
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
  
  // 进行中任务
  const inProgress = allTasks.filter(t => t.status === 'IN_PROGRESS');
  progressColumn.innerHTML = inProgress.map(task => createTaskCard(task)).join('') || 
    '<div class="empty-column">暂无任务</div>';
  
  // 等待中任务（PENDING 和 ASSIGNED）
  const pending = allTasks.filter(t => t.status === 'PENDING' || t.status === 'ASSIGNED');
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

/**
 * 更新统计显示
 */
function updateStatsDisplay(data) {
  // 更新顶部统计卡片
  const totalEl = document.getElementById('total-tasks');
  const blockedEl = document.getElementById('blocked-tasks');
  const progressEl = document.getElementById('progress-tasks');
  const pendingEl = document.getElementById('pending-tasks');
  const completedEl = document.getElementById('completed-tasks');
  
  if (totalEl) totalEl.textContent = data.data?.stats?.total || 0;
  if (blockedEl) blockedEl.textContent = data.data?.stats?.blocked || 0;
  if (progressEl) progressEl.textContent = data.data?.stats?.inProgress || 0;
  if (pendingEl) pendingEl.textContent = data.data?.stats?.pending || 0;
  if (completedEl) completedEl.textContent = (data.data?.all || []).filter(t => t.status === 'COMPLETED').length;
  
  console.log('[Dashboard] 统计显示已更新');
}
