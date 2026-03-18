const sqlite = require('./services/sqlite');
const fs = require('fs');
const path = require('path');

// 小说配置
const novelsConfig = [
  {
    category: '玄幻',
    title: '太古剑尊',
    author: '剑尊',
    description: '太古剑体觉醒，万古第一剑尊的崛起之路',
    folder: '玄幻'
  },
  {
    category: '仙侠',
    title: '仙途逆旅',
    author: '仙途',
    description: '仙途逆旅，凡人修仙问道长生',
    folder: '仙侠'
  },
  {
    category: '都市',
    title: '都市狂少',
    author: '狂少',
    description: '都市狂少，纵横花都的传奇人生',
    folder: '都市'
  },
  {
    category: '重生',
    title: '重生2008',
    author: '重生',
    description: '重生2008，开启不一样的人生',
    folder: '重生'
  },
  {
    category: '系统',
    title: '最强系统',
    author: '系统',
    description: '最强系统加持，成就无上霸主',
    folder: '系统'
  }
];

const novelsPath = '/Users/qone/.openclaw/workspace/projects/xyebook/小说';

async function importNovels() {
  console.log('=== 开始导入小说到数据库 ===\n');
  
  // 清空现有数据
  console.log('清空现有数据...');
  sqlite.clearNovels();
  
  let totalChapters = 0;
  
  for (const config of novelsConfig) {
    console.log(`\n📚 正在导入：《${config.title}》(${config.category})`);
    
    // 1. 添加小说信息
    const novelResult = sqlite.addNovel({
      title: config.title,
      author: config.author,
      cover: `https://via.placeholder.com/200x280/FF${Math.floor(Math.random()*16777215).toString(16)}/ffffff?text=${encodeURIComponent(config.title)}`,
      description: config.description,
      category: config.category,
      status: '已完结',
      word_count: 0, // 后续计算
      rating: 9.0,
      views: Math.floor(Math.random() * 100000),
      update_time: new Date().toISOString().split('T')[0]
    });
    
    if (novelResult.error) {
      console.error(`  ❌ 添加小说失败: ${novelResult.error}`);
      continue;
    }
    
    const novelId = novelResult.id;
    console.log(`  ✅ 小说添加成功，ID: ${novelId}`);
    
    // 2. 读取并添加章节
    const chapterFolder = path.join(novelsPath, config.folder);
    const chapterFiles = fs.readdirSync(chapterFolder)
      .filter(f => f.endsWith('.md'))
      .sort((a, b) => {
        const numA = parseInt(a.replace(/第|.md/g, ''));
        const numB = parseInt(b.replace(/第|.md/g, ''));
        return numA - numB;
      });
    
    console.log(`  📖 找到 ${chapterFiles.length} 个章节文件`);
    
    let chapters = [];
    let totalWords = 0;
    
    for (const file of chapterFiles) {
      const filePath = path.join(chapterFolder, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // 从文件名提取章节号和标题
      // 格式：第XX章 标题.md
      const match = file.match(/第(\d+)章\s*(.*)\.md/);
      const chapterNumber = match ? parseInt(match[1]) : 0;
      const chapterTitle = match ? match[2] : file.replace('.md', '');
      
      // 清理内容（移除Markdown标题）
      const cleanContent = content.replace(/^#.*\n/, '').trim();
      const wordCount = cleanContent.length;
      totalWords += wordCount;
      
      chapters.push({
        novel_id: novelId,
        chapter_number: chapterNumber,
        title: `第${chapterNumber}章 ${chapterTitle}`,
        content: cleanContent,
        word_count: wordCount
      });
    }
    
    // 批量插入章节
    const chapterResult = sqlite.addChaptersBatch(chapters);
    if (chapterResult.error) {
      console.error(`  ❌ 添加章节失败: ${chapterResult.error}`);
    } else {
      console.log(`  ✅ 成功导入 ${chapterResult.count} 个章节`);
      totalChapters += chapterResult.count;
    }
    
    // 更新小说的总字数
    console.log(`  📝 总字数: ${totalWords} 字`);
  }
  
  // 显示统计信息
  console.log('\n=== 导入完成 ===');
  const stats = sqlite.getStats();
  console.log(`📊 总小说数: ${stats.novels}`);
  console.log(`📊 总章节数: ${stats.chapters}`);
  
  // 验证导入
  console.log('\n=== 验证数据 ===');
  const novels = sqlite.getNovels();
  for (const novel of novels.novels) {
    const chapters = sqlite.getChapters(novel.id);
    console.log(`- ${novel.title} (${novel.category}): ${chapters.chapters.length} 章`);
  }
}

importNovels().catch(console.error);
