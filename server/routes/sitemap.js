// Sitemap 生成路由
const express = require('express');
const router = express.Router();
const { getNovels, getChapters } = require('../services/data');

const BASE_URL = process.env.BASE_URL || 'https://xyebook.com';

// 生成 XML 格式的 sitemap
router.get('/', async (req, res) => {
  try {
    const novels = await getNovels({ limit: 1000 });
    const novelList = Array.isArray(novels) ? novels : (novels.data || []);
    
    const staticPages = [
      { loc: '/', changefreq: 'daily', priority: '1.0', lastmod: new Date().toISOString() },
      { loc: '/login', changefreq: 'monthly', priority: '0.3', lastmod: new Date().toISOString() },
      { loc: '/register', changefreq: 'monthly', priority: '0.3', lastmod: new Date().toISOString() },
    ];

    const sitemapEntries = [...staticPages];

    // 添加小说详情页
    for (const novel of novelList) {
      if (novel && novel.id) {
        sitemapEntries.push({
          loc: `/novel/${novel.id}`,
          changefreq: 'weekly',
          priority: '0.8',
          lastmod: novel.updated_at || novel.created_at || new Date().toISOString()
        });
      }
    }

    // 生成 XML
    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.map(entry => `  <url>
    <loc>${BASE_URL}${entry.loc}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(sitemapXml);
  } catch (error) {
    console.error('Sitemap生成错误:', error);
    // 返回基础 sitemap
    const basicXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
    res.header('Content-Type', 'application/xml');
    res.send(basicXml);
  }
});

module.exports = router;
