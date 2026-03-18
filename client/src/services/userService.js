/**
 * 用户服务 - 基于localStorage的本地存储
 * 支持匿名用户，无需注册
 * 数据存储在浏览器本地，保护用户隐私
 */

const STORAGE_KEYS = {
  USER: 'xyebook_user',
  FAVORITES: 'xyebook_favorites',
  READING_HISTORY: 'xyebook_reading_history',
  READER_PREFERENCES: 'xyebook_reader_prefs',
  USER_PREFERENCES: 'xyebook_user_prefs'
};

// 生成匿名用户ID
function generateAnonymousId() {
  const user = getUser();
  if (user && user.id) return user.id;
  
  const anonymousId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  const anonymousUser = {
    id: anonymousId,
    username: '匿名用户',
    isAnonymous: true,
    createdAt: Date.now()
  };
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(anonymousUser));
  return anonymousId;
}

// 获取当前用户
export function getUser() {
  const userStr = localStorage.getItem(STORAGE_KEYS.USER);
  if (userStr) {
    return JSON.parse(userStr);
  }
  // 创建匿名用户
  generateAnonymousId();
  return getUser();
}

// 获取用户偏好设置
export function getUserPreferences() {
  const prefsStr = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
  return prefsStr ? JSON.parse(prefsStr) : {};
}

// 保存用户偏好设置
export function saveUserPreferences(prefs) {
  const current = getUserPreferences();
  const updated = { ...current, ...prefs };
  localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updated));
  return updated;
}

// 获取收藏列表
export function getFavorites() {
  const favStr = localStorage.getItem(STORAGE_KEYS.FAVORITES);
  return favStr ? JSON.parse(favStr) : [];
}

// 添加收藏
export function addFavorite(novelId, novelInfo = {}) {
  const favorites = getFavorites();
  if (!favorites.find(f => f.novelId === novelId)) {
    favorites.push({
      novelId,
      title: novelInfo.title || '',
      cover: novelInfo.cover || '',
      author: novelInfo.author || '',
      addedAt: Date.now()
    });
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
  }
  return favorites;
}

// 取消收藏
export function removeFavorite(novelId) {
  const favorites = getFavorites();
  const filtered = favorites.filter(f => f.novelId !== novelId);
  localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(filtered));
  return filtered;
}

// 检查是否已收藏
export function isFavorited(novelId) {
  const favorites = getFavorites();
  return !!favorites.find(f => f.novelId === novelId);
}

// 获取阅读历史
export function getReadingHistory() {
  const historyStr = localStorage.getItem(STORAGE_KEYS.READING_HISTORY);
  return historyStr ? JSON.parse(historyStr) : [];
}

// 保存阅读历史
export function saveReadingHistory(novelId, chapterId, chapterInfo = {}) {
  const history = getReadingHistory();
  
  // 查找是否已存在该小说的阅读记录
  const existingIndex = history.findIndex(h => h.novelId === novelId);
  
  const newRecord = {
    novelId,
    chapterId,
    title: chapterInfo.title || '',
    chapterNum: chapterInfo.chapterNum || 1,
    novelTitle: chapterInfo.novelTitle || '',
    novelCover: chapterInfo.novelCover || '',
    timestamp: Date.now()
  };
  
  if (existingIndex >= 0) {
    // 更新现有记录
    history[existingIndex] = newRecord;
  } else {
    // 添加新记录（保持在最前面）
    history.unshift(newRecord);
  }
  
  // 只保留最近50条记录
  const trimmedHistory = history.slice(0, 50);
  localStorage.setItem(STORAGE_KEYS.READING_HISTORY, JSON.stringify(trimmedHistory));
  
  return trimmedHistory;
}

// 获取某本小说的最新阅读进度
export function getNovelReadingProgress(novelId) {
  const history = getReadingHistory();
  return history.find(h => h.novelId === novelId) || null;
}

// 清除阅读历史
export function clearReadingHistory() {
  localStorage.setItem(STORAGE_KEYS.READING_HISTORY, JSON.stringify([]));
}

// 获取阅读器偏好设置
export function getReaderPreferences() {
  const prefsStr = localStorage.getItem(STORAGE_KEYS.READER_PREFERENCES);
  return prefsStr ? JSON.parse(prefsStr) : {
    readMode: 'light',
    fontSize: 18
  };
}

// 保存阅读器偏好设置
export function saveReaderPreferences(prefs) {
  const current = getReaderPreferences();
  const updated = { ...current, ...prefs };
  localStorage.setItem(STORAGE_KEYS.READER_PREFERENCES, JSON.stringify(updated));
  return updated;
}

// 导出所有数据（用于数据迁移）
export function exportUserData() {
  return {
    user: getUser(),
    favorites: getFavorites(),
    readingHistory: getReadingHistory(),
    preferences: {
      reader: getReaderPreferences(),
      user: getUserPreferences()
    }
  };
}

// 导入数据（用于数据迁移）
export function importUserData(data) {
  if (data.user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
  }
  if (data.favorites) {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(data.favorites));
  }
  if (data.readingHistory) {
    localStorage.setItem(STORAGE_KEYS.READING_HISTORY, JSON.stringify(data.readingHistory));
  }
  if (data.preferences) {
    if (data.preferences.reader) {
      localStorage.setItem(STORAGE_KEYS.READER_PREFERENCES, JSON.stringify(data.preferences.reader));
    }
    if (data.preferences.user) {
      localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(data.preferences.user));
    }
  }
}
