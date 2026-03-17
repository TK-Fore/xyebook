// 全局错误处理中间件
const errorHandler = (err, req, res, next) => {
  // 打印错误日志
  console.error(`[ERROR] ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`, {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // 区分不同类型的错误
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: err.message,
      details: err.details || []
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: err.message || '未授权访问'
    });
  }

  if (err.name === 'RateLimitError') {
    return res.status(429).json({
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: err.message || '请求过于频繁，请稍后再试',
      retryAfter: err.retryAfter
    });
  }

  // 已知业务错误
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.errorCode || 'BUSINESS_ERROR',
      message: err.message
    });
  }

  // 未知错误
  res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误'
  });
};

// 创建业务错误类
class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = 'BUSINESS_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { errorHandler, AppError };
