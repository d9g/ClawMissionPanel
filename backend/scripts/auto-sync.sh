#!/bin/bash
# 任务状态自动同步 (每 5 分钟)
# 添加到 crontab: */5 * * * * <workspace>/task-board/scripts/auto-sync.sh

cd ~/.openclaw/workspace/task-board
node scripts/sync-all-tasks.js >> logs/sync.log 2>&1
