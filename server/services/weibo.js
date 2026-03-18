/**
 * 微博热搜服务
 * 由于微博API需要登录，本服务使用爬虫方式从百度热搜获取实时热搜数据
 * 百度热搜包含微博相关热点，可以作为替代方案
 */

const axios = require('axios');
const cheerio = require('cheerio');

const CACHE_EXPIRE = 5 * 60 * 1000; // 缓存5分钟

// 内存缓存
let cache = {
  data: null,
  timestamp: 0
};

/**
 * 从百度热搜页面抓取数据
 * 页面中的JSON数据包含在script标签中
 */
async function fetchFromBaidu() {
  try {
    const response = await axios.get('https://top.baidu.com/board?tab=realtime', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      timeout: 10000
    });

    const html = response.data;
    
    // 从页面中提取JSON数据
    // 百度热搜数据在 window.__PRELOAD_STATE__ 或类似的变量中
    let jsonMatch = html.match(/window\.__PRELOAD_STATE__\s*=\s*({[^;]+});/);
    
    if (!jsonMatch) {
      // 尝试另一种方式 - 从data属性中提取
      jsonMatch = html.match(/data="([^"]*hotList[^"]*)"/);
    }
    
    if (!jsonMatch) {
      // 尝试提取页面中的JSON字符串
      const hotListMatch = html.match(/"hotList"\s*:\s*(\[[^\]]+\])/);
      if (hotListMatch) {
        try {
          const hotList = JSON.parse(hotListMatch[1]);
          return hotList.map((item, index) => ({
            rank: index + 1,
            title: item.word || item.query || item.title,
            hot: parseInt(item.hotScore) || 0,
            desc: item.desc || '',
            url: item.url || item.rawUrl || '',
            platform: 'baidu'
          })).slice(0, 50);
        } catch (e) {
          console.error('解析hotList失败:', e.message);
        }
      }
    } else {
      try {
        // 解析PRELOAD_STATE
        const preloadedState = JSON.parse(jsonMatch[1]);
        // 尝试获取cards中的hotList数据
        if (preloadedState.data && preloadedState.data.cards) {
          for (const card of preloadedState.data.cards) {
            if (card.component === 'hotList' && card.content) {
              return card.content.map((item, index) => ({
                rank: index + 1,
                title: item.word || item.query || item.title,
                hot: parseInt(item.hotScore) || 0,
                desc: item.desc || '',
                url: item.url || item.rawUrl || item.appUrl || '',
                platform: 'baidu'
              })).slice(0, 50);
            }
          }
        }
      } catch (e) {
        console.error('解析PRELOAD_STATE失败:', e.message);
      }
    }

    // 如果上述方法都失败，使用cheerio解析
    return parseWithCheerio(html);
    
  } catch (error) {
    console.error('抓取百度热搜失败:', error.message);
    return null;
  }
}

/**
 * 使用cheerio解析HTML
 */
function parseWithCheerio(html) {
  const $ = cheerio.load(html);
  const hotList = [];

  // 尝试多种选择器
  const items = $('.hot-list-item, .item, .c-feed-box .item');
  
  items.each((index, element) => {
    if (index >= 50) return;

    const title = $(element).find('.title, .c-title, .word, [class*="title"]').first().text().trim();
    const rawUrl = $(element).find('a').attr('href') || '';
    const rawHot = $(element).find('.hot-label, .c-title-sub, .index, [class*="hot"]').text().trim();
    const desc = $(element).find('.c-title-desc, .desc, [class*="desc"]').text().trim();
    
    if (title) {
      hotList.push({
        rank: index + 1,
        title: title,
        hot: parseHotValue(rawHot),
        desc: desc || '',
        url: rawUrl.startsWith('http') ? rawUrl : `https://www.baidu.com/s?wd=${encodeURIComponent(title)}`,
        platform: 'baidu'
      });
    }
  });

  return hotList.length > 0 ? hotList : null;
}

/**
 * 解析热度值
 */
function parseHotValue(text) {
  if (!text) return 0;
  // 处理如 "921万" "1.2亿" 等格式
  const match = text.match(/([\d.]+)(万|亿)?/);
  if (!match) return 0;
  
  let value = parseFloat(match[1]);
  const unit = match[2];
  
  if (unit === '万') {
    value *= 10000;
  } else if (unit === '亿') {
    value *= 100000000;
  }
  
  return Math.round(value);
}

/**
 * 获取热搜数据（带缓存）
 */
async function getHotList() {
  const now = Date.now();
  
  // 检查缓存
  if (cache.data && (now - cache.timestamp) < CACHE_EXPIRE) {
    return cache.data;
  }

  // 尝试从百度热搜获取
  let data = await fetchFromBaidu();

  if (data && data.length > 0) {
    // 更新缓存
    cache = {
      data: data,
      timestamp: now
    };
  } else {
    // 如果获取失败，返回缓存数据（即使过期）
    if (cache.data) {
      console.warn('热搜数据获取失败，返回过期缓存');
      return cache.data;
    }
    // 返回模拟数据
    return getMockData();
  }

  return data;
}

/**
 * 获取模拟数据（备用）
 */
function getMockData() {
  return [
    { rank: 1, title: '微博热搜测试数据1', hot: 1000000, desc: '这是测试数据', url: '#', platform: 'mock' },
    { rank: 2, title: '微博热搜测试数据2', hot: 900000, desc: '这是测试数据', url: '#', platform: 'mock' },
    { rank: 3, title: '微博热搜测试数据3', hot: 800000, desc: '这是测试数据', url: '#', platform: 'mock' },
  ];
}

/**
 * 清除缓存
 */
function clearCache() {
  cache = {
    data: null,
    timestamp: 0
  };
}

/**
 * 获取热搜详情
 */
async function getAllHotLists() {
  const baiduHot = await getHotList();
  
  return {
    weibo: baiduHot,  // 百度热搜作为微博热搜的替代
    source: 'baidu',
    updated: Date.now()
  };
}

module.exports = {
  getHotList,
  getAllHotLists,
  clearCache,
  fetchFromBaidu
};
