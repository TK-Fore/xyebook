// 小羊书吧 - 后端API服务
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const novelRoutes = require('./routes/novels');
const chapterRoutes = require('./routes/chapters');
const userRoutes = require('./routes/user');
const commentRoutes = require('./routes/comments');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 静态文件服务（Vercel用/client/dist，本地用../client/dist）
const staticPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(staticPath));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/novels', novelRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/user', userRoutes);
app.use('/api/comments', commentRoutes);

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '服务器错误' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
