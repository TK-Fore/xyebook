// 扩展章节内容到3000字的脚本
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nehhbwuycrujvsrhqpfb.supabase.co',
  'sb_publishable_K4ziZd5vxIdV-7sKHWdAIg_ZO1ASKeK'
);

const MINIMAX_API_KEY = 'sk-cp-dZBKi5zb2gtjEwI6XpGoesSkhZbADBg9MhLmQ2kerVxhZZ-ibysGtwTRQU9FkMXydoVkolKBJe5Hl6LanVZlzcCdLcmj0g14BDOBClpBy3KWvVBaG_H7RHI';

// AI扩展章节内容
async function expandChapter(content, chapterTitle) {
  const prompt = `请将以下小说章节扩展到3000字左右。要求：
1. 保持原有人物和情节不变
2. 增加更多细节描写、心理活动、场景描写
3. 增加一些过渡情节使故事更连贯
4. 保持原文的风格和语气
5. 只返回扩展后的内容，不要有其他说明

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
    if (data.choices && data.choices[0]) {
      return data.choices[0].message.content;
    }
    return content;
  } catch (error) {
    console.error('API Error:', error.message);
    return content;
  }
}

// 处理所有小说的章节
async function expandAllChapters() {
  console.log('=== 开始扩展章节内容 ===\n');
  
  const novels = ['太古剑尊', '仙侠逆旅', '都市狂少', '重生2008', '最强系统'];
  
  for (const title of novels) {
    console.log(`\n📚 处理小说：《${title}》`);
    
    // 获取小说ID
    const { data: novel } = await supabase
      .from('novels')
      .select('id, title')
      .eq('title', title)
      .single();
    
    if (!novel) {
      console.log(`  ⚠️ 未找到: ${title}`);
      continue;
    }
    
    // 获取所有章节
    const { data: chapters } = await supabase
      .from('chapters')
      .select('*')
      .eq('novel_id', novel.id)
      .order('chapter_number');
    
    console.log(`  📖 共 ${chapters.length} 章`);
    
    let expanded = 0;
    let skipped = 0;
    
    for (const chapter of chapters) {
      const currentLength = chapter.content.length;
      
      // 如果已经超过2500字，就跳过
      if (currentLength >= 2500) {
        skipped++;
        continue;
      }
      
      console.log(`  ✍️ 扩展第${chapter.chapter_number}章 (当前${currentLength}字)...`);
      
      // 调用AI扩展
      const expandedContent = await expandChapter(chapter.content, chapter.title);
      
      // 更新数据库
      await supabase
        .from('chapters')
        .update({ content: expandedContent })
        .eq('id', chapter.id);
      
      expanded++;
      
      // 简单的速率限制
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`  ✅ 扩展完成: ${expanded} 章, 跳过: ${skipped} 章`);
  }
  
  console.log('\n=== 扩展完成 ===');
}

expandAllChapters().catch(console.error);
