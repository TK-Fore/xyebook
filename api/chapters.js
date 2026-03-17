// 章节路由 - Vercel Serverless Function
const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');
const { getChapterContent } = require('../server/services/feishu');

const app = express();
app.use(cors());
app.use(express.json());

// 获取章节内容
app.get('/:id', async (req, res) => {
  try {
    const result = await getChapterContent(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = serverless(app);
