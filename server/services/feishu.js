// 本地小说数据
const localNovels = [
  { id: '1', title: '全职高手', author: '蝴蝶蓝', cover: 'https://via.placeholder.com/200x280/89CFF0/ffffff?text=全职高手', description: '游戏荣耀教材级作品', category: '游戏', status: '已完结', word_count: 5000000, rating: '9.2', views: 1500000, updateTime: '2024-01-15' },
  { id: '2', title: '诡异末世，我靠吹牛无敌了', author: '娱乐小组', cover: 'https://via.placeholder.com/200x280/FF6B6B/ffffff?text=诡异末世', description: '末世降临，诡异生物入侵，主角靠吹牛成为最强王者！', category: '玄幻', status: '连载中', word_count: 50000, rating: '9.5', views: 10000, updateTime: '2024-03-10' },
  { id: '3', title: '大圣传', author: '说梦者', cover: 'https://via.placeholder.com/200x280/FFB6C1/ffffff?text=大圣传', description: '讲述齐天大圣孙悟空成佛后的故事', category: '玄幻', status: '已完结', word_count: 3000000, rating: '9.0', views: 800000, updateTime: '2023-12-20' },
  { id: '4', title: '凡人修仙传', author: '忘语', cover: 'https://via.placeholder.com/200x280/98FB98/ffffff?text=凡人修仙传', description: '凡人少年逆天改命修仙成仙', category: '仙侠', status: '已完结', word_count: 7000000, rating: '9.3', views: 2000000, updateTime: '2024-02-28' },
  { id: '5', title: '庆余年', author: '猫腻', cover: 'https://via.placeholder.com/200x280/DDA0DD/ffffff?text=庆余年', description: '范闲的庆国传奇', category: '历史', status: '已完结', word_count: 4000000, rating: '9.1', views: 1200000, updateTime: '2024-01-05' },
  { id: '6', title: '三体', author: '刘慈欣', cover: 'https://via.placeholder.com/200x280/87CEEB/ffffff?text=三体', description: '地球文明与三体文明的宏大故事', category: '科幻', status: '已完结', word_count: 900000, rating: '9.4', views: 3000000, updateTime: '2023-11-15' },
  { id: '7', title: '全职法师', author: '乱', cover: 'https://via.placeholder.com/200x280/FFD700/ffffff?text=全职法师', description: '魔法世界全职系统', category: '玄幻', status: '连载中', word_count: 8000000, rating: '8.8', views: 900000, updateTime: '2024-03-12' },
  { id: '8', title: '我在都市当奶爸', author: '都市居士', cover: 'https://via.placeholder.com/200x280/FFA07A/ffffff?text=奶爸', description: '都市生活中的奶爸日常', category: '都市', status: '连载中', word_count: 200000, rating: '8.5', views: 50000, updateTime: '2024-03-14' }
];

async function getNovels(params = {}) {
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

async function getNovelDetail(id) {
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
