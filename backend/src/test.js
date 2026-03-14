/**
 * Phase 1 基础框架 - 测试脚本
 * 版本：v1.0
 * 创建：2026-03-11
 * 开发：小云开发 💻
 */

const TaskManager = require('./task-manager');
const { TaskStateMachine } = require('./state-machine');
const ApprovalManager = require('./approval-manager');
const AcceptanceManager = require('./acceptance-manager');
const RecordKeeper = require('./record-keeper');

async function runTests() {
  console.log('🧪 Phase 1 基础框架测试');
  console.log('================================\n');

  const taskManager = new TaskManager();
  const stateMachine = new TaskStateMachine();
  const approvalManager = new ApprovalManager(taskManager);
  const acceptanceManager = new AcceptanceManager(taskManager);
  const recordKeeper = new RecordKeeper(taskManager);

  try {
    // 测试 1: 创建任务
    console.log('[测试 1] 创建任务...');
    const taskData = {
      task_id: 'TASK-TEST-001',
      title: '测试任务 - 基础框架验证',
      description: '验证 Phase 1 基础框架功能',
      category: 'development',
      priority: 'P0',
      requester: '用户',
      assignee: 'xiaoyun-dev',
      estimated_hours: 5
    };

    await taskManager.createTask(taskData);
    console.log('✅ 任务创建成功\n');

    // 测试 2: 读取任务
    console.log('[测试 2] 读取任务...');
    const task = await taskManager.getTask('TASK-TEST-001');
    console.log('✅ 任务读取成功:', task.title, '\n');

    // 测试 3: 状态流转
    console.log('[测试 3] 状态流转测试...');
    await stateMachine.transition(taskManager, 'TASK-TEST-001', 'PENDING_APPROVAL', '小云');
    console.log('✅ 状态流转成功：DRAFT → PENDING_APPROVAL\n');

    // 测试 4: 创建审批
    console.log('[测试 4] 创建审批...');
    const approval = await approvalManager.createApproval('TASK-TEST-001', 'requirement', '用户');
    console.log('✅ 审批创建成功:', approval.approval_id, '\n');

    // 测试 5: 审批通过
    console.log('[测试 5] 审批通过...');
    await approvalManager.approve(approval.approval_id, '用户', '方案可行');
    await stateMachine.transition(taskManager, 'TASK-TEST-001', 'AVAILABLE', '小云');
    console.log('✅ 审批通过，任务状态：AVAILABLE\n');

    // 测试 6: 领取任务
    console.log('[测试 6] 领取任务...');
    await stateMachine.transition(taskManager, 'TASK-TEST-001', 'IN_PROGRESS', 'xiaoyun-dev');
    console.log('✅ 任务领取成功，状态：IN_PROGRESS\n');

    // 测试 7: 提交验收
    console.log('[测试 7] 提交验收...');
    await acceptanceManager.submitForAcceptance('TASK-TEST-001', 'xiaoyun-dev', {
      code: 'task-manager.js',
      tests: 'passed'
    });
    console.log('✅ 验收提交成功，状态：PENDING_REVIEW\n');

    // 测试 8: 验收通过
    console.log('[测试 8] 验收通过...');
    await acceptanceManager.accept('TASK-TEST-001', '小云', {
      quality: 'excellent',
      documentation: 'complete'
    });
    console.log('✅ 验收通过，状态：COMPLETED\n');

    // 测试 9: 获取记录
    console.log('[测试 9] 获取任务记录...');
    const records = await recordKeeper.getRecords('TASK-TEST-001');
    console.log('✅ 获取记录成功，共', records.length, '条记录\n');

    // 测试 10: 获取时间线
    console.log('[测试 10] 获取任务时间线...');
    const timeline = await recordKeeper.getTimeline('TASK-TEST-001');
    console.log('✅ 时间线获取成功:');
    timeline.forEach(item => {
      console.log(`  ${item.time} - ${item.stage} - ${item.actor} - ${item.action}`);
    });

    console.log('\n================================');
    console.log('✅ 所有测试通过！');
    console.log('================================\n');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error(error.stack);
  } finally {
    taskManager.close();
  }
}

// 运行测试
runTests();
