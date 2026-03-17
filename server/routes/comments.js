// 评论路由
const express = require('express');
const router = express.Router();
const { findUserById } = require('../services/user');

// 内存存储评论
const comments = [];

// 获取小说评论
router.get('/:novelId', (req, res) => {
  const novelComments = comments
    .filter(c => c.novelId === req.params.novelId)
    .sort((a, b) => b.createdAt - a.createdAt);
  
  res.json({ comments: novelComments });
});

// 添加评论
router.post('/', (req, res) => {
  const { novelId, content, anonymous } = req.body;
  
  if (!novelId || !content) {
    return res.status(400).json({ message: '缺少必要参数' });
  }
  
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
    createdAt: Date.now(),
    created_at: new Date().toISOString()
  };
  
  comments.push(comment);
  
  res.json({ success: true, comment });
});

module.exports = router;
