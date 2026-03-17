// 认证路由
const express = require('express');
const router = express.Router();
const { findUserByUsername, findUserById, createUser } = require('../services/user');

// 注册
router.post('/register', (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ message: '请填写完整信息' });
    }
    
    const user = createUser({ username, email, password });
    
    const token = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64');
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        favorites: user.favorites
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 登录
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = findUserByUsername(username);
  
  if (!user || user.password !== password) {
    return res.status(401).json({ message: '用户名或密码错误' });
  }
  
  const token = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64');
  
  res.json({
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
