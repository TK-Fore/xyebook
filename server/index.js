// 小羊书吧 - 后端API服务
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const novelRoutes = require('./routes/novels');
const chapterRoutes = require('./routes/chapters');
const userRoutes = require('./routes/user');
const commentRoutes = require('./routes/comments');
const ratingRoutes = require('./routes/ratings');
const shareRoutes = require('./routes/share');
const weatherRoutes = require('./routes/weather');
const { logger, errorHandler, rateLimiter } = require('./middleware');

const app = express();

// 全局限流 - 每分钟100次请求
app.use(rateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 100,
  message: '请求过于频繁，请稍后再试'
}));

// 请求日志
app.use(logger);

// 中间件
app.use(cors());
app.use(express.json());

// 静态文件路径处理 - Vercel 和本地兼容
let staticPath;
if (process.env.VERCEL) {
  // Vercel 环境
  staticPath = path.join(process.cwd(), 'client', 'dist');
} else {
  // 本地环境
  staticPath = path.join(__dirname, '..', 'client', 'dist');
}
app.use(express.static(staticPath));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/novels', novelRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/user', userRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/weather', weatherRoutes);

// 健康检查（必须在SPA fallback之前）
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

// 全局错误处理（必须放在所有路由之后）
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
