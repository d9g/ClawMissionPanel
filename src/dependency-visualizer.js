/**
 * 依赖关系可视化组件
 * 
 * 功能:
 * - 在任务详情页显示依赖关系
 * - 显示依赖状态
 * - 依赖图可视化
 */

// 依赖关系 HTML 模板
function generateDependencyHTML(taskId, dependencies) {
  const { parseTaskDependencies, canTaskStart, getTaskStatuses } = require('./dependency-parser');
  
  const taskDeps = parseTaskDependencies(`${taskId}.md`);
  const taskStatuses = getTaskStatuses();
  const canStart = canTaskStart(taskId, taskStatuses);
  
  let html = '';
  
  // 依赖任务部分
  if (taskDeps.dependencies.length > 0) {
    html += `
<div class="dependency-section">
  <h3>📋 依赖任务</h3>
  <div class="dependency-list">
`;
    
    for (const depId of taskDeps.dependencies) {
      const depStatus = taskStatuses[depId];
      const statusClass = getStatusClass(depStatus?.status);
      const statusIcon = getStatusIcon(depStatus?.status);
      
      html += `
    <div class="dependency-item ${statusClass}">
      <a href="/task-board/tasks/${depId}.html" class="dependency-link">${depId}</a>
      <span class="dependency-status">${statusIcon} ${depStatus?.status || '未知'}</span>
      ${!canStart.canStart && canStart.blockingTasks.find(b => b.taskId === depId) ? 
        '<span class="dependency-badge blocked">⛔ 阻塞中</span>' : ''}
    </div>
`;
    }
    
    html += `
  </div>
  ${!canStart.canStart ? `
  <div class="dependency-alert">
    ⚠️ 当前任务被 ${canStart.blockingTasks.length} 个依赖任务阻塞
  </div>
  ` : ''}
</div>
`;
  }
  
  // 被依赖任务部分
  if (taskDeps.dependents.length > 0) {
    html += `
<div class="dependency-section">
  <h3>🔗 被依赖任务</h3>
  <div class="dependency-list">
`;
    
    for (const depId of taskDeps.dependents) {
      const depStatus = taskStatuses[depId];
      const statusClass = getStatusClass(depStatus?.status);
      const statusIcon = getStatusIcon(depStatus?.status);
      
      html += `
    <div class="dependency-item ${statusClass}">
      <a href="/task-board/tasks/${depId}.html" class="dependency-link">${depId}</a>
      <span class="dependency-status">${statusIcon} ${depStatus?.status || '未知'}</span>
    </div>
`;
    }
    
    html += `
  </div>
</div>
`;
  }
  
  return html;
}

// 获取状态对应的 CSS 类
function getStatusClass(status) {
  const statusMap = {
    'COMPLETED': 'completed',
    'IN_PROGRESS': 'in-progress',
    'PENDING': 'pending',
    'BLOCKED': 'blocked',
    'CANCELLED': 'cancelled',
  };
  return statusMap[status] || 'unknown';
}

// 获取状态对应的图标
function getStatusIcon(status) {
  const iconMap = {
    'COMPLETED': '✅',
    'IN_PROGRESS': '🟠',
    'PENDING': '🟡',
    'BLOCKED': '🔴',
    'CANCELLED': '❌',
  };
  return iconMap[status] || '⚪';
}

// 生成依赖图 SVG
function generateDependencyGraphSVG(taskId) {
  const { buildDependencyGraph, getDependencyChain } = require('./dependency-parser');
  
  const graph = buildDependencyGraph();
  const chain = getDependencyChain(taskId);
  
  // 简单的 SVG 依赖图
  let svg = `<svg class="dependency-graph" viewBox="0 0 400 ${Math.max(200, chain.length * 60)}" xmlns="http://www.w3.org/2000/svg">`;
  
  // 绘制当前任务
  svg += `
    <rect x="150" y="20" width="100" height="40" rx="5" fill="#4CAF50" />
    <text x="200" y="45" text-anchor="middle" fill="white" font-size="12">${taskId}</text>
  `;
  
  // 绘制依赖链
  chain.forEach((depId, index) => {
    const y = 80 + index * 60;
    const isBlocking = true; // 简化处理
    
    // 绘制箭头
    svg += `
      <line x1="200" y1="${y - 20}" x2="200" y2="${y - 10}" stroke="#666" stroke-width="2" marker-end="url(#arrowhead)" />
    `;
    
    // 绘制依赖任务框
    const color = isBlocking ? '#f44336' : '#2196F3';
    svg += `
      <rect x="150" y="${y}" width="100" height="40" rx="5" fill="${color}" />
      <text x="200" y="${y + 25}" text-anchor="middle" fill="white" font-size="12">${depId}</text>
    `;
  });
  
  // 添加箭头标记
  svg += `
    <defs>
      <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
      </marker>
    </defs>
  </svg>
  `;
  
  return svg;
}

// 导出函数
module.exports = {
  generateDependencyHTML,
  generateDependencyGraphSVG,
  getStatusClass,
  getStatusIcon,
};
