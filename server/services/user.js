// 用户服务
const users = new Map(); // 内存存储，生产环境应该用数据库

// 默认用户数据（演示用）
users.set('test', {
  id: '1',
  username: 'test',
  email: 'test@example.com',
  password: '123456', // 实际应该加密存储
  favorites: [],
  history: []
});

function findUserByUsername(username) {
  return users.get(username);
}

function findUserById(id) {
  for (const user of users.values()) {
    if (user.id === id) return user;
  }
  return null;
}

function createUser(userData) {
  if (users.has(userData.username)) {
    throw new Error('用户名已存在');
  }
  
  const id = String(users.size + 1);
  const user = {
    id,
    username: userData.username,
    email: userData.email,
    password: userData.password,
    favorites: [],
    history: []
  };
  
  users.set(userData.username, user);
  return user;
}

function updateUserFavorites(userId, novelId, action = 'add') {
  const user = findUserById(userId);
  if (!user) return null;
  
  if (action === 'add') {
    if (!user.favorites.includes(novelId)) {
      user.favorites.push(novelId);
    }
  } else {
    user.favorites = user.favorites.filter(f => f !== novelId);
  }
  
  return user;
}

function addHistory(userId, historyItem) {
  const user = findUserById(userId);
  if (!user) return null;
  
  user.history.unshift(historyItem);
  // 保留最近100条记录
  if (user.history.length > 100) {
    user.history = user.history.slice(0, 100);
  }
  
  return user;
}

module.exports = {
  findUserByUsername,
  findUserById,
  createUser,
  updateUserFavorites,
  addHistory,
  users
};
