/**
 * 主题管理工具
 * 提供主题色、暗色模式、字体等用户偏好管理
 */

// 默认主题配置
export const DEFAULT_THEME = {
  colorScheme: 'light', // light | dark | eye-care
  primaryColor: '#89CFF0', // 主题色
  fontFamily: 'system', // system | serif | sans-serif
  fontSize: 18,
  readingProgress: 0, // 0-100
};

// 可选的主题色
export const THEME_COLORS = [
  { name: '天空蓝', value: '#89CFF0' },
  { name: '薰衣草', value: '#B4A7D6' },
  { name: '薄荷绿', value: '#A8E6CF' },
  { name: '珊瑚红', value: '#FFAAA5' },
  { name: '奶咖色', value: '#D4A574' },
  { name: '樱花粉', value: '#FFB7C5' },
  { name: '深海蓝', value: '#667EEA' },
  { name: '夕阳橙', value: '#F5AF19' },
];

// 可选的字体
export const FONT_OPTIONS = [
  { name: '系统默认', value: 'system', css: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  { name: '衬线体', value: 'serif', css: '"LXGW WenKai", "Noto Serif SC", "Songti SC", serif' },
  { name: '无衬线', value: 'sans-serif', css: '"Noto Sans SC", "Helvetica Neue", Arial, sans-serif' },
  { name: '幼圆', value: 'rounded', css: '"Nunito", "Microsoft YaHei Rounded", sans-serif' },
];

// 暗色模式配置
export const DARK_THEMES = {
  dark: {
    bg: '#1a1a2e',
    nav: '#16213E',
    card: '#1F2937',
    text: '#E0E0E0',
    textSecondary: '#9CA3AF',
    border: '#374151',
  },
  'eye-care': {
    bg: '#F5F0E6',
    nav: '#E8DCC8',
    card: '#FAF6ED',
    text: '#5D4E37',
    textSecondary: '#8B7355',
    border: '#D4C4A8',
  },
};

/**
 * 获取用户主题设置
 */
export function getThemeSettings() {
  try {
    const saved = localStorage.getItem('themeSettings');
    return saved ? { ...DEFAULT_THEME, ...JSON.parse(saved) } : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/**
 * 保存用户主题设置
 */
export function saveThemeSettings(settings) {
  localStorage.setItem('themeSettings', JSON.stringify({ ...getThemeSettings(), ...settings }));
}

/**
 * 获取阅读进度
 */
export function getReadingProgress(novelId) {
  try {
    const saved = localStorage.getItem(`readingProgress_${novelId}`);
    return saved ? JSON.parse(saved) : { chapterId: null, progress: 0, totalChapters: 0 };
  } catch {
    return { chapterId: null, progress: 0, totalChapters: 0 };
  }
}

/**
 * 保存阅读进度
 */
export function saveReadingProgress(novelId, chapterId, currentChapter, totalChapters) {
  const progress = totalChapters > 0 ? Math.round((currentChapter / totalChapters) * 100) : 0;
  localStorage.setItem(`readingProgress_${novelId}`, JSON.stringify({
    chapterId,
    currentChapter,
    totalChapters,
    progress,
    lastRead: Date.now(),
  }));
}
