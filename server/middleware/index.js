// 中间件统一导出
const { errorHandler, AppError } = require('./errorHandler');
const { logger, businessLogger } = require('./logger');
const { rateLimiter, loginRateLimiter, registerRateLimiter } = require('./rateLimiter');
const { validate, validateQuery, validateParams } = require('./validator');

/**
 * 异步路由处理包装器 - 自动捕获异步错误
 * @param {Function} fn - 异步处理函数
 * @returns {Function} 包装后的中间件
 * @example
 * router.get('/example', asyncHandler(async (req, res) => {
 *   const data = await someAsyncFunction();
 *   res.json(data);
 * }));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  AppError,
  logger,
  businessLogger,
  rateLimiter,
  loginRateLimiter,
  registerRateLimiter,
  validate,
  validateQuery,
  validateParams,
  asyncHandler
};
