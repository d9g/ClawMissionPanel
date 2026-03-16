# 监控任务检查清单

**任务 ID**: TASK-20260312-010  
**监控频率**: 每 4 小时一次  
**监控时间**: 07:30, 11:30, 15:30, 19:30, 23:30  

---

## 📋 检查项

### 1. API 可用性检查

- [ ] `/api/agents/status` - 200 OK
- [ ] `/api/tasks/stats` - 200 OK
- [ ] `/api/tasks/blocked/all` - 200 OK
- [ ] `/api/tasks/all` - 200 OK

**测试命令**:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/agents/status
```

---

### 2. 页面加载状态验证

- [ ] 首页加载 <2 秒
- [ ] 阻塞页面加载 <2 秒
- [ ] 详情页面加载 <2 秒
- [ ] 筛选页面加载 <2 秒

**测试命令**:
```bash
curl -s -o /dev/null -w "%{time_total}s" https://yun.webyoung.cn/task-board/
```

---

### 3. 任务状态变更检测

- [ ] 检查 IN_PROGRESS 任务
- [ ] 检查 updated_at 时间 (<2 小时)
- [ ] 检查进度更新
- [ ] 检查阻塞任务

**检查命令**:
```bash
sqlite3 task-board.db "SELECT task_id, status, updated_at FROM tasks WHERE status = 'IN_PROGRESS';"
```

---

### 4. Agent 状态同步检查

- [ ] 检查 Memory 文件更新 (<2 小时)
- [ ] 检查 Inbox 状态
- [ ] 检查唤醒响应
- [ ] 检查任务进度

**检查命令**:
```bash
for agent in xiaoyun-dev xiaoyun-test xiaoyun-recorder xiaoyun-judge; do
  echo "=== $agent ==="
  ls -la agents/$agent/memory/2026-03-13.md
done
```

---

## 📊 进度更新

**每次监控完成**: +5%  
**最终报告完成**: +15%  

**进度计划**:
| 时间 | 类型 | 进度 |
|------|------|------|
| 11:20 | 首次测试 | 30% |
| 15:30 | 第 1 次检查 | 75% |
| 16:30 | 第 2 次检查 | 80% |
| 19:30 | 第 3 次检查 | 85% |
| 23:30 | 最终报告 | 100% |

---

## 🚨 异常处理

### API 失败
- 立即报告用户
- 记录错误日志
- 尝试重启 API 服务

### 页面 404
- 立即报告用户
- 检查部署状态
- 重新部署文件

### 状态不一致
- 手动同步数据库
- 检查任务追踪服务
- 修复同步逻辑

### 监控过时
- >30 分钟 → 自动告警
- >1 小时 → 催促 Agent
- >2 小时 → 报告用户

---

## 📝 监控报告模板

```markdown
## 监控报告 - 第 X 次检查

**时间**: YYYY-MM-DD HH:mm
**执行者**: xiaoyun-test

### 检查结果

**API 可用性**: ✅ 全部 200 OK
**页面加载**: ✅ 全部 <2 秒
**任务状态**: ✅ 正常
**Agent 状态**: ✅ 正常

### 发现的问题

[如有，详细描述]

### 下一步计划

- 下次检查时间：HH:mm
- 重点关注：[如有]
```

---

_让监控标准化，让问题无处遁形！_ 🔍✅
