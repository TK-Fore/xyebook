// 本地小说数据（fallback）
const localNovels = [
  { id: '1', title: '全职高手', author: '蝴蝶蓝', cover: 'https://via.placeholder.com/200x280/89CFF0/ffffff?text=全职高手', description: '游戏荣耀教材级作品', category: '游戏', status: '已完结', word_count: 5000000, rating: '9.2', views: 1500000 },
  { id: '2', title: '诡异末世，我靠吹牛无敌了', author: '娱乐小组', cover: 'https://via.placeholder.com/200x280/FF6B6B/ffffff?text=诡异末世', description: '末世降临，诡异生物入侵，主角靠吹牛成为最强王者！', category: '玄幻', status: '连载中', word_count: 50000, rating: '9.5', views: 10000 }
];

// 优先使用Supabase，其次使用飞书，最后使用本地数据
const supabase = require('./supabase');
const feishu = require('./feishu');

async function getNovels(params = {}) {
  // 1. 优先尝试Supabase
  if (supabase.isSupabaseConfigured()) {
    const result = await supabase.getNovels(params);
    if (result.novels?.length > 0) {
      return result;
    }
  }
  
  // 2. 尝试飞书
  if (feishu.isFeishuConfigured()) {
    try {
      const result = await feishu.getNovels(params);
      if (result.novels?.length > 0) {
        return result;
      }
    } catch (e) {
      console.log('Feishu unavailable:', e.message);
    }
  }
  
  // 3. Fallback到本地数据
  let novels = [...localNovels];
  if (params.category) novels = novels.filter(n => n.category === params.category);
  if (params.keyword) {
    const k = params.keyword.toLowerCase();
    novels = novels.filter(n => n.title.toLowerCase().includes(k) || n.author.toLowerCase().includes(k));
  }
  return { novels, source: 'local' };
}

async function getNovelDetail(id) {
  // 1. 优先尝试Supabase
  if (supabase.isSupabaseConfigured()) {
    const result = await supabase.getNovelDetail(id);
    if (result.novel) {
      return result;
    }
  }
  
  // 2. 尝试飞书
  if (feishu.isFeishuConfigured()) {
    try {
      const result = await feishu.getNovelDetail(id);
      if (result.novel) {
        return result;
      }
    } catch (e) {
      console.log('Feishu unavailable:', e.message);
    }
  }
  
  // 3. Fallback到本地数据
  const novel = localNovels.find(n => n.id === id);
  return { novel: novel || null, source: 'local' };
}

async function getChapters(novelId) {
  // 1. 优先尝试Supabase
  if (supabase.isSupabaseConfigured()) {
    const result = await supabase.getChapters(novelId);
    if (result.chapters?.length > 0) {
      return result;
    }
  }
  
  // 2. 尝试飞书
  if (feishu.isFeishuConfigured()) {
    try {
      const result = await feishu.getChapters(novelId);
      if (result.chapters?.length > 0) {
        return result;
      }
    } catch (e) {
      console.log('Feishu unavailable:', e.message);
    }
  }
  
  return { chapters: [], source: 'local' };
}

async function getChapterContent(chapterId) {
  // 1. 优先尝试Supabase
  if (supabase.isSupabaseConfigured()) {
    const result = await supabase.getChapterContent(chapterId);
    if (result.chapter) {
      return result;
    }
  }
  
  // 2. 尝试飞书
  if (feishu.isFeishuConfigured()) {
    try {
      const result = await feishu.getChapterContent(chapterId);
      if (result.chapter) {
        return result;
      }
    } catch (e) {
      console.log('Feishu unavailable:', e.message);
    }
  }
  
  return { chapter: null, source: 'local' };
}

module.exports = { getNovels, getNovelDetail, getChapters, getChapterContent };
