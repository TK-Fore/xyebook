// 数据验证中间件 - 使用Joi进行验证
const Joi = require('joi');

// 预定义验证规则
const schemas = {
  // 用户注册
  register: Joi.object({
    username: Joi.string().min(3).max(20).pattern(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/)
      .messages({
        'string.pattern.base': '用户名只能包含字母、数字、下划线和中文字符',
        'string.min': '用户名至少3个字符',
        'string.max': '用户名最多20个字符'
      }),
    email: Joi.string().email().messages({
      'string.email': '请输入有效的邮箱地址'
    }),
    password: Joi.string().min(6).max(50).messages({
      'string.min': '密码至少6个字符',
      'string.max': '密码最多50个字符'
    })
  }),

  // 用户登录
  login: Joi.object({
    username: Joi.string().required().messages({
      'any.required': '用户名不能为空'
    }),
    password: Joi.string().required().messages({
      'any.required': '密码不能为空'
    })
  }),

  // 收藏操作
  favorite: Joi.object({
    novelId: Joi.string().required().messages({
      'any.required': 'novelId不能为空'
    })
  }),

  // 阅读历史
  history: Joi.object({
    novelId: Joi.string().required().messages({
      'any.required': 'novelId不能为空'
    }),
    chapterId: Joi.string().required().messages({
      'any.required': 'chapterId不能为空'
    })
  }),

  // 评论
  comment: Joi.object({
    novelId: Joi.string().required().messages({
      'any.required': 'novelId不能为空'
    }),
    content: Joi.string().min(1).max(1000).required().messages({
      'any.required': '评论内容不能为空',
      'string.max': '评论最多1000个字符'
    }),
    anonymous: Joi.boolean().optional()
  }),

  // 小说ID参数
  novelIdParam: Joi.object({
    id: Joi.string().required().messages({
      'any.required': '小说ID不能为空'
    })
  }),

  // 章节ID参数
  chapterIdParam: Joi.object({
    id: Joi.string().required().messages({
      'any.required': '章节ID不能为空'
    })
  }),

  // 小说列表查询
  novelsQuery: Joi.object({
    category: Joi.string().optional(),
    keyword: Joi.string().allow('').optional()
  })
};

// 验证中间件工厂
const validate = (schemaName, source = 'body') => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      console.error(`Validation schema '${schemaName}' not found`);
      return next();
    }

    const data = source === 'query' ? req.query : req[source];
    const { error, value } = schema.validate(data, { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      console.warn(JSON.stringify({
        type: 'VALIDATION_FAILED',
        schema: schemaName,
        source,
        path: req.originalUrl,
        errors: details,
        timestamp: new Date().toISOString()
      }));

      const validationError = new Error('数据验证失败');
      validationError.name = 'ValidationError';
      validationError.statusCode = 400;
      validationError.details = details;
      return next(validationError);
    }

    // 更新经过验证的数据
    req[source] = value;
    next();
  };
};

// 验证查询参数
const validateQuery = (schemaName) => validate(schemaName, 'query');

// 验证路由参数
const validateParams = (schemaName) => validate(schemaName, 'params');

module.exports = { validate, validateQuery, validateParams, schemas };
