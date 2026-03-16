/**
 * Agent 轮询服务
 * 版本：v1.0
 * 创建：2026-03-11
 * 开发：小云开发 💻
 * 
 * 功能：定时查询并领取分配给 Agent 的任务
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const TaskFlowController = require('./task-flow-controller');

const DB_PATH = path.join(__dirname, '../database/task-board.db');
const flowController = new TaskFlowController();

class AgentPoller {
  constructor() {
    this.db = new sqlite3.Database(DB_PATH);
    this.pollInterval = 5 * 60 * 1000; // 5 分钟
    this.agents = [
      'main',
      'xiaoyun-judge',
      'xiaoyun-recorder',
      'xiaoyun-dev',
      'xiaoyun-novel'
    ];
    this.isRunning = false;
  }

  /**
   * 启动轮询服务
   */
  start() {
    console.log('🤖 Agent 轮询服务启动');
    console.log(`   轮询间隔：${this.pollInterval / 1000}秒`);
    console.log(`   Agent 数量：${this.agents.length}`);
    
    this.isRunning = true;
    
    // 立即执行一次
    this.pollAllAgents();
    
    // 定时轮询
    setInterval(() => {
      if (this.isRunning) {
        this.pollAllAgents();
      }
    }, this.pollInterval);
  }

  /**
   * 停止轮询服务
   */
  stop() {
    this.isRunning = false;
    console.log('🤖 Agent 轮询服务停止');
  }

  /**
   * 轮询所有 Agent
   */
  async pollAllAgents() {
    console.log(`\n[轮询] 开始查询所有 Agent 任务...`);
    
    for (const agentId of this.agents) {
      try {
        await this.pollAgent(agentId);
      } catch (error) {
        console.error(`[轮询] Agent ${agentId} 查询失败:`, error.message);
      }
    }
  }

  /**
   * 轮询单个 Agent
   */
  async pollAgent(agentId) {
    // 查询分配给该 Agent 的可用任务
    const tasks = await this.getTasksForAgent(agentId);
    
    if (tasks.length === 0) {
      return;
    }

    // 筛选可用状态的任务
    const availableTasks = tasks.filter(t => t.status === 'AVAILABLE');
    
    if (availableTasks.length > 0) {
      console.log(`[轮询] Agent ${agentId} 发现 ${availableTasks.length} 个可领取任务`);
      
      // 领取第一个任务
      const task = availableTasks[0];
      await this.claimTask(task.task_id, agentId);
      
      // 发送通知
      await this.notifyTaskAssigned(agentId, task);
    }
  }

  /**
   * 获取 Agent 的任务
   */
  getTasksForAgent(agentId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM tasks 
        WHERE assignee = ? 
        AND status IN ('AVAILABLE', 'IN_PROGRESS', 'PENDING_REVIEW')
        ORDER BY priority, created_at
      `;
      
      this.db.all(sql, [agentId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * 领取任务（自动更新状态为 IN_PROGRESS）
   */
  async claimTask(taskId, agentId) {
    console.log(`[领取] Agent ${agentId} 领取任务 ${taskId}`);
    
    // 使用 TaskFlowController 自动更新状态
    const result = await flowController.claimTask(taskId, agentId);
    return result;
  }

  /**
   * 发送任务分配通知
   */
  async notifyTaskAssigned(agentId, task) {
    console.log(`[通知] 发送任务分配通知给 ${agentId}: ${task.title}`);
    
    // TODO: 集成通知服务
    // await notificationService.send(agentId, {
    //   type: 'TASK_ASSIGNED',
    //   task: task,
    //   timestamp: new Date()
    // });
  }

  /**
   * 关闭数据库连接
   */
  close() {
    this.stop();
    this.db.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const poller = new AgentPoller();
  poller.start();
  
  // 优雅退出
  process.on('SIGINT', () => {
    poller.close();
    process.exit(0);
  });
}

module.exports = AgentPoller;
