/**
 * 任务板首页仪表板脚本
 * 负责 Agent 状态展示和自动刷新
 */

// 配置 - 使用正确的 API 路径
const API_AGENTS_STATUS = '/task-board/api/agents/status';
const API_TASKS_STATS = '/task-board/api/tasks/stats';
const API_TASKS_ALL = '/task-board/api/tasks/blocked/all';
const API_DASHBOARD_DATA = '/task-board/api/dashboard/data';

// 不自动轮询，用户手动刷新或浏览器刷新时加载
console.log('[Dashboard] 自动轮询已禁用，节省资源');

// 状态映射
const STATUS_LABELS = {
  working: '🟢 工作中',
  inactive: '🔴 未响应',
  idle: '🟡 待命',
  pending: '🔵 待开始',
  error: '⚫ 错误',
  available: '🟡 可用',
  assigned: '🔵 已分配',
  in_progress: '🟢 进行中',
  completed: '✅ 已完成'
};

/**
 * 更新 Agent 状态卡片
 */
function updateAgentCards(agents) {
  console.log('[Dashboard] updateAgentCards 被调用，Agent 数量:', agents ? agents.length : 0);
  const container = document.querySelector('.agent-cards');
  if (!container) {
    console.error('[Dashboard] 找不到.agent-cards 元素');
    return;
  }
  
  if (!agents || agents.length === 0) {
    console.log('[Dashboard] 无 Agent 数据');
    return;
  }
  
  container.innerHTML = agents.map(agent => `
    <div class="agent-card ${agent.status || 'idle'}">
      <div class="agent-header">
        <span class="agent-name">${agent.name || agent.id || 'Unknown'}</span>
        <span class="agent-status">${STATUS_LABELS[agent.status] || agent.status || '🟡 待命'}</span>
      </div>
      <div class="task-info">
        ${agent.current_task_id || agent.currentTask ? `
          <span class="task-id">📋 ${agent.current_task_id || agent.currentTask}</span>
        ` : '<span class="task-id">无任务</span>'}
      </div>
    </div>
  `).join('');
  
  console.log('[Dashboard] Agent 卡片已更新');
}

/**
 * 更新统计显示
 */
function updateStatsDisplay(data) {
  console.log('[Dashboard] updateStatsDisplay 被调用');
  
  // 更新顶部统计卡片
  const totalEl = document.getElementById('total-tasks');
  const blockedEl = document.getElementById('blocked-tasks');
  const progressEl = document.getElementById('progress-tasks');
  const pendingEl = document.getElementById('pending-tasks');
  const completedEl = document.getElementById('completed-tasks');
  
  // 从 API 获取数据
  const stats = data.data?.stats || data.stats || {};
  const allTasks = data.data?.all || [];
  
  if (totalEl) totalEl.textContent = stats.total || allTasks.length || 0;
  if (blockedEl) blockedEl.textContent = stats.blocked || 0;
  if (progressEl) progressEl.textContent = stats.inProgress || stats.in_progress || 0;
  if (pendingEl) pendingEl.textContent = stats.pending || 0;
  if (completedEl) completedEl.textContent = stats.completed || allTasks.filter(t => t.status === 'COMPLETED').length;
  
  console.log('[Dashboard] 统计显示已更新', stats);
}

/**
 * 更新任务统计（保留向后兼容）
 */
function updateTaskStats(stats) {
  updateStatsDisplay({ data: { stats, all: [] } });
}

/**
 * 从 API 加载数据
 */
async function loadDashboardData() {
  try {
    console.log('[Dashboard] 开始加载 Dashboard 数据...');
    const response = await fetch(API_DASHBOARD_DATA + '?t=' + Date.now());
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    console.log('[Dashboard] 数据加载成功', data);
    return data;
  } catch (error) {
    console.error('[Dashboard] 数据加载失败:', error);
    return null;
  }
}

/**
 * 初始化
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log('[Dashboard] DOMContentLoaded');
  
  // 延迟加载，确保页面已渲染
  setTimeout(async () => {
    const data = await loadDashboardData();
    
    if (data && data.data) {
      // 更新 Agent 卡片
      const agents = data.data.agents?.details ? Object.values(data.data.agents.details) : [];
      updateAgentCards(agents);
      
      // 更新统计
      updateStatsDisplay(data);
    }
  }, 500);
});
