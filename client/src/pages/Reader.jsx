import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getChapterContent, getChapters, saveReadingHistory, isLoggedIn } from '../services/api';
import { 
  getThemeSettings, 
  saveThemeSettings, 
  THEME_COLORS, 
  FONT_OPTIONS,
  DARK_THEMES,
  getReadingProgress,
  saveReadingProgress
} from '../utils/theme';
import Loading from '../components/Loading';

// 章节预加载缓存
const chapterCache = new Map();

export default function Reader() {
  const { novelId, chapterId } = useParams();
  const navigate = useNavigate();
  const contentRef = useRef(null);
  
  const [chapter, setChapter] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 阅读模式: 'light' 白天, 'dark' 夜间, 'eye-care' 护眼
  const [colorScheme, setColorScheme] = useState('light');
  const [primaryColor, setPrimaryColor] = useState('#89CFF0');
  const [fontFamily, setFontFamily] = useState('system');
  const [fontSize, setFontSize] = useState(18);
  const [showChapters, setShowChapters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  // ========== 新增功能1: 阅读进度记忆 ==========
  const isRestoringScroll = useRef(false);
  
  // ========== 新增功能2: 章节预加载 ==========
  const [preloadedChapters, setPreloadedChapters] = useState({});
  
  // ========== 新增功能3: 自动翻页 ==========
  const [autoFlip, setAutoFlip] = useState(false);
  const [autoFlipInterval, setAutoFlipInterval] = useState(5);
  const autoFlipTimerRef = useRef(null);

  // 恢复用户偏好
  useEffect(() => {
    const settings = getThemeSettings();
    setColorScheme(settings.colorScheme || 'light');
    setPrimaryColor(settings.primaryColor || '#89CFF0');
    setFontFamily(settings.fontFamily || 'system');
    setFontSize(settings.fontSize || 18);
    
    // 恢复阅读进度
    const progress = getReadingProgress(novelId);
    setReadingProgress(progress.progress || 0);
    
    // 恢复自动翻页间隔设置
    const savedInterval = localStorage.getItem('readerAutoFlipInterval');
    if (savedInterval) setAutoFlipInterval(parseInt(savedInterval));
    
    // 恢复滚动位置（从目录进入时）
    const scrollKey = `scroll_${novelId}_${chapterId}`;
    const savedScroll = localStorage.getItem(scrollKey);
    const fromDirectory = sessionStorage.getItem('fromDirectory');
    
    if (savedScroll && fromDirectory === 'true') {
      sessionStorage.removeItem('fromDirectory');
      setTimeout(() => {
        if (contentRef.current) {
          isRestoringScroll.current = true;
          contentRef.current.scrollTop = parseInt(savedScroll, 10);
          setTimeout(() => { isRestoringScroll.current = false; }, 200);
        }
      }, 100);
    }
  }, [novelId, chapterId]);

  // 监听滚动计算阅读进度并保存滚动位置
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current || isRestoringScroll.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const totalScrollable = scrollHeight - clientHeight;
      
      if (totalScrollable > 0) {
        const progress = Math.min(100, Math.round((scrollTop / totalScrollable) * 100));
        setReadingProgress(progress);
        
        // 保存进度到本地
        const currentIndex = chapters.findIndex(c => c.id === chapterId);
        if (currentIndex >= 0) {
          saveReadingProgress(novelId, chapterId, currentIndex + 1, chapters.length);
        }
        
        // 保存滚动位置
        const scrollKey = `scroll_${novelId}_${chapterId}`;
        localStorage.setItem(scrollKey, scrollTop.toString());
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [novelId, chapterId, chapters]);

  // 自动翻页逻辑
  useEffect(() => {
    if (autoFlip) {
      autoFlipTimerRef.current = setInterval(() => {
        const currentIndex = chapters.findIndex(c => c.id === chapterId);
        if (currentIndex < chapters.length - 1) {
          // 触发下一章
          const nextBtn = document.querySelector('.nav-btn-next');
          if (nextBtn && !nextBtn.disabled) {
            nextBtn.click();
          }
        } else {
          // 已经是最后一章，停止自动翻页
          setAutoFlip(false);
        }
      }, autoFlipInterval * 1000);
    } else {
      if (autoFlipTimerRef.current) {
        clearInterval(autoFlipTimerRef.current);
        autoFlipTimerRef.current = null;
      }
    }
    
    return () => {
      if (autoFlipTimerRef.current) {
        clearInterval(autoFlipTimerRef.current);
      }
    };
  }, [autoFlip, autoFlipInterval, chapters, chapterId]);

  // 保存自动翻页间隔
  useEffect(() => {
    localStorage.setItem('readerAutoFlipInterval', autoFlipInterval.toString());
  }, [autoFlipInterval]);

  // 保存主题设置
  useEffect(() => {
    saveThemeSettings({ colorScheme, primaryColor, fontFamily, fontSize });
  }, [colorScheme, primaryColor, fontFamily, fontSize]);

  useEffect(() => {
    loadChapter();
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

  function cycleColorScheme() {
    const modes = ['light', 'dark', 'eye-care'];
    const currentIndex = modes.indexOf(colorScheme);
    setColorScheme(modes[(currentIndex + 1) % modes.length]);
  }

  function getModeIcon() {
    switch (colorScheme) {
      case 'dark': return '🌙';
      case 'eye-care': return '📖';
      default: return '☀️';
    }
  }

  function getModeText() {
    switch (colorScheme) {
      case 'dark': return '夜间';
      case 'eye-care': return '护眼';
      default: return '白天';
    }
  }

  function getCurrentFont() {
    return FONT_OPTIONS.find(f => f.value === fontFamily) || FONT_OPTIONS[0];
  }

  function cycleFont() {
    const currentIndex = FONT_OPTIONS.findIndex(f => f.value === fontFamily);
    setFontFamily(FONT_OPTIONS[(currentIndex + 1) % FONT_OPTIONS.length].value);
  }

  function increaseFontSize() {
    if (fontSize < 32) setFontSize(fontSize + 2);
  }

  function decreaseFontSize() {
    if (fontSize < 14) return;
    setFontSize(fontSize - 2);
  }

  // 获取当前主题样式
  function getThemeStyles() {
    if (colorScheme === 'light') {
      return {
        bg: '#F8FBFD',
        nav: '#FFFFFF',
        card: '#FFFFFF',
        text: '#2C3E50',
        textSecondary: '#7F8C8D',
        border: '#E8F4F8',
      };
    }
    return DARK_THEMES[colorScheme] || DARK_THEMES.dark;
  }

  const theme = getThemeStyles();

  if (loading) {
    return (
      <div className="reader-page">
        <Loading type="page" text="章节加载中..." />
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="reader-page">
        <div className="empty-state">章节不存在</div>
      </div>
    );
  }

  const currentIndex = getCurrentIndex();
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < chapters.length - 1;

  return (
    <div 
      className={`reader-page ${colorScheme}`}
      style={{
        '--primary': primaryColor,
        '--bg-main': theme.bg,
        '--text-primary': theme.text,
        '--text-secondary': theme.textSecondary,
        '--nav-bg': theme.nav,
        '--card-bg': theme.card,
        '--border-color': theme.border,
      }}
    >
      {/* 阅读进度条 */}
      <div 
        className="reading-progress-bar"
        style={{ 
          background: primaryColor,
          width: `${readingProgress}%`,
        }}
      />

      <nav className="reader-nav" style={{ background: theme.nav }}>
        <Link to={`/novel/${novelId}`} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          ← 返回
        </Link>
        <span className="reader-title">{chapter.title}</span>
        <div className="reader-controls">
          {/* 自动翻页按钮 */}
          <button 
            className={`control-btn ${autoFlip ? 'auto-flip-active' : ''}`} 
            onClick={() => setAutoFlip(!autoFlip)} 
            title={autoFlip ? '关闭自动翻页' : '开启自动翻页'}
            style={{ 
              background: autoFlip ? primaryColor : 'rgba(0,0,0,0.1)',
              color: autoFlip ? 'white' : theme.text,
              border: `1px solid ${theme.border}`
            }}
          >
            {autoFlip ? '⏸' : '▶'} 自动
          </button>
          {/* 自动翻页间隔选择 */}
          {autoFlip && (
            <select 
              value={autoFlipInterval} 
              onChange={(e) => setAutoFlipInterval(parseInt(e.target.value))}
              style={{ 
                padding: '0.25rem', 
                fontSize: '0.75rem',
                borderRadius: '4px',
                border: `1px solid ${theme.border}`,
                background: theme.card,
                color: theme.text
              }}
              title="翻页间隔"
            >
              <option value={3}>3秒</option>
              <option value={5}>5秒</option>
              <option value={10}>10秒</option>
              <option value={15}>15秒</option>
              <option value={30}>30秒</option>
            </select>
          )}
          <button className="control-btn" onClick={() => setShowChapters(!showChapters)} title="目录" style={{ background: primaryColor }}>
            ☰
          </button>
          <button className="control-btn" onClick={() => setShowSettings(!showSettings)} title="设置">
            ⚙️
          </button>
          <button className="control-btn" onClick={decreaseFontSize} title="减小字体">
            A-
          </button>
          <span style={{ fontSize: '0.75rem', color: theme.textSecondary, minWidth: '24px', textAlign: 'center' }}>
            {fontSize}
          </span>
          <button className="control-btn" onClick={increaseFontSize} title="增大字体">
            A+
          </button>
          <button className="control-btn" onClick={cycleColorScheme} title={`当前: ${getModeText()}`}>
            {getModeIcon()} {getModeText()}
          </button>
        </div>
      </nav>

      {/* 设置面板 */}
      {showSettings && (
        <div className="settings-panel" style={{ background: theme.card, borderColor: theme.border }}>
          <div className="settings-section">
            <h4 style={{ margin: '0 0 0.75rem', color: theme.text }}>📖 字体选择</h4>
            <div className="font-options">
              {FONT_OPTIONS.map((font) => (
                <button
                  key={font.value}
                  className={`font-option ${fontFamily === font.value ? 'active' : ''}`}
                  style={{ 
                    fontFamily: font.css,
                    borderColor: fontFamily === font.value ? primaryColor : theme.border,
                    background: fontFamily === font.value ? `${primaryColor}20` : 'transparent',
                    color: theme.text,
                  }}
                  onClick={() => setFontFamily(font.value)}
                >
                  {font.name}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-section">
            <h4 style={{ margin: '0 0 0.75rem', color: theme.text }}>🎨 主题色</h4>
            <div className="color-options">
              {THEME_COLORS.map((color) => (
                <button
                  key={color.value}
                  className={`color-option ${primaryColor === color.value ? 'active' : ''}`}
                  style={{ 
                    background: color.value,
                    border: primaryColor === color.value ? `3px solid ${theme.text}` : '3px solid transparent',
                    boxShadow: primaryColor === color.value ? `0 0 0 2px ${color.value}` : 'none',
                  }}
                  onClick={() => setPrimaryColor(color.value)}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="settings-section">
            <h4 style={{ margin: '0 0 0.75rem', color: theme.text }}>📊 阅读进度</h4>
            <div className="progress-info" style={{ color: theme.textSecondary }}>
              <span>当前第 {currentIndex + 1} 章 / 共 {chapters.length} 章</span>
              <span>{readingProgress}%</span>
            </div>
            <div className="progress-bar-bg" style={{ background: theme.border }}>
              <div 
                className="progress-bar-fill" 
                style={{ 
                  background: primaryColor,
                  width: `${readingProgress}%` 
                }} 
              />
            </div>
          </div>

          <button 
            className="control-btn" 
            onClick={() => setShowSettings(false)}
            style={{ width: '100%', marginTop: '0.5rem', background: primaryColor, color: 'white' }}
          >
            完成设置
          </button>
        </div>
      )}

      {/* 目录弹窗 */}
      {showChapters && (
        <div style={{
          position: 'fixed',
          top: '50px',
          left: 0,
          right: 0,
          bottom: 0,
          background: theme.bg,
          overflow: 'auto',
          padding: '1rem',
          zIndex: 50,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', position: 'sticky', top: 0, background: theme.bg, padding: '0.5rem 0' }}>
              <h3 style={{ margin: 0, color: theme.text }}>📚 目录</h3>
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
                    background: chap.id === chapterId ? primaryColor : 'transparent',
                    color: chap.id === chapterId ? 'white' : theme.text,
                    borderColor: theme.border,
                  }}
                  onClick={() => setShowChapters(false)}
                >
                  <span>
                    <span className="chapter-num" style={{ color: chap.id === chapterId ? 'white' : primaryColor }}>
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

      <div 
        ref={contentRef}
        className="reader-content" 
        style={{ 
          opacity: isSliding ? 0.7 : 1,
          transform: isSliding ? 'translateX(10px)' : 'translateX(0)',
          transition: 'all 0.15s ease-out',
          fontFamily: getCurrentFont().css,
        }}
      >
        <h1 className="chapter-title" style={{ color: theme.text }}>{chapter.title}</h1>
        <div 
          className="chapter-text"
          style={{ 
            fontSize: `${fontSize}px`, 
            lineHeight: '2',
            color: theme.text,
          }}
        >
          {chapter.content ? chapter.content.split('\n').map((paragraph, i) => (
            <p key={i} style={{ marginBottom: '1.5em', textIndent: '2em' }}>{paragraph}</p>
          )) : (
            <p style={{ color: theme.textSecondary, textAlign: 'center' }}>暂无内容</p>
          )}
        </div>
      </div>

      <div className="reader-navigation">
        <button 
          className="nav-btn" 
          onClick={goToPrevChapter}
          disabled={!hasPrev}
          style={{ background: theme.card, color: theme.text, borderColor: theme.border }}
        >
          {hasPrev ? `← 上一章\n第${chapters[currentIndex - 1]?.chapter_num || currentIndex}章` : '已经是第一章'}
        </button>
        <button 
          className="nav-btn nav-btn-next" 
          onClick={goToNextChapter}
          disabled={!hasNext}
          style={{ background: theme.card, color: theme.text, borderColor: theme.border }}
        >
          {hasNext ? `下一章 →\n第${chapters[currentIndex + 1]?.chapter_num || currentIndex + 2}章` : '已经是最后一章'}
        </button>
      </div>

      {/* 内联样式 */}
      <style>{`
        .reader-page {
          min-height: 100vh;
          background: var(--bg-main);
          transition: background 0.3s, color 0.3s;
        }

        .reading-progress-bar {
          position: fixed;
          top: 0;
          left: 0;
          height: 3px;
          z-index: 1001;
          transition: width 0.2s ease-out;
        }

        .settings-panel {
          max-width: 600px;
          margin: 1rem auto;
          padding: 1.25rem;
          border-radius: 12px;
          border: 1px solid;
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .settings-section {
          margin-bottom: 1.25rem;
        }

        .settings-section:last-of-type {
          margin-bottom: 1rem;
        }

        .font-options {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .font-option {
          padding: 0.5rem 1rem;
          border: 2px solid;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.9rem;
        }

        .font-option:hover {
          transform: scale(1.02);
        }

        .color-options {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .color-option {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s;
        }

        .color-option:hover {
          transform: scale(1.15);
        }

        .progress-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
        }

        .progress-bar-bg {
          height: 8px;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease-out;
        }

        .reader-nav {
          padding: 1rem 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .reader-title {
          font-size: 1rem;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 50%;
        }

        .reader-controls {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .control-btn {
          padding: 0.375rem 0.75rem;
          border: none;
          border-radius: 18px;
          background: var(--primary, #89CFF0);
          color: white;
          cursor: pointer;
          font-size: 0.8125rem;
          transition: all 0.2s;
        }

        .control-btn:hover {
          opacity: 0.9;
          transform: scale(1.02);
        }

        .reader-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem 1.5rem;
          min-height: 60vh;
        }

        .chapter-title {
          font-size: 1.375rem;
          font-weight: bold;
          text-align: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border-color, #E8F4F8);
        }

        .chapter-text {
          font-size: 1.0625rem;
          line-height: 2;
          font-family: var(--font-serif);
          text-align: justify;
        }

        .reader-navigation {
          max-width: 800px;
          margin: 0 auto;
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          gap: 1rem;
        }

        .nav-btn {
          flex: 1;
          padding: 0.875rem;
          border: 1px solid;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }

        .nav-btn:hover:not(:disabled) {
          background: var(--primary, #89CFF0) !important;
          color: white !important;
          transform: translateY(-2px);
        }

        .nav-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .chapter-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .chapter-item {
          display: block;
          padding: 0.875rem 1rem;
          border-radius: 8px;
          border: 1px solid;
          text-decoration: none;
          transition: all 0.2s;
        }

        .chapter-item:hover {
          transform: scale(1.01);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .chapter-num {
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .reader-nav {
            padding: 0.75rem 1rem;
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          
          .reader-title {
            font-size: 0.875rem;
            max-width: 100%;
            order: -1;
            width: 100%;
            text-align: center;
            margin-bottom: 0.5rem;
          }
          
          .reader-controls {
            gap: 0.375rem;
          }
          
          .control-btn {
            padding: 0.25rem 0.5rem;
            font-size: 0.75rem;
          }
          
          .reader-content {
            padding: 1.5rem 1rem;
          }
          
          .chapter-title {
            font-size: 1.125rem;
            margin-bottom: 1.5rem;
          }
          
          .chapter-text {
            font-size: 1rem;
            line-height: 1.9;
          }
          
          .reader-navigation {
            padding: 1rem;
            flex-direction: column;
          }
          
          .nav-btn {
            padding: 0.75rem;
            font-size: 0.875rem;
          }

          .settings-panel {
            margin: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
