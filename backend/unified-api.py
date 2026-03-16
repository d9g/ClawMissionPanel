#!/usr/bin/env python3
"""
OpenMOSS 统一数据 API - 合并所有 API 到一个端口
端口：6568
功能：任务数据 + Agent 状态 + 评审 + 循环任务
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import json
from datetime import datetime
from typing import Optional

app = FastAPI(title="OpenMOSS Unified Data API", version="2.0.0")

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "/home/admin/.openclaw/workspace/task-board/database/task-board.db"

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def dict_from_row(row):
    return dict(zip(row.keys(), row))

@app.get("/")
async def root():
    return {
        "message": "OpenMOSS Unified Data API",
        "version": "2.0.0",
        "endpoints": [
            "/api/dashboard/data",
            "/api/tasks",
            "/api/agents",
            "/api/reviews",
            "/api/recurring",
            "/api/stats"
        ]
    }

@app.get("/api/dashboard/data")
async def get_dashboard_data():
    """
    获取仪表板完整数据（从数据库动态加载）
    返回格式匹配前台页面期望的结构
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. 获取所有任务
    cursor.execute("""
        SELECT 
            id as task_id, title, description, priority, status, 
            assignee, claimed_by, progress,
            created_at, updated_at
        FROM tasks
        ORDER BY 
            CASE priority 
                WHEN 'P0' THEN 1 
                WHEN 'P1' THEN 2 
                WHEN 'P2' THEN 3 
                WHEN 'P3' THEN 4 
            END,
            created_at DESC
    """)
    
    tasks = [dict_from_row(row) for row in cursor.fetchall()]
    
    # 2. 统计
    stats = {
        'total': len(tasks),
        'pending': len([t for t in tasks if t['status'] in ['AVAILABLE', 'PENDING', 'ASSIGNED']]),
        'in_progress': len([t for t in tasks if t['status'] == 'IN_PROGRESS']),
        'completed': len([t for t in tasks if t['status'] == 'COMPLETED']),
        'blocked': len([t for t in tasks if t['status'] == 'BLOCKED'])
    }
    
    # 3. 获取所有 Agent
    cursor.execute("""
        SELECT 
            id, name, role, status, 
            current_task_id, score,
            last_active_at
        FROM agents
        ORDER BY score DESC
    """)
    
    agents = [dict_from_row(row) for row in cursor.fetchall()]
    
    # 4. 获取最近活动日志
    cursor.execute("""
        SELECT 
            id, agent_id, action, task_id, 
            details, created_at
        FROM activity_logs
        ORDER BY created_at DESC
        LIMIT 50
    """)
    
    activity_logs = [dict_from_row(row) for row in cursor.fetchall()]
    
    # 5. 阻塞任务检测
    blocked_tasks = []
    cursor.execute("""
        SELECT id as task_id, title, assignee, status, progress
        FROM tasks
        WHERE status = 'BLOCKED' OR (status = 'IN_PROGRESS' AND progress = 0)
    """)
    for row in cursor.fetchall():
        blocked_tasks.append({
            'task_id': row['task_id'],
            'title': row['title'],
            'assignee': row['assignee'],
            'blocked_reason': '任务阻塞' if row['status'] == 'BLOCKED' else '无进展'
        })
    
    conn.close()
    
    # 6. 组装数据（匹配前台期望的格式）
    return {
        "success": True,
        "updatedAt": datetime.now().isoformat(),
        "data": {
            "stats": stats,
            "total": stats['total'],
            "all": tasks,
            "in_progress": [t for t in tasks if t['status'] == 'IN_PROGRESS'],
            "pending": [t for t in tasks if t['status'] in ['PENDING', 'ASSIGNED']],
            "completed": [t for t in tasks if t['status'] == 'COMPLETED'],
            "blocked": blocked_tasks,
            "agents": {
                "total": len(agents),
                "details": {agent['id']: agent for agent in agents}
            },
            "activity_logs": activity_logs
        }
    }

@app.get("/api/tasks")
async def get_tasks(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assignee: Optional[str] = None
):
    """
    获取任务列表（支持筛选）
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM tasks WHERE 1=1"
    params = []
    
    if status:
        query += " AND status = ?"
        params.append(status)
    
    if priority:
        query += " AND priority = ?"
        params.append(priority)
    
    if assignee:
        query += " AND assignee = ?"
        params.append(assignee)
    
    query += " ORDER BY created_at DESC"
    
    cursor.execute(query, params)
    tasks = [dict_from_row(row) for row in cursor.fetchall()]
    conn.close()
    
    return {
        "success": True,
        "data": tasks,
        "count": len(tasks)
    }

@app.get("/api/agents")
async def get_agents():
    """
    获取所有 Agent
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM agents ORDER BY score DESC")
    agents = [dict_from_row(row) for row in cursor.fetchall()]
    conn.close()
    
    return {
        "success": True,
        "data": agents,
        "count": len(agents)
    }

@app.get("/api/reviews")
async def get_reviews():
    """
    获取评审数据（从活动日志中提取）
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT 
            id, agent_id, action, task_id, 
            details, created_at
        FROM activity_logs
        WHERE action IN ('review', 'claim', 'complete', 'release')
        ORDER BY created_at DESC
        LIMIT 100
    """)
    
    reviews = [dict_from_row(row) for row in cursor.fetchall()]
    conn.close()
    
    return {
        "success": True,
        "data": reviews,
        "count": len(reviews)
    }

@app.get("/api/recurring")
async def get_recurring_tasks():
    """
    获取循环任务
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM recurring_tasks ORDER BY next_run")
    recurring = [dict_from_row(row) for row in cursor.fetchall()]
    conn.close()
    
    return {
        "success": True,
        "data": recurring,
        "count": len(recurring)
    }

@app.get("/api/stats")
async def get_stats():
    """
    获取统计数据
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 任务统计
    cursor.execute("SELECT COUNT(*) FROM tasks")
    total = cursor.fetchone()[0]
    
    cursor.execute("SELECT status, COUNT(*) FROM tasks GROUP BY status")
    status_counts = dict(cursor.fetchall())
    
    # Agent 统计
    cursor.execute("SELECT COUNT(*) FROM agents")
    agent_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM agents WHERE status = 'BUSY'")
    busy_count = cursor.fetchone()[0]
    
    conn.close()
    
    return {
        "success": True,
        "data": {
            "tasks": {
                "total": total,
                "available": status_counts.get('AVAILABLE', 0),
                "assigned": status_counts.get('ASSIGNED', 0),
                "in_progress": status_counts.get('IN_PROGRESS', 0),
                "completed": status_counts.get('COMPLETED', 0),
                "blocked": status_counts.get('BLOCKED', 0)
            },
            "agents": {
                "total": agent_count,
                "busy": busy_count,
                "idle": agent_count - busy_count
            }
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=6568)
