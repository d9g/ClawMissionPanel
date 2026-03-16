#!/usr/bin/env python3
"""
巡逻监控 Agent - Phase 7
功能：
1. 定时检测系统健康状态
2. 发现阻塞任务
3. 检测 Agent 假死
4. 创建告警任务
5. 通知相关 Agent

配置 cron:
*/10 * * * * python3 /home/admin/.openclaw/workspace/task-board/scripts/patrol-monitor.py
"""

import sqlite3
import json
from datetime import datetime, timedelta
import sys
import os

DB_PATH = "/home/admin/.openclaw/workspace/task-board/database/task-board.db"

# 配置
AGENT_TIMEOUT_MINUTES = 60  # Agent 60 分钟无活动视为假死
TASK_BLOCKED_MINUTES = 30   # 任务 30 分钟无进展视为阻塞
CHECK_INTERVAL_MINUTES = 10 # 每 10 分钟检查一次

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def patrol_check():
    """巡逻检查"""
    
    print("="*70)
    print("🛡️  开始巡逻监控检查...")
    print(f"⏰ 检查时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📊 Agent 超时阈值：{AGENT_TIMEOUT_MINUTES} 分钟")
    print(f"📊 任务阻塞阈值：{TASK_BLOCKED_MINUTES} 分钟")
    print("="*70)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    issues_found = 0
    alerts_created = 0
    
    # ========== 1. 检测 Agent 假死 ==========
    print("\n🔍 检查 Agent 健康状态...")
    
    timeout_threshold = datetime.now() - timedelta(minutes=AGENT_TIMEOUT_MINUTES)
    
    cursor.execute("""
        SELECT id, name, role, status, current_task_id, last_active_at
        FROM agents
        WHERE last_active_at < ?
          AND status != 'OFFLINE'
    """, (timeout_threshold.isoformat(),))
    
    inactive_agents = cursor.fetchall()
    
    for agent in inactive_agents:
        issues_found += 1
        print(f"\n⚠️  Agent 假死检测:")
        print(f"   Agent: {agent['name']} ({agent['id']})")
        print(f"   角色：{agent['role']}")
        print(f"   状态：{agent['status']}")
        print(f"   最后活跃：{agent['last_active_at']}")
        print(f"   当前任务：{agent['current_task_id'] or '无'}")
        
        # 创建告警任务
        alert_id = create_alert_task(
            cursor,
            f"Agent 假死告警 - {agent['id']}",
            f"Agent {agent['name']} 已超过 {AGENT_TIMEOUT_MINUTES} 分钟无活动",
            "patrol",
            {
                "agent_id": agent['id'],
                "agent_name": agent['name'],
                "last_active": agent['last_active_at'],
                "timeout_minutes": AGENT_TIMEOUT_MINUTES
            }
        )
        
        if alert_id:
            alerts_created += 1
            print(f"   ✅ 已创建告警任务：{alert_id}")
    
    # ========== 2. 检测阻塞任务 ==========
    print("\n🔍 检查阻塞任务...")
    
    task_timeout_threshold = datetime.now() - timedelta(minutes=TASK_BLOCKED_MINUTES)
    
    cursor.execute("""
        SELECT 
            t.id,
            t.title,
            t.status,
            t.claimed_by,
            t.claimed_at,
            t.progress,
            t.updated_at,
            a.name as agent_name
        FROM tasks t
        LEFT JOIN agents a ON t.claimed_by = a.id
        WHERE t.status IN ('ASSIGNED', 'IN_PROGRESS')
          AND t.updated_at < ?
          AND t.progress < 100
        ORDER BY t.updated_at ASC
    """, (task_timeout_threshold.isoformat(),))
    
    blocked_tasks = cursor.fetchall()
    
    for task in blocked_tasks:
        issues_found += 1
        print(f"\n⚠️  任务阻塞检测:")
        print(f"   任务 ID: {task['id']}")
        print(f"   任务名：{task['title'][:50]}...")
        print(f"   状态：{task['status']}")
        print(f"   执行者：{task['agent_name'] or '未分配'} ({task['claimed_by'] or '无'})")
        print(f"   认领时间：{task['claimed_at']}")
        print(f"   最后更新：{task['updated_at']}")
        print(f"   进度：{task['progress']}%")
        
        # 创建告警任务
        alert_id = create_alert_task(
            cursor,
            f"任务阻塞告警 - {task['id']}",
            f"任务 {task['title'][:30]} 已超过 {TASK_BLOCKED_MINUTES} 分钟无进展",
            "patrol",
            {
                "task_id": task['id'],
                "task_title": task['title'],
                "agent_id": task['claimed_by'],
                "agent_name": task['agent_name'],
                "blocked_minutes": TASK_BLOCKED_MINUTES,
                "current_progress": task['progress']
            }
        )
        
        if alert_id:
            alerts_created += 1
            print(f"   ✅ 已创建告警任务：{alert_id}")
            
            # 释放阻塞任务
            if task['claimed_by']:
                cursor.execute("""
                    UPDATE tasks 
                    SET status = 'AVAILABLE',
                        claimed_by = NULL,
                        claimed_at = NULL,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (task['id'],))
                
                # 更新 Agent 状态
                cursor.execute("""
                    UPDATE agents 
                    SET status = 'IDLE',
                        current_task_id = NULL
                    WHERE id = ?
                """, (task['claimed_by'],))
                
                print(f"   ✅ 已释放任务，状态更新为 AVAILABLE")
    
    # ========== 3. 检测依赖阻塞 ==========
    print("\n🔍 检查依赖阻塞...")
    
    cursor.execute("""
        SELECT 
            t.id,
            t.title,
            t.dependencies,
            t.status
        FROM tasks t
        WHERE t.status IN ('PENDING', 'AVAILABLE')
          AND t.dependencies IS NOT NULL
    """)
    
    pending_tasks = cursor.fetchall()
    
    for task in pending_tasks:
        if task['dependencies']:
            try:
                deps = json.loads(task['dependencies'])
                if isinstance(deps, list) and len(deps) > 0:
                    # 检查依赖是否完成
                    placeholders = ','.join(['?' for _ in deps])
                    cursor.execute(f"""
                        SELECT id, status FROM tasks 
                        WHERE id IN ({placeholders})
                    """, deps)
                    
                    dep_tasks = cursor.fetchall()
                    incomplete = [d['id'] for d in dep_tasks if d['status'] != 'COMPLETED']
                    
                    if incomplete:
                        print(f"\n⚠️  依赖阻塞检测:")
                        print(f"   任务 ID: {task['id']}")
                        print(f"   任务名：{task['title'][:50]}...")
                        print(f"   阻塞依赖：{', '.join(incomplete)}")
                        # 暂时不创建告警，依赖阻塞是正常的
            except:
                pass
    
    # ========== 4. 统计信息 ==========
    print("\n" + "="*70)
    print("✅ 巡逻检查完成！")
    print(f"📊 检查统计:")
    print(f"  - 发现问题：{issues_found} 个")
    print(f"  - 创建告警：{alerts_created} 个")
    
    # 总体统计
    cursor.execute("SELECT COUNT(*) FROM tasks WHERE status IN ('ASSIGNED', 'IN_PROGRESS')")
    active_tasks = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM agents WHERE status = 'BUSY'")
    busy_agents = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM tasks WHERE status = 'REVIEW'")
    review_tasks = cursor.fetchone()[0]
    
    print(f"\n📈 系统状态:")
    print(f"  - 进行中任务：{active_tasks} 个")
    print(f"  - 繁忙 Agent: {busy_agents} 个")
    print(f"  - 待评审任务：{review_tasks} 个")
    print("="*70)
    
    conn.commit()
    conn.close()
    
    return issues_found

def create_alert_task(cursor, title, description, alert_type, details):
    """创建告警任务"""
    
    try:
        alert_id = f"ALERT-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        now = datetime.now().isoformat()
        
        cursor.execute("""
            INSERT OR REPLACE INTO tasks 
            (id, title, description, priority, status, created_at, updated_at, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            alert_id,
            title,
            description,
            'P0',  # 告警任务最高优先级
            'AVAILABLE',
            now,
            now,
            json.dumps({
                "type": "alert",
                "alert_type": alert_type,
                "details": details,
                "created_by": "patrol"
            })
        ))
        
        # 记录活动日志
        cursor.execute("""
            INSERT INTO activity_logs (agent_id, action, task_id, details)
            VALUES (?, ?, ?, ?)
        """, ('patrol', 'create_alert', alert_id, json.dumps(details)))
        
        return alert_id
        
    except Exception as e:
        print(f"   ❌ 创建告警失败：{str(e)}")
        return None

if __name__ == "__main__":
    issues = patrol_check()
    sys.exit(0 if issues == 0 else 1)
