// 认证路由
const express = require('express');
const router = express.Router();
const { findUserByUsername, findUserById, createUser } = require('../services/user');
const { validate, loginRateLimiter, registerRateLimiter } = require('../middleware');
const { businessLogger } = require('../middleware/logger');

/**
 * 生成用户Token
 * @param {Object} user - 用户对象
 * @returns {string} base64编码的Token
 * @description 生产环境应使用 JWT 替代简单的 base64 编码
 */
function generateToken(user) {
  return Buffer.from(JSON.stringify({ 
    userId: user.id,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7天过期
  })).toString('base64');
}

/**
 * 验证Token
 * @param {string} token - Token字符串
 * @returns {Object|null} 解码后的用户信息或null
 */
function verifyToken(token) {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    if (decoded.exp && decoded.exp < Date.now()) {
      return null; // Token已过期
    }
    return decoded;
  } catch (e) {
    return null;
  }
}

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
    
    // 使用改进的Token生成函数
    const token = generateToken(user);
    
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
  
  // 使用改进的Token生成函数
  const token = generateToken(user);
  
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
