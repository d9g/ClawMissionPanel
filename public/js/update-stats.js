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
  
  // 从 API 获取数据
  const stats = data.data?.stats || {};
  const allTasks = data.data?.all || [];
  
  if (totalEl) totalEl.textContent = stats.total || allTasks.length || 0;
  if (blockedEl) blockedEl.textContent = stats.blocked || 0;
  if (progressEl) progressEl.textContent = stats.inProgress || 0;
  if (pendingEl) pendingEl.textContent = stats.pending || 0;
  if (completedEl) completedEl.textContent = allTasks.filter(t => t.status === 'COMPLETED').length;
  
  console.log('[Dashboard] 统计显示已更新', stats);
}

/**
 * 更新任务统计（保留向后兼容）
 */
function updateTaskStats(stats) {
  updateStatsDisplay({ data: { stats, all: [] } });
}
