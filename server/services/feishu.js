// 飞书多维表格服务
const { Client } = require('@larksuiteoapi/node-sdk');

// 环境变量配置（从Vercel环境变量读取）
const APP_ID = process.env.FEISHU_APP_ID || '';
const APP_SECRET = process.env.FEISHU_APP_SECRET || '';
const NOVELS_TABLE_TOKEN = process.env.FEISHU_NOVELS_TOKEN || '';
const CHAPTERS_TABLE_TOKEN = process.env.FEISHU_CHAPTERS_TOKEN || '';

// 初始化飞书客户端
let client = null;
try {
  client = new Client({
    appId: APP_ID,
    appSecret: APP_SECRET,
    logLevel: 'debug',
  });
  console.log('飞书客户端初始化成功');
} catch (error) {
  console.warn('飞书客户端初始化失败:', error.message);
}

// 模拟数据（开发环境或无配置时使用）
const mockNovels = [
  {
    id: '1',
    title: '全职高手',
    author: '蝴蝶蓝',
    cover: 'https://via.placeholder.com/200x280/89CFF0/ffffff?text=全职高手',
    description: '游戏荣耀教材级作品，讲述职业电竞选手叶修的传奇故事。',
    category: '游戏',
    status: '已完结',
    word_count: 5000000,
    rating: '9.2',
    views: 1500000
  },
  {
    id: '2',
    title: '斗破苍穹',
    author: '天蚕土豆',
    cover: 'https://via.placeholder.com/200x280/89CFF0/ffffff?text=斗破苍穹',
    description: '讲述了天才少年萧炎在异界大陆的传奇修炼之路。',
    category: '玄幻',
    status: '已完结',
    word_count: 6000000,
    rating: '8.8',
    views: 2000000
  },
  {
    id: '3',
    title: '凡人修仙传',
    author: '忘语',
    cover: 'https://via.placeholder.com/200x280/89CFF0/ffffff?text=凡人修仙传',
    description: '平凡少年韩立的修仙之路，从凡人到仙人的传奇。',
    category: '仙侠',
    status: '已完结',
    word_count: 8000000,
    rating: '9.0',
    views: 1800000
  },
  {
    id: '4',
    title: '全职艺术家',
    author: '我会修空调',
    cover: 'https://via.placeholder.com/200x280/89CFF0/ffffff?text=全职艺术家',
    description: '穿越平行世界，娱乐文化大繁荣时代的传奇故事。',
    category: '都市',
    status: '已完结',
    word_count: 4000000,
    rating: '8.9',
    views: 1200000
  },
  {
    id: '5',
    title: '庆余年',
    author: '猫腻',
    cover: 'https://via.placeholder.com/200x280/89CFF0/ffffff?text=庆余年',
    description: '穿越到古代王朝的权力斗争与爱恨情仇。',
    category: '历史',
    status: '已完结',
    word_count: 3500000,
    rating: '9.1',
    views: 1600000
  },
  {
    id: '6',
    title: '三体',
    author: '刘慈欣',
    cover: 'https://via.placeholder.com/200x280/89CFF0/ffffff?text=三体',
    description: '人类文明与三体文明的宇宙级碰撞。',
    category: '科幻',
    status: '已完结',
    word_count: 900000,
    rating: '9.3',
    views: 2500000
  },
  {
    id: '7',
    title: '诡秘之主',
    author: '爱潜水的乌贼',
    cover: 'https://via.placeholder.com/200x280/89CFF0/ffffff?text=诡秘之主',
    description: '蒸汽朋克与克苏鲁风格的西方玄幻之作。',
    category: '玄幻',
    status: '已完结',
    word_count: 3700000,
    rating: '9.4',
    views: 2000000
  },
  {
    id: '8',
    title: '完美世界',
    author: '辰东',
    cover: 'https://via.placeholder.com/200x280/89CFF0/ffffff?text=完美世界',
    description: '少年石昊的横推万古之路。',
    category: '玄幻',
    status: '已完结',
    word_count: 6500000,
    rating: '8.7',
    views: 1900000
  }
];

const mockChapters = {
  '1': [
    { id: '1-1', novel_id: '1', title: '被驱逐的王者', chapter_num: 1, word_count: 3000, content: '“休息日，一大早，陈果就接到一个电话。\n\n叶修还在睡觉，被陈果直接从上铺拖了下来。\n\n“干嘛？”叶修迷迷糊糊。\n\n“起来起来，出事了！”陈果着急。\n\n叶修掏了掏耳朵：“除夕出什么事？春晚直播事故？”\n\n“快起来！”陈果把叶修拖到电脑前。\n\n屏幕上显示的是荣耀官方论坛，一个醒目的标题挂在最上边：\n\n《爆：叶秋退役，嘉世发生了什么？》' },
    { id: '1-2', novel_id: '1', title: '荣耀至上的男人', chapter_num: 2, word_count: 2800, content: '叶修点开帖子，仔细阅读。\n\n内容很长很长，主要是关于叶秋退役的一些分析。\n\n发帖人显然是一个知情者，爆出了很多猛料。\n\n叶修一条条看下去，有时点头，有时摇头，有时会心一笑。\n\n帖子最后，发帖人声称有重大猛料要爆，但就在大家期待的时候，帖子却被删除了。' },
    { id: '1-3', novel_id: '1', title: '新的开始', chapter_num: 3, word_count: 3200, content: '“看完了？”陈果问。\n\n“看完了。”叶修说。\n\n“有什么想法？”陈果问。\n\n“写的不错。”叶修说。\n\n“这不是重点吧！”陈果说。\n\n“这帖子谁发的？”叶修问。\n\n“我哪知道。”陈果说。\n\n“挺有水平的。”叶修说。\n\n“叶秋！！！”陈果怒了。' }
  ],
  '2': [
    { id: '2-1', novel_id: '2', title: '陨落的天才', chapter_num: 1, word_count: 3500, content: '斗气大陆，这是一个属于斗气的世界。\n\n没有花俏艳丽的魔法，有的，仅仅是繁衍到巅峰的斗气！\n\n乌坦城萧家，一个曾经辉煌的家族，如今却渐渐衰落。\n\n“萧炎，凝聚斗之气旋！”\n\n训练场上，族长的声音响起。\n\n一个少年闭目盘膝而坐正是萧炎。\n\n曾经的天才，如今的废物。\n\n三段斗之气，这就是萧炎现在的等级。' },
    { id: '2-2', novel_id: '2', title: '戒指中的老爷爷', chapter_num: 2, word_count: 3100, content: '夜色渐深，萧炎独自走在回房间的路上。\n\n今天凝聚斗之气旋又失败了，三段，始终是三段。\n\n“看来真的是废物了。”萧炎自嘲一笑。\n\n回到房间，萧炎摘下手指上的黑色戒指。\n\n这是母亲留给他的遗物，据说是从一个遗迹中带回的。\n\n只是研究了这么多年，也没有什么特别之处。' }
  ],
  '3': [
    { id: '3-1', novel_id: '3', title: '山中小村', chapter_num: 1, word_count: 2800, content: '“韩立，快来看！”\n\n一个稚嫩的声音在山间回荡。\n\n这是一个偏僻的小山村，四周都是连绵起伏的山峰。\n\n村民们世世代代生活在这里，过着与世无争的日子。\n\n韩立从屋内走出来，这是一个看起来有些瘦弱的少年。\n\n“怎么了，二愣？”韩立问道。' },
    { id: '3-2', novel_id: '3', title: '修仙的诱惑', chapter_num: 2, word_count: 2900, content: '“真的有仙人？”韩立问道。\n\n“当然！我亲眼看到的！”二愣兴奋地说。\n\n两人跑到村口，果然看到一行人正在休息。\n\n这些人服饰奇异，与常人不同。\n\n为首的是一名中年男子，气度不凡。' }
  ]
};

// 检查飞书客户端是否可用
function isFeishuConfigured() {
  // 检查环境变量是否配置（不是默认值）
  const hasAppId = process.env.FEISHU_APP_ID && process.env.FEISHU_APP_ID !== 'cli_a5a6f4c2b30c900c';
  const hasAppSecret = process.env.FEISHU_APP_SECRET && process.env.FEISHU_APP_SECRET !== 'qlYN8Zs8mokq2ksqZs8mokq2ksq';
  const hasAppToken = process.env.FEISHU_NOVELS_TOKEN;
  return client !== null && hasAppId && hasAppSecret && hasAppToken;
}

// 从飞书多维表格获取小说列表
async function getNovelsFromFeishu() {
  if (!client) {
    throw new Error('飞书客户端未初始化');
  }

  try {
    const response = await client.bitable.record.list({
      app_token: NOVELS_TABLE_TOKEN,
      table_id: 'tblnovels', // 默认表ID，可根据实际情况调整
      page_size: 100,
    });

    if (response.data && response.data.items) {
      return response.data.items.map(record => ({
        id: record.fields.id || record.record_id,
        title: record.fields.title || '',
        author: record.fields.author || '',
        cover: record.fields.cover || '',
        description: record.fields.description || '',
        category: record.fields.category || '',
        status: record.fields.status || '',
        word_count: record.fields.word_count || 0,
        rating: record.fields.rating || '0.0',
        views: record.fields.views || 0,
      }));
    }
    return [];
  } catch (error) {
    console.error('获取飞书小说数据失败:', error.message);
    throw error;
  }
}

// 从飞书多维表格获取章节列表
async function getChaptersFromFeishu(novelId) {
  if (!client) {
    throw new Error('飞书客户端未初始化');
  }

  try {
    const response = await client.bitable.record.list({
      app_token: CHAPTERS_TABLE_TOKEN,
      table_id: 'tblchapters',
      filter: JSON.stringify({
        conditions: [{
          field_name: 'novel_id',
          operator: 'equal',
          value: [novelId]
        }],
        relation: 'and'
      }),
      page_size: 500,
    });

    if (response.data && response.data.items) {
      return response.data.items.map(record => ({
        id: record.record_id,
        novel_id: record.fields.novel_id || '',
        title: record.fields.title || '',
        chapter_num: record.fields.chapter_num || 0,
        word_count: record.fields.word_count || 0,
        content: record.fields.content || '',
      })).sort((a, b) => a.chapter_num - b.chapter_num);
    }
    return [];
  } catch (error) {
    console.error('获取飞书章节数据失败:', error.message);
    throw error;
  }
}

// 从飞书多维表格获取章节内容
async function getChapterContentFromFeishu(chapterId) {
  if (!client) {
    throw new Error('飞书客户端未初始化');
  }

  try {
    const response = await client.bitable.record.get({
      app_token: CHAPTERS_TABLE_TOKEN,
      table_id: 'tblchapters',
      record_id: chapterId,
    });

    if (response.data && response.data.fields) {
      return {
        id: response.data.record_id,
        novel_id: response.data.fields.novel_id || '',
        title: response.data.fields.title || '',
        chapter_num: response.data.fields.chapter_num || 0,
        word_count: response.data.fields.word_count || 0,
        content: response.data.fields.content || '',
      };
    }
    return null;
  } catch (error) {
    console.error('获取飞书章节内容失败:', error.message);
    throw error;
  }
}

// 获取小说列表
async function getNovels(params = {}) {
  // 优先尝试从飞书获取数据
  if (isFeishuConfigured()) {
    try {
      const novels = await getNovelsFromFeishu();
      let result = [...novels];
      
      if (params.category) {
        result = result.filter(n => n.category === params.category);
      }
      
      if (params.keyword) {
        const keyword = params.keyword.toLowerCase();
        result = result.filter(n => 
          n.title.toLowerCase().includes(keyword) || 
          n.author.toLowerCase().includes(keyword)
        );
      }
      
      return { novels: result, source: 'feishu' };
    } catch (error) {
      console.warn('飞书数据获取失败，使用本地数据:', error.message);
    }
  }
  
  // 使用本地模拟数据
  let novels = [...mockNovels];
  
  if (params.category) {
    novels = novels.filter(n => n.category === params.category);
  }
  
  if (params.keyword) {
    const keyword = params.keyword.toLowerCase();
    novels = novels.filter(n => 
      n.title.toLowerCase().includes(keyword) || 
      n.author.toLowerCase().includes(keyword)
    );
  }
  
  return { novels, source: 'mock' };
}

// 获取小说详情
async function getNovelDetail(id) {
  // 优先尝试从飞书获取数据
  if (isFeishuConfigured()) {
    try {
      const novels = await getNovelsFromFeishu();
      const novel = novels.find(n => n.id === id);
      if (novel) {
        return { novel, source: 'feishu' };
      }
    } catch (error) {
      console.warn('飞书数据获取失败，使用本地数据:', error.message);
    }
  }
  
  // 使用本地模拟数据
  const novel = mockNovels.find(n => n.id === id);
  return { novel: novel || null, source: 'mock' };
}

// 获取章节列表
async function getChapters(novelId) {
  // 优先尝试从飞书获取数据
  if (isFeishuConfigured()) {
    try {
      const chapters = await getChaptersFromFeishu(novelId);
      return { chapters, source: 'feishu' };
    } catch (error) {
      console.warn('飞书章节数据获取失败，使用本地数据:', error.message);
    }
  }
  
  // 使用本地模拟数据
  const chapters = mockChapters[novelId] || [];
  return { chapters, source: 'mock' };
}

// 获取章节内容
async function getChapterContent(chapterId) {
  // 优先尝试从飞书获取数据
  if (isFeishuConfigured()) {
    try {
      const chapter = await getChapterContentFromFeishu(chapterId);
      if (chapter) {
        return { chapter, source: 'feishu' };
      }
    } catch (error) {
      console.warn('飞书章节内容获取失败，使用本地数据:', error.message);
    }
  }
  
  // 使用本地模拟数据
  for (const novelId in mockChapters) {
    const chapter = mockChapters[novelId].find(c => c.id === chapterId);
    if (chapter) {
      return { chapter, source: 'mock' };
    }
  }
  return { chapter: null, source: 'mock' };
}

module.exports = {
  getNovels,
  getNovelDetail,
  getChapters,
  getChapterContent,
  mockNovels,
  mockChapters,
  isFeishuConfigured
};
