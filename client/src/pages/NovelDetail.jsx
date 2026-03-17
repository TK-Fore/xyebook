import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getNovelDetail, getChapters, addFavorite, removeFavorite, getComments, addComment, isLoggedIn } from '../services/api';

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

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const [novelData, chapterData, commentData] = await Promise.all([
        getNovelDetail(id),
        getChapters(id),
        getComments(id)
      ]);
      
      setNovel(novelData.novel);
      setChapters(chapterData.chapters || []);
      setComments(commentData.comments || []);
      
      // 检查是否已收藏
      if (isLoggedIn()) {
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        setIsFavorite(favorites.includes(id));
      }
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

  function handleRead() {
    if (chapters.length > 0) {
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
    return <div className="loading">加载中...</div>;
  }

  if (!novel) {
    return <div className="empty-state">小说不存在</div>;
  }

  return (
    <>
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
                <span className="stat-value">{novel.word_count?.toLocaleString() || 0} 字</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">评分</span>
                <span className="stat-value">⭐ {novel.rating || '0.0'}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">状态</span>
                <span className="stat-value">{novel.status || '连载中'}</span>
              </div>
            </div>
            <p className="novel-desc">{novel.description || '暂无简介'}</p>
            <div className="action-buttons">
              <button className="btn btn-primary" onClick={handleRead}>
                📖 开始阅读
              </button>
              <button 
                className={`btn ${isFavorite ? 'btn-accent' : 'btn-outline'}`}
                onClick={handleFavorite}
              >
                {isFavorite ? '❤️ 已收藏' : '🤍 收藏'}
              </button>
            </div>
          </div>
        </div>

        <div className="chapter-section">
          <h2 className="section-title">目录 ({chapters.length} 章)</h2>
          <div className="chapter-list">
            {chapters.map((chapter, index) => (
              <Link 
                key={chapter.id} 
                to={`/read/${id}/${chapter.id}`}
                className="chapter-item"
              >
                <span>
                  <span className="chapter-num">第{chapter.chapter_num || index + 1}章</span>
                  {chapter.title}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#7F8C8D' }}>
                  {chapter.word_count || 0}字
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="comments-section">
          <h2 className="section-title">评论</h2>
          <form className="comment-form" onSubmit={handleComment}>
            <textarea
              className="comment-input"
              placeholder="发表你的评论..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
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
          <div className="comment-list">
            {comments.map((comment) => (
              <div key={comment.id} className="comment-item">
                <div className="comment-header">
                  <span className="comment-author">
                    {comment.anonymous ? '匿名用户' : comment.author}
                  </span>
                  <span className="comment-time">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="comment-content">{comment.content}</p>
              </div>
            ))}
            {comments.length === 0 && (
              <div className="empty-state" style={{ padding: '1rem' }}>
                <p>暂无评论，快来抢沙发~</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
