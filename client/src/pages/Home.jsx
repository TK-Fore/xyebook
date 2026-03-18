import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getNovels, getReadingProgress } from '../services/api';
import Loading from '../components/Loading';
import { useDebounce, useClickOutside } from '../hooks/useCommon';

const categories = [
  { name: '全部', icon: '📚' },
  { name: '都市', icon: '🏙️' },
  { name: '玄幻', icon: '🐉' },
  { name: '仙侠', icon: '🗡️' },
  { name: '历史', icon: '🏯' },
  { name: '科幻', icon: '🚀' },
  { name: '游戏', icon: '🎮' }
];

// 搜索热词
const hotKeywords = [
  { text: '斗罗大陆', icon: '🔥' },
  { text: '全职高手', icon: '🎮' },
  { text: '凡人修仙传', icon: '🗡️' },
  { text: '庆余年', icon: '👑' },
  { text: '遮天', icon: '🌟' },
];

// 主题列表
const themes = [
  { id: 'default', icon: '🐑', name: '清新蓝', class: '' },
  { id: 'pink', icon: '🌸', name: '少女粉', class: 'theme-pink' },
  { id: 'purple', icon: '💜', name: '梦幻紫', class: 'theme-purple' },
  { id: 'green', icon: '🌿', name: '森系绿', class: 'theme-green' },
  { id: 'orange', icon: '🍊', name: '活力橙', class: 'theme-orange' },
  { id: 'dark', icon: '🌙', name: '夜间', class: 'theme-dark' },
  { id: 'sepia', icon: '📖', name: '护眼', class: 'theme-sepia' },
];

function NovelCard({ novel }) {
  // 卡片点击反馈
  const [isPressed, setIsPressed] = useState(false);
  
  return (
    <Link 
      to={`/novel/${novel.id}`} 
      className={`novel-card ${isPressed ? 'pressed' : ''}`}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
    >
      <div className="novel-cover-wrapper">
        <img 
          src={novel.cover || 'https://via.placeholder.com/200x280/89CFF0/ffffff?text=小羊书吧'} 
          alt={novel.title}
          className="novel-cover"
          loading="lazy"
          decoding="async"
        />
        <div className="novel-cover-overlay">
          <span className="read-btn">开始阅读</span>
        </div>
        {novel.status === '已完结' && <span className="novel-badge">完结</span>}
      </div>
      <div className="novel-info">
        <h3 className="novel-title">{novel.title}</h3>
        <p className="novel-author">{novel.author}</p>
        <div className="novel-meta">
          <span className="novel-rating">⭐ {novel.rating || '0.0'}</span>
          <span className="novel-category">{novel.category}</span>
        </div>
        {novel.description && (
          <p className="novel-desc-preview">{novel.description.slice(0, 50)}...</p>
        )}
      </div>
    </Link>
  );
}

// 继续阅读卡片组件
function ContinueReadingCard({ novelId, onClick }) {
  const [novelInfo, setNovelInfo] = useState(null);
  const [progress, setProgress] = useState(null);
  
  useEffect(() => {
    const loadProgress = async () => {
      const progressData = getReadingProgress(novelId);
      if (progressData) {
        setProgress(progressData);
        // 获取小说信息
        try {
          const data = await import('../services/api').then(m => m.getNovelDetail(novelId));
          if (data.novel) {
            setNovelInfo(data.novel);
          }
        } catch (e) {
          console.error('获取小说信息失败:', e);
        }
      }
    };
    loadProgress();
  }, [novelId]);

  if (!progress) return null;

  return (
    <div className="continue-reading-card" onClick={onClick}>
      <div className="continue-reading-cover">
        {novelInfo?.cover ? (
          <img src={novelInfo.cover} alt={novelInfo.title} />
        ) : (
          <div className="continue-reading-placeholder">📖</div>
        )}
      </div>
      <div className="continue-reading-info">
        <h3 className="continue-reading-title">{progress.novelTitle || '未知小说'}</h3>
        <p className="continue-reading-chapter">
          {progress.title || `上次阅读：第${progress.chapterNum || 1}章`}
        </p>
        <span className="continue-reading-btn">继续阅读 →</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [novels, setNovels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('全部');
  const [keyword, setKeyword] = useState('');
  const [navOpen, setNavOpen] = useState(false);
  const [source, setSource] = useState('');
  const [recentNovels, setRecentNovels] = useState([]);
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('xyebook_theme') || 'default';
  });
  const [showThemePanel, setShowThemePanel] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  
  // 防抖搜索
  const debouncedKeyword = useDebounce(keyword, 300);
  const searchRef = useRef(null);
  
  // 点击外部关闭搜索建议
  useClickOutside(searchRef, () => setShowSearchSuggestions(false));

  // 应用主题
  useEffect(() => {
    document.body.className = themes.find(t => t.id === currentTheme)?.class || '';
    localStorage.setItem('xyebook_theme', currentTheme);
  }, [currentTheme]);

  // 切换主题
  function switchTheme(themeId) {
    setCurrentTheme(themeId);
    setShowThemePanel(false);
  }

  useEffect(() => {
    loadNovels();
    loadRecentReading();
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

  // 加载最近阅读的小说
  function loadRecentReading() {
    try {
      const history = JSON.parse(localStorage.getItem('xyebook_reading_history') || '[]');
      // 获取最近阅读的不同小说
      const uniqueNovels = [];
      const seen = new Set();
      for (const item of history) {
        if (!seen.has(item.novelId)) {
          seen.add(item.novelId);
          uniqueNovels.push(item.novelId);
          if (uniqueNovels.length >= 3) break;
        }
      }
      setRecentNovels(uniqueNovels);
    } catch (e) {
      console.error('加载阅读历史失败:', e);
    }
  }

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
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="搜索小说、作者..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            {keyword && (
              <button 
                type="button" 
                className="search-clear"
                onClick={() => { setKeyword(''); loadNovels(); }}
              >
                ✕
              </button>
            )}
          </form>
          
          <nav className={`nav-links ${navOpen ? 'active' : ''}`}>
            {/* 主题切换按钮 */}
            <div className="theme-selector" style={{ position: 'relative' }}>
              <button 
                className="nav-link theme-btn"
                onClick={() => setShowThemePanel(!showThemePanel)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
              >
                {themes.find(t => t.id === currentTheme)?.icon || '🎨'}
                <span style={{ fontSize: '0.75rem' }}>主题</span>
              </button>
              {showThemePanel && (
                <div className="theme-panel" style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.5rem',
                  background: 'white',
                  borderRadius: 'var(--radius)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  padding: '0.75rem',
                  zIndex: 1000,
                  minWidth: '160px',
                  animation: 'fadeIn 0.2s ease-out'
                }}>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--text-light)', 
                    marginBottom: '0.5rem',
                    fontWeight: 600
                  }}>
                    选择主题
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    {themes.map(theme => (
                      <button
                        key={theme.id}
                        onClick={() => switchTheme(theme.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          border: 'none',
                          borderRadius: '8px',
                          background: currentTheme === theme.id ? 'var(--primary-lighter)' : 'transparent',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          color: 'var(--text-primary)',
                          transition: 'background 0.2s'
                        }}
                      >
                        <span>{theme.icon}</span>
                        <span>{theme.name}</span>
                        {currentTheme === theme.id && <span style={{ marginLeft: 'auto', color: 'var(--primary-dark)' }}>✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
        {/* 继续阅读区域 */}
        {recentNovels.length > 0 && !keyword && (
          <div className="continue-reading-section">
            <h2 className="section-subtitle">📖 最近阅读</h2>
            <div className="continue-reading-grid">
              {recentNovels.map((novelId) => {
                const history = JSON.parse(localStorage.getItem('xyebook_reading_history') || '[]');
                const progress = history.find(h => h.novelId === novelId);
                if (!progress) return null;
                
                return (
                  <Link 
                    key={novelId}
                    to={`/read/${progress.novelId}/${progress.chapterId}`}
                    className="continue-reading-item"
                  >
                    <div className="continue-reading-cover">
                      {progress.novelCover ? (
                        <img src={progress.novelCover} alt={progress.novelTitle} />
                      ) : (
                        <div className="continue-reading-placeholder">📖</div>
                      )}
                    </div>
                    <div className="continue-reading-info">
                      <h3>{progress.novelTitle || '未知小说'}</h3>
                      <p>{progress.title || `第${progress.chapterNum || 1}章`}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div className="category-tabs">
          {categories.map((cat) => (
            <button
              key={cat.name}
              className={`category-tab ${category === cat.name ? 'active' : ''}`}
              onClick={() => handleCategoryClick(cat.name)}
            >
              <span className="category-icon">{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <Loading type="page" text="正在加载小说" />
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
          <div className="empty-state search">
            <div className="empty-icon">📚</div>
            <h3>暂无小说</h3>
            <p>分类: {category} {keyword && `| 关键词: ${keyword}`}</p>
            <span className="empty-hint">
              💡 试试其他分类或关键词？
            </span>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>© 2024 小羊书吧 - 优质小说阅读平台 🐑</p>
      </footer>

      <style>{`
        .continue-reading-section {
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 12px;
        }
        .section-subtitle {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 1rem;
          color: #333;
        }
        .continue-reading-grid {
          display: flex;
          gap: 1rem;
          overflow-x: auto;
          padding-bottom: 0.5rem;
          -webkit-overflow-scrolling: touch;
        }
        .continue-reading-item {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: white;
          border-radius: 10px;
          text-decoration: none;
          color: inherit;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          min-width: 200px;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .continue-reading-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }
        .continue-reading-cover {
          width: 40px;
          height: 56px;
          border-radius: 4px;
          overflow: hidden;
          flex-shrink: 0;
          background: #e0e0e0;
        }
        .continue-reading-cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .continue-reading-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          background: linear-gradient(135deg, #89CFF0 0%, #6BB3D9 100%);
          color: white;
        }
        .continue-reading-info h3 {
          font-size: 0.9rem;
          font-weight: 600;
          margin: 0 0 0.25rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 120px;
        }
        .continue-reading-info p {
          font-size: 0.75rem;
          color: #666;
          margin: 0;
        }
      `}</style>
    </>
  );
}
