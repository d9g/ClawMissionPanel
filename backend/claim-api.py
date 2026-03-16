#!/usr/bin/env python3
"""
任务认领 API - 使用数据库锁机制实现自主任务认领
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
import json
from datetime import datetime
import asyncio

app = FastAPI(title="Task Board API", version="1.0.0")

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "/home/admin/.openclaw/workspace/task-board/database/task-board.db"

# ============ 数据模型 ============

class ClaimRequest(BaseModel):
    agent_id: str

class ReleaseRequest(BaseModel):
    agent_id: str
    reason: str = "manual"

class ProgressRequest(BaseModel):
    progress: int
    agent_id: str

class CompleteRequest(BaseModel):
    agent_id: str
    deliverable: str

# ============ 数据库工具 ============

def get_db_connection():
    """获取数据库连接"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def dict_from_row(row):
    """将 SQLite Row 转换为字典"""
    return dict(zip(row.keys(), row))

# ============ API 端点 ============

@app.get("/")
async def root():
    return {"message": "Task Board API", "version": "1.0.0"}

@app.get("/api/tasks/available")
async def get_available_tasks():
    """
    获取可用任务列表
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM tasks 
        WHERE status = 'AVAILABLE'
        ORDER BY 
            CASE priority 
                WHEN 'P0' THEN 1 
                WHEN 'P1' THEN 2 
                WHEN 'P2' THEN 3 
                WHEN 'P3' THEN 4 
            END,
            created_at ASC
    """)
    
    tasks = [dict_from_row(row) for row in cursor.fetchall()]
    conn.close()
    
    return {
        "success": True,
        "data": tasks,
        "count": len(tasks)
    }

@app.post("/api/tasks/{task_id}/claim")
async def claim_task(task_id: str, request: ClaimRequest):
    """
    认领任务 - 使用数据库事务锁防止并发冲突
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 开启事务
        cursor.execute("BEGIN IMMEDIATE")
        
        # 1. 查询任务 (SQLite 不支持 FOR UPDATE，使用事务锁)
        cursor.execute(
            "SELECT * FROM tasks WHERE id = ?",
            (task_id,)
        )
        task = cursor.fetchone()
        
        if not task:
            conn.rollback()
            raise HTTPException(status_code=404, detail="任务不存在")
        
        task_dict = dict_from_row(task)
        
        # 2. 检查是否可认领
        if task_dict['status'] != 'AVAILABLE':
            conn.rollback()
            return {
                "success": False,
                "error": f"任务已被认领 (状态：{task_dict['status']})"
            }
        
        # 3. 检查认领者是否存在
        cursor.execute(
            "SELECT * FROM agents WHERE id = ?",
            (request.agent_id,)
        )
        agent = cursor.fetchone()
        
        if not agent:
            conn.rollback()
            raise HTTPException(status_code=404, detail="Agent 不存在")
        
        # 4. 更新任务状态
        now = datetime.now().isoformat()
        cursor.execute("""
            UPDATE tasks 
            SET claimed_by = ?, 
                claimed_at = ?,
                status = 'ASSIGNED',
                updated_at = ?
            WHERE id = ?
        """, (request.agent_id, now, now, task_id))
        
        # 5. 更新 Agent 状态
        cursor.execute("""
            UPDATE agents 
            SET status = 'BUSY',
                current_task_id = ?,
                last_active_at = ?
            WHERE id = ?
        """, (task_id, now, request.agent_id))
        
        # 6. 记录活动日志
        cursor.execute("""
            INSERT INTO activity_logs (agent_id, action, task_id, details)
            VALUES (?, ?, ?, ?)
        """, (
            request.agent_id,
            'claim',
            task_id,
            json.dumps({"task_title": task_dict['title']})
        ))
        
        # 提交事务
        conn.commit()
        
        # 7. 返回成功
        task_dict['claimed_by'] = request.agent_id
        task_dict['claimed_at'] = now
        task_dict['status'] = 'ASSIGNED'
        
        return {
            "success": True,
            "task": task_dict,
            "message": "认领成功"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/api/tasks/{task_id}/release")
async def release_task(task_id: str, request: ReleaseRequest):
    """
    释放任务 (超时/放弃)
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("BEGIN IMMEDIATE")
        
        # 1. 查询任务
        cursor.execute(
            "SELECT * FROM tasks WHERE id = ?",
            (task_id,)
        )
        task = cursor.fetchone()
        
        if not task:
            conn.rollback()
            raise HTTPException(status_code=404, detail="任务不存在")
        
        task_dict = dict_from_row(task)
        
        # 2. 检查是否是认领者释放
        if task_dict['claimed_by'] != request.agent_id:
            conn.rollback()
            return {
                "success": False,
                "error": "只有认领者才能释放任务"
            }
        
        # 3. 释放任务
        cursor.execute("""
            UPDATE tasks 
            SET status = 'AVAILABLE',
                claimed_by = NULL,
                claimed_at = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (task_id,))
        
        # 4. 更新 Agent 状态
        cursor.execute("""
            UPDATE agents 
            SET status = 'IDLE',
                current_task_id = NULL
            WHERE id = ?
        """, (request.agent_id,))
        
        # 5. 记录日志
        cursor.execute("""
            INSERT INTO activity_logs (agent_id, action, task_id, details)
            VALUES (?, ?, ?, ?)
        """, (
            request.agent_id,
            'release',
            task_id,
            json.dumps({"reason": request.reason})
        ))
        
        conn.commit()
        
        return {
            "success": True,
            "message": "任务已释放"
        }
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.put("/api/tasks/{task_id}/progress")
async def update_progress(task_id: str, request: ProgressRequest):
    """
    更新任务进度
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 1. 检查任务
        cursor.execute(
            "SELECT * FROM tasks WHERE id = ? AND claimed_by = ?",
            (task_id, request.agent_id)
        )
        task = cursor.fetchone()
        
        if not task:
            raise HTTPException(status_code=404, detail="任务不存在或不是你的任务")
        
        # 2. 更新进度
        now = datetime.now().isoformat()
        cursor.execute("""
            UPDATE tasks 
            SET progress = ?,
                updated_at = ?
            WHERE id = ?
        """, (request.progress, now, task_id))
        
        # 3. 记录日志
        cursor.execute("""
            INSERT INTO activity_logs (agent_id, action, task_id, details)
            VALUES (?, ?, ?, ?)
        """, (
            request.agent_id,
            'update_progress',
            task_id,
            json.dumps({"progress": request.progress})
        ))
        
        conn.commit()
        
        return {
            "success": True,
            "message": "进度已更新"
        }
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/api/tasks/{task_id}/complete")
async def complete_task(task_id: str, request: CompleteRequest):
    """
    完成任务
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("BEGIN IMMEDIATE")
        
        # 1. 检查任务
        cursor.execute(
            "SELECT * FROM tasks WHERE id = ? AND claimed_by = ?",
            (task_id, request.agent_id)
        )
        task = cursor.fetchone()
        
        if not task:
            conn.rollback()
            raise HTTPException(status_code=404, detail="任务不存在或不是你的任务")
        
        # 2. 更新任务状态
        now = datetime.now().isoformat()
        cursor.execute("""
            UPDATE tasks 
            SET status = 'COMPLETED',
                progress = 100,
                updated_at = ?,
                completed_at = ?
            WHERE id = ?
        """, (now, now, task_id))
        
        # 3. 更新 Agent 状态
        cursor.execute("""
            UPDATE agents 
            SET status = 'IDLE',
                current_task_id = NULL,
                completed_tasks = completed_tasks + 1,
                last_active_at = ?
            WHERE id = ?
        """, (now, request.agent_id))
        
        # 4. 记录日志
        cursor.execute("""
            INSERT INTO activity_logs (agent_id, action, task_id, details)
            VALUES (?, ?, ?, ?)
        """, (
            request.agent_id,
            'complete',
            task_id,
            json.dumps({"deliverable": request.deliverable})
        ))
        
        conn.commit()
        
        return {
            "success": True,
            "message": "任务已完成"
        }
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/api/activity/logs")
async def get_activity_logs(
    agent_id: Optional[str] = None,
    task_id: Optional[str] = None,
    limit: int = 50
):
    """
    获取活动日志
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM activity_logs WHERE 1=1"
    params = []
    
    if agent_id:
        query += " AND agent_id = ?"
        params.append(agent_id)
    
    if task_id:
        query += " AND task_id = ?"
        params.append(task_id)
    
    query += " ORDER BY created_at DESC LIMIT ?"
    params.append(limit)
    
    cursor.execute(query, params)
    logs = [dict_from_row(row) for row in cursor.fetchall()]
    conn.close()
    
    return {
        "success": True,
        "data": logs,
        "count": len(logs)
    }

@app.get("/api/agents/{agent_id}/status")
async def get_agent_status(agent_id: str):
    """
    获取 Agent 状态
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT * FROM agents WHERE id = ?",
        (agent_id,)
    )
    agent = cursor.fetchone()
    conn.close()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent 不存在")
    
    return {
        "success": True,
        "data": dict_from_row(agent)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=6565)
