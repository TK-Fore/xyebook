// 飞书多维表格服务（使用axios直接调用API）
const axios = require('axios');

// 环境变量配置（从Vercel环境变量读取）
const APP_ID = process.env.FEISHU_APP_ID || '';
const APP_SECRET = process.env.FEISHU_APP_SECRET || '';
const NOVELS_TABLE_TOKEN = process.env.FEISHU_NOVELS_TOKEN || '';
const CHAPTERS_TABLE_TOKEN = process.env.FEISHU_CHAPTERS_TOKEN || '';
const NOVELS_TABLE_ID = process.env.FEISHU_NOVELS_TABLE_ID || 'tblnnhIkklTTnSXp';
const CHAPTERS_TABLE_ID = process.env.FEISHU_CHAPTERS_TABLE_ID || 'tbllU7jO0Vs32uv0';

let cachedToken = null;
let tokenExpire = 0;

// 获取 app access token
async function getAppAccessToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpire - 60) {
    return cachedToken;
  }
  
  const response = await axios.post('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    app_id: APP_ID,
    app_secret: APP_SECRET
  });
  
  if (response.data && response.data.tenant_access_token) {
    cachedToken = response.data.tenant_access_token;
    tokenExpire = now + (response.data.expire - 60) * 1000;
    return cachedToken;
  }
  throw new Error('Failed to get access token');
}

// 模拟数据（开发环境或无配置时使用）
const mockNovels = [
  {
    id: '1',
    title: '全职高手',
    author: '蝴蝶蓝',
    cover: 'https://via.placeholder.com/200x280/89CFF0/ffffff?text=全职高手',
    description: '游戏荣耀教材级作品，讲述职业电竞选手叶修的传奇故事。',
    category: '游戏',
    status: '已完结',
    word_count: 5000000,
    rating: '9.2',
    views: 1500000
  },
  {
    id: '2',
    title: '斗破苍穹',
    author: '天蚕土豆',
    cover: 'https://via.placeholder.com/200x280/89CFF0/ffffff?text=斗破苍穹',
    description: '讲述了天才少年萧炎在异界大陆的传奇修炼之路。',
    category: '玄幻',
    status: '已完结',
    word_count: 6000000,
    rating: '8.8',
    views: 2000000
  },
  {
    id: '3',
    title: '凡人修仙传',
    author: '忘语',
    cover: 'https://via.placeholder.com/200x280/89CFF0/ffffff?text=凡人修仙传',
    description: '平凡少年韩立的修仙之路，从凡人到仙人的传奇。',
    category: '仙侠',
    status: '已完结',
    word_count: 8000000,
    rating: '9.0',
    views: 1800000
  },
  {
    id: '4',
    title: '全职艺术家',
    author: '我会修空调',
    cover: 'https://via.placeholder.com/200x280/89CFF0/ffffff?text=全职艺术家',
    description: '穿越平行世界，娱乐文化大繁荣时代的传奇故事。',
    category: '都市',
    status: '已完结',
    word_count: 4000000,
    rating: '8.9',
    views: 1200000
  },
  {
    id: '5',
    title: '庆余年',
    author: '猫腻',
    cover: 'https://via.placeholder.com/200x280/89CFF0/ffffff?text=庆余年',
    description: '穿越到古代王朝的权力斗争与爱恨情仇。',
    category: '历史',
    status: '已完结',
    word_count: 3500000,
    rating: '9.1',
    views: 1600000
  },
  {
    id: '6',
    title: '三体',
    author: '刘慈欣',
    cover: 'https://via.placeholder.com/200x280/89CFF0/ffffff?text=三体',
    description: '人类文明与三体文明的宇宙级碰撞。',
    category: '科幻',
    status: '已完结',
    word_count: 900000,
    rating: '9.3',
    views: 2500000
  },
  {
    id: '7',
    title: '诡秘之主',
    author: '爱潜水的乌贼',
    cover: 'https://via.placeholder.com/200x280/89CFF0/ffffff?text=诡秘之主',
    description: '蒸汽朋克与克苏鲁风格的西方玄幻之作。',
    category: '玄幻',
    status: '已完结',
    word_count: 3700000,
    rating: '9.4',
    views: 2000000
  },
  {
    id: '8',
    title: '完美世界',
    author: '辰东',
    cover: 'https://via.placeholder.com/200x280/89CFF0/ffffff?text=完美世界',
    description: '少年石昊的横推万古之路。',
    category: '玄幻',
    status: '已完结',
    word_count: 6500000,
    rating: '8.7',
    views: 1900000
  }
];

const mockChapters = {
  '1': [
    { id: '1-1', novel_id: '1', title: '被驱逐的王者', chapter_num: 1, word_count: 3000, content: '...' },
    { id: '1-2', novel_id: '1', title: '荣耀至上的男人', chapter_num: 2, word_count: 2800, content: '...' },
    { id: '1-3', novel_id: '1', title: '新的开始', chapter_num: 3, word_count: 3200, content: '...' }
  ]
};

// 检查飞书客户端是否可用
function isFeishuConfigured() {
  const result = !!(APP_ID && APP_SECRET && NOVELS_TABLE_TOKEN);
  console.log('[Feishu] isFeishuConfigured:', result, { APP_ID: !!APP_ID, hasSecret: !!APP_SECRET, hasToken: !!NOVELS_TABLE_TOKEN });
  return result;
}

// 从飞书多维表格获取小说列表
async function getNovelsFromFeishu() {
  const accessToken = await getAppAccessToken();
  
  const response = await axios.get(`https://open.feishu.cn/open-apis/bitable/v1/apps/${NOVELS_TABLE_TOKEN}/tables/${NOVELS_TABLE_ID}/records`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: { page_size: 100 }
  });

  if (response.data && response.data.data && response.data.data.items) {
    return response.data.data.items
      .filter(record => record.fields && record.fields['书名'])
      .map(record => ({
        id: record.record_id,
        title: record.fields['书名'] || '',
        author: record.fields['作者'] || '',
        cover: record.fields['附件'] || '',
        description: record.fields['简介'] || '',
        category: record.fields['类型'] || '',
        status: record.fields['状态'] || '',
        word_count: record.fields['字数'] || 0,
        rating: record.fields['评分'] || '0.0',
        views: record.fields['阅读量'] || 0,
      }));
  }
  return [];
}

// 从飞书获取章节列表
async function getChaptersFromFeishu(novelId) {
  const accessToken = await getAppAccessToken();
  
  const response = await axios.get(`https://open.feishu.cn/open-apis/bitable/v1/apps/${CHAPTERS_TABLE_TOKEN}/tables/${CHAPTERS_TABLE_ID}/records`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: { 
      page_size: 500,
      filter: JSON.stringify({
        conditions: [{
          field_name: '文本',
          operator: 'equal',
          value: [novelId]
        }],
        relation: 'and'
      })
    }
  });

  if (response.data && response.data.data && response.data.data.items) {
    return response.data.data.items
      .filter(record => record.fields && record.fields['章节标题'])
      .map(record => ({
        id: record.record_id,
        novel_id: record.fields['文本'] || '',
        title: record.fields['章节标题'] || '',
        chapter_num: record.fields['章节序号'] || 0,
        word_count: record.fields['字数'] || 0,
        content: record.fields['内容'] || '',
      }))
      .sort((a, b) => a.chapter_num - b.chapter_num);
  }
  return [];
}

// 获取章节内容
async function getChapterContentFromFeishu(chapterId) {
  const accessToken = await getAppAccessToken();
  
  const response = await axios.get(`https://open.feishu.cn/open-apis/bitable/v1/apps/${CHAPTERS_TABLE_TOKEN}/tables/${CHAPTERS_TABLE_ID}/records/${chapterId}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (response.data && response.data.data && response.data.data.fields) {
    return {
      id: response.data.data.record_id,
      novel_id: response.data.data.fields['文本'] || '',
      title: response.data.data.fields['章节标题'] || '',
      chapter_num: response.data.data.fields['章节序号'] || 0,
      word_count: response.data.data.fields['字数'] || 0,
      content: response.data.data.fields['内容'] || '',
    };
  }
  return null;
}

// 获取小说列表
async function getNovels(params = {}) {
  const envStatus = {
    APP_ID: process.env.FEISHU_APP_ID ? 'SET' : 'NOT_SET',
    APP_SECRET: process.env.FEISHU_APP_SECRET ? 'SET' : 'NOT_SET',
    NOVELS_TOKEN: process.env.FEISHU_NOVELS_TOKEN ? 'SET' : 'NOT_SET',
    CHAPTERS_TOKEN: process.env.FEISHU_CHAPTERS_TOKEN ? 'SET' : 'NOT_SET'
  };
  console.log('[Feishu] ENV Status:', JSON.stringify(envStatus));
  
  // 如果环境变量设置了，返回状态信息（用于调试）
  if (Object.values(envStatus).some(v => v === 'SET')) {
    console.log('[Feishu] Environment variables DETECTED, trying feishu...');
  }
  
  if (isFeishuConfigured()) {
    try {
      const novels = await getNovelsFromFeishu();
      console.log('[Feishu] novels from feishu:', novels.length);
      if (novels.length > 0) {
        let result = [...novels];
        
        if (params.category) {
          result = result.filter(n => n.category === params.category);
        }
        
        if (params.keyword) {
          const keyword = params.keyword.toLowerCase();
          result = result.filter(n => 
            n.title.toLowerCase().includes(keyword) || 
            n.author.toLowerCase().includes(keyword)
          );
        }
        
        return { novels: result, source: 'feishu', envStatus };
      }
      return { novels: mockNovels, source: 'mock', envStatus, note: 'No novels from Feishu' };
    } catch (error) {
      console.error('[Feishu] Error:', error.message, error.stack);
      return { novels: mockNovels, source: 'mock', envStatus, error: error.message };
    }
  }
  
  // 使用本地模拟数据
  let novels = [...mockNovels];
  
  if (params.category) {
    novels = novels.filter(n => n.category === params.category);
  }
  
  if (params.keyword) {
    const keyword = params.keyword.toLowerCase();
    novels = novels.filter(n => 
      n.title.toLowerCase().includes(keyword) || 
      n.author.toLowerCase().includes(keyword)
    );
  }
  
  return { novels, source: 'mock', envStatus };
}

// 获取小说详情
async function getNovelDetail(id) {
  if (isFeishuConfigured()) {
    try {
      const novels = await getNovelsFromFeishu();
      const novel = novels.find(n => n.id === id);
      if (novel) {
        return { novel, source: 'feishu' };
      }
    } catch (error) {
      console.warn('飞书数据获取失败:', error.message);
    }
  }
  
  const novel = mockNovels.find(n => n.id === id);
  return { novel: novel || null, source: 'mock' };
}

// 获取章节列表
async function getChapters(novelId) {
  if (isFeishuConfigured()) {
    try {
      const chapters = await getChaptersFromFeishu(novelId);
      if (chapters.length > 0) {
        return { chapters, source: 'feishu' };
      }
    } catch (error) {
      console.warn('飞书章节获取失败:', error.message);
    }
  }
  
  const chapters = mockChapters[novelId] || [];
  return { chapters, source: 'mock' };
}

// 获取章节内容
async function getChapterContent(chapterId) {
  if (isFeishuConfigured()) {
    try {
      const chapter = await getChapterContentFromFeishu(chapterId);
      if (chapter) {
        return { chapter, source: 'feishu' };
      }
    } catch (error) {
      console.warn('飞书章节内容获取失败:', error.message);
    }
  }
  
  for (const nid in mockChapters) {
    const chapter = mockChapters[nid].find(c => c.id === chapterId);
    if (chapter) {
      return { chapter, source: 'mock' };
    }
  }
  return { chapter: null, source: 'mock' };
}

module.exports = {
  getNovels,
  getNovelDetail,
  getChapters,
  getChapterContent,
  mockNovels,
  mockChapters,
  isFeishuConfigured
};
