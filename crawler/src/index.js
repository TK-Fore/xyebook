/**
 * 小羊书吧爬虫系统
 * 主入口文件
 */

const BookCrawler = require('./crawler');
const Database = require('./database');
const config = require('./config');

class XyeBookSystem {
  constructor() {
    this.crawler = new BookCrawler();
    this.db = new Database();
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
