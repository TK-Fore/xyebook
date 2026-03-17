import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getFavoritesList, getReadingHistoryList, getNovelDetail, logout } from '../services/api';

export default function Profile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('favorites');
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [favoriteNovels, setFavoriteNovels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // 从本地存储获取收藏和历史
      const favData = getFavoritesList();
      const histData = getReadingHistoryList();
      
      setFavorites(favData || []);
      setHistory(histData || []);
      
      // 获取收藏的小说详情
      if (favData && favData.length > 0) {
        const novelPromises = favData.map(f => getNovelDetail(f.novelId));
        const novels = await Promise.all(novelPromises);
        // 合并本地存储的收藏信息和API返回的详情
        setFavoriteNovels(novels.map((n, i) => ({
          ...n.novel,
          localAddedAt: favData[i]?.addedAt
        })).filter(Boolean));
      }
    } catch (error) {
      console.error('加载失败:', error);
    }
    setLoading(false);
  }

  function handleLogout() {
    logout();
  }

  // 按最近添加时间排序收藏
  const sortedFavorites = [...favoriteNovels].sort((a, b) => 
    (b.localAddedAt || 0) - (a.localAddedAt || 0)
  );

  // 按最近阅读时间排序历史
  const sortedHistory = [...history].sort((a, b) => 
    (b.timestamp || 0) - (a.timestamp || 0)
  );

  return (
    <>
      <header className="header">
        <div className="header-content">
          <Link to="/" className="logo">
            <span className="logo-icon">🐑</span>
            <span>小羊书吧</span>
          </Link>
          <nav className="nav-links">
            <Link to="/" className="nav-link">
              🏠 首页
            </Link>
          </nav>
        </div>
      </header>

      <main className="profile-page">
        <div className="profile-header">
          <div className="profile-avatar">🐑</div>
          <h1 className="profile-name">小羊书吧</h1>
          <p>随时随地，继续阅读</p>
        </div>

        <div className="profile-tabs">
          <button 
            className={`profile-tab ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            ❤️ 收藏列表 ({favorites.length})
          </button>
          <button 
            className={`profile-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📖 阅读历史 ({history.length})
          </button>
        </div>

        {loading ? (
          <div className="loading">加载中...</div>
        ) : activeTab === 'favorites' ? (
          sortedFavorites.length > 0 ? (
            <div className="favorites-grid">
              {sortedFavorites.map((novel) => (
                <Link key={novel.id} to={`/novel/${novel.id}`} className="novel-card">
                  <img 
                    src={novel.cover || 'https://via.placeholder.com/200x280/89CFF0/ffffff?text=小羊书吧'} 
                    alt={novel.title}
                    className="novel-cover"
                  />
                  <div className="novel-info">
                    <h3 className="novel-title">{novel.title}</h3>
                    <p className="novel-author">{novel.author}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">❤️</div>
              <p>还没有收藏任何小说</p>
              <Link to="/" className="btn btn-primary" style={{ display: 'inline-block', marginTop: '1rem' }}>
                去逛逛
              </Link>
            </div>
          )
        ) : (
          sortedHistory.length > 0 ? (
            <div className="history-list">
              {sortedHistory.map((item) => (
                <Link 
                  key={`${item.novelId}-${item.chapterId}`} 
                  to={`/read/${item.novelId}/${item.chapterId}`} 
                  className="history-item"
                >
                  <div className="history-cover">
                    {item.novelCover ? (
                      <img src={item.novelCover} alt={item.novelTitle} />
                    ) : (
                      <div className="history-cover-placeholder">📖</div>
                    )}
                  </div>
                  <div className="history-info">
                    <h3 className="history-title">{item.novelTitle || '未知小说'}</h3>
                    <p className="history-chapter">
                      {item.title || `第${item.chapterNum || 1}章`}
                    </p>
                    <p className="history-time">
                      {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : ''}
                    </p>
                  </div>
                  <div className="history-action">
                    <span>继续阅读 →</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📖</div>
              <p>还没有阅读记录</p>
              <Link to="/" className="btn btn-primary" style={{ display: 'inline-block', marginTop: '1rem' }}>
                去读书
              </Link>
            </div>
          )
        )}
      </main>

      <style>{`
        .history-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 0 1rem;
        }
        .history-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background: var(--card-bg, #fff);
          border-radius: 12px;
          text-decoration: none;
          color: inherit;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .history-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }
        .history-cover {
          width: 50px;
          height: 70px;
          border-radius: 6px;
          overflow: hidden;
          flex-shrink: 0;
          background: #f0f0f0;
        }
        .history-cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .history-cover-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          background: linear-gradient(135deg, #89CFF0 0%, #6BB3D9 100%);
          color: white;
        }
        .history-info {
          flex: 1;
          min-width: 0;
        }
        .history-title {
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 0.25rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .history-chapter {
          font-size: 0.875rem;
          color: #666;
          margin: 0 0 0.25rem;
        }
        .history-time {
          font-size: 0.75rem;
          color: #999;
          margin: 0;
        }
        .history-action {
          color: var(--primary, #89CFF0);
          font-size: 0.875rem;
          white-space: nowrap;
        }
      `}</style>
    </>
  );
}
