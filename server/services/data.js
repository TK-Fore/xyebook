const supabase = require('./supabase');

const localNovels = [
  { id: '1', title: '全职高手', author: '蝴蝶蓝', cover: 'https://via.placeholder.com/200x280/89CFF0/ffffff?text=全职高手', description: '游戏荣耀教材级作品', category: '游戏', status: '已完结', word_count: 5000000, rating: '9.2', views: 1500000 },
  { id: '2', title: '诡异末世，我靠吹牛无敌了', author: '娱乐小组', cover: 'https://via.placeholder.com/200x280/FF6B6B/ffffff?text=诡异末世', description: '诡异末世降临，主角陈九意外觉醒"吹牛成真系统"，通过吹牛吓退诡异生物，走上逆袭之路。', category: '玄幻', status: '连载中', word_count: 50000, rating: '9.5', views: 10000 }
];

const localChapters = [
  { id: '2-1', novel_id: '2', chapter_number: 1, title: '第一章', content: '主角陈九在废墟中被诡异生物追赶，临死前疯狂吹牛："我乃守夜人组织首领林九座下第一高手！"没想到诡异居然被吓退了，系统觉醒！守夜人邀请他加入...' }
];

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
  let novels = [...localNovels];
  if (params.category) novels = novels.filter(n => n.category === params.category);
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
  const chapters = localChapters.filter(c => c.novel_id === novelId);
  return { chapters, source: 'local' };
}

async function getChapterContent(chapterId) {
  const chapter = localChapters.find(c => c.id === chapterId);
  return { chapter: chapter || null, source: 'local' };
}

module.exports = { getNovels, getNovelDetail, getChapters, getChapterContent };
