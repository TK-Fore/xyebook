import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getChapterContent, getChapters, saveReadingHistory, isLoggedIn } from '../services/api';

export default function Reader() {
  const { novelId, chapterId } = useParams();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  // 阅读模式: 'light' 白天, 'dark' 夜间, 'eye-care' 护眼
  const [readMode, setReadMode] = useState('light');
  const [fontSize, setFontSize] = useState(18);
  const [showChapters, setShowChapters] = useState(false);
  const [isSliding, setIsSliding] = useState(false); // 翻页动画状态

  // 恢复阅读偏好
  useEffect(() => {
    const savedReadMode = localStorage.getItem('readerReadMode');
    const savedFontSize = localStorage.getItem('readerFontSize');
    if (savedReadMode) setReadMode(savedReadMode);
    if (savedFontSize) setFontSize(parseInt(savedFontSize));
  }, []);

  // 切换阅读模式时保存
  useEffect(() => {
    localStorage.setItem('readerReadMode', readMode);
  }, [readMode]);

  // 切换字体大小时保存
  useEffect(() => {
    localStorage.setItem('readerFontSize', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    loadChapter();
    // 页面滚动到顶部
    window.scrollTo(0, 0);
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
      setIsSliding(true);
      setTimeout(() => {
        navigate(`/read/${novelId}/${chapters[index - 1].id}`);
        setIsSliding(false);
      }, 150);
    }
  }

  function goToNextChapter() {
    const index = getCurrentIndex();
    if (index < chapters.length - 1) {
      setIsSliding(true);
      setTimeout(() => {
        navigate(`/read/${novelId}/${chapters[index + 1].id}`);
        setIsSliding(false);
      }, 150);
    }
  }

  function cycleReadMode() {
    const modes = ['light', 'dark', 'eye-care'];
    const currentIndex = modes.indexOf(readMode);
    setReadMode(modes[(currentIndex + 1) % modes.length]);
  }

  function getModeIcon() {
    switch (readMode) {
      case 'dark': return '🌙';
      case 'eye-care': return '📖';
      default: return '☀️';
    }
  }

  function getModeText() {
    switch (readMode) {
      case 'dark': return '夜间';
      case 'eye-care': return '护眼';
      default: return '白天';
    }
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
    <div className={`reader-page ${readMode}`}>
      <nav className="reader-nav">
        <Link to={`/novel/${novelId}`} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          ← 返回
        </Link>
        <span className="reader-title">{chapter.title}</span>
        <div className="reader-controls">
          <button className="control-btn" onClick={() => setShowChapters(!showChapters)} title="目录">
            ☰
          </button>
          <button className="control-btn" onClick={decreaseFontSize} title="减小字体">
            A-
          </button>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', minWidth: '24px', textAlign: 'center' }}>
            {fontSize}
          </span>
          <button className="control-btn" onClick={increaseFontSize} title="增大字体">
            A+
          </button>
          <button className="control-btn" onClick={cycleReadMode} title={`当前: ${getModeText()}`}>
            {getModeIcon()} {getModeText()}
          </button>
        </div>
      </nav>

      {/* 目录弹窗 */}
      {showChapters && (
        <div style={{
          position: 'fixed',
          top: '50px',
          left: 0,
          right: 0,
          bottom: 0,
          background: readMode === 'dark' ? '#16213E' : readMode === 'eye-care' ? '#F5F0E6' : 'white',
          overflow: 'auto',
          padding: '1rem',
          zIndex: 50,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', position: 'sticky', top: 0, background: readMode === 'dark' ? '#16213E' : readMode === 'eye-care' ? '#F5F0E6' : 'white', padding: '0.5rem 0' }}>
              <h3 style={{ margin: 0 }}>📚 目录</h3>
              <button 
                onClick={() => setShowChapters(false)} 
                className="control-btn"
                style={{ padding: '0.375rem 0.75rem' }}
              >
                ✕ 关闭
              </button>
            </div>
            <div className="chapter-list">
              {chapters.map((chap, index) => (
                <Link
                  key={chap.id}
                  to={`/read/${novelId}/${chap.id}`}
                  className="chapter-item"
                  style={{
                    background: chap.id === chapterId ? 'var(--primary)' : undefined,
                    color: chap.id === chapterId ? 'white' : undefined,
                    borderColor: chap.id === chapterId ? 'var(--primary)' : undefined
                  }}
                  onClick={() => setShowChapters(false)}
                >
                  <span>
                    <span className="chapter-num" style={{ color: chap.id === chapterId ? 'white' : undefined }}>
                      第{chap.chapter_num || index + 1}章
                    </span>
                    {' '}{chap.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={`reader-content ${readMode === 'dark' ? 'dark' : ''}`} style={{ 
        opacity: isSliding ? 0.7 : 1,
        transform: isSliding ? 'translateX(10px)' : 'translateX(0)',
        transition: 'all 0.15s ease-out'
      }}>
        <h1 className="chapter-title">{chapter.title}</h1>
        <div 
          className="chapter-text"
          style={{ fontSize: `${fontSize}px`, lineHeight: '2' }}
        >
          {chapter.content ? chapter.content.split('\n').map((paragraph, i) => (
            <p key={i} style={{ marginBottom: '1.5em', textIndent: '2em' }}>{paragraph}</p>
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
          style={{ whiteSpace: 'pre-line' }}
        >
          {hasPrev ? `← 上一章\n第${chapters[currentIndex - 1]?.chapter_num || currentIndex}章` : '已经是第一章'}
        </button>
        <button 
          className="nav-btn" 
          onClick={goToNextChapter}
          disabled={!hasNext}
          style={{ whiteSpace: 'pre-line' }}
        >
          {hasNext ? `下一章 →\n第${chapters[currentIndex + 1]?.chapter_num || currentIndex + 2}章` : '已经是最后一章'}
        </button>
      </div>
    </div>
  );
}
