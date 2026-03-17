import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getChapterContent, getChapters, saveReadingHistory, isLoggedIn } from '../services/api';

export default function Reader() {
  const { novelId, chapterId } = useParams();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [showChapters, setShowChapters] = useState(false);

  useEffect(() => {
    loadChapter();
  }, [novelId, chapterId]);

  async function loadChapter() {
    setLoading(true);
    try {
      const [chapterData, chaptersData] = await Promise.all([
        getChapterContent(chapterId),
        getChapters(novelId)
      ]);
      
      setChapter(chapterData.chapter);
      setChapters(chaptersData.chapters || []);
      
      // 保存阅读历史
      if (isLoggedIn()) {
        saveReadingHistory({
          novelId,
          chapterId,
          timestamp: Date.now()
        });
      }
      
      // 本地存储阅读历史
      const history = JSON.parse(localStorage.getItem('readingHistory') || '{}');
      history[novelId] = { chapterId, timestamp: Date.now() };
      localStorage.setItem('readingHistory', JSON.stringify(history));
    } catch (error) {
      console.error('加载章节失败:', error);
    }
    setLoading(false);
  }

  function getCurrentIndex() {
    return chapters.findIndex(c => c.id === chapterId);
  }

  function goToPrevChapter() {
    const index = getCurrentIndex();
    if (index > 0) {
      navigate(`/read/${novelId}/${chapters[index - 1].id}`);
    }
  }

  function goToNextChapter() {
    const index = getCurrentIndex();
    if (index < chapters.length - 1) {
      navigate(`/read/${novelId}/${chapters[index + 1].id}`);
    }
  }

  function toggleDarkMode() {
    setDarkMode(!darkMode);
  }

  function increaseFontSize() {
    if (fontSize < 28) setFontSize(fontSize + 2);
  }

  function decreaseFontSize() {
    if (fontSize > 14) setFontSize(fontSize - 2);
  }

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (!chapter) {
    return <div className="empty-state">章节不存在</div>;
  }

  const currentIndex = getCurrentIndex();
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < chapters.length - 1;

  return (
    <div className={`reader-page ${darkMode ? 'dark' : ''}`}>
      <nav className="reader-nav">
        <Link to={`/novel/${novelId}`} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
          ← 返回
        </Link>
        <span className="reader-title">{chapter.title}</span>
        <div className="reader-controls">
          <button className="control-btn" onClick={() => setShowChapters(!showChapters)}>
            📑 目录
          </button>
          <button className="control-btn" onClick={decreaseFontSize}>
            A-
          </button>
          <span style={{ padding: '0 0.5rem' }}>{fontSize}px</span>
          <button className="control-btn" onClick={increaseFontSize}>
            A+
          </button>
          <button className="control-btn" onClick={toggleDarkMode}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>

      {showChapters && (
        <div style={{
          position: 'fixed',
          top: '60px',
          left: 0,
          right: 0,
          bottom: 0,
          background: darkMode ? '#16213E' : 'white',
          overflow: 'auto',
          padding: '1rem',
          zIndex: 50
        }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>目录</h3>
              <button onClick={() => setShowChapters(false)} className="control-btn">关闭</button>
            </div>
            <div className="chapter-list">
              {chapters.map((chap, index) => (
                <Link
                  key={chap.id}
                  to={`/read/${novelId}/${chap.id}`}
                  className="chapter-item"
                  style={{
                    background: chap.id === chapterId ? 'var(--primary)' : undefined,
                    color: chap.id === chapterId ? 'white' : undefined
                  }}
                  onClick={() => setShowChapters(false)}
                >
                  <span>第{chap.chapter_num || index + 1}章 {chap.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={`reader-content ${darkMode ? 'dark' : ''}`}>
        <h1 className="chapter-title">{chapter.title}</h1>
        <div 
          className="chapter-text"
          style={{ fontSize: `${fontSize}px`, lineHeight: '2' }}
        >
          {chapter.content ? chapter.content.split('\n').map((paragraph, i) => (
            <p key={i} style={{ marginBottom: '1.5em' }}>{paragraph}</p>
          )) : (
            <p style={{ color: '#999', textAlign: 'center' }}>暂无内容</p>
          )}
        </div>
      </div>

      <div className="reader-navigation">
        <button 
          className="nav-btn" 
          onClick={goToPrevChapter}
          disabled={!hasPrev}
        >
          {hasPrev ? `← 上一章\n第${chapters[currentIndex - 1]?.chapter_num || currentIndex}章` : '已经是第一章'}
        </button>
        <button 
          className="nav-btn" 
          onClick={goToNextChapter}
          disabled={!hasNext}
        >
          {hasNext ? `下一章 →\n第${chapters[currentIndex + 1]?.chapter_num || currentIndex + 2}章` : '已经是最后一章'}
        </button>
      </div>
    </div>
  );
}
