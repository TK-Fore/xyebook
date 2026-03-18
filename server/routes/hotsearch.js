/**
 * 热搜 API 路由
 * GET /api/hotsearch?platform=zhihu|douyin|baidu|all
 */

const express = require('express');
const router = express.Router();
const hotsearchService = require('../services/hotsearch');

/**
 * 获取热搜数据
 * query参数:
 *   platform: zhihu(知乎), douyin(抖音), baidu(百度), all(全部), 默认为all
 */
router.get('/', async (req, res, next) => {
  try {
    const { platform = 'all' } = req.query;
    
    let data;
    
    switch (platform) {
      case 'zhihu':
        data = await hotsearchService.getZhihuHot();
        break;
      case 'douyin':
        data = await hotsearchService.getDouyinHot();
        break;
      case 'baidu':
        data = await hotsearchService.getBaiduHot();
        break;
      case 'all':
      default:
        data = await hotsearchService.getAllHot();
        break;
    }
    
    res.json({
      success: true,
      platform,
      data,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Hotsearch API error:', error.message);
    res.status(500).json({
      error: '获取热搜失败',
      message: error.message
    });
  }
});

/**
 * 获取知乎热榜 (快捷路由)
 */
router.get('/zhihu', async (req, res, next) => {
  try {
    const data = await hotsearchService.getZhihuHot();
    
    res.json({
      success: true,
      platform: 'zhihu',
      data,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Zhihu hotsearch error:', error.message);
    res.status(500).json({
      error: '获取知乎热搜失败',
      message: error.message
    });
  }
});

/**
 * 获取抖音热榜 (快捷路由)
 */
router.get('/douyin', async (req, res, next) => {
  try {
    const data = await hotsearchService.getDouyinHot();
    
    res.json({
      success: true,
      platform: 'douyin',
      data,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Douyin hotsearch error:', error.message);
    res.status(500).json({
      error: '获取抖音热搜失败',
      message: error.message
    });
  }
});

/**
 * 获取百度热搜 (快捷路由)
 */
router.get('/baidu', async (req, res, next) => {
  try {
    const data = await hotsearchService.getBaiduHot();
    
    res.json({
      success: true,
      platform: 'baidu',
      data,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Baidu hotsearch error:', error.message);
    res.status(500).json({
      error: '获取百度热搜失败',
      message: error.message
    });
  }
});

module.exports = router;
