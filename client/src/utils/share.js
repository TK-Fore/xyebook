// 分享工具函数

/**
 * 复制文本到剪贴板
 * @param {string} text - 要复制的文本
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text) {
  try {
    // 现代API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // 兼容旧浏览器
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const result = document.execCommand('copy');
    document.body.removeChild(textArea);
    return result;
  } catch (err) {
    console.error('复制失败:', err);
    return false;
  }
}

/**
 * 获取分享链接
 * @param {number|string} novelId - 小说ID
 * @returns {string}
 */
export function getShareUrl(novelId) {
  const baseUrl = window.location.origin;
  return `${baseUrl}/novel/${novelId}`;
}

/**
 * 生成分享文案
 * @param {Object} novel - 小说对象
 * @returns {string}
 */
export function getShareText(novel) {
  if (!novel) return '';
  return `【${novel.title}】作者：${novel.author}。在小羊书吧畅读更多精彩小说！`;
}

/**
 * 分享到微信 - 提示用户使用扫一扫
 */
export function shareToWechat() {
  // 微信分享需要使用微信JS SDK，这里显示提示
  alert('请点击右上角「...」选择「分享到朋友圈」或「发送给朋友」');
}

/**
 * 分享到QQ
 * @param {Object} novel - 小说对象
 */
export function shareToQQ(novel) {
  const url = getShareUrl(novel.id);
  const title = `推荐小说：${novel.title}`;
  const desc = `${novel.author} | ${novel.category} | ${novel.word_count?.toLocaleString() || 0}字`;
  
  // 跳转QQ分享页面
  const shareUrl = `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&desc=${encodeURIComponent(desc)}&summary=${encodeURIComponent(novel.description || '')}`;
  window.open(shareUrl, '_blank');
}

/**
 * 分享到微博
 * @param {Object} novel - 小说对象
 */
export function shareToWeibo(novel) {
  const url = getShareUrl(novel.id);
  const text = getShareText(novel);
  const shareUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`;
  window.open(shareUrl, '_blank');
}

/**
 * 使用Web Share API分享（如果支持）
 * @param {Object} novel - 小说对象
 */
export async function nativeShare(novel) {
  if (!navigator.share) {
    return false;
  }
  
  try {
    await navigator.share({
      title: `推荐小说：${novel.title}`,
      text: getShareText(novel),
      url: getShareUrl(novel.id),
    });
    return true;
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('分享失败:', err);
    }
    return false;
  }
}
