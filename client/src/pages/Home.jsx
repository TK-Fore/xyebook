import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getNovels } from '../services/api';

const categories = ['全部', '都市', '玄幻', '仙侠', '历史', '科幻', '游戏'];

function NovelCard({ novel }) {
  return (
    <Link to={`/novel/${novel.id}`} className="novel-card">
      <div className="novel-cover-wrapper">
        <img 
          src={novel.cover || 'https://via.placeholder.com/200x280/89CFF0/ffffff?text=小羊书吧'} 
          alt={novel.title}
          className="novel-cover"
          loading="lazy"
        />
      </div>
      <div className="novel-info">
        <h3 className="novel-title">{novel.title}</h3>
        <p className="novel-author">{novel.author}</p>
        <div className="novel-meta">
          <span className="novel-rating">⭐ {novel.rating || '0.0'}</span>
          <span className={`novel-status ${novel.status === '已完结' ? 'completed' : ''}`}>
            {novel.status || '连载中'}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const [novels, setNovels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('全部');
  const [keyword, setKeyword] = useState('');
  const [navOpen, setNavOpen] = useState(false);
  const [source, setSource] = useState('');

  useEffect(() => {
    loadNovels();
  }, [category]);

  // 点击外部关闭导航
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navOpen && !e.target.closest('.nav-links') && !e.target.closest('.nav-toggle')) {
        setNavOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [navOpen]);

  async function loadNovels() {
    setLoading(true);
    try {
      const data = await getNovels({ 
        category: category === '全部' ? '' : category,
        keyword 
      });
      setNovels(data.novels || []);
      setSource(data.source || '');
    } catch (error) {
      console.error('加载小说失败:', error);
    }
    setLoading(false);
  }

  function handleSearch(e) {
    e.preventDefault();
    loadNovels();
  }

  function handleCategoryClick(cat) {
    setCategory(cat);
    setNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <>
      <header className="header">
        <div className="header-content">
          <Link to="/" className="logo">
            <span className="logo-icon">🐑</span>
            <span>小羊书吧</span>
          </Link>
          
          <button 
            className="nav-toggle" 
            onClick={(e) => {
              e.stopPropagation();
              setNavOpen(!navOpen);
            }}
            aria-label="菜单"
          >
            {navOpen ? '✕' : '☰'}
          </button>
          
          <form className="search-box" onSubmit={handleSearch}>
            <input
              type="text"
              className="search-input"
              placeholder="搜索小说..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </form>
          
          <nav className={`nav-links ${navOpen ? 'active' : ''}`}>
            <Link 
              to="/profile" 
              className="nav-link"
              onClick={() => setNavOpen(false)}
            >
              个人中心
            </Link>
            {navOpen && (
              <form className="search-box mobile-search" onSubmit={handleSearch}>
                <input
                  type="text"
                  className="search-input"
                  placeholder="搜索小说..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </form>
            )}
          </nav>
        </div>
      </header>

      <main className="main-content">
        <div className="category-tabs">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-tab ${category === cat ? 'active' : ''}`}
              onClick={() => handleCategoryClick(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading">加载中...</div>
        ) : novels.length > 0 ? (
          <>
            {source && (
              <p style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '0.8rem', color: '#95A5A6' }}>
                数据来源: {source === 'feishu' ? '飞书' : '本地'}
              </p>
            )}
            <div className="novel-grid">
              {novels.map((novel) => (
                <NovelCard key={novel.id} novel={novel} />
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <p>暂无小说</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
              分类: {category} {keyword && `| 关键词: ${keyword}`}
            </p>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>© 2024 小羊书吧 - 优质小说阅读平台 🐑</p>
      </footer>
    </>
  );
}
