// 配置文件
module.exports = {
  // 请求配置
  request: {
    timeout: 30000,
    retry: 3,
    retryDelay: 1000,
    interval: 2000, // 请求间隔 (ms)
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  },

  // 数据库配置 (通过环境变量覆盖)
  supabase: {
    url: process.env.SUPABASE_URL || '',
    key: process.env.SUPABASE_KEY || ''
  },

  // 书源配置
  sources: [
    {
      name: '笔趣阁',
      url: 'https://www.xbiquge.so',
      description: '经典小说书源，更新快',
      encoding: 'utf-8'
    },
    {
      name: '顶点小说',
      url: 'https://www.23us.com',
      description: '顶点小说网',
      encoding: 'utf-8'
    },
    {
      name: '笔趣阁阁',
      url: 'https://www.bxwxorg.com',
      description: '笔趣阁阁小说网',
      encoding: 'utf-8'
    }
  ]
};
