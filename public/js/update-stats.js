/**
 * 更新统计显示 - 工具函数
 * v3.0 - 统一解析逻辑，避免与 dashboard.js 冲突
 */

/**
 * 从 API 数据中提取统计数据
 */
function extractStats(data) {
  // 数据格式：{ success: true, data: { stats: { stats: {...} }, all: [...] } }
  const statsData = data.data?.stats?.stats || data.data?.stats || data.stats || {};
  const allTasks = data.data?.all || [];
  
  console.log('[UpdateStats] 解析统计数据:', statsData);
  
  return {
    total: statsData.total || allTasks.length || 0,
    blocked: statsData.blocked || 0,
    inProgress: statsData.in_progress || statsData.inProgress || 0,
    pending: statsData.pending || 0,
    completed: statsData.completed || allTasks.filter(t => t.status === 'COMPLETED').length || 0,
    reviewApproved: statsData.review_approved || 0,
    reviewing: statsData.reviewing || 0
  };
}

// 注意：updateStatsDisplay 函数在 dashboard.js 中统一定义
// 此文件仅提供 extractStats 工具函数

/**
 * 更新任务统计（保留向后兼容）
 */
function updateTaskStats(stats) {
  updateStatsDisplay({ data: { stats: { stats: stats }, all: [] } });
}