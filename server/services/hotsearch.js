/**
 * 热搜服务
 * 支持: 知乎热榜、抖音热榜、百度热搜
 * 
 * 微博热搜: ❌ 无法接入
 * 原因: weibo.com/ajax/statuses/hot 和 weibo.com/ajax/side/hotSearch 均返回 302 重定向到登录页面
 *       m.weibo.cn API 也需要登录验证，无免费可用的公开API
 *       微博热搜数据需要Cookie/登录态，无法通过简单API调用获取
 * 如需接入微博热搜，需要:
 * 1. 使用已登录的Cookie进行请求
 * 2. 或使用爬虫服务(如Puppeteer/Playwright)模拟浏览器访问
 * 3. 或购买第三方微博热搜API服务
 */

const API_BASE = {
  zhihu: 'https://api.zhihu.com/topstory/hot-lists',
  douyin: 'https://www.douyin.com',
  baidu: 'https://top.baidu.com',
  // 微博无法接入
};

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
 * 需要爬虫方式抓取页面
 */
async function getBaiduHot(tab = 'realtime') {
  // 百度热搜页面结构复杂，需要爬虫
  // 这里先检查是否有可用的API端点
  
  // 尝试百度指数API (需要Cookie)
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
  
  // 尝试从HTML中提取热搜数据
  // 百度热搜数据通常嵌入在script标签中的JSON
  const dataMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});/);
  
  if (dataMatch) {
    try {
      const jsonData = JSON.parse(dataMatch[1]);
      // 提取热搜数据
      const hotList = jsonData?.hotList || jsonData?.data?.hotList || [];
      
      if (hotList.length > 0) {
        return hotList.map((item, index) => ({
          rank: index + 1,
          title: item.content || item.word || '',
          url: item.url || `https://www.baidu.com/s?wd=${encodeURIComponent(item.content || item.word || '')}`,
          hotValue: item.hotScore || item.hot || 0,
          label: item.label || '',
          type: item.type || 'topic'
        }));
      }
    } catch (e) {
      console.error('解析百度热搜JSON失败:', e.message);
    }
  }
  
  // 如果无法解析，返回错误提示需要爬虫
  throw new Error('百度热搜需要使用爬虫方案抓取，页面数据加密无法直接解析');
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
 * 获取所有平台热搜
 */
async function getAllHot() {
  const results = {
    zhihu: { success: false, data: [], error: null },
    douyin: { success: false, data: [], error: null },
    baidu: { success: false, data: [], error: null }
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
  
  return results;
}

module.exports = {
  getZhihuHot,
  getDouyinHot,
  getBaiduHot,
  getWeiboHot,
  getAllHot
};
