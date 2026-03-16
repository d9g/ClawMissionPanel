#!/usr/bin/env node
/**
 * 任务文件迁移工具
 * 
 * 功能：将旧格式任务文件迁移到新格式
 * 自动检测并添加状态字段
 */

const fs = require('fs');
const path = require('path');

const TASKS_DIR = '/home/admin/.openclaw/workspace/task-board/tasks';

/**
 * 从文件内容智能推断状态
 */
function inferStatus(content, fileName) {
  // 检查是否有显式状态
  const statusMatch = content.match(/^\*\*状态\*\*:\s*(.+)/im);
  if (statusMatch) return statusMatch[1].trim();
  
  // 检查执行者
  const assigneeMatch = content.match(/^\*\*执行者\*\*:\s*(.+)/im);
  const hasAssignee = !!assigneeMatch;
  
  // 检查进度记录
  const hasProgressRecord = content.includes('## 进度记录') || 
                            content.includes('进度记录') ||
                            content.includes('- 开始');
  
  // 检查完成标记
  const isCompleted = content.includes('✅ 已完成') ||
                      content.includes('任务完成') ||
                      fileName.includes('COMPLETED');
  
  // 检查取消标记
  const isCancelled = content.includes('❌ 已取消') ||
                      content.includes('已取消') ||
                      content.includes('CANCELLED');
  
  if (isCompleted) return 'COMPLETED';
  if (isCancelled) return 'CANCELLED';
  if (hasProgressRecord) return 'IN_PROGRESS';
  if (hasAssignee) return 'ASSIGNED';
  return 'PENDING';
}

/**
 * 更新任务文件，添加状态字段
 */
function migrateTaskFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath, '.md');
  
  // 检查是否已有状态字段
  if (content.match(/^\*\*状态\*\*:/im)) {
    console.log(`✅ ${fileName}: 已有状态字段，跳过`);
    return false;
  }
  
  // 推断状态
  const status = inferStatus(content, fileName);
  
  // 在任务 ID 后插入状态字段
  const taskIdMatch = content.match(/^(\*\*任务 ID\*\*: .+\n)/);
  if (taskIdMatch) {
    const insertPos = taskIdMatch.index + taskIdMatch[0].length;
    const newContent = 
      content.slice(0, insertPos) +
      `**状态**: ${status}\n` +
      content.slice(insertPos);
    
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ ${fileName}: 已添加状态 ${status}`);
    return true;
  }
  
  // 如果没有任务 ID，在标题后插入
  const titleMatch = content.match(/^# .+\n/);
  if (titleMatch && !content.includes('**任务 ID**')) {
    const insertPos = titleMatch.index + titleMatch[0].length;
    const newContent = 
      content.slice(0, insertPos) +
      `\n**任务 ID**: ${fileName}\n**状态**: ${status}\n` +
      content.slice(insertPos);
    
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ ${fileName}: 已添加任务 ID 和状态 ${status}`);
    return true;
  }
  
  // 只有状态字段缺失
  if (titleMatch) {
    const insertPos = titleMatch.index + titleMatch[0].length;
    const newContent = 
      content.slice(0, insertPos) +
      `\n**状态**: ${status}\n` +
      content.slice(insertPos);
    
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ ${fileName}: 已添加状态 ${status}`);
    return true;
  }
  
  console.log(`⚠️ ${fileName}: 无法解析文件格式`);
  return false;
}

/**
 * 主函数
 */
function main() {
  console.log('🔄 开始迁移任务文件...\n');
  
  const files = fs.readdirSync(TASKS_DIR).filter(f => f.endsWith('.md'));
  let migrated = 0;
  let skipped = 0;
  
  for (const file of files) {
    try {
      const result = migrateTaskFile(path.join(TASKS_DIR, file));
      if (result) migrated++;
      else skipped++;
    } catch (error) {
      console.error(`❌ ${file}: ${error.message}`);
    }
  }
  
  console.log(`\n📊 迁移完成：${migrated} 个文件已更新，${skipped} 个文件跳过`);
}

main();
