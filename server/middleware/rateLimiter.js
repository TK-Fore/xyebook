// API限流中间件 - 基于内存的简单限流实现
const rateLimiter = (options = {}) => {
  const {
    windowMs = 60 * 1000, // 默认1分钟
    maxRequests = 100,   // 默认每分钟100次
    keyGenerator = (req) => req.ip || 'unknown',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    message = '请求过于频繁，请稍后再试',
    statusCode = 429
  } = options;

  // 存储每个IP的请求记录
  const requests = new Map();

  // 清理过期记录
  const cleanup = () => {
    const now = Date.now();
    for (const [key, data] of requests.entries()) {
      // 清理超过windowMs的记录
      data.history = data.history.filter(time => now - time < windowMs);
      if (data.history.length === 0) {
        requests.delete(key);
      }
    }
  };

  // 定期清理
  setInterval(cleanup, windowMs);

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();

    // 初始化或获取该IP的记录
    if (!requests.has(key)) {
      requests.set(key, { history: [] });
    }

    const record = requests.get(key);

    // 清理该IP的旧记录
    record.history = record.history.filter(time => now - time < windowMs);

    // 检查是否超过限制
    if (record.history.length >= maxRequests) {
      const retryAfter = Math.ceil((record.history[0] + windowMs - now) / 1000);
      
      console.warn(JSON.stringify({
        type: 'RATE_LIMIT',
        ip: key,
        path: req.originalUrl,
        method: req.method,
        count: record.history.length,
        limit: maxRequests,
        windowMs,
        timestamp: new Date().toISOString()
      }));

      return res.status(statusCode).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message,
        retryAfter,
        limit: maxRequests,
        window: `${windowMs / 1000}s`
      });
    }

    // 记录本次请求
    record.history.push(now);

    // 在响应头中添加限流信息
    res.set('X-RateLimit-Limit', maxRequests);
    res.set('X-RateLimit-Remaining', maxRequests - record.history.length);
    res.set('X-RateLimit-Reset', Math.ceil((record.history[0] + windowMs) / 1000));

    next();
  };
};

// 专门针对登录的限流（更严格）
const loginRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15分钟
  maxRequests: 5,            // 最多5次尝试
  keyGenerator: (req) => `${req.ip}-login`,
  message: '登录尝试过于频繁，请15分钟后再试'
});

// 专门针对注册的限流
const registerRateLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1小时
  maxRequests: 3,           // 最多3次注册
  keyGenerator: (req) => `${req.ip}-register`,
  message: '注册尝试过于频繁，请1小时后再试'
});

module.exports = { rateLimiter, loginRateLimiter, registerRateLimiter };
