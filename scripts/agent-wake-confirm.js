#!/usr/bin/env node
/**
 * Agent 唤醒确认服务 v1.0
 * 
 * 功能：
 * 1. 发送唤醒消息
 * 2. 立即检查 Agent 状态
 * 3. 如果仍然 idle，判定发送失败
 * 4. 自动重试或告警
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const OPENCLAW_CMD = '/home/admin/.local/share/pnpm/openclaw';
const WORKSPACE = '/home/admin/.openclaw/workspace';
const API_STATUS = 'http://localhost:3000/api/agents/status';

// 配置
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 秒
const STATUS_CHECK_DELAY = 3000; // 3 秒后检查状态

/**
 * 执行 shell 命令
 */
function execCmd(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout: 60000 }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

/**
 * 获取 Agent 状态
 */
async function getAgentStatus(agentId) {
  try {
    const stdout = await execCmd(`curl -s "${API_STATUS}"`);
    const data = JSON.parse(stdout);
    
    if (data.success && data.data) {
      const agent = data.data.find(a => a.id === agentId);
      if (agent) {
        return {
          id: agent.id,
          status: agent.status,
          currentTask: agent.currentTask,
          progress: agent.progress,
          statusText: agent.statusText
        };
      }
    }
    return null;
  } catch (error) {
    console.error(`获取 Agent 状态失败:`, error.message);
    return null;
  }
}

/**
 * 发送唤醒消息
 */
async function sendWakeMessage(agentId, message) {
  const sessionId = `${agentId}-wake-${Date.now()}`;
  const escapedMessage = message.replace(/"/g, '\\"');
  
  const cmd = `${OPENCLAW_CMD} agent --agent ${agentId} --message "${escapedMessage}" --session-id "${sessionId}" 2>&1`;
  
  console.log(`📤 [${agentId}] 发送唤醒消息...`);
  console.log(`   Session: ${sessionId}`);
  console.log(`   消息：${message.substring(0, 50)}...`);
  
  try {
    const output = await execCmd(cmd);
    console.log(`✅ [${agentId}] 消息发送成功`);
    return { success: true, sessionId, output };
  } catch (error) {
    console.error(`❌ [${agentId}] 消息发送失败:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 等待并检查 Agent 状态
 */
async function waitForAgentResponse(agentId, expectedStatus = 'busy') {
  console.log(`⏳ [${agentId}] 等待 ${STATUS_CHECK_DELAY / 1000}秒后检查状态...`);
  
  await new Promise(resolve => setTimeout(resolve, STATUS_CHECK_DELAY));
  
  const status = await getAgentStatus(agentId);
  
  if (!status) {
    console.error(`❌ [${agentId}] 无法获取状态`);
    return { success: false, reason: '无法获取状态' };
  }
  
  console.log(`📊 [${agentId}] 当前状态:`, status);
  
  // 检查是否从 idle 变为非 idle
  if (status.status === 'idle' && status.progress === 100) {
    console.error(`❌ [${agentId}] 仍然空闲！消息可能未送达`);
    return { 
      success: false, 
      reason: 'Agent 仍然 idle',
      status 
    };
  }
  
  console.log(`✅ [${agentId}] Agent 已激活`);
  return { success: true, status };
}

/**
 * 带确认的唤醒 Agent
 */
async function wakeAgentWithConfirm(agentId, message, options = {}) {
  const {
    maxRetries = MAX_RETRIES,
    retryDelay = RETRY_DELAY
  } = options;
  
  console.log(`\n🔔 [${agentId}] 开始唤醒流程...`);
  
  // 获取初始状态
  const initialStatus = await getAgentStatus(agentId);
  console.log(`📊 [${agentId}] 初始状态:`, initialStatus?.status || '未知');
  
  let lastResult = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`\n🔄 [${agentId}] 第 ${attempt}/${maxRetries} 次尝试`);
    
    // 发送消息
    const sendResult = await sendWakeMessage(agentId, message);
    
    if (!sendResult.success) {
      console.error(`❌ [${agentId}] 发送失败，准备重试...`);
      lastResult = sendResult;
      
      if (attempt < maxRetries) {
        console.log(`⏳ 等待 ${retryDelay / 1000}秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
      continue;
    }
    
    // 检查 Agent 是否响应
    const confirmResult = await waitForAgentResponse(agentId);
    
    if (confirmResult.success) {
      console.log(`✅ [${agentId}] 唤醒成功！`);
      return {
        success: true,
        attempts: attempt,
        sessionId: sendResult.sessionId,
        finalStatus: confirmResult.status
      };
    }
    
    console.error(`❌ [${agentId}] 未响应，原因：${confirmResult.reason}`);
    lastResult = confirmResult;
    
    if (attempt < maxRetries) {
      console.log(`⏳ 等待 ${retryDelay / 1000}秒后重试...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  // 所有重试失败
  console.error(`\n❌ [${agentId}] 唤醒失败，已重试 ${maxRetries} 次`);
  
  // 生成告警报告
  const alertReport = {
    agentId,
    message,
    initialStatus,
    finalResult: lastResult,
    attempts: maxRetries,
    timestamp: new Date().toISOString()
  };
  
  // 保存告警报告
  const alertPath = path.join(WORKSPACE, 'logs', `agent-wake-alert-${agentId}-${Date.now()}.json`);
  fs.writeFileSync(alertPath, JSON.stringify(alertReport, null, 2));
  console.log(`📄 告警报告已保存：${alertPath}`);
  
  return {
    success: false,
    attempts: maxRetries,
    error: 'Agent 未响应',
    reason: lastResult?.reason,
    alertPath
  };
}

/**
 * 批量唤醒并确认
 */
async function wakeMultipleAgents(agents) {
  console.log(`\n🔔 批量唤醒 ${agents.length} 个 Agent...`);
  
  const results = [];
  
  for (const agent of agents) {
    const result = await wakeAgentWithConfirm(agent.id, agent.message, agent.options);
    results.push({ agentId: agent.id, ...result });
  }
  
  // 汇总结果
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log(`\n📊 批量唤醒结果:`);
  console.log(`   ✅ 成功：${successCount}`);
  console.log(`   ❌ 失败：${failCount}`);
  
  return {
    total: agents.length,
    success: successCount,
    failed: failCount,
    results
  };
}

// 导出函数
module.exports = {
  wakeAgentWithConfirm,
  wakeMultipleAgents,
  getAgentStatus,
  sendWakeMessage
};

// CLI 支持
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('用法: node agent-wake-confirm.js <agent-id> <message>');
    console.log('示例: node agent-wake-confirm.js xiaoyun-judge "紧急评审任务..."');
    process.exit(1);
  }
  
  const [agentId, ...messageParts] = args;
  const message = messageParts.join(' ');
  
  wakeAgentWithConfirm(agentId, message)
    .then(result => {
      if (result.success) {
        console.log('\n✅ 唤醒成功！');
        process.exit(0);
      } else {
        console.log('\n❌ 唤醒失败！');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('错误:', error);
      process.exit(1);
    });
}
