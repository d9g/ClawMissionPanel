/**
 * 依赖解析器 Bug 修复测试
 * 
 * 验证：状态提取支持 emoji 前缀
 */

const path = require('path');
const fs = require('fs');

// 临时修改 CONFIG 指向测试目录
const testTasksDir = path.join(__dirname, 'tmp/dependency-test-tasks');

describe('Dependency Parser Bug Fix', () => {
  beforeAll(() => {
    // 创建测试任务目录
    fs.mkdirSync(testTasksDir, { recursive: true });
    
    // 创建测试任务文件（带 emoji 状态）
    fs.writeFileSync(
      path.join(testTasksDir, 'TASK-TEST-A.md'),
      `# 测试任务 A
**状态**: ✅ COMPLETED
**执行者**: 测试者
`
    );
    
    fs.writeFileSync(
      path.join(testTasksDir, 'TASK-TEST-B.md'),
      `# 测试任务 B
**状态**: 🟡 PENDING
**依赖任务**: TASK-TEST-A
`
    );
    
    fs.writeFileSync(
      path.join(testTasksDir, 'TASK-TEST-C.md'),
      `# 测试任务 C
**状态**: 🔴 BLOCKED
**依赖任务**: TASK-TEST-A
`
    );
    
    // 修改依赖解析器的 CONFIG
    const parser = require('../src/dependency-parser');
    parser.CONFIG.tasksDir = testTasksDir;
  });

  afterAll(() => {
    // 清理测试目录
    if (fs.existsSync(testTasksDir)) {
      fs.rmSync(testTasksDir, { recursive: true, force: true });
    }
  });

  describe('getTaskStatuses()', () => {
    test('应该正确提取带 ✅ emoji 的状态', () => {
      const parser = require('../src/dependency-parser');
      const statuses = parser.getTaskStatuses();
      
      expect(statuses['TASK-TEST-A']).toBeDefined();
      expect(statuses['TASK-TEST-A'].status).toBe('COMPLETED');
    });

    test('应该正确提取带 🟡 emoji 的状态', () => {
      const parser = require('../src/dependency-parser');
      const statuses = parser.getTaskStatuses();
      
      expect(statuses['TASK-TEST-B']).toBeDefined();
      expect(statuses['TASK-TEST-B'].status).toBe('PENDING');
    });

    test('应该正确提取带 🔴 emoji 的状态', () => {
      const parser = require('../src/dependency-parser');
      const statuses = parser.getTaskStatuses();
      
      expect(statuses['TASK-TEST-C']).toBeDefined();
      expect(statuses['TASK-TEST-C'].status).toBe('BLOCKED');
    });
  });

  describe('canTaskStart()', () => {
    test('应该正确判断依赖已完成的任务可以开始', () => {
      const parser = require('../src/dependency-parser');
      const result = parser.canTaskStart('TASK-TEST-B');
      
      expect(result.canStart).toBe(true);
      expect(result.blockingTasks.length).toBe(0);
    });

    test('应该返回空阻塞列表当依赖已完成', () => {
      const parser = require('../src/dependency-parser');
      const result = parser.canTaskStart('TASK-TEST-B');
      
      expect(result.blockingTasks).toEqual([]);
    });
  });

  describe('真实场景测试', () => {
    test('TASK-20260313-DEP-A 应该被识别为 COMPLETED', () => {
      const parser = require('../src/dependency-parser');
      const statuses = parser.getTaskStatuses();
      
      const depA = statuses['TASK-20260313-DEP-A'];
      expect(depA).toBeDefined();
      expect(depA.status).toBe('COMPLETED');
    });

    test('TASK-20260313-DEP-B 应该可以开始（依赖 A 已完成）', () => {
      const parser = require('../src/dependency-parser');
      const result = parser.canTaskStart('TASK-20260313-DEP-B');
      
      expect(result.canStart).toBe(true);
      expect(result.blockingTasks).toEqual([]);
    });

    test('TASK-20260313-DEP-C 应该可以开始（依赖 A 已完成）', () => {
      const parser = require('../src/dependency-parser');
      const result = parser.canTaskStart('TASK-20260313-DEP-C');
      
      expect(result.canStart).toBe(true);
      expect(result.blockingTasks).toEqual([]);
    });
  });
});
