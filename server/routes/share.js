// 分享路由
const express = require('express');
const router = express.Router();
const { getNovelDetail } = require('../services/data');

// 获取分享信息
router.get('/:novelId', async (req, res) => {
  try {
    const { novel } = await getNovelDetail(req.params.novelId);
    
    if (!novel) {
      return res.status(404).json({ message: '小说不存在' });
    }
    
    const shareUrl = `${req.protocol}://${req.get('host')}/novel/${novel.id}`;
    
    res.json({
      success: true,
      share: {
        title: novel.title,
        author: novel.author,
        description: novel.description || `推荐阅读：《${novel.title}》`,
        cover: novel.cover,
        url: shareUrl
      }
    });
  } catch (error) {
    res.status(500).json({ message: '获取分享信息失败' });
  }
});

module.exports = router;
