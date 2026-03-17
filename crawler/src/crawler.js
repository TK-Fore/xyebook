const axios = require('axios');
const cheerio = require('cheerio');
const config = require('./config');

class BookCrawler {
  constructor() {
    this.requestConfig = config.request;
  }

  /**
   * 创建带伪装的 axios 实例
   */
  createClient(baseURL = '') {
    return axios.create({
      baseURL,
      timeout: this.requestConfig.timeout,
      headers: {
        'User-Agent': this.requestConfig.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Cache-Control': 'max-age=0'
      }
    });
  }

  /**
   * 带重试的请求
   */
  async fetchWithRetry(url, options = {}, retryCount = 0) {
    const client = this.createClient();
    
    try {
      // 遵守请求间隔
      if (this.lastRequestTime) {
        const elapsed = Date.now() - this.lastRequestTime;
        if (elapsed < this.requestConfig.interval) {
          await new Promise(resolve => 
            setTimeout(resolve, this.requestConfig.interval - elapsed)
          );
        }
      }
      this.lastRequestTime = Date.now();

      const response = await client.get(url, options);
      return response.data;
    } catch (error) {
      if (retryCount < this.requestConfig.retry) {
        console.log(`请求失败，${this.requestConfig.retryDelay}ms 后重试... (${retryCount + 1}/${this.requestConfig.retry})`);
        await new Promise(resolve => 
          setTimeout(resolve, this.requestConfig.retryDelay)
        );
        return this.fetchWithRetry(url, options, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * 解析小说详情页
   */
  async parseNovelDetail(novelUrl, sourceName) {
    try {
      console.log(`  正在解析: ${novelUrl}`);
      const html = await this.fetchWithRetry(novelUrl);
      const $ = cheerio.load(html);
      
      let novel = {
        title: '',
        author: '',
        description: '',
        cover_url: '',
        category: '',
        chapters_url: novelUrl,
        source: sourceName
      };

      // 根据不同书源使用不同的解析规则
      if (sourceName === '笔趣阁') {
        novel = this.parseBiquge($, novel);
      } else if (sourceName === '顶点小说') {
        novel = this.parse23us($, novel);
      } else if (sourceName === '笔趣阁阁') {
        novel = this.parseBxworg($, novel);
      } else {
        // 默认解析
        novel.title = $('#info h1').text().trim() || 
                      $('.bookinfo h1').text().trim() ||
                      $('h1').first().text().trim();
        novel.author = $('#info p').first().text().replace(/作者：/, '').trim() ||
                       $('.bookinfo .author').text().trim();
        novel.description = $('#intro').text().trim() ||
                            $('.intro').text().trim();
        novel.cover_url = $('#fmimg img').attr('src') ||
                          $('.bookinfo .cover img').attr('src') ||
                          '';
        novel.category = $('.bookinfo .category').text().trim() || '';
      }

      console.log(`  ✓ 解析完成: ${novel.title} by ${novel.author}`);
      return novel;
    } catch (error) {
      console.error(`  ✗ 解析失败: ${novelUrl}`, error.message);
      return null;
    }
  }

  /**
   * 笔趣阁解析规则
   */
  parseBiquge($, novel) {
    // 笔趣阁详情页结构
    novel.title = $('#info h1').text().trim();
    novel.author = $('#info p').eq(0).text().replace('作者：', '').trim();
    novel.description = $('#intro').text().trim();
    novel.cover_url = $('#fmimg img').attr('src') || '';
    // 分类通常在顶部导航
    novel.category = $('meta[name="keywords"]').attr('content')?.split(',')[0] || '小说';
    
    return novel;
  }

  /**
   * 顶点小说解析规则
   */
  parse23us($, novel) {
    novel.title = $('#info h1').text().trim();
    novel.author = $('#info p').first().text().replace(/作者/, '').replace(/：/, '').trim();
    novel.description = $('#intro').text().trim();
    novel.cover_url = $('#fmimg img').attr('src') || '';
    novel.category = $('meta[name="keywords"]').attr('content')?.split(',')[0] || '小说';
    
    return novel;
  }

  /**
   * 笔趣阁阁解析规则
   */
  parseBxworg($, novel) {
    novel.title = $('.book_info h1').text().trim() || 
                  $('#info h1').text().trim();
    novel.author = $('.book_info .author').text().replace(/作者：/, '').trim() ||
                   $('#info p').eq(0).text().replace('作者：', '').trim();
    novel.description = $('.book_info .intro').text().trim() ||
                        $('#intro').text().trim();
    novel.cover_url = $('.book_info .cover img').attr('src') ||
                     $('#fmimg img').attr('src') || '';
    novel.category = $('.book_info .tag').first().text().trim() || '小说';
    
    return novel;
  }

  /**
   * 获取书源的小说列表页
   */
  async getNovelList(source) {
    try {
      console.log(`\n正在采集书源: ${source.name}`);
      const html = await this.fetchWithRetry(source.url);
      const $ = cheerio.load(html);
      
      const novels = [];
      
      // 笔趣阁列表规则
      if (source.name === '笔趣阁') {
        $('#main li, .item').each((i, el) => {
          const title = $(el).find('a').text().trim();
          const url = $(el).find('a').attr('href');
          if (title && url) {
            novels.push({
              title,
              url: url.startsWith('http') ? url : source.url + url
            });
          }
        });
      }
      
      console.log(`  发现 ${novels.length} 本小说`);
      return novels;
    } catch (error) {
      console.error(`  ✗ 采集失败: ${source.name}`, error.message);
      return [];
    }
  }

  /**
   * 批量采集小说详情
   */
  async crawlNovelDetails(novelList, sourceName) {
    const results = [];
    
    for (const novel of novelList) {
      const detail = await this.parseNovelDetail(novel.url, sourceName);
      if (detail) {
        results.push(detail);
      }
    }
    
    return results;
  }
}

module.exports = BookCrawler;
