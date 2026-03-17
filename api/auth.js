// 认证路由 - Vercel Serverless Function
const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');
const { findUserByUsername, findUserById, createUser } = require('../server/services/user');

const app = express();
app.use(cors());
app.use(express.json());

// 注册
app.post('/register', (req, res) => {
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
app.post('/login', (req, res) => {
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

module.exports = serverless(app);
