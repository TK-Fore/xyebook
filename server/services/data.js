const supabase = require('./supabase');

/**
 * 本地小说数据（演示用）
 * 生产环境应从数据库获取
 * @typedef {Object} Novel
 * @property {string} id - 小说ID
 * @property {string} title - 小说标题
 * @property {string} author - 作者
 * @property {string} cover - 封面URL
 * @property {string} description - 简介
 * @property {string} category - 分类
 * @property {string} status - 连载状态
 * @property {number} word_count - 字数
 * @property {string} rating - 评分
 * @property {number} views - 阅读量
 * @property {string} updateTime - 更新时间
 */
const localNovels = [
  { id: '1', title: '全职高手', author: '蝴蝶蓝', cover: 'https://via.placeholder.com/200x280/89CFF0/ffffff?text=全职高手', description: '游戏荣耀教材级作品', category: '游戏', status: '已完结', word_count: 5000000, rating: '9.2', views: 1500000, updateTime: '2024-01-15' },
  { id: '2', title: '诡异末世，我靠吹牛无敌了', author: '娱乐小组', cover: 'https://via.placeholder.com/200x280/FF6B6B/ffffff?text=诡异末世', description: '诡异末世降临，主角陈九意外觉醒"吹牛成真系统"，通过吹牛吓退诡异生物，走上逆袭之路。', category: '玄幻', status: '连载中', word_count: 50000, rating: '9.5', views: 10000, updateTime: '2024-03-10' },
  { id: '3', title: '大圣传', author: '说梦者', cover: 'https://via.placeholder.com/200x280/FFB6C1/ffffff?text=大圣传', description: '讲述齐天大圣孙悟空成佛后的故事', category: '玄幻', status: '已完结', word_count: 3000000, rating: '9.0', views: 800000, updateTime: '2023-12-20' },
  { id: '4', title: '凡人修仙传', author: '忘语', cover: 'https://via.placeholder.com/200x280/98FB98/ffffff?text=凡人修仙传', description: '凡人少年逆天改命修仙成仙', category: '仙侠', status: '已完结', word_count: 7000000, rating: '9.3', views: 2000000, updateTime: '2024-02-28' },
  { id: '5', title: '庆余年', author: '猫腻', cover: 'https://via.placeholder.com/200x280/DDA0DD/ffffff?text=庆余年', description: '范闲的庆国传奇', category: '历史', status: '已完结', word_count: 4000000, rating: '9.1', views: 1200000, updateTime: '2024-01-05' },
  { id: '6', title: '三体', author: '刘慈欣', cover: 'https://via.placeholder.com/200x280/87CEEB/ffffff?text=三体', description: '地球文明与三体文明的宏大故事', category: '科幻', status: '已完结', word_count: 900000, rating: '9.4', views: 3000000, updateTime: '2023-11-15' },
  { id: '7', title: '全职法师', author: '乱', cover: 'https://via.placeholder.com/200x280/FFD700/ffffff?text=全职法师', description: '魔法世界全职系统', category: '玄幻', status: '连载中', word_count: 8000000, rating: '8.8', views: 900000, updateTime: '2024-03-12' },
  { id: '8', title: '我在都市当奶爸', author: '都市居士', cover: 'https://via.placeholder.com/200x280/FFA07A/ffffff?text=奶爸', description: '都市生活中的奶爸日常', category: '都市', status: '连载中', word_count: 200000, rating: '8.5', views: 50000, updateTime: '2024-03-14' }
];

/**
 * 获取小说列表
 * @param {Object} params - 查询参数
 * @param {string} [params.category] - 分类筛选
 * @param {string} [params.keyword] - 关键词搜索
 * @param {string} [params.searchType] - 搜索类型(title/author)
 * @param {string} [params.status] - 连载状态(ongoing/completed)
 * @param {string} [params.sortBy] - 排序字段
 * @param {string} [params.sortOrder] - 排序方向(asc/desc)
 * @returns {Promise<{novels: Array, source: string}>}
 */
async function getNovels(params = {}) {
  if (supabase.isSupabaseConfigured()) {
    try {
      const result = await supabase.getNovels(params);
      if (result.novels && result.novels.length > 0) {
        return result;
      }
    } catch (e) {
      console.log('Supabase error:', e.message);
    }
  }
  
  // 本地数据处理
  let novels = [...localNovels];
  const { category, keyword, searchType, status, sortBy, sortOrder } = params;
  
  // 分类筛选（支持多分类）
  if (category) {
    const categories = Array.isArray(category) ? category : category.split(',');
    novels = novels.filter(n => categories.includes(n.category));
  }
  
  // 关键词搜索（支持按书名/作者搜索）
  if (keyword) {
    const k = keyword.toLowerCase();
    novels = novels.filter(n => {
      if (searchType === 'title') {
        return n.title.toLowerCase().includes(k);
      } else if (searchType === 'author') {
        return n.author.toLowerCase().includes(k);
      } else {
        // 默认全文搜索
        return n.title.toLowerCase().includes(k) || n.author.toLowerCase().includes(k);
      }
    });
  }
  
  // 状态筛选（连载/完结）
  if (status) {
    if (status === 'ongoing') {
      novels = novels.filter(n => n.status === '连载中');
    } else if (status === 'completed') {
      novels = novels.filter(n => n.status === '已完结');
    }
  }
  
  // 排序功能
  if (sortBy) {
    novels.sort((a, b) => {
      let valA, valB;
      switch (sortBy) {
        case 'updateTime':
          valA = new Date(a.updateTime || '1970-01-01');
          valB = new Date(b.updateTime || '1970-01-01');
          break;
        case 'views':
          valA = parseInt(a.views) || 0;
          valB = parseInt(b.views) || 0;
          break;
        case 'rating':
          valA = parseFloat(a.rating) || 0;
          valB = parseFloat(b.rating) || 0;
          break;
        default:
          return 0;
      }
      if (sortOrder === 'asc') {
        return valA - valB;
      } else {
        return valB - valA;
      }
    });
  }
  
  return { novels, source: 'local' };
}

/**
 * 获取小说详情
 * @param {string} id - 小说ID
 * @returns {Promise<{novel: Object|null, source: string}>}
 */
async function getNovelDetail(id) {
  if (supabase.isSupabaseConfigured()) {
    try {
      const result = await supabase.getNovelDetail(id);
      if (result.novel) return result;
    } catch (e) {}
  }
  const novel = localNovels.find(n => n.id === id);
  return { novel: novel || null, source: 'local' };
}

/**
 * 获取小说的章节列表
 * @param {string} novelId - 小说ID
 * @returns {Promise<{chapters: Array, source: string}>}
 */
async function getChapters(novelId) {
  if (supabase.isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.supabase
        .from('chapters')
        .select('*')
        .eq('novel_id', novelId)
        .order('chapter_number');
      if (!error && data && data.length > 0) {
        return { chapters: data, source: 'supabase' };
      }
    } catch (e) {
      console.log('Chapters error:', e.message);
    }
  }
  return { chapters: [], source: 'local' };
}

/**
 * 获取章节内容
 * @param {string} chapterId - 章节ID
 * @returns {Promise<{chapter: Object|null, source: string}>}
 */
async function getChapterContent(chapterId) {
  if (supabase.isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.supabase
        .from('chapters')
        .select('*')
        .eq('id', chapterId)
        .single();
      if (!error && data) {
        return { chapter: data, source: 'supabase' };
      }
    } catch (e) {}
  }
  return { chapter: null, source: 'local' };
}

module.exports = { getNovels, getNovelDetail, getChapters, getChapterContent };
