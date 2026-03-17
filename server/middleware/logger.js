// 请求日志中间件
const logger = (req, res, next) => {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(2, 15);

  // 请求开始日志
  console.log(JSON.stringify({
    type: 'REQUEST',
    requestId,
    method: req.method,
    url: req.originalUrl,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString()
  }));

  // 监听响应完成
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logEntry = {
      type: 'RESPONSE',
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    };

    // 根据状态码添加日志级别
    if (res.statusCode >= 500) {
      console.error(JSON.stringify(logEntry));
    } else if (res.statusCode >= 400) {
      console.warn(JSON.stringify(logEntry));
    } else {
      console.log(JSON.stringify(logEntry));
    }
  });

  // 将requestId添加到请求对象
  req.requestId = requestId;
  next();
};

// 业务日志工具
const businessLogger = {
  info: (action, details) => {
    console.log(JSON.stringify({
      type: 'BUSINESS',
      level: 'INFO',
      action,
      ...details,
      timestamp: new Date().toISOString()
    }));
  },
  warn: (action, details) => {
    console.warn(JSON.stringify({
      type: 'BUSINESS',
      level: 'WARN',
      action,
      ...details,
      timestamp: new Date().toISOString()
    }));
  },
  error: (action, details) => {
    console.error(JSON.stringify({
      type: 'BUSINESS',
      level: 'ERROR',
      action,
      ...details,
      timestamp: new Date().toISOString()
    }));
  }
};

module.exports = { logger, businessLogger };
