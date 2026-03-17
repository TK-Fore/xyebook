/**
 * 小羊书吧爬虫系统
 * 主入口文件
 */

const BookCrawler = require('./crawler');
const Database = require('./database');
const config = require('./config');
const fs = require('fs');
const path = require('path');

class XyeBookSystem {
  constructor() {
    this.crawler = new BookCrawler();
    this.db = new Database();
    this.localDataPath = path.join(__dirname, '../../server/data/novels.json');
  }

  /**
   * 初始化系统
   */
  async init() {
    console.log('='.repeat(50));
    console.log('  🐑 小羊书吧爬虫系统启动');
    console.log('='.repeat(50));
    
    // 初始化数据库
    this.db.init();
    
    // 创建必要的表
    await this.db.createSourcesTable();
    await this.db.createNovelsTable();
  }

  /**
   * 初始化书源
   */
  async initSources() {
    console.log('\n📚 初始化书源...');
    
    const sources = config.sources.map(s => ({
      name: s.name,
      url: s.url,
      description: s.description
    }));

    await this.db.saveSources(sources);
    return sources;
  }

  /**
   * 采集指定书源的小说
   */
  async crawlSource(sourceName) {
    const source = config.sources.find(s => s.name === sourceName);
    if (!source) {
      console.error(`未找到书源: ${sourceName}`);
      return [];
    }

    // 获取书源的小说列表
    const novelList = await this.crawler.getNovelList(source);
    
    if (novelList.length === 0) {
      console.log('  没有找到小说');
      return [];
    }

    // 采集详情（取前10本作为演示）
    const novels = await this.crawler.crawlNovelDetails(
      novelList.slice(0, 10), 
      sourceName
    );

    // 保存到数据库
    await this.db.saveNovels(novels);

    return novels;
  }

  /**
   * 采集所有书源
   */
  async crawlAll() {
    const results = [];
    
    for (const source of config.sources) {
      const novels = await this.crawlSource(source.name);
      results.push(...novels);
    }

    return results;
  }

  /**
   * 查看书源列表
   */
  async listSources() {
    return await this.db.getSources();
  }

  /**
   * 查看小说列表
   */
  async listNovels() {
    return await this.db.getNovels();
  }

  /**
   * 保存到本地 JSON 文件
   */
  async saveToLocalFile(novels) {
    try {
      // 读取现有数据
      let existingData = [];
      if (fs.existsSync(this.localDataPath)) {
        const content = fs.readFileSync(this.localDataPath, 'utf-8');
        // 提取数组部分
        const match = content.match(/\[[\s\S]*\]/);
        if (match) {
          existingData = JSON.parse(match[0]);
        }
      }

      // 合并数据（去重）
      const existingTitles = new Set(existingData.map(n => n.title));
      const newNovels = novels.filter(n => !existingTitles.has(n.title));

      // 添加 id
      const startId = existingData.length + 1;
      newNovels.forEach((novel, i) => {
        novel.id = String(startId + i);
        novel.status = 'unknown';
        novel.word_count = 0;
        novel.rating = '0';
        novel.views = 0;
        // 添加缺失字段
        if (!novel.cover) novel.cover = novel.cover_url || '';
      });

      const allNovels = [...existingData, ...newNovels];

      // 写入文件
      const fileContent = `// 本地小说数据（部署到Vercel用）
const localNovels = ${JSON.stringify(allNovels, null, 2)};

module.exports = localNovels;`;

      fs.writeFileSync(this.localDataPath, fileContent, 'utf-8');
      console.log(`  ✓ 已保存 ${newNovels.length} 本小说到本地文件`);
      
      return allNovels;
    } catch (error) {
      console.error('  ✗ 保存本地文件失败:', error.message);
      return [];
    }
  }

  /**
   * 导入到 Supabase
   */
  async importToSupabase(novels) {
    if (!this.db.isInitialized) {
      console.log('  ⚠️ Supabase 未配置，跳过导入');
      return [];
    }

    try {
      // 转换数据格式
      const supabaseNovels = novels.map(n => ({
        title: n.title,
        author: n.author,
        description: n.description,
        cover_url: n.cover_url || n.cover || '',
        category: n.category,
        chapters_url: n.chapters_url,
        source: n.source,
        status: n.status || 'unknown',
        word_count: n.word_count || 0
      }));

      const { data, error } = await this.db.supabase
        .from('novels')
        .upsert(supabaseNovels, { onConflict: 'title,source' })
        .select();

      if (error) throw error;
      
      console.log(`  ✓ 已导入 ${data?.length || 0} 本小说到 Supabase`);
      return data || [];
    } catch (error) {
      console.error('  ✗ 导入 Supabase 失败:', error.message);
      return [];
    }
  }
}

// 主函数
async function main() {
  const system = new XyeBookSystem();
  await system.init();
  
  // 初始化书源
  await system.initSources();

  // 采集所有书源
  console.log('\n🚀 开始采集小说...');
  const novels = await system.crawlAll();
  
  console.log(`\n✅ 采集完成，共获取 ${novels.length} 本小说`);
  
  // 保存到本地文件
  if (novels.length > 0) {
    console.log('\n💾 保存到本地文件...');
    await system.saveToLocalFile(novels);
    
    // 尝试导入到 Supabase
    console.log('\n📤 尝试导入到 Supabase...');
    await system.importToSupabase(novels);
  }
  
  // 显示采集结果
  if (novels.length > 0) {
    console.log('\n📖 采集结果:');
    novels.forEach((novel, i) => {
      console.log(`  ${i + 1}. ${novel.title} - ${novel.author}`);
      console.log(`     分类: ${novel.category}`);
    });
  }
}

// 导出
module.exports = XyeBookSystem;

// 如果直接运行
if (require.main === module) {
  main().catch(console.error);
}
