/**
 * 任务管理系统 HTTP 服务
 * 版本：v1.0
 * 创建：2026-03-11
 * 开发：小云开发 💻
 */

const express = require('express');
const path = require('path');
const TaskManager = require('./task-manager');
const { TaskStateMachine, TASK_STATUS } = require('./state-machine');
const ApprovalManager = require('./approval-manager');
const AcceptanceManager = require('./acceptance-manager');
const RecordKeeper = require('./record-keeper');
const AgentPoller = require('./agent-poller');
const NotificationService = require('./notification-service');
const DebateManager = require('./debate-manager');
const TaskFlowController = require('./task-flow-controller');
const approvalPageRouter = require('./approval-page');
const { getAgentsStatus } = require('./agent-status');
const { getTaskStats } = require('./task-stats');

const app = express();
const PORT = process.env.TASK_BOARD_PORT || 3000;

// 初始化服务
const taskManager = new TaskManager();
const stateMachine = new TaskStateMachine();
const approvalManager = new ApprovalManager(taskManager);
const acceptanceManager = new AcceptanceManager(taskManager);
const recordKeeper = new RecordKeeper(taskManager);
const notificationService = new NotificationService();
const agentPoller = new AgentPoller();
const debateManager = new DebateManager();
const flowController = new TaskFlowController();

// 中间件
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// 审批确认页面路由
app.use('/approvals', approvalPageRouter);

// Agent 状态 API
app.get('/api/agents/status', async (req, res) => {
  try {
    const agents = await getAgentsStatus();
    res.json({ success: true, data: agents });
  } catch (error) {
    console.error('Agent 状态 API 错误:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 任务统计 API
app.get('/api/tasks/stats', async (req, res) => {
  try {
    const stats = await getTaskStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('任务统计 API 错误:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 任务状态流转 API（自动更新状态）
app.post('/api/tasks/:taskId/approve', async (req, res) => {
  try {
    const { action, comments, approved_by } = req.body;
    const taskId = req.params.taskId;
    
    let result;
    if (action === 'approve') {
      result = await flowController.approveTask(taskId, approved_by, comments);
    } else if (action === 'reject') {
      result = await flowController.rejectTask(taskId, approved_by, comments);
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/tasks/:taskId/claim', async (req, res) => {
  try {
    const { agent_id } = req.body;
    const taskId = req.params.taskId;
    
    const result = await flowController.claimTask(taskId, agent_id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/tasks/:taskId/complete', async (req, res) => {
  try {
    const { agent_id, deliverables } = req.body;
    const taskId = req.params.taskId;
    
    const result = await flowController.completeTask(taskId, agent_id, deliverables);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/tasks/:taskId/accept', async (req, res) => {
  try {
    const { acceptor, acceptance_report } = req.body;
    const taskId = req.params.taskId;
    
    const result = await flowController.acceptTask(taskId, acceptor, acceptance_report);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/tasks/:taskId/reject', async (req, res) => {
  try {
    const { rejector, reasons, suggestions } = req.body;
    const taskId = req.params.taskId;
    
    const result = await flowController.rejectAcceptance(taskId, rejector, reasons, suggestions);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 辩论会 API 路由
app.get('/api/debates/:debateId', async (req, res) => {
  try {
    const debate = await debateManager.getDebateDetails(req.params.debateId);
    res.json({ success: true, data: debate });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/debates', async (req, res) => {
  try {
    const debate = await debateManager.createDebate(req.body);
    res.json({ success: true, data: debate });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/debates/:debateId/proposals', async (req, res) => {
  try {
    const proposal = await debateManager.submitProposal({
      ...req.body,
      debate_id: req.params.debateId
    });
    res.json({ success: true, data: proposal });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/debates/:debateId/evaluate', async (req, res) => {
  try {
    const evaluation = await debateManager.evaluateProposals(req.params.debateId);
    res.json({ success: true, data: evaluation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API 路由

// 获取任务列表
app.get('/api/tasks', async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      assignee: req.query.assignee
    };
    
    const tasks = await taskManager.getTaskList(filters);
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取任务详情
app.get('/api/tasks/:taskId', async (req, res) => {
  try {
    const task = await taskManager.getTask(req.params.taskId);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 创建任务
app.post('/api/tasks', async (req, res) => {
  try {
    const taskData = req.body;
    await taskManager.createTask(taskData);
    
    // 记录创建
    await recordKeeper.record({
      task_id: taskData.task_id,
      stage: 'TASK_CREATED',
      stage_name: '任务创建',
      actor: taskData.requester,
      action: '创建任务',
      result: '成功',
      details: taskData
    });
    
    res.json({ success: true, data: taskData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新任务状态
app.patch('/api/tasks/:taskId/status', async (req, res) => {
  try {
    const { status, actor, reason } = req.body;
    const taskId = req.params.taskId;
    
    await stateMachine.transition(taskManager, taskId, status, actor, reason);
    
    res.json({ success: true, data: { task_id: taskId, status } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// 获取任务记录/时间线
app.get('/api/tasks/:taskId/records', async (req, res) => {
  try {
    const timeline = await recordKeeper.getTimeline(req.params.taskId);
    res.json({ success: true, data: timeline });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 审批相关
app.post('/api/tasks/:taskId/approvals', async (req, res) => {
  try {
    const { approval_type, approver, comments } = req.body;
    const approval = await approvalManager.createApproval(
      req.params.taskId,
      approval_type,
      approver,
      comments
    );
    res.json({ success: true, data: approval });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/approvals/:approvalId/approve', async (req, res) => {
  try {
    const { approved_by, comments } = req.body;
    await approvalManager.approve(req.params.approvalId, approved_by, comments);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/approvals/:approvalId/reject', async (req, res) => {
  try {
    const { rejected_by, comments } = req.body;
    await approvalManager.reject(req.params.approvalId, rejected_by, comments);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 验收相关
app.post('/api/tasks/:taskId/submit', async (req, res) => {
  try {
    const { submitter, deliverables } = req.body;
    await acceptanceManager.submitForAcceptance(
      req.params.taskId,
      submitter,
      deliverables
    );
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/tasks/:taskId/accept', async (req, res) => {
  try {
    const { acceptor, acceptance_report } = req.body;
    await acceptanceManager.accept(req.params.taskId, acceptor, acceptance_report);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/tasks/:taskId/reject', async (req, res) => {
  try {
    const { rejector, reasons, suggestions } = req.body;
    await acceptanceManager.reject(req.params.taskId, rejector, reasons, suggestions);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// 获取 Agent 列表
app.get('/api/agents', async (req, res) => {
  try {
    const agents = await new Promise((resolve, reject) => {
      taskManager.db.all('SELECT * FROM agents', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    res.json({ success: true, data: agents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// 启动服务
app.listen(PORT, () => {
  console.log('================================');
  console.log('🚀 任务管理系统 HTTP 服务已启动');
  console.log(`📍 端口：${PORT}`);
  console.log(`🌐 访问：http://localhost:${PORT}`);
  console.log('================================');
  
  // 启动 Agent 轮询服务
  agentPoller.start();
});

module.exports = app;
