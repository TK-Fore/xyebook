# 🐑 小羊书吧

一个优雅的小说阅读网站，基于 React + Node.js + 飞书多维表格构建。

![小羊书吧](https://via.placeholder.com/800x400/89CFF0/ffffff?text=小羊书吧)

## ✨ 特性

- 📚 丰富的小说库 - 多种分类可选
- 🌙 夜间模式 - 舒适的阅读体验
- 🔤 字体大小调节 - 个性化阅读
- ❤️ 收藏功能 - 记录喜爱的小说
- 💬 评论系统 - 支持匿名评论
- 📖 阅读历史 - 继续上次的阅读

## 🛠 技术栈

- **前端**: React 18 + Vite + React Router
- **后端**: Node.js + Express
- **数据源**: 飞书多维表格
- **部署**: Vercel

## 🚀 快速开始

### 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装前端依赖
cd client && npm install
```

### 开发模式

```bash
# 同时启动前端和后端
npm run dev

# 或分别启动
npm run server  # 后端: http://localhost:3000
cd client && npm run dev  # 前端: http://localhost:5173
```

### 生产构建

```bash
npm run build
```

## 📁 项目结构

```
xyebook/
├── client/                 # React 前端
│   ├── src/
│   │   ├── components/    # 公共组件
│   │   ├── pages/        # 页面组件
│   │   ├── services/    # API 服务
│   │   └── styles/      # 样式文件
│   └── index.html
├── server/                 # Node.js 后端
│   ├── routes/           # API 路由
│   ├── services/        # 业务逻辑
│   └── index.js
├── vercel.json           # Vercel 配置
└── SPEC.md              # 项目规范
```

## 🌐 API 文档

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/novels | 获取小说列表 |
| GET | /api/novels/:id | 获取小说详情 |
| GET | /api/novels/:id/chapters | 获取章节列表 |
| GET | /api/chapters/:id | 获取章节内容 |
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| POST | /api/user/favorite | 收藏小说 |
| DELETE | /api/user/favorite/:id | 取消收藏 |
| POST | /api/comments | 添加评论 |
| GET | /api/comments/:novelId | 获取评论 |

## 🎨 主题色

- 主色: `#89CFF0` (淡蓝)
- 深色: `#5DADE2`
- 浅色: `#B0E0E6`

## 📝 许可证

MIT License
