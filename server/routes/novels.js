// 小说路由
const express = require('express');
const router = express.Router();
const { getNovels, getNovelDetail, getChapters, getChapterContent, isFeishuConfigured } = require('../services/data');
const { isSupabaseConfigured } = require('../services/supabase');
const { validateQuery, validateParams, AppError } = require('../middleware');
const { businessLogger } = require('../middleware/logger');

// 调试端点 - 检查环境变量
router.get('/debug', async (req, res) => {
  res.json({
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
    isSupabaseConfigured: isSupabaseConfigured(),
    FEISHU_APP_ID: !!process.env.FEISHU_APP_ID,
    FEISHU_APP_SECRET: !!process.env.FEISHU_APP_SECRET,
    FEISHU_NOVELS_TOKEN: !!process.env.FEISHU_NOVELS_TOKEN,
    FEISHU_CHAPTERS_TOKEN: !!process.env.FEISHU_CHAPTERS_TOKEN,
    isFeishuConfigured: isFeishuConfigured(),
    NODE_ENV: process.env.NODE_ENV
  });
});

// 获取小说列表 - 添加查询验证
router.get('/', validateQuery('novelsQuery'), async (req, res, next) => {
  try {
    const { category, keyword } = req.query;
    const result = await getNovels({ category, keyword });
    
    businessLogger.info('NOVELS_FETCHED', { category, keyword, count: result.novels?.length || 0 });
    
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

// 获取小说详情
router.get('/:id', validateParams('novelIdParam'), async (req, res, next) => {
  try {
    const result = await getNovelDetail(req.params.id);
    
    if (!result.novel) {
      const error = new Error('小说不存在');
      error.statusCode = 404;
      error.errorCode = 'NOVEL_NOT_FOUND';
      return next(error);
    }
    
    businessLogger.info('NOVEL_VIEWED', { novelId: req.params.id });
    
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

// 获取章节列表
router.get('/:id/chapters', validateParams('novelIdParam'), async (req, res, next) => {
  try {
    const result = await getChapters(req.params.id);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

// 获取章节内容
router.get('/chapter/:id', validateParams('chapterIdParam'), async (req, res, next) => {
  try {
    const result = await getChapterContent(req.params.id);
    
    if (!result.chapter) {
      const error = new Error('章节不存在');
      error.statusCode = 404;
      error.errorCode = 'CHAPTER_NOT_FOUND';
      return next(error);
    }
    
    businessLogger.info('CHAPTER_READ', { chapterId: req.params.id });
    
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
