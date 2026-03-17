# 小羊书吧 - 项目规范文档

## 1. 项目概述

- **项目名称**: 小羊书吧
- **项目类型**: 小说阅读网站
- **技术栈**: React (Vite) + Node.js + 飞书多维表格 + Vercel
- **主题色**: 淡蓝色 (#89CFF0, #B0E0E6)
- **目标用户**: 小说读者

## 2. 飞书数据源

### 小说表 (app_token: A6FKb7Sy5aBtJGsMPcpcWIL9nNd)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | 文本 | 小说ID |
| title | 文本 | 小说标题 |
| author | 文本 | 作者 |
| cover | 超链接 | 封面图片 |
| description | 文本 | 简介 |
| category | 单选 | 分类(都市/玄幻/仙侠/历史/科幻/游戏) |
| status | 单选 | 状态(连载中/已完结) |
| word_count | 数字 | 字数 |
| rating | 数字 | 评分 |
| views | 数字 | 阅读量 |
| created_at | 日期 | 创建时间 |

### 章节表 (app_token: Sl1QbktwXaF8dFsYQdCcKeYZnob)
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | 文本 | 章节ID |
| novel_id | 文本 | 小说ID |
| title | 文本 | 章节标题 |
| content | 文本 | 章节内容 |
| chapter_num | 数字 | 章节序号 |
| word_count | 数字 | 字数 |
| created_at | 日期 | 创建时间 |

## 3. UI/UX 规范

### 3.1 布局结构
- **Header**: Logo + 导航 + 搜索框 + 用户头像
- **Main Content**: 响应式网格布局
- **Footer**: 版权信息 + 链接

### 3.2 响应式断点
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### 3.3 色彩方案
```
--primary: #89CFF0 (淡蓝)
--primary-dark: #5DADE2
--primary-light: #B0E0E6
--bg-main: #F8FBFD
--bg-card: #FFFFFF
--text-primary: #2C3E50
--text-secondary: #7F8C8D
--accent: #F39C12 (金色，用于收藏等)
```

### 3.4 字体
- 主字体: "Noto Sans SC", sans-serif
- 阅读字体: "LXGW WenKai", serif

### 3.5 组件
- 小说卡片: 封面 + 标题 + 作者 + 评分
- 章节列表: 序号 + 标题 + 字数
- 阅读器: 夜间模式 + 字体大小调整

## 4. 页面结构

### 4.1 首页 (/)
- 分类筛选标签
- 小说网格展示 (4列桌面/2列移动)
- 搜索框
- 热门推荐

### 4.2 小说详情页 (/novel/:id)
- 小说信息区 (封面 + 标题 + 作者 + 简介)
- 目录区 (章节列表)
- 收藏/阅读按钮
- 评论区域

### 4.3 阅读页 (/read/:novelId/:chapterId)
- 章节标题
- 章节内容
- 上一章/下一章导航
- 夜间模式切换
- 字体大小调整
- 底部章节跳转

### 4.4 用户中心 (/profile)
- 收藏列表
- 阅读历史
- 个人设置

### 4.5 管理后台 (/admin)
- 小说管理
- 章节管理
- 用户管理

## 5. API 设计

### 后端 API (Node.js + Express)
```
GET  /api/novels          - 获取小说列表
GET  /api/novels/:id      - 获取小说详情
GET  /api/novels/:id/chapters - 获取章节列表
GET  /api/chapters/:id    - 获取章节内容
POST /api/auth/register   - 用户注册
POST /api/auth/login      - 用户登录
GET  /api/user/profile    - 获取用户信息
POST /api/user/favorite   - 收藏小说
DELETE /api/user/favorite/:id - 取消收藏
GET  /api/user/favorites  - 获取收藏列表
POST /api/comments        - 添加评论
GET  /api/comments/:novelId - 获取评论列表
```

## 6. 开发计划

1. **Phase 1**: 初始化项目 + 飞书数据对接
2. **Phase 2**: 前端页面开发
3. **Phase 3**: 后端API开发
4. **Phase 4**: 用户系统 + 收藏评论
5. **Phase 5**: 管理后台
6. **Phase 6**: 部署到Vercel

## 7. 文件结构
```
xyebook/
├── client/                 # React前端
│   ├── src/
│   │   ├── components/    # 组件
│   │   ├── pages/         # 页面
│   │   ├── hooks/         # 自定义Hook
│   │   ├── services/      # API服务
│   │   └── styles/        # 样式
│   └── index.html
├── server/                 # Node.js后端
│   ├── routes/           # 路由
│   ├── services/        # 业务逻辑
│   └── index.js
└── vercel.json           # Vercel配置
```
