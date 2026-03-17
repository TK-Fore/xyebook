// 用户路由
const express = require('express');
const router = express.Router();
const { findUserById, updateUserFavorites, addHistory } = require('../services/user');
const { validate, AppError } = require('../middleware');
const { businessLogger } = require('../middleware/logger');

// 认证中间件
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    const error = new Error('未授权');
    error.name = 'UnauthorizedError';
    return next(error);
  }
  
  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    req.userId = decoded.userId;
    next();
  } catch (error) {
    const err = new Error('无效的token');
    err.name = 'UnauthorizedError';
    return next(err);
  }
}

// 获取用户信息
router.get('/profile', authMiddleware, (req, res, next) => {
  const user = findUserById(req.userId);
  
  if (!user) {
    const error = new Error('用户不存在');
    error.statusCode = 404;
    error.errorCode = 'USER_NOT_FOUND';
    return next(error);
  }
  
  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      favorites: user.favorites
    }
  });
});

// 收藏小说 - 添加验证
router.post('/favorite', authMiddleware, validate('favorite'), (req, res, next) => {
  const { novelId } = req.body;
  
  const user = updateUserFavorites(req.userId, novelId, 'add');
  
  businessLogger.info('NOVEL_FAVORITED', { userId: req.userId, novelId });
  
  res.json({ 
    success: true, 
    favorites: user.favorites 
  });
});

// 取消收藏
router.delete('/favorite/:novelId', authMiddleware, (req, res, next) => {
  const user = updateUserFavorites(req.userId, req.params.novelId, 'remove');
  
  businessLogger.info('NOVEL_UNFAVORITED', { userId: req.userId, novelId: req.params.novelId });
  
  res.json({ 
    success: true, 
    favorites: user.favorites 
  });
});

// 获取收藏列表
router.get('/favorites', authMiddleware, (req, res, next) => {
  const user = findUserById(req.userId);
  
  if (!user) {
    const error = new Error('用户不存在');
    error.statusCode = 404;
    return next(error);
  }
  
  // 返回收藏的novelId列表
  const favorites = user.favorites.map(novelId => ({ novelId }));
  res.json({ success: true, favorites });
});

// 保存阅读历史 - 添加验证
router.post('/history', authMiddleware, validate('history'), (req, res, next) => {
  const { novelId, chapterId } = req.body;
  
  const user = addHistory(req.userId, {
    novelId,
    chapterId,
    timestamp: Date.now()
  });
  
  businessLogger.info('READING_HISTORY_ADDED', { userId: req.userId, novelId, chapterId });
  
  res.json({ success: true });
});

// 获取阅读历史
router.get('/history', authMiddleware, (req, res, next) => {
  const user = findUserById(req.userId);
  
  if (!user) {
    const error = new Error('用户不存在');
    error.statusCode = 404;
    return next(error);
  }
  
  res.json({ success: true, history: user.history });
});

module.exports = router;
