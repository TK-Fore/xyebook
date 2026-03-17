// 认证路由
const express = require('express');
const router = express.Router();
const { findUserByUsername, findUserById, createUser } = require('../services/user');
const { validate, loginRateLimiter, registerRateLimiter } = require('../middleware');
const { businessLogger } = require('../middleware/logger');

// 注册 - 添加限流和验证
router.post('/register', registerRateLimiter, validate('register'), (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    
    // 检查用户名是否已存在
    const existingUser = findUserByUsername(username);
    if (existingUser) {
      const error = new Error('用户名已存在');
      error.statusCode = 400;
      error.errorCode = 'USER_EXISTS';
      return next(error);
    }
    
    const user = createUser({ username, email, password });
    
    const token = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64');
    
    businessLogger.info('USER_REGISTERED', { userId: user.id, username: user.username });
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        favorites: user.favorites
      }
    });
  } catch (error) {
    next(error);
  }
});

// 登录 - 添加限流和验证
router.post('/login', loginRateLimiter, validate('login'), (req, res, next) => {
  const { username, password } = req.body;
  
  const user = findUserByUsername(username);
  
  if (!user || user.password !== password) {
    businessLogger.warn('LOGIN_FAILED', { username, reason: 'invalid_credentials' });
    const error = new Error('用户名或密码错误');
    error.statusCode = 401;
    error.errorCode = 'INVALID_CREDENTIALS';
    return next(error);
  }
  
  const token = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64');
  
  businessLogger.info('USER_LOGIN', { userId: user.id, username: user.username });
  
  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      favorites: user.favorites
    }
  });
});

module.exports = router;
