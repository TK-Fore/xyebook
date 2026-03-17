// API 缓存工具
// 使用 localStorage 实现简单的 API 缓存

const CACHE_PREFIX = 'xyebook_cache_';
const DEFAULT_CACHE_TIME = 5 * 60 * 1000; // 默认缓存 5 分钟

// 获取缓存
export function getCache(key) {
  try {
    const cacheData = localStorage.getItem(CACHE_PREFIX + key);
    if (!cacheData) return null;
    
    const { data, timestamp, expire } = JSON.parse(cacheData);
    const now = Date.now();
    
    // 检查是否过期
    if (expire && now - timestamp > expire) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('读取缓存失败:', error);
    return null;
  }
}

// 设置缓存
export function setCache(key, data, expireTime = DEFAULT_CACHE_TIME) {
  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
      expire: expireTime
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheData));
  } catch (error) {
    console.error('设置缓存失败:', error);
  }
}

// 清除指定缓存
export function clearCache(key) {
  localStorage.removeItem(CACHE_PREFIX + key);
}

// 清除所有缓存
export function clearAllCache() {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith(CACHE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
}

// 带缓存的 fetch 封装
export async function fetchWithCache(url, options = {}, cacheKey, expireTime = DEFAULT_CACHE_TIME) {
  // 如果是 GET 请求，尝试从缓存获取
  if (!options.method || options.method === 'GET') {
    const cachedData = getCache(cacheKey || url);
    if (cachedData) {
      // 返回缓存数据，同时发起请求更新缓存
      fetch(url, options).then(res => res.json()).then(data => {
        setCache(cacheKey || url, data, expireTime);
      }).catch(() => {});
      
      return cachedData;
    }
  }
  
  // 执行实际请求
  const res = await fetch(url, options);
  const data = await res.json();
  
  // GET 请求缓存结果
  if (!options.method || options.method === 'GET') {
    setCache(cacheKey || url, data, expireTime);
  }
  
  return data;
}
