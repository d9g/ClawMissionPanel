#!/usr/bin/env python3
"""
数据迁移脚本 - 将任务文件迁移到数据库
Phase 4: 数据迁移
"""

import sqlite3
import os
import re
import json
from datetime import datetime

TASKS_DIR = "/home/admin/.openclaw/workspace/task-board/tasks"
DB_PATH = "/home/admin/.openclaw/workspace/task-board/database/task-board.db"

def parse_task_file(content, filename):
    """解析 Markdown 任务文件"""
    
    task_id = filename.replace('.md', '')
    
    # 提取任务名称
    name_match = re.search(r'# (.+)', content)
    task_name = name_match.group(1).strip() if name_match else task_id
    
    # 提取优先级
    priority_match = re.search(r'\*\*优先级\*\*:\s*(P[0-3])', content)
    priority = priority_match.group(1) if priority_match else 'P2'
    
    # 提取状态
    status_match = re.search(r'\*\*状态\*\*:\s*[🟢🟡🔴⏳]?\s*(\w+)', content)
    status = status_match.group(1).upper() if status_match else 'PENDING'
    
    # 映射状态
    status_map = {
        'PENDING': 'AVAILABLE',
        'AVAILABLE': 'AVAILABLE',
        'ASSIGNED': 'ASSIGNED',
        'IN_PROGRESS': 'IN_PROGRESS',
        'COMPLETED': 'COMPLETED',
        'BLOCKED': 'BLOCKED'
    }
    status = status_map.get(status, 'AVAILABLE')
    
    # 提取执行者
    assignee_match = re.search(r'\*\*执行者\*\*:\s*(\S+)', content)
    assignee = assignee_match.group(1) if assignee_match else None
    
    # 提取进度
    progress_match = re.search(r'\*\*进度\*\*:\s*(\d+)%', content)
    progress = int(progress_match.group(1)) if progress_match else 0
    
    # 提取截止时间
    deadline_match = re.search(r'\*\*截止时间\*\*:\s*([^\n]+)', content)
    deadline = deadline_match.group(1).strip() if deadline_match else None
    
    # 提取描述 (第一个标题后的内容)
    desc_match = re.search(r'# .+?\n\n(.*?)(?=\n##|\n\*\*|$)', content, re.DOTALL)
    description = desc_match.group(1).strip() if desc_match else content[:500]
    
    return {
        'id': task_id,
        'title': task_name,
        'description': description,
        'priority': priority,
        'status': status,
        'assignee': assignee,
        'progress': progress,
        'deadline': deadline,
        'metadata': json.dumps({
            'filename': filename,
            'migrated_at': datetime.now().isoformat()
        })
    }

def migrate_tasks():
    """迁移所有任务到数据库"""
    
    print("🔄 开始迁移任务...")
    print(f"📂 任务目录：{TASKS_DIR}")
    print(f"💾 数据库：{DB_PATH}")
    
    # 连接数据库
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 读取所有任务文件
    files = [f for f in os.listdir(TASKS_DIR) if f.endswith('.md')]
    print(f"📄 找到 {len(files)} 个任务文件")
    
    migrated = 0
    skipped = 0
    errors = 0
    
    for filename in files:
        try:
            filepath = os.path.join(TASKS_DIR, filename)
            
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 解析任务
            task = parse_task_file(content, filename)
            
            # 插入数据库
            cursor.execute("""
                INSERT OR REPLACE INTO tasks 
                (id, title, description, priority, status, assignee, progress, deadline, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                task['id'],
                task['title'],
                task['description'],
                task['priority'],
                task['status'],
                task['assignee'],
                task['progress'],
                task['deadline'],
                task['metadata']
            ))
            
            migrated += 1
            print(f"  ✅ {task['id']}: {task['title'][:30]}... ({task['status']})")
            
        except Exception as e:
            errors += 1
            print(f"  ❌ {filename}: {str(e)}")
    
    # 提交事务
    conn.commit()
    
    # 统计
    cursor.execute("SELECT COUNT(*) FROM tasks")
    total = cursor.fetchone()[0]
    
    cursor.execute("SELECT status, COUNT(*) FROM tasks GROUP BY status")
    status_stats = cursor.fetchall()
    
    conn.close()
    
    print("\n" + "="*50)
    print("✅ 迁移完成！")
    print(f"📊 迁移统计:")
    print(f"  - 成功：{migrated} 个")
    print(f"  - 跳过：{skipped} 个")
    print(f"  - 错误：{errors} 个")
    print(f"  - 数据库总任务数：{total} 个")
    print(f"\n📈 状态分布:")
    for status, count in status_stats:
        print(f"  - {status}: {count} 个")
    print("="*50)

if __name__ == "__main__":
    migrate_tasks()
