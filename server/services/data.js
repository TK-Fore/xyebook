const supabase = require('./supabase');
const feishu = require('./feishu');

// 本地小说数据
const localNovels = [
  { id: '1', title: '全职高手', author: '蝴蝶蓝', cover: 'https://via.placeholder.com/200x280/89CFF0/ffffff?text=全职高手', description: '游戏荣耀教材级作品', category: '游戏', status: '已完结', word_count: 5000000, rating: '9.2', views: 1500000 },
  { id: '2', title: '诡异末世，我靠吹牛无敌了', author: '娱乐小组', cover: 'https://via.placeholder.com/200x280/FF6B6B/ffffff?text=诡异末世', description: '末世降临，诡异生物入侵，主角靠吹牛成为最强王者！', category: '玄幻', status: '连载中', word_count: 50000, rating: '9.5', views: 10000 }
];

async function getNovels(params = {}) {
  // 1. 优先尝试Supabase
  if (supabase.isSupabaseConfigured()) {
    try {
      const result = await supabase.getNovels(params);
      if (result.novels?.length > 0) {
        return result;
      }
    } catch (e) {
      console.log('Supabase error:', e.message);
    }
  }
  
  // 2. Fallback到本地数据
  let novels = [...localNovels];
  if (params.category) novels = novels.filter(n => n.category === params.category);
  if (params.keyword) {
    const k = params.keyword.toLowerCase();
    novels = novels.filter(n => n.title.toLowerCase().includes(k) || n.author.toLowerCase().includes(k));
  }
  return { novels, source: 'local' };
}

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

async function getChapters(novelId) {
  return { chapters: [], source: 'local' };
}

async function getChapterContent(chapterId) {
  return { chapter: null, source: 'local' };
}

module.exports = { getNovels, getNovelDetail, getChapters, getChapterContent };
