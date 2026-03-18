/**
 * 微博热搜路由
 * GET /api/weibo/hot
 * GET /api/weibo/hot/refresh - 强制刷新缓存
 */

const express = require('express');
const router = express.Router();
const weiboService = require('../services/weibo');

/**
 * 获取热搜列表
 * query参数:
 *   limit: 返回条数，默认50
 *   refresh: 是否强制刷新，1为刷新
 */
router.get('/hot', async (req, res, next) => {
  try {
    const { limit = 50, refresh } = req.query;
    
    // 强制刷新缓存
    if (refresh === '1') {
      weiboService.clearCache();
    }
    
    const hotList = await weiboService.getHotList();
    
    // 限制返回数量
    const limitedList = hotList.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: limitedList,
      total: limitedList.length,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Weibo Hot API error:', error.message);
    res.status(500).json({
      error: '获取热搜失败',
      message: error.message
    });
  }
});

/**
 * 强制刷新热搜缓存
 */
router.get('/hot/refresh', async (req, res, next) => {
  try {
    weiboService.clearCache();
    const hotList = await weiboService.getHotList();
    
    res.json({
      success: true,
      message: '缓存已刷新',
      data: hotList,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Weibo Hot refresh error:', error.message);
    res.status(500).json({
      error: '刷新热搜失败',
      message: error.message
    });
  }
});

/**
 * 获取所有平台热搜
 */
router.get('/all', async (req, res, next) => {
  try {
    const allHot = await weiboService.getAllHotLists();
    
    res.json({
      success: true,
      data: allHot,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Weibo All Hot API error:', error.message);
    res.status(500).json({
      error: '获取热搜失败',
      message: error.message
    });
  }
});

module.exports = router;
