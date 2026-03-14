/**
 * 任务板首页仪表板脚本
 * 负责 Agent 状态展示和自动刷新
 */

// 配置
const API_AGENTS_STATUS = '/task-board-api/api/agents/status';
const API_TASKS_STATS = '/task-board-api/api/tasks/stats';

// 不自动轮询，用户手动刷新或浏览器刷新时加载
console.log('[Dashboard] 自动轮询已禁用，节省资源');

// 状态映射
const STATUS_LABELS = {
  working: '🟢 工作中',
  inactive: '🔴 未响应',
  idle: '🟡 待命',
  pending: '🔵 待开始',
  error: '⚫ 错误'
};

/**
 * 更新 Agent 状态卡片
 */
function updateAgentCards(agents) {
  console.log('[Dashboard] updateAgentCards 被调用');
  const container = document.querySelector('.agent-cards');
  if (!container) {
    console.error('[Dashboard] 找不到.agent-cards 元素，当前 HTML:', document.body.innerHTML.substring(0, 500));
    return;
  }
  
  console.log('[Dashboard] 找到 container，更新 Agent 卡片，数量:', agents.length);
  
  container.innerHTML = agents.map(agent => `
    <div class="agent-card ${agent.status}">
      <div class="agent-header">
        <span class="agent-name">${agent.name} ${agent.emoji}</span>
        <span class="agent-status">${STATUS_LABELS[agent.status] || agent.status}</span>
      </div>
      <div class="task-info">
        ${agent.currentTask ? `
          <a href="/task-board/tasks/${agent.currentTask}.html" target="_blank" class="task-id-link" title="点击查看详情">${agent.currentTask} 🔗</a>
          <div class="progress-bar">
            <div class="progress" style="width: ${agent.progress}%"></div>
          </div>
          <div class="progress-details">
            <span class="progress-text">${agent.progress}%</span>
            ${agent.remainingTime ? `
              <span class="time-estimate ${agent.remainingTime.overdue ? 'overdue' : ''}">
                ${agent.remainingTime.text}
              </span>
            ` : ''}
          </div>
          ${agent.estimatedComplete ? `
            <div class="estimated-complete">
              预计完成：${formatDateTime(agent.estimatedComplete)}
            </div>
          ` : ''}
          ${agent.overdue ? `<span class="overdue-badge">⚠️ 已延期 ${agent.overdueHours}小时</span>` : ''}
        ` : '<span class="task-id">无任务</span>'}
      </div>
    </div>
  `).join('');
  
  console.log('[Dashboard] Agent 卡片更新完成');
}

/**
 * 格式化日期时间
 */
function formatDateTime(dateStr) {
  try {
    const date = new Date(dateStr.replace(' ', 'T'));
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const dateToday = date.toISOString().split('T')[0];
    
    const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    
    if (dateToday === today) {
      return `今天 ${timeStr}`;
    } else {
      return `${dateToday.split('-')[2]}日 ${timeStr}`;
    }
  } catch (error) {
    return dateStr;
  }
}

/**
 * 更新延期任务告警区
 */
function updateOverdueAlerts(agents) {
  const container = document.querySelector('.overdue-alerts');
  if (!container) return;
  
  const overdueAgents = agents.filter(a => a.overdue);
  
  if (overdueAgents.length === 0) {
    container.style.display = 'none';
    return;
  }
  
  container.style.display = 'block';
  container.innerHTML = `
    <h3>⚠️ 延期任务 (${overdueAgents.length}个)</h3>
    ${overdueAgents.map(agent => `
      <div class="overdue-item">
        <a href="/task-board/tasks/${agent.currentTask}.html" target="_blank" class="task-id-link" title="点击查看详情">${agent.currentTask} 🔗</a>
        <span class="assignee">${agent.name} ${agent.emoji}</span>
        <span class="overdue-time">延期 ${agent.overdueHours}小时</span>
      </div>
    `).join('')}
  `;
}

/**
 * 更新任务统计
 */
function updateTaskStats(stats) {
  const container = document.querySelector('.stats-grid');
  if (!container) {
    console.error('[Dashboard] 找不到.stats-grid 元素');
    return;
  }
  
  console.log('[Dashboard] 更新任务统计');
  
  container.innerHTML = `
    <div class="stat-card completed">
      <div class="stat-value">${stats.completed}</div>
      <div class="stat-label">✅ 完成</div>
    </div>
    <div class="stat-card in-progress">
      <div class="stat-value">${stats.inProgress}</div>
      <div class="stat-label">🟠 进行中</div>
    </div>
    <div class="stat-card pending">
      <div class="stat-value">${stats.pending}</div>
      <div class="stat-label">⏸️ 待开始</div>
    </div>
    <div class="stat-card overdue">
      <div class="stat-value">${stats.overdue}</div>
      <div class="stat-label">⚠️ 延期</div>
    </div>
  `;
  
  console.log('[Dashboard] 任务统计更新完成');
}

/**
 * 更新最后更新时间
 */
function updateLastUpdated() {
  const el = document.getElementById('last-updated');
  if (!el) return;
  
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  el.textContent = `最后更新：${timeStr}`;
}

/**
 * 刷新数据
 */
async function refreshData() {
  console.log('[Dashboard] 开始刷新数据...');
  
  try {
    // 获取 Agent 状态
    console.log('[Dashboard] 请求 Agent 状态:', API_AGENTS_STATUS);
    const agentsRes = await fetch(API_AGENTS_STATUS);
    console.log('[Dashboard] Agent 状态响应:', agentsRes.status);
    
    if (!agentsRes.ok) {
      throw new Error(`Agent API 响应失败：${agentsRes.status}`);
    }
    
    const agentsData = await agentsRes.json();
    console.log('[Dashboard] Agent 数据:', agentsData);
    
    if (agentsData.success) {
      updateAgentCards(agentsData.data);
      updateOverdueAlerts(agentsData.data);
      console.log('[Dashboard] Agent 卡片已更新');
    } else {
      console.error('[Dashboard] Agent 数据失败:', agentsData.error);
    }
    
    // 获取任务统计
    console.log('[Dashboard] 请求任务统计:', API_TASKS_STATS);
    const statsRes = await fetch(API_TASKS_STATS);
    console.log('[Dashboard] 任务统计响应:', statsRes.status);
    
    if (!statsRes.ok) {
      throw new Error(`任务统计 API 响应失败：${statsRes.status}`);
    }
    
    const statsData = await statsRes.json();
    console.log('[Dashboard] 任务统计:', statsData);
    
    if (statsData.success) {
      updateTaskStats(statsData.data);
      console.log('[Dashboard] 任务统计已更新');
    } else {
      console.error('[Dashboard] 任务统计失败:', statsData.error);
    }
    
    // 更新最后更新时间
    updateLastUpdated();
    
    // 隐藏 loading
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
      loadingEl.style.display = 'none';
    }
    
    console.log('[Dashboard] ✅ 数据刷新成功');
  } catch (error) {
    console.error('[Dashboard] ❌ 数据刷新失败:', error);
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
      loadingEl.innerHTML = `<div style="color:red; padding:20px;">
        <h3>❌ 数据加载失败</h3>
        <p>错误：${error.message}</p>
        <p>请尝试：</p>
        <ol>
          <li>按 <strong>Ctrl+F5</strong> (Windows) 或 <strong>Cmd+Shift+R</strong> (Mac) 强制刷新</li>
          <li>清除浏览器缓存后重试</li>
          <li>检查网络连接</li>
        </ol>
      </div>`;
      loadingEl.style.display = 'block';
    }
    alert(`数据加载失败：${error.message}\n\n请按 Ctrl+F5 强制刷新页面`);
  }
}

/**
 * 初始化
 */
function init() {
  console.log('[Dashboard] 初始化开始');
  console.log('[Dashboard] DOM 状态:', document.readyState);
  console.log('[Dashboard] 自动轮询已禁用，节省资源');
  
  // 检查关键元素是否存在
  console.log('[Dashboard] .agent-cards 存在:', !!document.querySelector('.agent-cards'));
  console.log('[Dashboard] .stats-grid 存在:', !!document.querySelector('.stats-grid'));
  
  // 显示页面加载提示
  const loadingEl = document.getElementById('loading');
  if (loadingEl) {
    loadingEl.textContent = '正在加载数据...';
    loadingEl.style.display = 'block';
  }
  
  // 页面加载时刷新一次
  console.log('[Dashboard] 准备加载数据...');
  refreshData();
  
  console.log('[Dashboard] ✅ 初始化完成');
  console.log('[Dashboard] 数据已加载，需要更新时请点击刷新按钮或刷新浏览器');
}

// 添加全局错误捕获
window.addEventListener('error', (e) => {
  console.error('[Dashboard] 全局错误:', e.message);
  console.error('[Dashboard] 错误详情:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('[Dashboard] 未处理的 Promise 拒绝:', e.reason);
});

// DOM 加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
