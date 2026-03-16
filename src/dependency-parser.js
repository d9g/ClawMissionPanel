#!/usr/bin/env node

/**
 * 任务依赖解析器
 * 
 * 功能:
 * - 解析任务文件中的依赖关系
 * - 构建依赖图
 * - 检测循环依赖
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  tasksDir: '/home/admin/.openclaw/workspace/task-board/tasks',
};

/**
 * 解析单个任务文件的依赖关系
 */
function parseTaskDependencies(filename) {
  const filepath = path.join(CONFIG.tasksDir, filename);
  const content = fs.readFileSync(filepath, 'utf8');
  
  const taskId = filename.replace('.md', '');
  const dependencies = [];
  const dependents = [];
  
  // 解析依赖任务 (depends_on)
  const dependsMatch = content.match(/\*\*依赖任务\*\*[:：]?\s*([^\n]+)/i);
  if (dependsMatch) {
    const deps = dependsMatch[1]
      .split(/[,,]/)
      .map(d => d.trim())
      .filter(d => d.startsWith('TASK-'));
    dependencies.push(...deps);
  }
  
  // 解析被依赖任务 (blocked_by / 被依赖)
  const blockedByMatch = content.match(/\*\*被依赖\*\*[:：]?\s*([^\n]+)/i);
  if (blockedByMatch) {
    const deps = blockedByMatch[1]
      .split(/[,,]/)
      .map(d => d.trim())
      .filter(d => d.startsWith('TASK-'));
    dependents.push(...deps);
  }
  
  // 解析前置任务 (前置任务 / prerequisites)
  const prereqMatch = content.match(/\*\*(?:前置任务 | 先决条件)\*\*[:：]?\s*([^\n]+)/i);
  if (prereqMatch) {
    const deps = prereqMatch[1]
      .split(/[,,]/)
      .map(d => d.trim())
      .filter(d => d.startsWith('TASK-'));
    dependencies.push(...deps);
  }
  
  // 解析后置任务 (后置任务 / 后续任务)
  const postreqMatch = content.match(/\*\*(?:后置任务 | 后续任务)\*\*[:：]?\s*([^\n]+)/i);
  if (postreqMatch) {
    const deps = postreqMatch[1]
      .split(/[,,]/)
      .map(d => d.trim())
      .filter(d => d.startsWith('TASK-'));
    dependents.push(...deps);
  }
  
  return {
    taskId,
    filename,
    dependencies: [...new Set(dependencies)], // 去重
    dependents: [...new Set(dependents)],
  };
}

/**
 * 解析所有任务的依赖关系
 */
function parseAllDependencies() {
  const files = fs.readdirSync(CONFIG.tasksDir);
  const taskFiles = files.filter(f => f.startsWith('TASK-') && f.endsWith('.md'));
  
  const dependencies = {};
  
  for (const file of taskFiles) {
    const parsed = parseTaskDependencies(file);
    dependencies[parsed.taskId] = parsed;
  }
  
  return dependencies;
}

/**
 * 构建依赖图
 */
function buildDependencyGraph(dependencies = null) {
  if (!dependencies) {
    dependencies = parseAllDependencies();
  }
  
  const graph = {
    nodes: Object.keys(dependencies),
    edges: [],
    adjacencyList: {},
  };
  
  // 初始化邻接表
  for (const taskId of graph.nodes) {
    graph.adjacencyList[taskId] = [];
  }
  
  // 构建边和邻接表
  for (const [taskId, data] of Object.entries(dependencies)) {
    for (const dep of data.dependencies) {
      graph.edges.push({ from: dep, to: taskId });
      if (graph.adjacencyList[dep]) {
        graph.adjacencyList[dep].push(taskId);
      }
    }
  }
  
  return graph;
}

/**
 * 检测循环依赖 (DFS)
 */
function detectCircularDependencies(dependencies = null) {
  if (!dependencies) {
    dependencies = parseAllDependencies();
  }
  
  const graph = buildDependencyGraph(dependencies);
  const visited = new Set();
  const recursionStack = new Set();
  const cycles = [];
  
  function dfs(node, path = []) {
    if (recursionStack.has(node)) {
      // 发现循环依赖
      const cycleStart = path.indexOf(node);
      const cycle = path.slice(cycleStart).concat(node);
      cycles.push(cycle);
      return true;
    }
    
    if (visited.has(node)) {
      return false;
    }
    
    visited.add(node);
    recursionStack.add(node);
    path.push(node);
    
    const neighbors = graph.adjacencyList[node] || [];
    for (const neighbor of neighbors) {
      dfs(neighbor, path);
    }
    
    path.pop();
    recursionStack.delete(node);
    return false;
  }
  
  for (const node of graph.nodes) {
    if (!visited.has(node)) {
      dfs(node);
    }
  }
  
  return {
    hasCircular: cycles.length > 0,
    cycles,
    count: cycles.length,
  };
}

/**
 * 检查任务是否可以开始 (所有依赖已完成)
 */
function canTaskStart(taskId, taskStatuses = null) {
  const dependencies = parseAllDependencies();
  const task = dependencies[taskId];
  
  if (!task || task.dependencies.length === 0) {
    return { canStart: true, blockingTasks: [] };
  }
  
  // 获取所有任务状态
  if (!taskStatuses) {
    taskStatuses = getTaskStatuses();
  }
  
  const blockingTasks = [];
  
  for (const depId of task.dependencies) {
    const depStatus = taskStatuses[depId];
    if (!depStatus) {
      // 依赖任务不存在
      blockingTasks.push({ taskId: depId, reason: '任务不存在' });
    } else if (depStatus.status !== 'COMPLETED') {
      // 依赖任务未完成
      blockingTasks.push({
        taskId: depId,
        status: depStatus.status,
        reason: `任务状态：${depStatus.status}`,
      });
    }
  }
  
  return {
    canStart: blockingTasks.length === 0,
    blockingTasks,
  };
}

/**
 * 获取所有任务状态
 */
function getTaskStatuses() {
  const files = fs.readdirSync(CONFIG.tasksDir);
  const statuses = {};
  
  for (const file of files) {
    if (file.startsWith('TASK-') && file.endsWith('.md')) {
      const content = fs.readFileSync(path.join(CONFIG.tasksDir, file), 'utf8');
      const taskId = file.replace('.md', '');
      
      // 提取状态 (支持 **状态** 格式和 emoji 前缀)
      const statusMatch = content.match(/\*\*状态\*\*[:：]\s*(?:[🟢✅🟡🔴⏳]*\s*)?(\w+)/i);
      const status = statusMatch ? statusMatch[1].toUpperCase() : 'UNKNOWN';
      
      statuses[taskId] = { status, filename: file };
    }
  }
  
  return statuses;
}

/**
 * 获取任务的依赖链 (所有前置任务)
 */
function getDependencyChain(taskId, visited = new Set()) {
  const dependencies = parseAllDependencies();
  const task = dependencies[taskId];
  
  if (!task || visited.has(taskId)) {
    return [];
  }
  
  visited.add(taskId);
  const chain = [];
  
  for (const depId of task.dependencies) {
    chain.push(depId);
    const subChain = getDependencyChain(depId, visited);
    chain.push(...subChain);
  }
  
  return [...new Set(chain)];
}

// 导出函数
module.exports = {
  parseTaskDependencies,
  parseAllDependencies,
  buildDependencyGraph,
  detectCircularDependencies,
  canTaskStart,
  getTaskStatuses,
  getDependencyChain,
};

// CLI 模式
if (require.main === module) {
  console.log('🔍 任务依赖解析器\n');
  
  const deps = parseAllDependencies();
  console.log(`📊 解析了 ${Object.keys(deps).length} 个任务\n`);
  
  // 显示有依赖的任务
  console.log('📋 有依赖关系的任务:');
  for (const [taskId, data] of Object.entries(deps)) {
    if (data.dependencies.length > 0 || data.dependents.length > 0) {
      console.log(`\n${taskId}:`);
      if (data.dependencies.length > 0) {
        console.log(`  依赖：${data.dependencies.join(', ')}`);
      }
      if (data.dependents.length > 0) {
        console.log(`  被依赖：${data.dependents.join(', ')}`);
      }
    }
  }
  
  // 检测循环依赖
  const circular = detectCircularDependencies();
  console.log(`\n🔄 循环依赖检测：${circular.hasCircular ? '❌ 发现 ' + circular.count + ' 个循环' : '✅ 无循环'}`);
  if (circular.cycles.length > 0) {
    console.log('循环列表:');
    circular.cycles.forEach((cycle, i) => {
      console.log(`  ${i + 1}. ${cycle.join(' → ')}`);
    });
  }
}
