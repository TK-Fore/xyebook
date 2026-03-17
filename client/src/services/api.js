// API服务 - 对接飞书多维表格 + 本地存储用户系统
const API_BASE = ''; // Vercel部署时会自动设置

// 导入用户服务
import { 
  getFavorites as getFavoritesLocal, 
  addFavorite as addFavoriteLocal, 
  removeFavorite as removeFavoriteLocal,
  isFavorited,
  getReadingHistory as getReadingHistoryLocal,
  saveReadingHistory as saveReadingHistoryLocal,
  getNovelReadingProgress,
  getReaderPreferences,
  saveReaderPreferences,
  getUser as getUserLocal
} from '../services/userService';

// 获取小说列表
export async function getNovels(params = {}) {
  const { category, keyword } = params;
  let url = '/api/novels';
  const queryParams = [];
  
  if (category && category !== '全部') {
    queryParams.push(`category=${encodeURIComponent(category)}`);
  }
  if (keyword) {
    queryParams.push(`keyword=${encodeURIComponent(keyword)}`);
  }
  
  if (queryParams.length > 0) {
    url += '?' + queryParams.join('&');
  }
  
  const res = await fetch(url);
  return res.json();
}

// 获取小说详情
export async function getNovelDetail(id) {
  const res = await fetch(`/api/novels/${id}`);
  return res.json();
}

// 获取章节列表
export async function getChapters(novelId) {
  const res = await fetch(`/api/novels/${novelId}/chapters`);
  return res.json();
}

// 获取章节内容
export async function getChapterContent(chapterId) {
  const res = await fetch(`/api/chapters/${chapterId}`);
  return res.json();
}

// 添加评论
export async function addComment(data) {
  const res = await fetch('/api/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

// 获取评论列表
export async function getComments(novelId) {
  const res = await fetch(`/api/comments/${novelId}`);
  return res.json();
}

// 用户注册 - 简化为本地匿名用户
export async function register(userData) {
  return {
    success: true,
    user: getUserLocal(),
    message: '欢迎使用小羊书吧'
  };
}

// 用户登录 - 简化为本地匿名用户
export async function login(credentials) {
  return {
    success: true,
    token: 'local_token',
    user: getUserLocal()
  };
}

// 获取用户信息 - 本地获取
export async function getProfile() {
  return {
    success: true,
    user: getUserLocal()
  };
}

// 收藏小说 - 本地存储
export function addFavorite(novelId) {
  return new Promise(async (resolve) => {
    // 先尝试获取小说详情用于保存标题
    try {
      const data = await getNovelDetail(novelId);
      if (data.novel) {
        addFavoriteLocal(novelId, {
          title: data.novel.title,
          cover: data.novel.cover,
          author: data.novel.author
        });
      } else {
        addFavoriteLocal(novelId);
      }
    } catch (e) {
      addFavoriteLocal(novelId);
    }
    resolve({ success: true, favorites: getFavoritesLocal() });
  });
}

// 取消收藏 - 本地存储
export function removeFavorite(novelId) {
  removeFavoriteLocal(novelId);
  return Promise.resolve({ success: true, favorites: getFavoritesLocal() });
}

// 检查是否已收藏
export function checkFavorite(novelId) {
  return isFavorited(novelId);
}

// 获取收藏列表 - 本地获取
export function getFavoritesList() {
  return getFavoritesLocal();
}

// 保存阅读历史 - 本地存储
export function saveReadingHistory(data) {
  const { novelId, chapterId, chapterInfo = {} } = data;
  saveReadingHistoryLocal(novelId, chapterId, chapterInfo);
  return { success: true };
}

// 获取阅读历史 - 本地获取
export function getReadingHistoryList() {
  return getReadingHistoryLocal();
}

// 获取某本小说的阅读进度
export function getReadingProgress(novelId) {
  return getNovelReadingProgress(novelId);
}

// 获取阅读器偏好
export function getReadMode() {
  return getReaderPreferences();
}

// 保存阅读器偏好
export function saveReadMode(prefs) {
  return saveReaderPreferences(prefs);
}

// 添加评分
export async function addRating(novelId, rating) {
  const res = await fetch('/api/ratings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ novelId, rating }),
  });
  return res.json();
}

// 获取小说评分
export async function getNovelRating(novelId) {
  const res = await fetch(`/api/ratings/${novelId}`);
  return res.json();
}

// 评论点赞
export async function likeComment(commentId) {
  const res = await fetch(`/api/comments/${commentId}/like`, {
    method: 'POST',
  });
  return res.json();
}

// 获取分享信息
export async function getShareInfo(novelId) {
  const res = await fetch(`/api/share/${novelId}`);
  return res.json();
}

// 辅助函数：检查是否已登录（本地模式始终返回true）
export function isLoggedIn() {
  // 本地模式始终返回true，因为支持匿名用户
  return true;
}

// 退出登录（本地模式只清除本地数据）
export function logout() {
  // 保留用户数据，只清除登录状态相关的
  // 本地模式不需要真正退出
  window.location.href = '/';
}

// 获取当前用户
export function getCurrentUser() {
  return getUserLocal();
}

// 获取用户（兼容Login组件）
export function getUser() {
  return getUserLocal();
}

// 导出用户数据
export { exportUserData } from './userService';
// 导入用户数据
export { importUserData } from './userService';
