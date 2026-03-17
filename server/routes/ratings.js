// 评分路由
const express = require('express');
const router = express.Router();

// 内存存储评分
const ratings = {};

// 获取小说评分
router.get('/:novelId', (req, res) => {
  const novelId = req.params.novelId;
  const novelRatings = ratings[novelId] || [];
  
  if (novelRatings.length === 0) {
    return res.json({ 
      rating: { 
        avgRating: 0, 
        count: 0,
        distribution: {}
      } 
    });
  }
  
  const sum = novelRatings.reduce((acc, r) => acc + r.rating, 0);
  const avgRating = sum / novelRatings.length;
  
  // 统计分布
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  novelRatings.forEach(r => {
    if (distribution[r.rating] !== undefined) {
      distribution[r.rating]++;
    }
  });
  
  res.json({ 
    rating: { 
      avgRating: Math.round(avgRating * 10) / 10, 
      count: novelRatings.length,
      distribution
    } 
  });
});

// 添加评分
router.post('/', (req, res) => {
  const { novelId, rating } = req.body;
  
  if (!novelId || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: '参数错误' });
  }
  
  if (!ratings[novelId]) {
    ratings[novelId] = [];
  }
  
  // 检查是否已评分（简单版：基于IP或token）
  // 实际应该使用用户ID
  const existingIndex = ratings[novelId].findIndex(r => r.ip === req.ip);
  if (existingIndex >= 0) {
    return res.status(400).json({ message: '你已经评过分了' });
  }
  
  ratings[novelId].push({
    rating,
    ip: req.ip,
    createdAt: Date.now()
  });
  
  const novelRatings = ratings[novelId];
  const sum = novelRatings.reduce((acc, r) => acc + r.rating, 0);
  const avgRating = sum / novelRatings.length;
  
  res.json({ 
    success: true, 
    rating: { 
      avgRating: Math.round(avgRating * 10) / 10, 
      count: novelRatings.length 
    }
  });
});

module.exports = router;
