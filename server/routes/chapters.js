// 章节路由
const express = require('express');
const router = express.Router();
const { getChapterContent } = require('../services/feishu');
const { validateParams } = require('../middleware');
const { businessLogger } = require('../middleware/logger');

// 获取章节内容
router.get('/:id', validateParams('chapterIdParam'), async (req, res, next) => {
  try {
    const result = await getChapterContent(req.params.id);
    
    if (!result.chapter) {
      const error = new Error('章节不存在');
      error.statusCode = 404;
      error.errorCode = 'CHAPTER_NOT_FOUND';
      return next(error);
    }
    
    businessLogger.info('CHAPTER_READ', { chapterId: req.params.id, source: result.source });
    
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
