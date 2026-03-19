/**
 * 任务板首页仪表板脚本
 */

// 配置
const API_DASHBOARD_DATA = '/task-board/api/dashboard/data';

// 状态映射
const STATUS_LABELS = {
  idle: '🟡 待命',
  in_progress: '🟢 进行中',
  error: '⚫ 错误',
  available: '🟡 可用',
  assigned: '🔵 已分配',
  completed: '✅ 已完成'
};

/**
 * 更新 Agent 状态卡片
 */
function updateAgentCards(agents) {
  const container = document.querySelector('.agent-cards');
  if (!container) return;
  
  if (!agents || agents.length === 0) return;
  
  container.innerHTML = agents.map(agent => `
    <div class="agent-card ${agent.status || 'idle'}">
      <div class="agent-header">
        <span class="agent-name">${agent.name || agent.id || 'Unknown'}</span>
        <span class="agent-status">${STATUS_LABELS[agent.status] || '🟡 待命'}</span>
      </div>
      <div class="task-info">
        ${agent.current_task_id || agent.currentTask ? `
          <span class="task-id">📋 ${agent.current_task_id || agent.currentTask}</span>
        ` : '<span class="task-id">无任务</span>'}
      </div>
    </div>
  `).join('');
}

/**
 * 更新统计显示（统一定义，避免冲突）
 * v3.0 - 正确解析嵌套的 stats 结构
 */
function updateStatsDisplay(data) {
  // 数据格式：{ success: true, data: { stats: { stats: {...} }, agents: {...}, all: [...] } }
  const statsData = data.data?.stats?.stats || data.data?.stats || data.stats || {};
  const allTasks = data.data?.all || [];
  
  const totalEl = document.getElementById('total-tasks');
  const blockedEl = document.getElementById('blocked-tasks');
  const progressEl = document.getElementById('progress-tasks');
  const pendingEl = document.getElementById('pending-tasks');
  const completedEl = document.getElementById('completed-tasks');
  const acceptanceEl = document.getElementById('acceptance-tasks');
  
  // 计算各状态任务数
  const stats = {
    total: statsData.total || allTasks.length || 0,
    blocked: statsData.blocked || allTasks.filter(t => t.status === 'BLOCKED').length || 0,
    inProgress: statsData.in_progress || statsData.inProgress || allTasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'REVIEWING').length || 0,
    pending: statsData.pending || allTasks.filter(t => t.status === 'PENDING' || t.status === 'AVAILABLE').length || 0,
    completed: statsData.completed || allTasks.filter(t => t.status === 'COMPLETED').length || 0,
    reviewApproved: statsData.review_approved || allTasks.filter(t => t.status === 'REVIEW_APPROVED').length || 0
  };
  
  console.log('[Dashboard] 统计数据:', stats);
  
  // 更新 DOM
  if (totalEl) totalEl.textContent = stats.total;
  if (blockedEl) blockedEl.textContent = stats.blocked;
  if (progressEl) progressEl.textContent = stats.inProgress;
  if (pendingEl) pendingEl.textContent = stats.pending;
  if (completedEl) completedEl.textContent = stats.completed;
  if (acceptanceEl) acceptanceEl.textContent = stats.reviewApproved;
  
  // 更新最后更新时间
  const lastUpdatedEl = document.getElementById('last-updated');
  if (lastUpdatedEl) {
    const now = new Date();
    lastUpdatedEl.querySelector('span').textContent = `最后更新：${now.toLocaleTimeString('zh-CN')}`;
  }
}

/**
 * 从 API 加载数据
 */
async function loadDashboardData() {
  try {
    const response = await fetch(API_DASHBOARD_DATA + '?t=' + Date.now());
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('[Dashboard] 数据加载失败:', error);
    return null;
  }
}

/**
 * 初始化
 */
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(async () => {
    const data = await loadDashboardData();
    
    if (data && data.data) {
      console.log('[Dashboard] 数据加载成功:', data);
      
      // 更新 Agent 卡片
      const agents = data.data.agents?.details ? Object.values(data.data.agents.details) : [];
      updateAgentCards(agents);
      
      // 更新统计
      updateStatsDisplay(data);
      
      // 更新任务列表
      if (typeof updateTaskLists === 'function') {
        updateTaskLists(data);
      }
      
      // 更新阻塞告警
      if (typeof updateBlockedAlert === 'function') {
        updateBlockedAlert(data);
      }
    }
  }, 500);
});
