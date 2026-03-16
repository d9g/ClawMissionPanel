#!/usr/bin/env python3
"""
循环任务 API - Phase 10
功能：创建循环任务、自动触发子任务、管理循环配置
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import sqlite3
import json
from datetime import datetime, timedelta
import re

app = FastAPI(title="Recurring Tasks API", version="1.0.0")

DB_PATH = "/home/admin/.openclaw/workspace/task-board/database/task-board.db"

# ============ 数据模型 ============

class RecurringTaskCreate(BaseModel):
    parent_task_id: str
    recurring_type: str  # daily/weekly/monthly/custom
    time_of_day: str  # HH:MM
    day_of_week: Optional[str] = None  # 1-7
    day_of_month: Optional[str] = None  # 1-31
    cron_expression: Optional[str] = None
    enabled: bool = True

class RecurringTaskUpdate(BaseModel):
    enabled: Optional[bool] = None
    time_of_day: Optional[str] = None
    day_of_week: Optional[str] = None
    day_of_month: Optional[str] = None

# ============ 数据库工具 ============

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def dict_from_row(row):
    return dict(zip(row.keys(), row))

# ============ 工具函数 ============

def calculate_next_run(recurring_type, time_of_day, day_of_week=None, day_of_month=None, cron_expression=None):
    """计算下次执行时间"""
    now = datetime.now()
    
    if recurring_type == 'daily':
        # 每天执行
        hour, minute = map(int, time_of_day.split(':'))
        next_run = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        if next_run <= now:
            next_run += timedelta(days=1)
    
    elif recurring_type == 'weekly':
        # 每周执行
        hour, minute = map(int, time_of_day.split(':'))
        target_weekday = int(day_of_week) - 1 if day_of_week else 0  # Python: 0=Monday
        days_ahead = target_weekday - now.weekday()
        if days_ahead < 0:
            days_ahead += 7
        next_run = now.replace(hour=hour, minute=minute, second=0, microsecond=0) + timedelta(days=days_ahead)
        if next_run <= now:
            next_run += timedelta(weeks=1)
    
    elif recurring_type == 'monthly':
        # 每月执行
        hour, minute = map(int, time_of_day.split(':'))
        target_day = int(day_of_month) if day_of_month else 1
        if now.day >= target_day:
            if now.month == 12:
                next_run = now.replace(year=now.year+1, month=1, day=target_day, hour=hour, minute=minute, second=0, microsecond=0)
            else:
                next_run = now.replace(month=now.month+1, day=target_day, hour=hour, minute=minute, second=0, microsecond=0)
        else:
            next_run = now.replace(day=target_day, hour=hour, minute=minute, second=0, microsecond=0)
    
    elif recurring_type == 'custom' and cron_expression:
        # 自定义 CRON (简化实现，实际应使用 croniter 库)
        next_run = now + timedelta(hours=1)
    
    else:
        next_run = now + timedelta(days=1)
    
    return next_run

def create_child_task(cursor, parent_task_id, run_number, scheduled_time):
    """创建子任务"""
    
    # 1. 获取父任务信息
    cursor.execute("SELECT * FROM tasks WHERE id = ?", (parent_task_id,))
    parent = cursor.fetchone()
    
    if not parent:
        return None
    
    # 2. 生成子任务 ID
    child_id = f"{parent_task_id}-RUN{run_number}"
    now = datetime.now().isoformat()
    
    # 3. 创建子任务
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
            "scheduled_time": scheduled_time.isoformat(),
            "created_at": now
        })
    ))
    
    # 4. 记录子任务关联
    cursor.execute("""
        INSERT INTO child_tasks (parent_task_id, child_task_id, run_number, scheduled_time)
        VALUES (?, ?, ?, ?)
    """, (parent_task_id, child_id, run_number, scheduled_time))
    
    # 5. 更新父任务的运行次数
    cursor.execute("""
        UPDATE tasks SET run_number = run_number + 1 WHERE id = ?
    """, (parent_task_id,))
    
    return child_id

# ============ API 端点 ============

@app.get("/")
async def root():
    return {"message": "Recurring Tasks API", "version": "1.0.0"}

@app.post("/api/recurring-tasks")
async def create_recurring_task(request: RecurringTaskCreate):
    """
    创建循环任务配置
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 1. 检查父任务是否存在
        cursor.execute("SELECT * FROM tasks WHERE id = ?", (request.parent_task_id,))
        parent = cursor.fetchone()
        
        if not parent:
            raise HTTPException(status_code=404, detail="父任务不存在")
        
        # 2. 计算下次执行时间
        next_run = calculate_next_run(
            request.recurring_type,
            request.time_of_day,
            request.day_of_week,
            request.day_of_month,
            request.cron_expression
        )
        
        # 3. 创建循环配置
        now = datetime.now().isoformat()
        cursor.execute("""
            INSERT INTO recurring_tasks 
            (parent_task_id, recurring_type, cron_expression, time_of_day, day_of_week, day_of_month, enabled, next_run_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            request.parent_task_id,
            request.recurring_type,
            request.cron_expression,
            request.time_of_day,
            request.day_of_week,
            request.day_of_month,
            1 if request.enabled else 0,
            next_run.isoformat(),
            now,
            now
        ))
        
        recurring_id = cursor.lastrowid
        
        # 4. 更新父任务标记
        cursor.execute("""
            UPDATE tasks 
            SET is_recurring = 1, recurring_config_id = ?
            WHERE id = ?
        """, (recurring_id, request.parent_task_id))
        
        # 5. 创建第一个子任务
        child_id = create_child_task(cursor, request.parent_task_id, 1, next_run)
        
        conn.commit()
        
        return {
            "success": True,
            "recurring_id": recurring_id,
            "next_run": next_run.isoformat(),
            "first_child_id": child_id,
            "message": "循环任务创建成功"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/api/recurring-tasks")
async def list_recurring_tasks(enabled_only: bool = True):
    """
    获取循环任务列表
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
        SELECT r.*, t.title as parent_title
        FROM recurring_tasks r
        LEFT JOIN tasks t ON r.parent_task_id = t.id
    """
    
    if enabled_only:
        query += " WHERE r.enabled = 1"
    
    query += " ORDER BY r.next_run_at ASC"
    
    cursor.execute(query)
    recurring_tasks = [dict_from_row(row) for row in cursor.fetchall()]
    conn.close()
    
    return {
        "success": True,
        "data": recurring_tasks,
        "count": len(recurring_tasks)
    }

@app.put("/api/recurring-tasks/{recurring_id}")
async def update_recurring_task(recurring_id: int, request: RecurringTaskUpdate):
    """
    更新循环任务配置
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 1. 检查配置是否存在
        cursor.execute("SELECT * FROM recurring_tasks WHERE id = ?", (recurring_id,))
        config = cursor.fetchone()
        
        if not config:
            raise HTTPException(status_code=404, detail="循环配置不存在")
        
        # 2. 更新配置
        updates = []
        params = []
        
        if request.enabled is not None:
            updates.append("enabled = ?")
            params.append(1 if request.enabled else 0)
        
        if request.time_of_day:
            updates.append("time_of_day = ?")
            params.append(request.time_of_day)
        
        if request.day_of_week:
            updates.append("day_of_week = ?")
            params.append(request.day_of_week)
        
        if request.day_of_month:
            updates.append("day_of_month = ?")
            params.append(request.day_of_month)
        
        if updates:
            updates.append("updated_at = ?")
            params.append(datetime.now().isoformat())
            params.append(recurring_id)
            
            cursor.execute(f"""
                UPDATE recurring_tasks 
                SET {', '.join(updates)}
                WHERE id = ?
            """, params)
        
        conn.commit()
        
        return {
            "success": True,
            "message": "循环配置已更新"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.delete("/api/recurring-tasks/{recurring_id}")
async def delete_recurring_task(recurring_id: int):
    """
    删除循环任务配置
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 1. 检查配置是否存在
        cursor.execute("SELECT * FROM recurring_tasks WHERE id = ?", (recurring_id,))
        config = cursor.fetchone()
        
        if not config:
            raise HTTPException(status_code=404, detail="循环配置不存在")
        
        # 2. 删除配置
        cursor.execute("DELETE FROM recurring_tasks WHERE id = ?", (recurring_id,))
        
        # 3. 更新父任务标记
        cursor.execute("""
            UPDATE tasks 
            SET is_recurring = 0, recurring_config_id = NULL
            WHERE id = ?
        """, (config['parent_task_id'],))
        
        conn.commit()
        
        return {
            "success": True,
            "message": "循环配置已删除"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/api/recurring-tasks/{recurring_id}/trigger")
async def trigger_recurring_task(recurring_id: int):
    """
    手动触发循环任务 (立即创建子任务)
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 1. 获取配置
        cursor.execute("SELECT * FROM recurring_tasks WHERE id = ?", (recurring_id,))
        config = cursor.fetchone()
        
        if not config:
            raise HTTPException(status_code=404, detail="循环配置不存在")
        
        # 2. 获取当前运行次数
        cursor.execute("SELECT run_number FROM tasks WHERE id = ?", (config['parent_task_id'],))
        parent = cursor.fetchone()
        run_number = (parent['run_number'] if parent else 0) + 1
        
        # 3. 创建子任务
        now = datetime.now()
        child_id = create_child_task(cursor, config['parent_task_id'], run_number, now)
        
        # 4. 更新最后运行时间
        next_run = calculate_next_run(
            config['recurring_type'],
            config['time_of_day'],
            config.get('day_of_week'),
            config.get('day_of_month'),
            config.get('cron_expression')
        )
        
        cursor.execute("""
            UPDATE recurring_tasks 
            SET last_run_at = ?, next_run_at = ?, updated_at = ?
            WHERE id = ?
        """, (now.isoformat(), next_run.isoformat(), now.isoformat(), recurring_id))
        
        conn.commit()
        
        return {
            "success": True,
            "child_id": child_id,
            "run_number": run_number,
            "next_run": next_run.isoformat(),
            "message": "循环任务已触发"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/api/recurring-tasks/{recurring_id}/children")
async def get_recurring_children(recurring_id: int):
    """
    获取循环任务的子任务列表
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT c.*, t.title, t.status, t.progress
        FROM child_tasks c
        LEFT JOIN tasks t ON c.child_task_id = t.id
        WHERE c.parent_task_id = (SELECT parent_task_id FROM recurring_tasks WHERE id = ?)
        ORDER BY c.run_number DESC
    """, (recurring_id,))
    
    children = [dict_from_row(row) for row in cursor.fetchall()]
    conn.close()
    
    return {
        "success": True,
        "data": children,
        "count": len(children)
    }

@app.get("/api/recurring-tasks/check-due")
async def check_due_tasks():
    """
    检查到期需要执行的循环任务 (供 cron 调用)
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    now = datetime.now()
    
    # 查找到期任务
    cursor.execute("""
        SELECT * FROM recurring_tasks 
        WHERE enabled = 1 
          AND next_run_at <= ?
    """, (now.isoformat(),))
    
    due_tasks = cursor.fetchall()
    triggered = []
    
    for task in due_tasks:
        try:
            # 获取当前运行次数
            cursor.execute("SELECT run_number FROM tasks WHERE id = ?", (task['parent_task_id'],))
            parent = cursor.fetchone()
            run_number = (parent['run_number'] if parent else 0) + 1
            
            # 创建子任务
            child_id = create_child_task(cursor, task['parent_task_id'], run_number, now)
            
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
            """, (now.isoformat(), next_run.isoformat(), now.isoformat(), task['id']))
            
            triggered.append({
                "recurring_id": task['id'],
                "child_id": child_id,
                "run_number": run_number,
                "next_run": next_run.isoformat()
            })
            
        except Exception as e:
            print(f"触发循环任务失败 {task['id']}: {str(e)}")
    
    conn.commit()
    conn.close()
    
    return {
        "success": True,
        "triggered": triggered,
        "count": len(triggered)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=6567)
