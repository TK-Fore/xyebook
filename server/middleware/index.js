// 中间件统一导出
const { errorHandler, AppError } = require('./errorHandler');
const { logger, businessLogger } = require('./logger');
const { rateLimiter, loginRateLimiter, registerRateLimiter } = require('./rateLimiter');
const { validate, validateQuery, validateParams } = require('./validator');

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
  validateParams
};
