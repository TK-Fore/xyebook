// 章节路由
const express = require('express');
const router = express.Router();
const { getChapterContent } = require('../services/feishu');

// 获取章节内容
router.get('/:id', async (req, res) => {
  try {
    const result = await getChapterContent(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
