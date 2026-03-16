#!/usr/bin/env python3
"""
评审打分 API - Phase 6
功能：评审任务、打分、批准/拒绝、返工
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import sqlite3
import json
from datetime import datetime

app = FastAPI(title="Review API", version="1.0.0")

DB_PATH = "/home/admin/.openclaw/workspace/task-board/database/task-board.db"

# ============ 数据模型 ============

class ReviewRequest(BaseModel):
    task_id: str
    reviewer_id: str
    score: int  # 1-5
    decision: str  # APPROVED/REJECTED
    comments: Optional[str] = ""

class ScoreChangeRequest(BaseModel):
    agent_id: str
    score_change: int
    reason: str
    task_id: Optional[str] = None

# ============ 数据库工具 ============

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def dict_from_row(row):
    return dict(zip(row.keys(), row))

# ============ API 端点 ============

@app.get("/")
async def root():
    return {"message": "Review API", "version": "1.0.0"}

@app.post("/api/reviews")
async def create_review(request: ReviewRequest):
    """
    创建评审 - 评审任务并打分
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("BEGIN IMMEDIATE")
        
        # 1. 检查任务是否存在
        cursor.execute(
            "SELECT * FROM tasks WHERE id = ? AND status = 'REVIEW'",
            (request.task_id,)
        )
        task = cursor.fetchone()
        
        if not task:
            conn.rollback()
            raise HTTPException(status_code=404, detail="任务不存在或不在评审状态")
        
        task_dict = dict_from_row(task)
        
        # 2. 检查评审者是否存在
        cursor.execute(
            "SELECT * FROM agents WHERE id = ?",
            (request.reviewer_id,)
        )
        reviewer = cursor.fetchone()
        
        if not reviewer:
            conn.rollback()
            raise HTTPException(status_code=404, detail="评审者不存在")
        
        # 3. 创建评审记录
        now = datetime.now().isoformat()
        cursor.execute("""
            INSERT INTO reviews (task_id, reviewer_id, score, decision, comments, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (request.task_id, request.reviewer_id, request.score, request.decision, request.comments, now, now))
        
        review_id = cursor.lastrowid
        
        # 4. 根据评审结果处理
        if request.decision == 'APPROVED':
            # 任务完成
            cursor.execute("""
                UPDATE tasks 
                SET status = 'COMPLETED',
                    updated_at = ?
                WHERE id = ?
            """, (now, request.task_id))
            
            # 给执行者加分
            executor = task_dict['claimed_by']
            if executor:
                # 完成任务 +10 分
                cursor.execute("""
                    INSERT INTO scores (agent_id, task_id, score_change, reason, created_at)
                    VALUES (?, ?, ?, ?, ?)
                """, (executor, request.task_id, 10, '完成任务', now))
                
                # 评审通过 +5 分
                if request.score >= 4:
                    cursor.execute("""
                        INSERT INTO scores (agent_id, task_id, score_change, reason, created_at)
                        VALUES (?, ?, ?, ?, ?)
                    """, (executor, request.task_id, 5, '评审通过', now))
                
                # 评审优秀 (5 分) +10 分
                if request.score == 5:
                    cursor.execute("""
                        INSERT INTO scores (agent_id, task_id, score_change, reason, created_at)
                        VALUES (?, ?, ?, ?, ?)
                    """, (executor, request.task_id, 10, '评审优秀', now))
                
                # 更新 Agent 总分
                cursor.execute("""
                    UPDATE agents SET score = score + ? WHERE id = ?
                """, (10 + (5 if request.score >= 4 else 0) + (10 if request.score == 5 else 0), executor))
        
        elif request.decision == 'REJECTED':
            # 任务返工
            cursor.execute("""
                UPDATE tasks 
                SET status = 'IN_PROGRESS',
                    claimed_by = ?,
                    updated_at = ?
                WHERE id = ?
            """, (task_dict['claimed_by'], now, request.task_id))
            
            # 给执行者扣分
            executor = task_dict['claimed_by']
            if executor:
                cursor.execute("""
                    INSERT INTO scores (agent_id, task_id, score_change, reason, created_at)
                    VALUES (?, ?, ?, ?, ?)
                """, (executor, request.task_id, -5, '评审不通过', now))
                
                cursor.execute("""
                    UPDATE agents SET score = score - 5 WHERE id = ?
                """, (executor,))
        
        # 5. 给评审者加分
        cursor.execute("""
            INSERT INTO scores (agent_id, task_id, score_change, reason, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (request.reviewer_id, request.task_id, 2, '完成评审', now))
        
        cursor.execute("""
            UPDATE agents SET score = score + 2, review_count = review_count + 1 WHERE id = ?
        """, (request.reviewer_id,))
        
        # 6. 记录活动日志
        cursor.execute("""
            INSERT INTO activity_logs (agent_id, action, task_id, details)
            VALUES (?, ?, ?, ?)
        """, (
            request.reviewer_id,
            'review',
            request.task_id,
            json.dumps({
                "score": request.score,
                "decision": request.decision,
                "comments": request.comments,
                "review_id": review_id
            })
        ))
        
        conn.commit()
        
        return {
            "success": True,
            "review_id": review_id,
            "decision": request.decision,
            "score": request.score,
            "message": "评审完成" + ("，任务已批准" if request.decision == 'APPROVED' else "，任务需返工")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/api/reviews/task/{task_id}")
async def get_task_reviews(task_id: str):
    """
    获取任务的评审记录
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT r.*, a.name as reviewer_name
        FROM reviews r
        LEFT JOIN agents a ON r.reviewer_id = a.id
        WHERE r.task_id = ?
        ORDER BY r.created_at DESC
    """, (task_id,))
    
    reviews = [dict_from_row(row) for row in cursor.fetchall()]
    conn.close()
    
    return {
        "success": True,
        "data": reviews,
        "count": len(reviews)
    }

@app.post("/api/tasks/{task_id}/submit-review")
async def submit_for_review(task_id: str, agent_id: str):
    """
    提交任务评审 - 完成任务后提交评审
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 1. 检查任务
        cursor.execute(
            "SELECT * FROM tasks WHERE id = ? AND claimed_by = ?",
            (task_id, agent_id)
        )
        task = cursor.fetchone()
        
        if not task:
            raise HTTPException(status_code=404, detail="任务不存在或不是你的任务")
        
        # 2. 更新状态为评审中
        now = datetime.now().isoformat()
        cursor.execute("""
            UPDATE tasks 
            SET status = 'REVIEW',
                progress = 100,
                updated_at = ?
            WHERE id = ?
        """, (now, task_id))
        
        # 3. 记录日志
        cursor.execute("""
            INSERT INTO activity_logs (agent_id, action, task_id, details)
            VALUES (?, ?, ?, ?)
        """, (agent_id, 'submit_review', task_id, json.dumps({"submitted_at": now})))
        
        conn.commit()
        
        return {
            "success": True,
            "message": "任务已提交评审，等待评审者审核"
        }
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/api/reviews/pending")
async def get_pending_reviews():
    """
    获取待评审任务列表
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT t.*, a.name as executor_name
        FROM tasks t
        LEFT JOIN agents a ON t.claimed_by = a.id
        WHERE t.status = 'REVIEW'
        ORDER BY t.priority, t.created_at
    """)
    
    tasks = [dict_from_row(row) for row in cursor.fetchall()]
    conn.close()
    
    return {
        "success": True,
        "data": tasks,
        "count": len(tasks)
    }

@app.get("/api/scores/{agent_id}")
async def get_agent_scores(agent_id: str, limit: int = 50):
    """
    获取 Agent 评分记录
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT s.*, t.title as task_title
        FROM scores s
        LEFT JOIN tasks t ON s.task_id = t.id
        WHERE s.agent_id = ?
        ORDER BY s.created_at DESC
        LIMIT ?
    """, (agent_id, limit))
    
    scores = [dict_from_row(row) for row in cursor.fetchall()]
    
    # 获取总分
    cursor.execute("""
        SELECT score, review_count, avg_score, approval_rate
        FROM agents WHERE id = ?
    """, (agent_id,))
    
    agent = cursor.fetchone()
    conn.close()
    
    return {
        "success": True,
        "data": {
            "scores": scores,
            "total_score": agent['score'] if agent else 0,
            "review_count": agent['review_count'] if agent else 0
        },
        "count": len(scores)
    }

@app.get("/api/scores/leaderboard")
async def get_leaderboard():
    """
    获取 Agent 排行榜
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, name, role, score, completed_tasks, review_count, avg_score, approval_rate
        FROM agents
        ORDER BY score DESC, completed_tasks DESC
    """)
    
    agents = [dict_from_row(row) for row in cursor.fetchall()]
    conn.close()
    
    return {
        "success": True,
        "data": agents,
        "count": len(agents)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=6566)
