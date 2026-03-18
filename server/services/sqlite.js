// SQLite 本地数据库服务
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'data', 'novels.db');
const dataDir = path.join(__dirname, '..', 'data');

// 确保data目录存在
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 创建数据库连接
const db = new Database(dbPath);

// 初始化数据库表
function initDatabase() {
  // 创建 novels 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS novels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT,
      cover TEXT,
      description TEXT,
      category TEXT,
      status TEXT DEFAULT '连载中',
      word_count INTEGER DEFAULT 0,
      rating REAL DEFAULT 0,
      views INTEGER DEFAULT 0,
      update_time TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建 chapters 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS chapters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      novel_id INTEGER NOT NULL,
      chapter_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      word_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (novel_id) REFERENCES novels(id)
    )
  `);

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_chapters_novel_id ON chapters(novel_id);
    CREATE INDEX IF NOT EXISTS idx_chapters_number ON chapters(chapter_number);
  `);

  console.log('数据库初始化完成');
}

// 获取所有小说
function getNovels(params = {}) {
  try {
    let query = db.prepare('SELECT * FROM novels ORDER BY id DESC');
    const novels = query.all();
    return { novels, source: 'sqlite' };
  } catch (error) {
    console.error('getNovels error:', error);
    return { novels: [], source: 'sqlite', error: error.message };
  }
}

// 获取小说详情
function getNovelDetail(id) {
  try {
    const query = db.prepare('SELECT * FROM novels WHERE id = ?');
    const novel = query.get(id);
    return { novel: novel || null, source: 'sqlite' };
  } catch (error) {
    console.error('getNovelDetail error:', error);
    return { novel: null, source: 'sqlite', error: error.message };
  }
}

// 获取章节列表
function getChapters(novelId) {
  try {
    const query = db.prepare('SELECT * FROM chapters WHERE novel_id = ? ORDER BY chapter_number ASC');
    const chapters = query.all(novelId);
    return { chapters, source: 'sqlite' };
  } catch (error) {
    console.error('getChapters error:', error);
    return { chapters: [], source: 'sqlite', error: error.message };
  }
}

// 获取章节内容
function getChapterContent(chapterId) {
  try {
    const query = db.prepare('SELECT * FROM chapters WHERE id = ?');
    const chapter = query.get(chapterId);
    return { chapter: chapter || null, source: 'sqlite' };
  } catch (error) {
    console.error('getChapterContent error:', error);
    return { chapter: null, source: 'sqlite', error: error.message };
  }
}

// 添加小说
function addNovel(novel) {
  try {
    const stmt = db.prepare(`
      INSERT INTO novels (title, author, cover, description, category, status, word_count, rating, views, update_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      novel.title,
      novel.author || '',
      novel.cover || '',
      novel.description || '',
      novel.category || '其他',
      novel.status || '连载中',
      novel.word_count || 0,
      novel.rating || 0,
      novel.views || 0,
      novel.update_time || new Date().toISOString()
    );
    
    return { id: result.lastInsertRowid, source: 'sqlite' };
  } catch (error) {
    console.error('addNovel error:', error);
    return { error: error.message };
  }
}

// 批量添加小说
function addNovelsBatch(novels) {
  const stmt = db.prepare(`
    INSERT INTO novels (title, author, cover, description, category, status, word_count, rating, views, update_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const insertMany = db.transaction((items) => {
    for (const novel of items) {
      stmt.run(
        novel.title,
        novel.author || '',
        novel.cover || '',
        novel.description || '',
        novel.category || '其他',
        novel.status || '连载中',
        novel.word_count || 0,
        novel.rating || 0,
        novel.views || 0,
        novel.update_time || new Date().toISOString()
      );
    }
  });
  
  try {
    insertMany(novels);
    return { success: true, count: novels.length };
  } catch (error) {
    console.error('addNovelsBatch error:', error);
    return { error: error.message };
  }
}

// 添加章节
function addChapter(chapter) {
  try {
    const stmt = db.prepare(`
      INSERT INTO chapters (novel_id, chapter_number, title, content, word_count)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      chapter.novel_id,
      chapter.chapter_number,
      chapter.title,
      chapter.content,
      chapter.word_count || (chapter.content ? chapter.content.length : 0)
    );
    
    return { id: result.lastInsertRowid, source: 'sqlite' };
  } catch (error) {
    console.error('addChapter error:', error);
    return { error: error.message };
  }
}

// 批量添加章节
function addChaptersBatch(chapters) {
  const stmt = db.prepare(`
    INSERT INTO chapters (novel_id, chapter_number, title, content, word_count)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const insertMany = db.transaction((items) => {
    for (const chapter of items) {
      stmt.run(
        chapter.novel_id,
        chapter.chapter_number,
        chapter.title,
        chapter.content,
        chapter.word_count || (chapter.content ? chapter.content.length : 0)
      );
    }
  });
  
  try {
    insertMany(chapters);
    return { success: true, count: chapters.length };
  } catch (error) {
    console.error('addChaptersBatch error:', error);
    return { error: error.message };
  }
}

// 清空小说表（用于测试）
function clearNovels() {
  try {
    db.exec('DELETE FROM chapters; DELETE FROM novels;');
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}

// 获取统计数据
function getStats() {
  const novelCount = db.prepare('SELECT COUNT(*) as count FROM novels').get();
  const chapterCount = db.prepare('SELECT COUNT(*) as count FROM chapters').get();
  return {
    novels: novelCount.count,
    chapters: chapterCount.count
  };
}

// 初始化数据库
initDatabase();

module.exports = {
  db,
  getNovels,
  getNovelDetail,
  getChapters,
  getChapterContent,
  addNovel,
  addNovelsBatch,
  addChapter,
  addChaptersBatch,
  clearNovels,
  getStats,
  initDatabase
};
