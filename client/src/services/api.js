// API服务 - 对接飞书多维表格
const API_BASE = ''; // Vercel部署时会自动设置

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

// 用户注册
export async function register(userData) {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  return res.json();
}

// 用户登录
export async function login(credentials) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  return res.json();
}

// 获取用户信息
export async function getProfile() {
  const res = await fetch('/api/user/profile', {
    headers: getAuthHeaders(),
  });
  return res.json();
}

// 收藏小说
export async function addFavorite(novelId) {
  const res = await fetch('/api/user/favorite', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ novelId }),
  });
  return res.json();
}

// 取消收藏
export async function removeFavorite(novelId) {
  const res = await fetch(`/api/user/favorite/${novelId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return res.json();
}

// 获取收藏列表
export async function getFavorites() {
  const res = await fetch('/api/user/favorites', {
    headers: getAuthHeaders(),
  });
  return res.json();
}

// 添加评论
export async function addComment(data) {
  const res = await fetch('/api/comments', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

// 获取评论列表
export async function getComments(novelId) {
  const res = await fetch(`/api/comments/${novelId}`);
  return res.json();
}

// 保存阅读历史
export async function saveReadingHistory(data) {
  const res = await fetch('/api/user/history', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

// 获取阅读历史
export async function getReadingHistory() {
  const res = await fetch('/api/user/history', {
    headers: getAuthHeaders(),
  });
  return res.json();
}

// 辅助函数：获取认证头
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// 检查是否已登录
export function isLoggedIn() {
  return !!localStorage.getItem('token');
}

// 退出登录
export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
}

// 获取当前用户
export function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}
