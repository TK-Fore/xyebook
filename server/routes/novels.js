// 小说路由
const express = require('express');
const router = express.Router();
const { getNovels, getNovelDetail, getChapters, getChapterContent, isFeishuConfigured } = require('../services/feishu');

// 调试端点 - 检查环境变量
router.get('/debug', async (req, res) => {
  res.json({
    FEISHU_APP_ID: !!process.env.FEISHU_APP_ID,
    FEISHU_APP_SECRET: !!process.env.FEISHU_APP_SECRET,
    FEISHU_NOVELS_TOKEN: !!process.env.FEISHU_NOVELS_TOKEN,
    FEISHU_CHAPTERS_TOKEN: !!process.env.FEISHU_CHAPTERS_TOKEN,
    isFeishuConfigured: isFeishuConfigured(),
    NODE_ENV: process.env.NODE_ENV
  });
});

// 获取小说列表
router.get('/', async (req, res) => {
  try {
    const { category, keyword } = req.query;
    const result = await getNovels({ category, keyword });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 获取小说详情
router.get('/:id', async (req, res) => {
  try {
    const result = await getNovelDetail(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 获取章节列表
router.get('/:id/chapters', async (req, res) => {
  try {
    const result = await getChapters(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 获取章节内容
router.get('/chapter/:id', async (req, res) => {
  try {
    const result = await getChapterContent(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 获取章节内容（兼容路由）
router.get('/chapter/:id', async (req, res) => {
  try {
    const result = await getChapterContent(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
