#!/usr/bin/env python3
"""
超时任务自动释放脚本
Phase 5: 超时释放机制

功能:
1. 检测认领超时任务 (30 分钟无进展)
2. 自动释放任务
3. 更新 Agent 状态
4. 记录释放日志
5. 发送告警通知 (可选)

配置 cron:
*/5 * * * * python3 /home/admin/.openclaw/workspace/task-board/scripts/release-timeout-tasks.py
"""

import sqlite3
import json
from datetime import datetime, timedelta
import sys

DB_PATH = "/home/admin/.openclaw/workspace/task-board/database/task-board.db"
TIMEOUT_MINUTES = 30  # 30 分钟超时

def get_db_connection():
    """获取数据库连接"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def release_timeout_tasks():
    """释放超时任务"""
    
    print("="*60)
    print("🔄 开始检测超时任务...")
    print(f"⏰ 超时阈值：{TIMEOUT_MINUTES} 分钟")
    print(f"💾 数据库：{DB_PATH}")
    print(f"🕐 当前时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 计算超时时间阈值
    timeout_threshold = datetime.now() - timedelta(minutes=TIMEOUT_MINUTES)
    
    # 查找超时任务
    cursor.execute("""
        SELECT 
            t.id,
            t.title,
            t.claimed_by,
            t.claimed_at,
            t.status,
            a.name as agent_name
        FROM tasks t
        LEFT JOIN agents a ON t.claimed_by = a.id
        WHERE t.status IN ('ASSIGNED', 'IN_PROGRESS')
          AND t.claimed_at < ?
          AND t.progress = 0
        ORDER BY t.claimed_at ASC
    """, (timeout_threshold.isoformat(),))
    
    timeout_tasks = cursor.fetchall()
    
    if not timeout_tasks:
        print("\n✅ 没有发现超时任务")
        print("="*60)
        conn.close()
        return 0
    
    print(f"\n🔴 发现 {len(timeout_tasks)} 个超时任务:")
    print("-"*60)
    
    released_count = 0
    
    for task in timeout_tasks:
        task_id = task['id']
        task_title = task['title'][:50]
        claimed_by = task['claimed_by']
        claimed_at = task['claimed_at']
        agent_name = task['agent_name'] or '未知'
        
        print(f"\n⚠️  任务超时:")
        print(f"   任务 ID: {task_id}")
        print(f"   任务名：{task_title}...")
        print(f"   认领者：{agent_name} ({claimed_by})")
        print(f"   认领时间：{claimed_at}")
        
        try:
            # 开启事务
            cursor.execute("BEGIN IMMEDIATE")
            
            # 1. 释放任务
            cursor.execute("""
                UPDATE tasks 
                SET status = 'AVAILABLE',
                    claimed_by = NULL,
                    claimed_at = NULL,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (task_id,))
            
            # 2. 更新 Agent 状态
            if claimed_by:
                cursor.execute("""
                    UPDATE agents 
                    SET status = 'IDLE',
                        current_task_id = NULL,
                        last_active_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (claimed_by,))
            
            # 3. 记录活动日志
            cursor.execute("""
                INSERT INTO activity_logs (agent_id, action, task_id, details)
                VALUES (?, ?, ?, ?)
            """, (
                claimed_by,
                'timeout_release',
                task_id,
                json.dumps({
                    "reason": "timeout",
                    "timeout_minutes": TIMEOUT_MINUTES,
                    "original_claimed_at": claimed_at,
                    "released_at": datetime.now().isoformat()
                })
            ))
            
            # 提交事务
            conn.commit()
            
            print(f"   ✅ 已释放任务，状态更新为 AVAILABLE")
            released_count += 1
            
        except Exception as e:
            conn.rollback()
            print(f"   ❌ 释放失败：{str(e)}")
    
    # 统计信息
    cursor.execute("""
        SELECT status, COUNT(*) as count 
        FROM tasks 
        GROUP BY status
    """)
    status_stats = cursor.fetchall()
    
    cursor.execute("""
        SELECT COUNT(*) as count 
        FROM activity_logs 
        WHERE action = 'timeout_release' 
          AND created_at > datetime('now', '-1 hour')
    """)
    recent_releases = cursor.fetchone()['count']
    
    conn.close()
    
    # 打印统计
    print("\n" + "="*60)
    print("✅ 超时释放完成！")
    print(f"📊 释放统计:")
    print(f"  - 发现超时任务：{len(timeout_tasks)} 个")
    print(f"  - 成功释放：{released_count} 个")
    print(f"  - 失败：{len(timeout_tasks) - released_count} 个")
    print(f"  - 最近 1 小时释放：{recent_releases} 个")
    print(f"\n📈 任务状态分布:")
    for stat in status_stats:
        print(f"  - {stat['status']}: {stat['count']} 个")
    print("="*60)
    
    return released_count

if __name__ == "__main__":
    released = release_timeout_tasks()
    sys.exit(0 if released >= 0 else 1)
