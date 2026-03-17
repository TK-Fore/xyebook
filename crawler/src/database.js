const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

class Database {
  constructor() {
    this.supabase = null;
    this.isInitialized = false;
  }

  /**
   * 初始化 Supabase 客户端
   */
  init() {
    if (!config.supabase.url || !config.supabase.key) {
      console.warn('⚠️ Supabase 配置缺失，跳过数据库初始化');
      console.warn('   请设置环境变量: SUPABASE_URL 和 SUPABASE_KEY');
      return false;
    }

    this.supabase = createClient(config.supabase.url, config.supabase.key);
    this.isInitialized = true;
    console.log('✓ 数据库连接已初始化');
    return true;
  }

  /**
   * 创建书源表
   */
  async createSourcesTable() {
    if (!this.isInitialized) return false;

    try {
      // 尝试创建 sources 表
      const { error } = await this.supabase
        .from('sources')
        .select('id')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        // 表不存在 - 通过插入数据来创建
        console.log('  sources 表不存在，尝试创建...');
        // 这里需要使用 SQL，可以通过存储过程或者直接返回提示
      } else if (!error) {
        console.log('✓ sources 表就绪');
      }
      
      return true;
    } catch (error) {
      console.log('  sources 表检查:', error.message);
      return false;
    }
  }

  /**
   * 检查并创建表
   */
  async ensureTables() {
    if (!this.isInitialized) return false;
    
    // 检查 sources 表
    try {
      const { error } = await this.supabase.from('sources').select('id').limit(1);
      if (!error) {
        console.log('✓ sources 表已存在');
      }
    } catch (e) {
      console.log('⚠️ sources 表不存在，将在首次插入时自动创建');
    }
    
    // 检查 novels 表
    try {
      const { error } = await this.supabase.from('novels').select('id').limit(1);
      if (!error) {
        console.log('✓ novels 表已存在');
      }
    } catch (e) {
      console.log('⚠️ novels 表不存在，将在首次插入时自动创建');
    }
    
    return true;
  }

  /**
   * 创建小说表
   */
  async createNovelsTable() {
    return this.ensureTables();
  }

  /**
   * 保存书源
   */
  async saveSources(sources) {
    if (!this.isInitialized) {
      console.log('  📝 模拟保存书源:', sources.map(s => s.name).join(', '));
      return sources;
    }

    try {
      const { data, error } = await this.supabase
        .from('sources')
        .upsert(sources, { onConflict: 'url' })
        .select();

      if (error) throw error;
      
      console.log(`  ✓ 已保存 ${data?.length || 0} 个书源`);
      return data;
    } catch (error) {
      console.error('  ✗ 保存书源失败:', error.message);
      return null;
    }
  }

  /**
   * 保存小说
   */
  async saveNovels(novels) {
    if (!this.isInitialized) {
      console.log('  📝 模拟保存小说:', novels.length, '本');
      return novels;
    }

    try {
      const { data, error } = await this.supabase
        .from('novels')
        .upsert(novels, { onConflict: 'title,source' })
        .select();

      if (error) throw error;
      
      console.log(`  ✓ 已保存 ${data?.length || 0} 本小说`);
      return data;
    } catch (error) {
      console.error('  ✗ 保存小说失败:', error.message);
      return null;
    }
  }

  /**
   * 获取所有书源
   */
  async getSources() {
    if (!this.isInitialized) return [];

    try {
      const { data, error } = await this.supabase
        .from('sources')
        .select('*');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('  ✗ 获取书源失败:', error.message);
      return [];
    }
  }

  /**
   * 获取所有小说
   */
  async getNovels(limit = 100) {
    if (!this.isInitialized) return [];

    try {
      const { data, error } = await this.supabase
        .from('novels')
        .select('*')
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('  ✗ 获取小说失败:', error.message);
      return [];
    }
  }
}

module.exports = Database;
