import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getNovelDetail, getChapters, addFavorite, removeFavorite, getComments, addComment, isLoggedIn, addRating, getNovelRating, likeComment, getShareInfo } from '../services/api';
import ShareModal from '../components/ShareModal';
import Loading from '../components/Loading';
import { getReadingProgress } from '../utils/theme';

// 星星评分组件
function StarRating({ rating, onRate, readonly = false, size = 'normal' }) {
  const [hoverRating, setHoverRating] = useState(0);
  
  return (
    <div className={`star-rating ${readonly ? 'readonly' : ''} ${size}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= (hoverRating || rating) ? 'active' : ''}`}
          onClick={() => !readonly && onRate && onRate(star)}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function NovelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [novel, setNovel] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [expandedVolumes, setExpandedVolumes] = useState({});
  
  // 评分相关状态
  const [userRating, setUserRating] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  
  // 阅读进度状态
  const [readingProgress, setReadingProgress] = useState({ chapterId: null, progress: 0, currentChapter: 0, totalChapters: 0 });
  
  // 评论排序
  const [commentSort, setCommentSort] = useState('latest'); // latest or popular
  
  // 分享弹窗
  const [showShareModal, setShowShareModal] = useState(false);
  
  // 回复评论
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  // 触摸返回相关
  const touchStartX = useRef(null);

  useEffect(() => {
    loadData();
  }, [id]);

  // 触摸滑动返回
  const handleTouchStart = useCallback((e) => {
    // 只在页面顶部区域记录触摸开始位置（避免误触）
    if (e.touches[0].clientY < 100) {
      touchStartX.current = e.touches[0].clientX;
    }
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (touchStartX.current === null) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchStartX.current - touchEndX;
    const deltaY = Math.abs(e.changedTouches[0].clientY - e.touches[0].clientY);

    // 右滑超过阈值且垂直移动较小时返回首页（避免误触）
    if (deltaX < -50 && deltaY < 50) {
      navigate('/');
    }

    touchStartX.current = null;
  }, [navigate]);

  // 按卷分组章节
  const groupedChapters = chapters.reduce((acc, chapter, index) => {
    const volume = chapter.volume || '正文';
    if (!acc[volume]) {
      acc[volume] = [];
    }
    acc[volume].push({ ...chapter, index });
    return acc;
  }, {});

  const toggleVolume = (volume) => {
    setExpandedVolumes(prev => ({
      ...prev,
      [volume]: !prev[volume]
    }));
  };

  async function loadData() {
    setLoading(true);
    try {
      const [novelData, chapterData, commentData, ratingData] = await Promise.all([
        getNovelDetail(id),
        getChapters(id),
        getComments(id),
        getNovelRating(id)
      ]);
      
      setNovel(novelData.novel);
      setChapters(chapterData.chapters || []);
      setComments(commentData.comments || []);
      
      // 设置评分数据
      if (ratingData.rating) {
        setAvgRating(ratingData.rating.avgRating || 0);
        setRatingCount(ratingData.rating.count || 0);
      }
      
      // 检查本地是否已评分
      const ratedNovels = JSON.parse(localStorage.getItem('rated_novels') || '{}');
      if (ratedNovels[id]) {
        setUserRating(ratedNovels[id]);
        setHasRated(true);
      }
      
      if (isLoggedIn()) {
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        setIsFavorite(favorites.includes(id));
      }
      
      // 加载阅读进度
      const progress = getReadingProgress(id);
      setReadingProgress(progress);
    } catch (error) {
      console.error('加载失败:', error);
    }
    setLoading(false);
  }

  async function handleFavorite() {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    
    try {
      if (isFavorite) {
        await removeFavorite(id);
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        localStorage.setItem('favorites', JSON.stringify(favorites.filter(f => f !== id)));
      } else {
        await addFavorite(id);
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        localStorage.setItem('favorites', JSON.stringify([...favorites, id]));
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('收藏失败:', error);
    }
  }

  // 处理评分
  async function handleRating(rating) {
    if (hasRated) return;
    
    try {
      await addRating(id, rating);
      setUserRating(rating);
      setHasRated(true);
      
      // 本地保存评分记录
      const ratedNovels = JSON.parse(localStorage.getItem('rated_novels') || '{}');
      ratedNovels[id] = rating;
      localStorage.setItem('rated_novels', JSON.stringify(ratedNovels));
      
      // 重新获取评分数据更新平均值
      const ratingData = await getNovelRating(id);
      if (ratingData.rating) {
        setAvgRating(ratingData.rating.avgRating || 0);
        setRatingCount(ratingData.rating.count || 0);
      }
    } catch (error) {
      console.error('评分失败:', error);
    }
  }

  // 处理评论点赞
  async function handleLikeComment(commentId) {
    try {
      await likeComment(commentId);
      // 更新本地评论点赞数
      setComments(comments.map(c => 
        c.id === commentId ? { ...c, likes: (c.likes || 0) + 1 } : c
      ));
    } catch (error) {
      console.error('点赞失败:', error);
    }
  }

  // 处理回复评论
  async function handleReply(e) {
    e.preventDefault();
    if (!replyText.trim() || !replyTo) return;
    
    try {
      await addComment({
        novelId: id,
        content: `@${replyTo.author}: ${replyText}`,
        replyTo: replyTo.id
      });
      setReplyText('');
      setReplyTo(null);
      loadData();
    } catch (error) {
      console.error('回复失败:', error);
    }
  }

  function handleRead() {
    if (chapters.length > 0) {
      // 如果有阅读进度，从上次阅读的章节继续
      if (readingProgress.chapterId) {
        const chapter = chapters.find(c => c.id === readingProgress.chapterId);
        if (chapter) {
          navigate(`/read/${id}/${chapter.id}`);
          return;
        }
      }
      // 否则从第一章开始
      navigate(`/read/${id}/${chapters[0].id}`);
    }
  }

  async function handleComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    if (!isLoggedIn() && !anonymous) {
      navigate('/login');
      return;
    }

    try {
      await addComment({
        novelId: id,
        content: commentText,
        anonymous
      });
      setCommentText('');
      loadData();
    } catch (error) {
      console.error('评论失败:', error);
    }
  }

  if (loading) {
    return <Loading type="page" text="小说加载中..." />;
  }

  if (!novel) {
    return (
      <div className="empty-state error">
        <div className="empty-icon">😢</div>
        <h3>小说不存在</h3>
        <p>抱歉，您访问的小说可能已被删除或不存在</p>
        <div className="empty-action">
          <Link to="/" className="btn btn-primary">返回首页</Link>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="novel-detail-page"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <header className="header">
        <div className="header-content">
          <Link to="/" className="logo">
            <span className="logo-icon">🐑</span>
            <span>小羊书吧</span>
          </Link>
          <nav className="nav-links">
            <Link to="/profile" className="nav-link">个人中心</Link>
          </nav>
        </div>
      </header>

      <main className="novel-detail">
        <div className="novel-header">
          <img 
            src={novel.cover || 'https://via.placeholder.com/200x280/89CFF0/ffffff?text=小羊书吧'} 
            alt={novel.title}
            className="novel-cover-large"
          />
          <div className="novel-info-large">
            <h1 className="novel-title-large">{novel.title}</h1>
            <div className="novel-stats">
              <div className="stat-item">
                <span className="stat-label">作者</span>
                <span className="stat-value">{novel.author}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">分类</span>
                <span className="stat-value">{novel.category}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">字数</span>
                <span className="stat-value">{(novel.word_count || 0).toLocaleString()} 字</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">评分</span>
                <div className="stat-rating">
                  <StarRating 
                    rating={userRating || Math.round(avgRating)} 
                    onRate={handleRating}
                    readonly={hasRated}
                    size="small"
                  />
                  <span className="rating-text">
                    {avgRating > 0 ? `${avgRating.toFixed(1)}` : '0.0'} 
                    ({ratingCount}人评)
                  </span>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-label">状态</span>
                <span className="stat-value">{novel.status || '连载中'}</span>
              </div>
            </div>
            <p className="novel-desc">{novel.description || '暂无简介'}</p>
            
            {/* 阅读进度条 */}
            {readingProgress.progress > 0 && (
              <div className="reading-progress-section">
                <div className="progress-info">
                  <span>📖 已阅读 {readingProgress.currentChapter}/{readingProgress.totalChapters} 章</span>
                  <span>{readingProgress.progress}%</span>
                </div>
                <div className="progress-bar-bg">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${readingProgress.progress}%` }} 
                  />
                </div>
              </div>
            )}
            
            <div className="action-buttons">
              <button className="btn btn-primary" onClick={handleRead}>
                {readingProgress.progress > 0 ? `📖 继续阅读 (${readingProgress.progress}%)` : '📖 开始阅读'}
              </button>
              <button 
                className={`btn ${isFavorite ? 'btn-accent' : 'btn-outline'}`}
                onClick={handleFavorite}
              >
                {isFavorite ? '❤️ 已收藏' : '🤍 收藏'}
              </button>
              <button 
                className="btn btn-outline"
                onClick={() => setShowShareModal(true)}
              >
                📤 分享
              </button>
            </div>
          </div>
        </div>

        {/* 返回提示 */}
        <div className="swipe-back-hint">
          ← 左滑返回首页
        </div>

        <div className="chapter-section">
          <h2 className="section-title">📚 目录 ({chapters.length} 章)</h2>
          
          {Object.keys(groupedChapters).length > 1 ? (
            Object.entries(groupedChapters).map(([volume, volChapters]) => (
              <div key={volume} className="volume-group">
                <div 
                  className="volume-header"
                  onClick={() => toggleVolume(volume)}
                >
                  <span className="volume-title">{volume}</span>
                  <span className="volume-count">({volChapters.length}章)</span>
                  <span className="volume-toggle">{expandedVolumes[volume] !== false ? '▼' : '▶'}</span>
                </div>
                <div className={`volume-chapters ${expandedVolumes[volume] !== false ? 'expanded' : ''}`}>
                  {volChapters.map((chapter) => (
                    <Link 
                      key={chapter.id} 
                      to={`/read/${id}/${chapter.id}`}
                      className={`chapter-item ${readingProgress.chapterId === chapter.id ? 'current' : ''}`}
                    >
                      <span>
                        <span className="chapter-num">第{chapter.chapter_num || chapter.index + 1}章</span>
                        {chapter.title}
                        {readingProgress.chapterId === chapter.id && <span className="reading-badge">📖 阅读中</span>}
                      </span>
                      <span className="chapter-word-count">
                        {(chapter.word_count || 0).toLocaleString()}字
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="chapter-list">
              {chapters.map((chapter, index) => (
                <Link 
                  key={chapter.id} 
                  to={`/read/${id}/${chapter.id}`}
                  className={`chapter-item ${readingProgress.chapterId === chapter.id ? 'current' : ''}`}
                >
                  <span>
                    <span className="chapter-num">第{chapter.chapter_num || index + 1}章</span>
                    {chapter.title}
                    {readingProgress.chapterId === chapter.id && <span className="reading-badge">📖 阅读中</span>}
                  </span>
                  <span className="chapter-word-count">
                    {(chapter.word_count || 0).toLocaleString()}字
                  </span>
                </Link>
              ))}
            </div>
          )}
          
          {chapters.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📖</div>
              <h3>暂无章节</h3>
              <p>作者正在努力创作中，敬请期待~</p>
            </div>
          )}
        </div>

        <div className="comments-section">
          <h2 className="section-title">💬 评论</h2>
          <form className="comment-form" onSubmit={handleComment}>
            <textarea
              className="comment-input"
              placeholder="发表你的评论..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <div className="comment-form-footer">
              <label className="anonymous-checkbox">
                <input 
                  type="checkbox" 
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                />
                匿名评论
              </label>
              <button type="submit" className="btn btn-primary">
                发布评论
              </button>
            </div>
          </form>
          
          {/* 评论排序 */}
          <div className="comment-sort">
            <button 
              className={`sort-btn ${commentSort === 'latest' ? 'active' : ''}`}
              onClick={() => setCommentSort('latest')}
            >
              最新
            </button>
            <button 
              className={`sort-btn ${commentSort === 'popular' ? 'active' : ''}`}
              onClick={() => setCommentSort('popular')}
            >
              最热
            </button>
          </div>
          
          <div className="comment-list">
            {comments
              .sort((a, b) => {
                if (commentSort === 'popular') {
                  return (b.likes || 0) - (a.likes || 0);
                }
                return new Date(b.created_at) - new Date(a.created_at);
              })
              .map((comment) => (
              <div key={comment.id} className="comment-item">
                <div className="comment-header">
                  <span className="comment-author">
                    {comment.anonymous ? '匿名用户' : comment.author}
                  </span>
                  <span className="comment-time">
                    {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : ''}
                  </span>
                </div>
                <p className="comment-content">{comment.content}</p>
                <div className="comment-actions">
                  <button 
                    className="comment-action-btn"
                    onClick={() => handleLikeComment(comment.id)}
                  >
                    👍 {comment.likes || 0}
                  </button>
                  <button 
                    className="comment-action-btn"
                    onClick={() => setReplyTo(comment)}
                  >
                    💬 回复
                  </button>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <div className="empty-state">
                <p>暂无评论，快来抢沙发~</p>
              </div>
            )}
          </div>
          
          {/* 回复弹窗 */}
          {replyTo && (
            <form className="reply-form" onSubmit={handleReply}>
              <div className="reply-header">
                <span>回复 @{replyTo.author}</span>
                <button type="button" onClick={() => setReplyTo(null)}>取消</button>
              </div>
              <textarea
                className="comment-input"
                placeholder="写下你的回复..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <button type="submit" className="btn btn-primary btn-sm">
                发送回复
              </button>
            </form>
          )}
        </div>
      </main>
      
      {/* 分享弹窗 */}
      {showShareModal && (
        <ShareModal novel={novel} onClose={() => setShowShareModal(false)} />
      )}
    </div>
  );
}
