// 评论路由
const express = require('express');
const router = express.Router();
const { findUserById } = require('../services/user');
const { validate } = require('../middleware');
const { businessLogger } = require('../middleware/logger');

// 内存存储评论
const comments = [];
// 存储点赞记录（commentId -> [ip, ...])
const commentLikes = {};

// 获取小说评论
router.get('/:novelId', (req, res, next) => {
  const novelComments = comments
    .filter(c => c.novelId === req.params.novelId)
    .sort((a, b) => b.createdAt - a.createdAt);
  
  // 添加点赞数到返回数据
  const commentsWithLikes = novelComments.map(c => ({
    ...c,
    likes: commentLikes[c.id] ? commentLikes[c.id].length : 0
  }));
  
  res.json({ success: true, comments: commentsWithLikes });
});

// 添加评论 - 添加验证
router.post('/', validate('comment'), (req, res, next) => {
  const { novelId, content, anonymous, replyTo } = req.body;
  
  // 从token获取用户信息
  let author = '匿名用户';
  let userId = null;
  
  const authHeader = req.headers.authorization;
  if (authHeader && !anonymous) {
    try {
      const token = authHeader.replace('Bearer ', '');
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      userId = decoded.userId;
      
      const user = findUserById(userId);
      if (user) {
        author = user.username;
      }
    } catch (e) {
      // token解析失败，保持匿名
    }
  }
  
  const comment = {
    id: String(comments.length + 1),
    novelId,
    content,
    author,
    anonymous: !!anonymous,
    userId,
    replyTo,
    createdAt: Date.now(),
    created_at: new Date().toISOString()
  };
  
  comments.push(comment);
  commentLikes[comment.id] = [];
  
  businessLogger.info('COMMENT_ADDED', { 
    commentId: comment.id, 
    novelId, 
    userId, 
    anonymous: !!anonymous 
  });
  
  res.json({ success: true, comment });
});

// 评论点赞
router.post('/:commentId/like', (req, res, next) => {
  const commentId = req.params.commentId;
  const clientIp = req.ip || req.connection.remoteAddress;
  
  // 查找评论
  const comment = comments.find(c => c.id === commentId);
  if (!comment) {
    return res.status(404).json({ success: false, message: '评论不存在' });
  }
  
  // 初始化点赞记录
  if (!commentLikes[commentId]) {
    commentLikes[commentId] = [];
  }
  
  // 检查是否已点赞
  if (commentLikes[commentId].includes(clientIp)) {
    return res.status(400).json({ success: false, message: '你已经点赞过了' });
  }
  
  // 添加点赞
  commentLikes[commentId].push(clientIp);
  
  res.json({ 
    success: true, 
    likes: commentLikes[commentId].length 
  });
});

module.exports = router;
