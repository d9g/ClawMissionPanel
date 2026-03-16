#!/usr/bin/env python3
"""
循环任务定时检查脚本 - Phase 10
功能：每分钟检查到期的循环任务并自动触发

配置 cron:
* * * * * python3 /home/admin/.openclaw/workspace/task-board/scripts/check-recurring-tasks.py
"""

import sqlite3
import json
from datetime import datetime, timedelta
import sys
import os

DB_PATH = "/home/admin/.openclaw/workspace/task-board/database/task-board.db"

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def calculate_next_run(recurring_type, time_of_day, day_of_week=None, day_of_month=None, cron_expression=None):
    """计算下次执行时间"""
    now = datetime.now()
    
    if recurring_type == 'daily':
        hour, minute = map(int, time_of_day.split(':'))
        next_run = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        if next_run <= now:
            next_run += timedelta(days=1)
    
    elif recurring_type == 'weekly':
        hour, minute = map(int, time_of_day.split(':'))
        target_weekday = int(day_of_week) - 1 if day_of_week else 0
        days_ahead = target_weekday - now.weekday()
        if days_ahead < 0:
            days_ahead += 7
        next_run = now.replace(hour=hour, minute=minute, second=0, microsecond=0) + timedelta(days=days_ahead)
        if next_run <= now:
            next_run += timedelta(weeks=1)
    
    elif recurring_type == 'monthly':
        hour, minute = map(int, time_of_day.split(':'))
        target_day = int(day_of_month) if day_of_month else 1
        if now.day >= target_day:
            if now.month == 12:
                next_run = now.replace(year=now.year+1, month=1, day=target_day, hour=hour, minute=minute, second=0, microsecond=0)
            else:
                next_run = now.replace(month=now.month+1, day=target_day, hour=hour, minute=minute, second=0, microsecond=0)
        else:
            next_run = now.replace(day=target_day, hour=hour, minute=minute, second=0, microsecond=0)
    
    else:
        next_run = now + timedelta(days=1)
    
    return next_run

def create_child_task(cursor, parent_task_id, run_number, scheduled_time):
    """创建子任务"""
    
    cursor.execute("SELECT * FROM tasks WHERE id = ?", (parent_task_id,))
    parent = cursor.fetchone()
    
    if not parent:
        return None
    
    child_id = f"{parent_task_id}-RUN{run_number}"
    now = datetime.now().isoformat()
    
    cursor.execute("""
        INSERT OR REPLACE INTO tasks 
        (id, title, description, priority, status, parent_task_id, run_number, created_at, updated_at, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        child_id,
        f"[循环任务 #{run_number}] {parent['title']}",
        parent['description'],
        parent['priority'],
        'AVAILABLE',
        parent_task_id,
        run_number,
        now,
        now,
        json.dumps({
            "type": "child",
            "parent_task_id": parent_task_id,
            "run_number": run_number,
            "scheduled_time": scheduled_time.isoformat()
        })
    ))
    
    cursor.execute("""
        INSERT INTO child_tasks (parent_task_id, child_task_id, run_number, scheduled_time)
        VALUES (?, ?, ?, ?)
    """, (parent_task_id, child_id, run_number, scheduled_time))
    
    cursor.execute("""
        UPDATE tasks SET run_number = run_number + 1 WHERE id = ?
    """, (parent_task_id,))
    
    return child_id

def check_and_trigger():
    """检查并触发到期的循环任务"""
    
    print("="*70)
    print("🔄 开始检查循环任务...")
    print(f"⏰ 检查时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*70)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    now = datetime.now()
    
    # 查找到期任务
    cursor.execute("""
        SELECT * FROM recurring_tasks 
        WHERE enabled = 1 
          AND next_run_at <= ?
        ORDER BY next_run_at ASC
    """, (now.isoformat(),))
    
    due_tasks = cursor.fetchall()
    
    if not due_tasks:
        print("\n✅ 没有到期的循环任务")
        print("="*70)
        conn.close()
        return 0
    
    print(f"\n📅 发现 {len(due_tasks)} 个到期的循环任务:")
    print("-"*70)
    
    triggered_count = 0
    
    for task in due_tasks:
        task_id = task['id']
        parent_id = task['parent_task_id']
        recurring_type = task['recurring_type']
        next_run_old = task['next_run_at']
        
        print(f"\n⏰ 任务到期:")
        print(f"   配置 ID: {task_id}")
        print(f"   父任务：{parent_id}")
        print(f"   类型：{recurring_type}")
        print(f"   下次执行：{next_run_old}")
        
        try:
            # 获取当前运行次数
            cursor.execute("SELECT run_number FROM tasks WHERE id = ?", (parent_id,))
            parent = cursor.fetchone()
            run_number = (parent['run_number'] if parent else 0) + 1
            
            # 创建子任务
            child_id = create_child_task(cursor, parent_id, run_number, now)
            
            # 计算下次执行时间
            next_run = calculate_next_run(
                task['recurring_type'],
                task['time_of_day'],
                task.get('day_of_week'),
                task.get('day_of_month'),
                task.get('cron_expression')
            )
            
            # 更新配置
            cursor.execute("""
                UPDATE recurring_tasks 
                SET last_run_at = ?, next_run_at = ?, updated_at = ?
                WHERE id = ?
            """, (now.isoformat(), next_run.isoformat(), now.isoformat(), task_id))
            
            # 记录活动日志
            cursor.execute("""
                INSERT INTO activity_logs (agent_id, action, task_id, details)
                VALUES (?, ?, ?, ?)
            """, (
                'system',
                'recurring_trigger',
                child_id,
                json.dumps({
                    "recurring_id": task_id,
                    "parent_task_id": parent_id,
                    "run_number": run_number,
                    "recurring_type": recurring_type,
                    "triggered_at": now.isoformat()
                })
            ))
            
            print(f"   ✅ 已创建子任务：{child_id}")
            print(f"   📋 运行次数：#{run_number}")
            print(f"   🕐 下次执行：{next_run.strftime('%Y-%m-%d %H:%M:%S')}")
            
            triggered_count += 1
            
        except Exception as e:
            print(f"   ❌ 触发失败：{str(e)}")
    
    # 统计
    cursor.execute("SELECT COUNT(*) FROM recurring_tasks WHERE enabled = 1")
    total_enabled = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM tasks WHERE is_recurring = 1")
    total_recurring = cursor.fetchone()[0]
    
    conn.commit()
    conn.close()
    
    print("\n" + "="*70)
    print("✅ 循环任务检查完成！")
    print(f"📊 统计:")
    print(f"  - 到期任务：{len(due_tasks)} 个")
    print(f"  - 成功触发：{triggered_count} 个")
    print(f"  - 失败：{len(due_tasks) - triggered_count} 个")
    print(f"  - 启用配置：{total_enabled} 个")
    print(f"  - 循环任务：{total_recurring} 个")
    print("="*70)
    
    return triggered_count

if __name__ == "__main__":
    triggered = check_and_trigger()
    sys.exit(0 if triggered >= 0 else 1)
