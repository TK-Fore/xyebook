// Supabase 小说导入脚本
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://nehhbwuycrujvsrhqpfb.supabase.co',
  'sb_publishable_K4ziZd5vxIdV-7sKHWdAIg_ZO1ASKeK'
);

const novelsPath = '/Users/qone/.openclaw/workspace/projects/xyebook/小说';

// 小说配置 - 10部小说
const novelsConfig = [
  { category: '玄幻', title: '逆天仙尊', author: '仙尊', description: '逆天崛起，成就无上仙尊之路', folder: '玄幻修仙/逆天仙尊' },
  { category: '玄幻', title: '凡尘仙路', author: '仙路', description: '凡尘之中，求仙问道', folder: '玄幻修仙/凡尘仙路' },
  { category: '都市', title: '都市狂少', author: '狂少', description: '都市狂少，纵横花都的传奇人生', folder: '都市/都市狂少' },
  { category: '都市', title: '王者归来', author: '王者', description: '王者的荣耀，归来之时', folder: '都市/王者归来' },
  { category: '重生', title: '重生2008', author: '重生', description: '重生2008，开启不一样的人生', folder: '重生/重生2008' },
  { category: '重生', title: '逆袭人生', author: '逆袭', description: '逆袭人生，从底层崛起', folder: '重生/逆袭人生' },
  { category: '系统', title: '最强系统', author: '系统', description: '最强系统加持，成就无上霸主', folder: '系统/最强系统' },
  { category: '系统', title: '万界抽奖系统', author: '抽奖', description: '万界抽奖，纵横诸天', folder: '系统/万界抽奖系统' },
  { category: '科幻', title: '星际文明', author: '星际', description: '探索星际文明的奥秘', folder: '科幻/星际文明' },
  { category: '科幻', title: '维度穿梭', author: '维度', description: '穿梭维度，寻找真理', folder: '科幻/维度穿梭' }
];

// 获取下一个可用ID
async function getNextNovelId() {
  const { data } = await supabase.from('novels').select('id');
  if (!data || data.length === 0) return '1';
  const maxId = Math.max(...data.map(d => parseInt(d.id)));
  return String(maxId + 1);
}

async function importNovels() {
  console.log('=== 开始导入小说到 Supabase ===\n');
  
  // 先清空可能存在的这5部小说
  console.log('检查并清理已有数据...');
  for (const config of novelsConfig) {
    const { data: existing } = await supabase
      .from('novels')
      .select('id')
      .eq('title', config.title);
    
    if (existing && existing.length > 0) {
      await supabase.from('chapters').delete().eq('novel_id', existing[0].id);
      await supabase.from('novels').delete().eq('id', existing[0].id);
      console.log(`  🗑️ 已删除旧数据: ${config.title}`);
    }
  }
  
  // 获取起始ID
  const startId = await getNextNovelId();
  let currentId = parseInt(startId);
  
  let totalChapters = 0;
  let totalWords = 0;
  
  for (const config of novelsConfig) {
    console.log(`\n📚 正在导入：《${config.title}》(${config.category})`);
    
    // 1. 添加小说信息（需要手动指定ID）
    const novelId = String(currentId++);
    const { data: novelData, error: novelError } = await supabase
      .from('novels')
      .insert([{
        id: novelId,
        title: config.title,
        author: config.author,
        cover: `https://via.placeholder.com/200x280/FF${Math.floor(Math.random()*16777215).toString(16)}/ffffff?text=${encodeURIComponent(config.title)}`,
        description: config.description,
        category: config.category,
        status: '已完结',
        word_count: 0,
        rating: 9.0,
        views: Math.floor(Math.random() * 100000)
      }])
      .select();
    
    if (novelError) {
      console.error(`  ❌ 添加小说失败: ${novelError.message}`);
      continue;
    }
    
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
    
    let novelWordCount = 0;
    let chapters = [];
    
    for (const file of chapterFiles) {
      const filePath = path.join(chapterFolder, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      const match = file.match(/第(\d+)章\s*(.*)\.md/);
      const chapterNumber = match ? parseInt(match[1]) : 0;
      const chapterTitle = match ? match[2] : file.replace('.md', '');
      
      const cleanContent = content.replace(/^#.*\n/, '').trim();
      const wordCount = cleanContent.length;
      novelWordCount += wordCount;
      
      chapters.push({
        id: `${novelId}-${chapterNumber}`,
        novel_id: novelId,
        chapter_number: chapterNumber,
        title: `第${chapterNumber}章 ${chapterTitle}`,
        content: cleanContent
      });
    }
    
    // 批量插入章节 (每次最多100条)
    const batchSize = 100;
    for (let i = 0; i < chapters.length; i += batchSize) {
      const batch = chapters.slice(i, i + batchSize);
      const { error: chapterError } = await supabase
        .from('chapters')
        .insert(batch);
      
      if (chapterError) {
        console.error(`  ❌ 添加章节失败: ${chapterError.message}`);
      }
    }
    
    console.log(`  ✅ 成功导入 ${chapters.length} 个章节`);
    totalChapters += chapters.length;
    totalWords += novelWordCount;
    
    // 更新小说的总字数
    // novels 表没有 word_count 字段可更新
    // await supabase
    //   .from('novels')
    //   .update({ word_count: novelWordCount })
    //   .eq('id', novelId);
    
    console.log(`  📝 总字数: ${novelWordCount} 字`);
  }
  
  // 显示统计信息
  console.log('\n=== 导入完成 ===');
  console.log(`📊 总小说数: ${novelsConfig.length}`);
  console.log(`📊 总章节数: ${totalChapters}`);
  console.log(`📊 总字数: ${totalWords}`);
  console.log(`📊 平均每章: ${Math.round(totalWords / totalChapters)} 字`);
  
  // 验证导入
  console.log('\n=== 验证数据 ===');
  for (const config of novelsConfig) {
    const { data: novel } = await supabase
      .from('novels')
      .select('*')
      .eq('title', config.title)
      .single();
    
    if (novel) {
      const { data: chapters } = await supabase
        .from('chapters')
        .select('*')
        .eq('novel_id', novel.id);
      
      console.log(`- ${novel.title} (${novel.category}): ${chapters.length} 章, ${novel.word_count} 字`);
    }
  }
}

importNovels().catch(console.error);
