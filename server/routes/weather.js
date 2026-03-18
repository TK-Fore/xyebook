/**
 * 天气 API 路由
 * GET /api/weather?type=now|3d|7d&location=城市名
 */

const express = require('express');
const router = express.Router();
const weatherService = require('../services/weather');

/**
 * 获取天气数据
 * query参数:
 *   type: now(实时), 3d(3天预报), 7d(7天预报), 默认为now
 *   location: 城市名/城市ID/经纬度, 默认为auto_ip(自动获取IP所在城市)
 */
router.get('/', async (req, res, next) => {
  try {
    const { type = 'now', location = 'auto_ip' } = req.query;
    
    // 检查API是否配置
    if (!weatherService.isConfigured()) {
      return res.status(503).json({
        error: '天气服务未配置',
        message: '请配置 QWEATHER_KEY 环境变量',
        hint: '访问 https://dev.qweather.com 注册获取免费API Key'
      });
    }
    
    let weatherData;
    
    switch (type) {
      case '3d':
        weatherData = await weatherService.getForecast3d(location);
        break;
      case '7d':
        weatherData = await weatherService.getForecast7d(location);
        break;
      case 'now':
      default:
        weatherData = await weatherService.getCurrentWeather(location);
        break;
    }
    
    res.json({
      success: true,
      type,
      location,
      data: weatherData,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Weather API error:', error.message);
    res.status(500).json({
      error: '获取天气失败',
      message: error.message
    });
  }
});

/**
 * 获取实时天气 (快捷路由)
 */
router.get('/now', async (req, res, next) => {
  try {
    const { location = 'auto_ip' } = req.query;
    
    if (!weatherService.isConfigured()) {
      return res.status(503).json({
        error: '天气服务未配置',
        message: '请配置 QWEATHER_KEY 环境变量'
      });
    }
    
    const weatherData = await weatherService.getCurrentWeather(location);
    
    res.json({
      success: true,
      type: 'now',
      location,
      data: weatherData,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Weather API error:', error.message);
    res.status(500).json({
      error: '获取天气失败',
      message: error.message
    });
  }
});

/**
 * 获取3天预报 (快捷路由)
 */
router.get('/forecast', async (req, res, next) => {
  try {
    const { location = 'auto_ip', days = 3 } = req.query;
    
    if (!weatherService.isConfigured()) {
      return res.status(503).json({
        error: '天气服务未配置',
        message: '请配置 QWEATHER_KEY 环境变量'
      });
    }
    
    const weatherData = days == 7 
      ? await weatherService.getForecast7d(location)
      : await weatherService.getForecast3d(location);
    
    res.json({
      success: true,
      type: days == 7 ? '7d' : '3d',
      location,
      data: weatherData,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Weather API error:', error.message);
    res.status(500).json({
      error: '获取天气失败',
      message: error.message
    });
  }
});

module.exports = router;
