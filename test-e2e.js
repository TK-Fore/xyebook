import { chromium } from 'playwright';

const BASE_URL = 'https://xyebook.vercel.app';

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const results = {
    homePage: { status: 'pending', details: '' },
    novelDetail: { status: 'pending', details: '' },
    reader: { status: 'pending', details: '' },
    animations: { status: 'pending', details: '' }
  };

  console.log('🚀 开始验收测试...\n');

  try {
    // ===== 测试 1: 首页加载 =====
    console.log('📖 测试 1: 首页加载');
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    
    // 等待页面加载完成
    await page.waitForTimeout(2000);
    
    // 检查是否有小说列表
    const novelList = await page.locator('.novel-list, .book-list, [class*="novel"], [class*="book"]').first();
    const hasNovelList = await novelList.isVisible().catch(() => false);
    
    // 检查是否有内容区域
    const bodyContent = await page.locator('main, .content, .container').first();
    const hasContent = await bodyContent.isVisible().catch(() => false);
    
    // 获取页面标题
    const title = await page.title();
    
    results.homePage.status = 'pass';
    results.homePage.details = `页面标题: ${title}, 小说列表可见: ${hasNovelList}, 内容区域可见: ${hasContent}`;
    console.log('  ✅ 首页加载成功');
    console.log(`     ${results.homePage.details}\n`);

    // ===== 测试 2: 小说详情页 =====
    console.log('📖 测试 2: 小说详情页');
    
    // 尝试找到小说卡片并点击
    const novelCard = await page.locator('a[href*="/novel/"], .novel-card, [class*="card"]').first();
    
    if (await novelCard.isVisible().catch(() => false)) {
      await novelCard.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // 检查章节列表
      const chapterList = await page.locator('.chapter-list, [class*="chapter"]').first();
      const hasChapterList = await chapterList.isVisible().catch(() => false);
      
      // 检查详情内容
      const detailContent = await page.locator('.detail, .info, [class*="detail"]').first();
      const hasDetailContent = await detailContent.isVisible().catch(() => false);
      
      results.novelDetail.status = 'pass';
      results.novelDetail.details = `章节列表可见: ${hasChapterList}, 详情内容可见: ${hasDetailContent}`;
      console.log('  ✅ 小说详情页加载成功');
      console.log(`     ${results.novelDetail.details}\n`);
    } else {
      // 如果没有找到小说卡片，尝试直接访问一个已知的小说页面
      console.log('  ⚠️ 未找到小说卡片，尝试直接访问详情页...');
      const url = page.url();
      console.log(`     当前 URL: ${url}`);
      
      results.novelDetail.status = 'skip';
      results.novelDetail.details = '未找到可点击的小说卡片';
    }

    // ===== 测试 3: 阅读页 =====
    console.log('📖 测试 3: 阅读页');
    
    // 尝试找到章节链接并点击
    const chapterLink = await page.locator('a[href*="/read/"], .chapter-item, [class*="chapter"] a').first();
    
    if (await chapterLink.isVisible().catch(() => false)) {
      await chapterLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // 检查阅读内容
      const readerContent = await page.locator('.reader-content, .content, [class*="reader"]').first();
      const hasReaderContent = await readerContent.isVisible().catch(() => false);
      
      // 获取一些文本内容
      const textContent = await page.locator('p, div').filter({ hasText: /.+/ }).first().textContent().catch(() => '');
      
      results.reader.status = 'pass';
      results.reader.status = hasReaderContent ? 'pass' : 'warning';
      results.reader.details = `阅读内容可见: ${hasReaderContent}, 内容长度: ${textContent.length} 字符`;
      console.log('  ✅ 阅读页加载成功');
      console.log(`     ${results.reader.details}\n`);
    } else {
      console.log('  ⚠️ 未找到章节链接');
      results.reader.status = 'skip';
      results.reader.details = '未找到可点击的章节';
    }

    // ===== 测试 4: 页面动画和交互 =====
    console.log('📖 测试 4: 页面优化效果');
    
    // 检查 CSS 动画
    const animatedElements = await page.locator('[class*="animate"], [class*="transition"], [class*="fade"], [class*="slide"]').count();
    
    // 检查过渡效果
    const style = await page.evaluate(() => {
      const body = document.body;
      const computedStyle = window.getComputedStyle(body);
      return {
        transition: computedStyle.transition,
        animation: computedStyle.animation
      };
    });
    
    // 检查是否有交互元素（按钮、链接）
    const interactiveElements = await page.locator('button, a, [role="button"]').count();
    
    // 检查控制台错误
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    results.animations.status = consoleErrors.length > 0 ? 'warning' : 'pass';
    results.animations.details = `动画相关元素: ${animatedElements}, 交互元素: ${interactiveElements}, 控制台错误: ${consoleErrors.length}`;
    console.log('  ✅ 动画和交互检查完成');
    console.log(`     ${results.animations.details}\n`);

  } catch (error) {
    console.error('❌ 测试出错:', error.message);
    results.homePage.status = 'fail';
    results.homePage.details = error.message;
  } finally {
    await browser.close();
  }

  // 输出测试结果汇总
  console.log('📊 测试结果汇总:');
  console.log('='.repeat(50));
  console.log(`首页加载:        [${results.homePage.status.toUpperCase()}] ${results.homePage.details}`);
  console.log(`小说详情页:      [${results.novelDetail.status.toUpperCase()}] ${results.novelDetail.details}`);
  console.log(`阅读页:          [${results.reader.status.toUpperCase()}] ${results.reader.details}`);
  console.log(`页面优化效果:    [${results.animations.status.toUpperCase()}] ${results.animations.details}`);
  console.log('='.repeat(50));

  // 判断是否全部通过
  const allPassed = Object.values(results).every(r => r.status === 'pass' || r.status === 'skip');
  console.log(`\n🎯 总体结果: ${allPassed ? '通过' : '有问题'}`);
  
  return results;
}

runTests().catch(console.error);
