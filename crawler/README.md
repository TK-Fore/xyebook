# 🐑 小羊书吧爬虫系统

小说书源采集系统，支持多书源采集和数据存储。

## 功能特性

- ✅ 多书源支持（笔趣阁、顶点小说等）
- ✅ 小说信息采集（名称、作者、简介、封面、分类）
- ✅ User-Agent 伪装
- ✅ 请求间隔控制
- ✅ 错误重试机制
- ✅ Supabase 数据库存储

## 快速开始

### 1. 安装依赖

```bash
cd xyebook/crawler
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 填入 Supabase 配置
```

### 3. 初始化数据库

在 Supabase SQL 编辑器中执行 `sql/init.sql`

### 4. 运行爬虫

```bash
npm start
```

## 项目结构

```
xyebook/
├── crawler/
│   ├── src/
│   │   ├── config.js     # 配置文件
│   │   ├── crawler.js    # 爬虫核心
│   │   ├── database.js   # 数据库操作
│   │   └── index.js     # 主入口
│   ├── sql/
│   │   └── init.sql     # 数据库初始化
│   ├── package.json
│   └── .env.example
```

## 支持的书源

| 书源 | 状态 |
|------|------|
| 笔趣阁 | ✅ |
| 顶点小说 | ✅ |
| 笔趣阁阁 | ✅ |

## 采集字段

- 小说名称 (title)
- 作者 (author)
- 简介 (description)
- 封面图片URL (cover_url)
- 分类 (category)
- 章节列表URL (chapters_url)

## 数据库表

- **sources** - 书源表
- **novels** - 小说表
- **chapters** - 章节表
- **chapter_content** - 章节内容表

## 注意事项

1. 请遵守目标网站的 robots.txt
2. 合理设置请求间隔，避免对服务器造成压力
3. 请勿用于商业用途
