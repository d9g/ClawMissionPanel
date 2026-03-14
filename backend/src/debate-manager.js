/**
 * 辩论会流程管理
 * 版本：v1.0
 * 创建：2026-03-11
 * 开发：小云开发 💻
 * 
 * 功能：小云和小云评委的辩论会流程，包括方案对比、决策提交
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../database/task-board.db');

class DebateManager {
  constructor() {
    this.db = new sqlite3.Database(DB_PATH);
  }

  /**
   * 创建辩论会
   */
  async createDebate(debateData) {
    const debateId = `DEBATE-${Date.now()}`;
    const { task_id, topic, proposer } = debateData;

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO debates (
          debate_id, task_id, topic, proposer,
          status, created_at
        ) VALUES (?, ?, ?, ?, 'OPEN', CURRENT_TIMESTAMP)
      `;

      this.db.run(sql, [debateId, task_id, topic, proposer], function(err) {
        if (err) reject(err);
        else resolve({ debate_id: debateId, status: 'OPEN' });
      });
    });
  }

  /**
   * 提交方案
   */
  async submitProposal(proposalData) {
    const proposalId = `PROP-${Date.now()}`;
    const { debate_id, agent_id, content, rationale } = proposalData;

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO proposals (
          proposal_id, debate_id, agent_id, content,
          rationale, created_at
        ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;

      this.db.run(sql, [proposalId, debate_id, agent_id, content, rationale], function(err) {
        if (err) reject(err);
        else resolve({ proposal_id: proposalId });
      });
    });
  }

  /**
   * 辩论发言
   */
  async addDebateComment(commentData) {
    const commentId = `COMM-${Date.now()}`;
    const { debate_id, agent_id, content, target_proposal_id } = commentData;

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO debate_comments (
          comment_id, debate_id, agent_id, content,
          target_proposal_id, created_at
        ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;

      this.db.run(sql, [commentId, debate_id, agent_id, content, target_proposal_id], function(err) {
        if (err) reject(err);
        else resolve({ comment_id: commentId });
      });
    });
  }

  /**
   * 获取辩论详情
   */
  async getDebateDetails(debateId) {
    const debate = await this.getDebate(debateId);
    const proposals = await this.getProposals(debateId);
    const comments = await this.getComments(debateId);

    return {
      debate,
      proposals,
      comments
    };
  }

  /**
   * 获取辩论
   */
  getDebate(debateId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM debates WHERE debate_id = ?';
      
      this.db.get(sql, [debateId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  /**
   * 获取方案
   */
  getProposals(debateId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM proposals WHERE debate_id = ? ORDER BY created_at';
      
      this.db.all(sql, [debateId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * 获取评论
   */
  getComments(debateId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM debate_comments WHERE debate_id = ? ORDER BY created_at';
      
      this.db.all(sql, [debateId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * 评估方案（自动评估）
   */
  async evaluateProposals(debateId) {
    const proposals = await this.getProposals(debateId);
    
    if (proposals.length < 2) {
      return {
        result: 'INSUFFICIENT',
        message: '方案数量不足，无法评估'
      };
    }

    // 简单评估：比较方案的支持度（评论数）
    const evaluated = await Promise.all(
      proposals.map(async (prop) => {
        const supportCount = await this.getSupportCount(prop.proposal_id);
        return {
          ...prop,
          support_count: supportCount,
          score: supportCount // 简化评分
        };
      })
    );

    // 排序
    evaluated.sort((a, b) => b.score - a.score);

    const best = evaluated[0];
    const second = evaluated[1];

    // 判断是否明显优势
    if (best.score > second.score * 1.5) {
      return {
        result: 'CLEAR_WINNER',
        winner: best,
        message: `方案 ${best.proposal_id} 明显优于其他方案`
      };
    } else {
      return {
        result: 'CLOSE_CALL',
        top_two: [best, second],
        message: '方案势均力敌，建议提交用户决策'
      };
    }
  }

  /**
   * 获取方案支持数
   */
  getSupportCount(proposalId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT COUNT(*) as count FROM debate_comments WHERE target_proposal_id = ?';
      
      this.db.get(sql, [proposalId], (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
  }

  /**
   * 提交用户决策
   */
  async submitToUser(debateId, recommendation) {
    const debate = await this.getDebate(debateId);
    const proposals = await this.getProposals(debateId);
    const evaluation = await this.evaluateProposals(debateId);

    return {
      debate_id: debateId,
      topic: debate.topic,
      proposals: proposals,
      evaluation: evaluation,
      recommendation: recommendation,
      decision_url: `/approvals/debate/${debateId}`
    };
  }

  /**
   * 关闭辩论会
   */
  async closeDebate(debateId, winnerProposalId, reason) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE debates 
        SET status = 'CLOSED',
            winner_proposal_id = ?,
            closed_reason = ?,
            closed_at = CURRENT_TIMESTAMP
        WHERE debate_id = ?
      `;

      this.db.run(sql, [winnerProposalId, reason, debateId], function(err) {
        if (err) reject(err);
        else resolve({ debate_id: debateId, status: 'CLOSED' });
      });
    });
  }

  /**
   * 关闭数据库连接
   */
  close() {
    this.db.close();
  }
}

module.exports = DebateManager;
