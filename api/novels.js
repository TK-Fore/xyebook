// 小说路由 - Vercel Serverless Function
const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');
const { getNovels, getNovelDetail, getChapters, getChapterContent } = require('../server/services/feishu');

const app = express();
app.use(cors());
app.use(express.json());

// 获取小说列表
app.get('/', async (req, res) => {
  try {
    const { category, keyword } = req.query;
    const result = await getNovels({ category, keyword });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 获取小说详情
app.get('/:id', async (req, res) => {
  try {
    const result = await getNovelDetail(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 获取章节列表
app.get('/:id/chapters', async (req, res) => {
  try {
    const result = await getChapters(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 获取章节内容
app.get('/chapter/:id', async (req, res) => {
  try {
    const result = await getChapterContent(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 导出Vercel Serverless Function
module.exports = serverless(app);
