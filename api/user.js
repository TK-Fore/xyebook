// 用户路由 - Vercel Serverless Function
const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');
const { findUserById, updateUserFavorites, addHistory } = require('../server/services/user');

const app = express();
app.use(cors());
app.use(express.json());

// 认证中间件
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: '未授权' });
  }
  
  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: '无效的token' });
  }
}

// 获取用户信息
app.get('/profile', authMiddleware, (req, res) => {
  const user = findUserById(req.userId);
  
  if (!user) {
    return res.status(404).json({ message: '用户不存在' });
  }
  
  res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      favorites: user.favorites
    }
  });
});

// 收藏小说
app.post('/favorite', authMiddleware, (req, res) => {
  const { novelId } = req.body;
  
  if (!novelId) {
    return res.status(400).json({ message: '缺少novelId' });
  }
  
  const user = updateUserFavorites(req.userId, novelId, 'add');
  
  res.json({ 
    success: true, 
    favorites: user.favorites 
  });
});

// 取消收藏
app.delete('/favorite/:novelId', authMiddleware, (req, res) => {
  const user = updateUserFavorites(req.userId, req.params.novelId, 'remove');
  
  res.json({ 
    success: true, 
    favorites: user.favorites 
  });
});

// 获取收藏列表
app.get('/favorites', authMiddleware, (req, res) => {
  const user = findUserById(req.userId);
  
  if (!user) {
    return res.status(404).json({ message: '用户不存在' });
  }
  
  const favorites = user.favorites.map(novelId => ({ novelId }));
  res.json({ favorites });
});

// 保存阅读历史
app.post('/history', authMiddleware, (req, res) => {
  const { novelId, chapterId } = req.body;
  
  if (!novelId || !chapterId) {
    return res.status(400).json({ message: '缺少必要参数' });
  }
  
  const user = addHistory(req.userId, {
    novelId,
    chapterId,
    timestamp: Date.now()
  });
  
  res.json({ success: true });
});

// 获取阅读历史
app.get('/history', authMiddleware, (req, res) => {
  const user = findUserById(req.userId);
  
  if (!user) {
    return res.status(404).json({ message: '用户不存在' });
  }
  
  res.json({ history: user.history });
});

module.exports = serverless(app);
