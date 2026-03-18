// 扩展章节内容到3000字的脚本（改进版）
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nehhbwuycrujvsrhqpfb.supabase.co',
  'sb_publishable_K4ziZd5vxIdV-7sKHWdAIg_ZO1ASKeK'
);

const MINIMAX_API_KEY = 'sk-cp-dZBKi5zb2gtjEwI6XpGoesSkhZbADBg9MhLmQ2kerVxhZZ-ibysGtwTRQU9FkMXydoVkolKBJe5Hl6LanVZlzcCdLcmj0g14BDOBClpBy3KWvVBaG_H7RHI';

// AI扩展章节内容
async function expandChapter(content, chapterTitle) {
  const prompt = `请将以下小说章节显著扩展，要求：
1. 保持原有情节和人物
2. 大幅增加细节描写、心理活动、场景描写（至少增加3倍）
3. 增加过渡情节使故事更丰富
4. 保持原文风格
5. 只返回扩展后的正文内容，不要任何解释

原文标题：${chapterTitle}
原文内容：
${content}`;

  try {
    const response = await fetch('https://api.minimaxi.chat/v1/text/chatcompletion_v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MINIMAX_API_KEY}`
      },
      body: JSON.stringify({
        model: 'abab6.5s-chat',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    const data = await response.json();
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    }
    console.log('API返回异常:', JSON.stringify(data));
    return content;
  } catch (error) {
    console.error('API Error:', error.message);
    return content;
  }
}

// 处理单本小说的所有章节
async function expandNovel(title, novelId) {
  console.log(`\n📚 处理小说：《${title}》 (ID: ${novelId})`);
  
  // 获取所有章节
  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, chapter_number, title, content')
    .eq('novel_id', novelId)
    .order('chapter_number');
  
  console.log(`  📖 共 ${chapters.length} 章`);
  
  let expanded = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const chapter of chapters) {
    const currentLength = chapter.content.length;
    
    // 如果已经超过2800字，就跳过
    if (currentLength >= 2800) {
      skipped++;
      continue;
    }
    
    console.log(`  ✍️ 扩展第${chapter.chapter_number}章 (当前${currentLength}字)...`);
    
    try {
      // 调用AI扩展
      const expandedContent = await expandChapter(chapter.content, chapter.title);
      
      if (expandedContent && expandedContent.length > currentLength) {
        // 更新数据库
        const { error } = await supabase
          .from('chapters')
          .update({ content: expandedContent })
          .eq('id', chapter.id);
        
        if (error) {
          console.log(`     ❌ 更新失败: ${error.message}`);
          errors++;
        } else {
          console.log(`     ✅ 已扩展到 ${expandedContent.length} 字`);
          expanded++;
        }
      } else {
        console.log(`     ⚠️ 扩展后无变化`);
        errors++;
      }
    } catch (e) {
      console.log(`     ❌ 错误: ${e.message}`);
      errors++;
    }
    
    // 速率限制
    await new Promise(resolve => setTimeout(resolve, 800));
  }
  
  console.log(`  📊 完成: 扩展${expanded}章, 跳过${skipped}章, 错误${errors}章`);
  return { expanded, skipped, errors };
}

// 主函数
async function main() {
  console.log('=== 开始扩展章节内容 ===');
  console.log('时间:', new Date().toISOString());
  
  const novels = [
    { title: '太古剑尊', id: '11' },
    { title: '仙途逆旅', id: '12' },
    { title: '都市狂少', id: '13' },
    { title: '重生2008', id: '14' },
    { title: '最强系统', id: '15' }
  ];
  
  let totalExpanded = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  
  for (const novel of novels) {
    const result = await expandNovel(novel.title, novel.id);
    totalExpanded += result.expanded;
    totalSkipped += result.skipped;
    totalErrors += result.errors;
  }
  
  console.log('\n=== 全部完成 ===');
  console.log(`📊 总扩展: ${totalExpanded} 章`);
  console.log(`📊 总跳过: ${totalSkipped} 章`);
  console.log(`📊 总错误: ${totalErrors} 章`);
}

main().catch(console.error);
