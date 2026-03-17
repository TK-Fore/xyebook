// Supabase 数据库服务
const { createClient } = require('@supabase/supabase-js');

// 从环境变量获取Supabase配置
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// 创建Supabase客户端（如果配置了）
let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// 检查是否已配置Supabase
function isSupabaseConfigured() {
  return !!supabase;
}

// 获取小说列表
async function getNovels(params = {}) {
  if (!supabase) {
    return { novels: [], source: 'supabase', error: 'Supabase not configured' };
  }

  try {
    let query = supabase.from('novels').select('*');
    
    if (params.category) {
      query = query.eq('category', params.category);
    }
    
    if (params.keyword) {
      query = query.or(`title.ilike.%${params.keyword}%,author.ilike.%${params.keyword}%`);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return { novels: data || [], source: 'supabase' };
  } catch (error) {
    console.error('Supabase getNovels error:', error);
    return { novels: [], source: 'supabase', error: error.message };
  }
}

// 获取小说详情
async function getNovelDetail(id) {
  if (!supabase) {
    return { novel: null, source: 'supabase', error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('novels')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    return { novel: data, source: 'supabase' };
  } catch (error) {
    console.error('Supabase getNovelDetail error:', error);
    return { novel: null, source: 'supabase', error: error.message };
  }
}

// 获取章节列表
async function getChapters(novelId) {
  if (!supabase) {
    return { chapters: [], source: 'supabase', error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('novel_id', novelId)
      .order('chapter_number', { ascending: true });
    
    if (error) throw error;
    
    return { chapters: data || [], source: 'supabase' };
  } catch (error) {
    console.error('Supabase getChapters error:', error);
    return { chapters: [], source: 'supabase', error: error.message };
  }
}

// 获取章节内容
async function getChapterContent(chapterId) {
  if (!supabase) {
    return { chapter: null, source: 'supabase', error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('id', chapterId)
      .single();
    
    if (error) throw error;
    
    return { chapter: data, source: 'supabase' };
  } catch (error) {
    console.error('Supabase getChapterContent error:', error);
    return { chapter: null, source: 'supabase', error: error.message };
  }
}

// 添加小说（管理员功能）
async function addNovel(novel) {
  if (!supabase) {
    return { error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('novels')
      .insert([novel])
      .select();
    
    if (error) throw error;
    
    return { novel: data[0], source: 'supabase' };
  } catch (error) {
    console.error('Supabase addNovel error:', error);
    return { error: error.message };
  }
}

module.exports = {
  supabase,
  isSupabaseConfigured,
  getNovels,
  getNovelDetail,
  getChapters,
  getChapterContent,
  addNovel
};
