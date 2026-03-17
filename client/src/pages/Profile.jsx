import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getFavorites, getReadingHistory, getNovelDetail, logout, isLoggedIn, getCurrentUser } from '../services/api';

export default function Profile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('favorites');
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [favoriteNovels, setFavoriteNovels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    
    const currentUser = getCurrentUser();
    setUser(currentUser);
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [favData, histData] = await Promise.all([
        getFavorites(),
        getReadingHistory()
      ]);
      
      setFavorites(favData.favorites || []);
      setHistory(histData.history || []);
      
      // 获取收藏的小说详情
      const novelPromises = (favData.favorites || []).map(f => getNovelDetail(f.novelId));
      const novels = await Promise.all(novelPromises);
      setFavoriteNovels(novels.map(n => n.novel).filter(Boolean));
    } catch (error) {
      console.error('加载失败:', error);
    }
    setLoading(false);
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  if (!isLoggedIn()) {
    return null;
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
            <button 
              onClick={handleLogout}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1rem' }}
            >
              退出登录
            </button>
          </nav>
        </div>
      </header>

      <main className="profile-page">
        <div className="profile-header">
          <div className="profile-avatar">👤</div>
          <h1 className="profile-name">{user?.username || '用户'}</h1>
          <p>欢迎回来！</p>
        </div>

        <div className="profile-tabs">
          <button 
            className={`profile-tab ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            ❤️ 收藏列表
          </button>
          <button 
            className={`profile-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📖 阅读历史
          </button>
        </div>

        {loading ? (
          <div className="loading">加载中...</div>
        ) : activeTab === 'favorites' ? (
          favoriteNovels.length > 0 ? (
            <div className="favorites-grid">
              {favoriteNovels.map((novel) => (
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
          history.length > 0 ? (
            <div className="favorites-grid">
              {history.map((item) => (
                <Link key={`${item.novelId}-${item.chapterId}`} to={`/read/${item.novelId}/${item.chapterId}`} className="novel-card">
                  <div className="novel-info">
                    <h3 className="novel-title">继续阅读</h3>
                    <p className="novel-author">
                      {new Date(item.timestamp).toLocaleDateString()} · 第{item.chapterNum || 1}章
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📖</div>
              <p>还没有阅读记录</p>
            </div>
          )
        )}
      </main>
    </>
  );
}
