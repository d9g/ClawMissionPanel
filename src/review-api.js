/**
 * 评审任务 API
 * 提供评审任务的读取和管理功能
 */

const fs = require('fs');
const path = require('path');

const REVIEWS_DIR = path.join(__dirname, '../reviews');

/**
 * 获取所有评审任务
 * @returns {Array} 评审任务列表
 */
function getAllReviews() {
  try {
    if (!fs.existsSync(REVIEWS_DIR)) {
      return [];
    }

    const files = fs.readdirSync(REVIEWS_DIR);
    const reviews = [];

    for (const file of files) {
      if (file.endsWith('.md') && !file.includes('-RESULT')) {
        const reviewId = file.replace('.md', '');
        const review = getReviewById(reviewId);
        if (review) {
          reviews.push(review);
        }
      }
    }

    // 按创建时间倒序
    reviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return reviews;
  } catch (error) {
    console.error('获取评审任务失败:', error);
    return [];
  }
}

/**
 * 根据 ID 获取评审任务
 * @param {string} reviewId - 评审 ID
 * @returns {Object|null} 评审任务对象
 */
function getReviewById(reviewId) {
  try {
    const filePath = path.join(REVIEWS_DIR, `${reviewId}.md`);
    
    if (!fs.existsSync(filePath)) {
      console.error(`文件不存在：${filePath}`);
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const review = parseReviewContent(content, reviewId);
    
    console.log(`解析结果 ${reviewId}:`, JSON.stringify(review, null, 2));

    // 检查是否有评审结果
    const resultPath = path.join(REVIEWS_DIR, `${reviewId}-RESULT.md`);
    if (fs.existsSync(resultPath)) {
      review.hasResult = true;
      const resultContent = fs.readFileSync(resultPath, 'utf8');
      review.result = parseReviewResult(resultContent);
    } else {
      review.hasResult = false;
      review.result = null;
    }

    return review;
  } catch (error) {
    console.error(`获取评审任务 ${reviewId} 失败:`, error);
    return null;
  }
}

/**
 * 解析评审文件内容
 * @param {string} content - 文件内容
 * @param {string} reviewId - 评审 ID
 * @returns {Object} 评审对象
 */
function parseReviewContent(content, reviewId) {
  const review = {
    review_id: reviewId,
    title: '',
    status: 'PENDING', // PENDING, IN_PROGRESS, COMPLETED
    created_at: null,
    deadline: null,
    reviewer: '',
    creator: '',
    review_objects: [],
    priority: '',
  };

  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 提取标题 (第一个 # 标题)
    if (!review.title && (line.startsWith('# ') || line.startsWith('## '))) {
      review.title = line.replace(/^#+\s*/, '').trim();
    }

    // 提取评审 ID
    if (line.startsWith('**评审 ID**:') || line.startsWith('**Review ID**:')) {
      review.review_id = line.split(':')[1].trim();
    }

    // 提取评审对象
    if (line.startsWith('**评审对象**:') || line.startsWith('**Review Objects**:')) {
      let j = i + 1;
      while (j < lines.length && lines[j].trim().startsWith('-')) {
        review.review_objects.push(lines[j].trim().replace(/^-/, '').trim());
        j++;
      }
    }

    // 提取评审者
    if (line.startsWith('**评审者**:') || line.startsWith('**Reviewer**:')) {
      review.reviewer = line.split(':')[1].trim();
    }

    // 提取创建者
    if (line.startsWith('**创建者**:') || line.startsWith('**Creator**:')) {
      review.creator = line.split(':')[1].trim();
    }

    // 提取创建时间
    if (line.startsWith('**创建时间**:') || line.startsWith('**Created**:')) {
      review.created_at = line.split(':')[1].trim();
    }

    // 提取截止时间
    if (line.startsWith('**截止时间**:') || line.startsWith('**Deadline**:')) {
      review.deadline = line.split(':')[1].trim();
    }

    // 提取优先级
    if (line.startsWith('**优先级**:') || line.startsWith('**Priority**:')) {
      review.priority = line.split(':')[1].trim();
    }

    // 提取状态
    if (line.startsWith('**评审状态**:') || line.startsWith('**Status**:')) {
      const statusText = line.split(':')[1].trim();
      if (statusText.includes('待评审')) {
        review.status = 'PENDING';
      } else if (statusText.includes('进行中')) {
        review.status = 'IN_PROGRESS';
      } else if (statusText.includes('已完成')) {
        review.status = 'COMPLETED';
      }
    }
  }

  return review;
}

/**
 * 解析评审结果
 * @param {string} content - 结果文件内容
 * @returns {Object} 评审结果对象
 */
function parseReviewResult(content) {
  const result = {
    conclusion: '', // APPROVED, CONDITIONAL_APPROVED, REJECTED
    advantages: [],
    critical_issues: [],
    suggestions: [],
    answers: {},
  };

  const lines = content.split('\n');
  let currentSection = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('**结果**:') || trimmed.startsWith('**Result**:')) {
      const status = trimmed.split(':')[1].trim();
      if (status.includes('通过')) {
        result.conclusion = 'APPROVED';
      } else if (status.includes('有条件通过')) {
        result.conclusion = 'CONDITIONAL_APPROVED';
      } else if (status.includes('不通过')) {
        result.conclusion = 'REJECTED';
      }
    } else if (trimmed.startsWith('### 优点') || trimmed.startsWith('### Advantages')) {
      currentSection = 'advantages';
    } else if (trimmed.startsWith('### 严重问题') || trimmed.startsWith('### Critical Issues')) {
      currentSection = 'critical_issues';
    } else if (trimmed.startsWith('### 改进建议') || trimmed.startsWith('### Suggestions')) {
      currentSection = 'suggestions';
    } else if (trimmed.startsWith('### 待决策问题回答') || trimmed.startsWith('### Answers')) {
      currentSection = 'answers';
    } else if (trimmed.startsWith('-') || trimmed.startsWith('1.')) {
      const text = trimmed.replace(/^[-0-9.]+\s*/, '').trim();
      if (currentSection && text) {
        if (currentSection === 'answers') {
          const answerMatch = text.match(/^(\d+)\.\s*(.+)$/);
          if (answerMatch) {
            result.answers[answerMatch[1]] = answerMatch[2];
          }
        } else {
          result[currentSection].push(text);
        }
      }
    }
  }

  return result;
}

/**
 * 获取待评审任务
 * @returns {Array} 待评审任务列表
 */
function getPendingReviews() {
  const allReviews = getAllReviews();
  return allReviews.filter(r => r.status === 'PENDING');
}

/**
 * 获取进行中的评审
 * @returns {Array} 进行中评审列表
 */
function getInProgressReviews() {
  const allReviews = getAllReviews();
  return allReviews.filter(r => r.status === 'IN_PROGRESS');
}

/**
 * 获取已完成的评审
 * @returns {Array} 已完成评审列表
 */
function getCompletedReviews() {
  const allReviews = getAllReviews();
  return allReviews.filter(r => r.status === 'COMPLETED' || r.hasResult);
}

module.exports = {
  getAllReviews,
  getReviewById,
  getPendingReviews,
  getInProgressReviews,
  getCompletedReviews,
};
