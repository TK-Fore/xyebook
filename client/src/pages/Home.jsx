import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getNovels } from '../services/api';

const categories = ['全部', '都市', '玄幻', '仙侠', '历史', '科幻', '游戏'];

function NovelCard({ novel }) {
  return (
    <Link to={`/novel/${novel.id}`} className="novel-card">
      <img 
        src={novel.cover || 'https://via.placeholder.com/200x280/89CFF0/ffffff?text=小羊书吧'} 
        alt={novel.title}
        className="novel-cover"
      />
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

  useEffect(() => {
    loadNovels();
  }, [category]);

  async function loadNovels() {
    setLoading(true);
    try {
      const data = await getNovels({ 
        category: category === '全部' ? '' : category,
        keyword 
      });
      setNovels(data.novels || []);
    } catch (error) {
      console.error('加载小说失败:', error);
    }
    setLoading(false);
  }

  function handleSearch(e) {
    e.preventDefault();
    loadNovels();
  }

  return (
    <>
      <header className="header">
        <div className="header-content">
          <Link to="/" className="logo">
            <span className="logo-icon">🐑</span>
            <span>小羊书吧</span>
          </Link>
          
          <form className="search-box" onSubmit={handleSearch}>
            <input
              type="text"
              className="search-input"
              placeholder="搜索小说..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </form>
          
          <nav className="nav-links">
            <Link to="/profile" className="nav-link">个人中心</Link>
          </nav>
        </div>
      </header>

      <main className="main-content">
        <div className="category-tabs">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-tab ${category === cat ? 'active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading">加载中...</div>
        ) : novels.length > 0 ? (
          <div className="novel-grid">
            {novels.map((novel) => (
              <NovelCard key={novel.id} novel={novel} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <p>暂无小说</p>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>© 2024 小羊书吧 - 优质小说阅读平台</p>
      </footer>
    </>
  );
}
