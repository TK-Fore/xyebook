/**
 * 热搜服务
 * 支持: 知乎热榜、抖音热榜、百度热搜、谷歌趋势
 * 
 * 微博热搜: ❌ 无法接入
 * 原因: weibo.com/ajax/statuses/hot 和 weibo.com/ajax/side/hotSearch 均返回 302 重定向到登录页面
 *       m.weibo.cn API 也需要登录验证，无免费可用的公开API
 *       微博热搜数据需要Cookie/登录态，无法通过简单API调用获取
 * 如需接入微博热搜，需要:
 * 1. 使用已登录的Cookie进行请求
 * 2. 或使用爬虫服务(如Puppeteer/Playwright)模拟浏览器访问
 * 3. 或购买第三方微博热搜API服务
 * 
 * 谷歌趋势: ⚠️ 需要代理或特殊处理
 * 原因: Google Trends API 需要 Google 账户或使用第三方服务(如 SerpAPI)
 *       国内直接访问可能受限，建议使用代理或等待后续优化
 */

const API_BASE = {
  zhihu: 'https://api.zhihu.com/topstory/hot-lists',
  douyin: 'https://www.douyin.com',
  baidu: 'https://top.baidu.com',
  google: 'https://trends.google.com/trends',
  // 微博无法接入
};

// 代理配置
const PROXY_URL = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || 'http://127.0.0.1:7897';

/**
 * 获取知乎热榜
 * API: https://api.zhihu.com/topstory/hot-lists/total?limit=10
 * 无需配置，直接可用
 */
async function getZhihuHot() {
  const url = `${API_BASE.zhihu}/total?limit=50`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.zhihu.com/'
    }
  });
  
  if (!response.ok) {
    throw new Error(`知乎API请求失败: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.data || !Array.isArray(data.data)) {
    throw new Error('知乎API返回数据格式错误');
  }
  
  // 格式化数据
  return data.data.map((item, index) => ({
    rank: index + 1,
    title: item.target?.title || '',
    url: item.target?.url || '',
    hot: item.detail_text || '',
    excerpt: item.target?.excerpt || '',
    answerCount: item.target?.answer_count || 0,
    followerCount: item.target?.follower_count || 0,
    type: item.target?.type || 'question',
    label: item.card_label?.type || ''
  }));
}

/**
 * 获取抖音热榜
 * 需要爬虫方式抓取
 * 尝试多个备用端点
 */
async function getDouyinHot() {
  // 尝试官方API (可能需要登录态)
  const apis = [
    'https://www.douyin.com/aweme/v1/web/hot/search/list/',
    'https://www.douyin.com/webfach/api/v2/web/hot/search/list',
    'https://www.douyin.com/feabor/hot-search'
  ];
  
  let lastError = null;
  
  for (const apiUrl of apis) {
    try {
      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.douyin.com/'
        }
      });
      
      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status}`);
        continue;
      }
      
      const text = await response.text();
      
      // 尝试解析JSON
      try {
        const data = JSON.parse(text);
        
        // 检查是否返回了有效数据
        if (data.data && Array.isArray(data.data.word_list)) {
          return formatDouyinData(data.data.word_list);
        }
        if (data.data && Array.isArray(data.data)) {
          return formatDouyinData(data.data);
        }
      } catch (e) {
        // 返回的不是JSON，可能需要爬虫
        lastError = e;
      }
    } catch (e) {
      lastError = e;
    }
  }
  
  // 如果API都失败，返回模拟数据提示需要爬虫方案
  throw new Error(`抖音热搜API暂不可用，需要使用爬虫方案抓取: ${lastError?.message || '未知错误'}`);
}

function formatDouyinData(wordList) {
  return wordList.map((item, index) => ({
    rank: index + 1,
    word: item.word || item.title || '',
    hotValue: item.hot_value || item.hot || 0,
    eventTime: item.event_time || null,
    label: item.label || '',
    url: `https://www.douyin.com/search/${encodeURIComponent(item.word || '')}`
  }));
}

/**
 * 获取百度热搜
 * 通过爬虫方式抓取页面，解析HTML中的JSON数据
 */
async function getBaiduHot(tab = 'realtime') {
  const url = `https://top.baidu.com/board?tab=${tab}`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.baidu.com/'
    }
  });
  
  if (!response.ok) {
    throw new Error(`百度热搜请求失败: ${response.status}`);
  }
  
  const html = await response.text();
  
  // 从HTML中提取s-data中的JSON数据
  const dataMatch = html.match(/<!--s-data:({.*?})-->/);
  
  if (dataMatch) {
    try {
      const jsonData = JSON.parse(dataMatch[1]);
      // 提取cards中的hotList
      const cards = jsonData?.data?.cards || [];
      
      for (const card of cards) {
        if (card.component === 'hotList') {
          const hotList = card.content || [];
          
          if (hotList.length > 0) {
            return hotList.map((item, index) => ({
              rank: index + 1,
              title: item.word || item.query || '',
              url: item.url || item.rawUrl || `https://www.baidu.com/s?wd=${encodeURIComponent(item.word || '')}`,
              hotValue: parseInt(item.hotScore) || 0,
              label: item.hotTag || '',
              desc: item.desc || '',
              img: item.img || '',
              type: item.type || 'topic'
            }));
          }
        }
      }
    } catch (e) {
      console.error('解析百度热搜JSON失败:', e.message);
    }
  }
  
  throw new Error('百度热搜数据解析失败，请稍后重试');
}

/**
 * 获取微博热搜
 * ❌ 无法接入 - 所有API都需要登录验证
 * 
 * 测试过的端点 (均失败):
 * - https://weibo.com/ajax/statuses/hot → 302 重定向到登录
 * - https://weibo.com/ajax/side/hotSearch → 403 Forbidden  
 * - https://weibo.com/ajax/trends/hotpoint → 403 Forbidden
 * - https://m.weibo.cn/api/... → 无响应或需要登录
 */
async function getWeiboHot() {
  throw new Error('微博热搜API无法接入: 所有公开接口均需要登录Cookie验证。如需接入请使用已登录的Cookie或爬虫方案。');
}

/**
 * 获取谷歌趋势热搜
 * 使用代理访问
 * 
 * 代理配置: HTTP_PROXY / HTTPS_PROXY 环境变量
 */
async function getGoogleTrends(geo = 'US') {
  const axios = require('axios');
  
  // 尝试 Google Trends API (需要代理)
  const url = `https://trends.google.com/trends/api/dailytrends?hl=zh-CN&tz=-480&geo=${geo}`;
  
  try {
    const response = await axios.get(url, {
      proxy: {
        host: '127.0.0.1',
        port: 7897,
        protocol: 'http'
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      }
    });
    
    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const text = response.data;
    // Google API 返回格式: )]}' \n <JSON>
    const jsonStr = text.replace(/^\)\]\}\'\s*/, '');
    const data = JSON.parse(jsonStr);
    
    const trends = data.default?.trendingSearchesDays?.[0]?.trendingSearches || [];
    
    return trends.map((item, index) => ({
      rank: index + 1,
      title: item.title?.query || '',
      url: `https://www.google.com/search?q=${encodeURIComponent(item.title?.query || '')}`,
      hotValue: item.formattedTraffic || '0',
      label: item.label?.text || '',
      articles: item.articles?.slice(0, 3).map(art => ({
        title: art.title || '',
        url: art.url || ''
      })) || []
    }));
  } catch (e) {
    // 如果 API 失败，尝试返回友好的错误信息
    throw new Error(`谷歌趋势暂不可用: ${e.message}。如需接入建议使用代理或第三方服务。`);
  }
}

/**
 * 获取所有平台热搜
 */
async function getAllHot() {
  const results = {
    zhihu: { success: false, data: [], error: null },
    douyin: { success: false, data: [], error: null },
    baidu: { success: false, data: [], error: null },
    google: { success: false, data: [], error: null }
  };
  
  // 知乎
  try {
    results.zhihu.data = await getZhihuHot();
    results.zhihu.success = true;
  } catch (e) {
    results.zhihu.error = e.message;
  }
  
  // 抖音
  try {
    results.douyin.data = await getDouyinHot();
    results.douyin.success = true;
  } catch (e) {
    results.douyin.error = e.message;
  }
  
  // 百度
  try {
    results.baidu.data = await getBaiduHot();
    results.baidu.success = true;
  } catch (e) {
    results.baidu.error = e.message;
  }
  
  // 谷歌趋势
  try {
    results.google.data = await getGoogleTrends();
    results.google.success = true;
  } catch (e) {
    results.google.error = e.message;
  }
  
  return results;
}

module.exports = {
  getZhihuHot,
  getDouyinHot,
  getBaiduHot,
  getWeiboHot,
  getGoogleTrends,
  getAllHot
};
