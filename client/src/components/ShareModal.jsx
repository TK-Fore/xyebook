import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { 
  copyToClipboard, 
  getShareUrl, 
  getShareText,
  shareToWechat,
  shareToQQ,
  shareToWeibo,
  nativeShare 
} from '../utils/share';
import './ShareModal.css';

export default function ShareModal({ novel, onClose }) {
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const posterRef = useRef(null);
  
  const shareUrl = getShareUrl(novel.id);
  const shareText = getShareText(novel);

  // 复制链接
  const handleCopyLink = async () => {
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 复制文案
  const handleCopyText = async () => {
    const success = await copyToClipboard(shareText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 生成分享海报
  const handleGeneratePoster = async () => {
    if (!posterRef.current) return;
    
    setGenerating(true);
    try {
      const canvas = await html2canvas(posterRef.current, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scale: 2,
      });
      
      // 转换为图片并下载
      const link = document.createElement('a');
      link.download = `${novel.title}-分享海报.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('生成海报失败:', err);
      alert('生成海报失败，请重试');
    }
    setGenerating(false);
  };

  // 分享到QQ
  const handleShareQQ = () => {
    shareToQQ(novel);
  };

  // 分享到微博
  const handleShareWeibo = () => {
    shareToWeibo(novel);
  };

  // 尝试原生分享
  const handleNativeShare = async () => {
    const success = await nativeShare(novel);
    if (!success) {
      // 如果不支持，提示用户
      alert('您的浏览器不支持此分享方式，请选择其他分享渠道');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content share-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>分享 "{novel.title}"</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="share-body">
          {/* 分享按钮区域 */}
          <div className="share-buttons">
            <button className="share-btn" onClick={handleCopyLink}>
              <span className="share-icon">🔗</span>
              <span>{copied ? '已复制!' : '复制链接'}</span>
            </button>
            
            <button className="share-btn" onClick={handleCopyText}>
              <span className="share-icon">📋</span>
              <span>复制文案</span>
            </button>
            
            <button className="share-btn" onClick={() => shareToWechat()}>
              <span className="share-icon wechat">💬</span>
              <span>微信分享</span>
            </button>
            
            <button className="share-btn" onClick={handleShareQQ}>
              <span className="share-icon qq">🐧</span>
              <span>QQ分享</span>
            </button>
            
            <button className="share-btn" onClick={handleShareWeibo}>
              <span className="share-icon weibo">🌐</span>
              <span>微博</span>
            </button>
            
            <button className="share-btn" onClick={handleNativeShare}>
              <span className="share-icon">📤</span>
              <span>更多分享</span>
            </button>
          </div>

          {/* 海报预览区域 */}
          <div className="poster-section">
            <div className="poster-header">
              <h4>📸 生成海报</h4>
              <button 
                className="btn btn-sm btn-outline"
                onClick={() => setShowQR(!showQR)}
              >
                {showQR ? '隐藏二维码' : '显示二维码'}
              </button>
            </div>
            
            {/* 海报模板 */}
            <div className="poster-preview" ref={posterRef}>
              <div className="poster-container">
                <div className="poster-cover">
                  <img 
                    src={novel.cover || 'https://via.placeholder.com/120x160/89CFF0/ffffff?text=小羊'} 
                    alt={novel.title}
                  />
                </div>
                <div className="poster-info">
                  <h3 className="poster-title">{novel.title}</h3>
                  <p className="poster-author">作者：{novel.author}</p>
                  <p className="poster-category">{novel.category}</p>
                  <p className="poster-desc">
                    {novel.description?.slice(0, 50) || '精彩小说尽在小羊书吧'}
                    {novel.description?.length > 50 ? '...' : ''}
                  </p>
                  <div className="poster-footer">
                    <span className="poster-brand">🐑 小羊书吧</span>
                    {showQR && (
                      <div className="poster-qr">
                        <QRCodeSVG value={shareUrl} size={50} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <button 
              className="btn btn-primary btn-block"
              onClick={handleGeneratePoster}
              disabled={generating}
            >
              {generating ? '生成中...' : '📥 保存海报图片'}
            </button>
          </div>

          {/* 链接预览 */}
          <div className="share-link-preview">
            <span className="link-label">链接：</span>
            <span className="link-text">{shareUrl}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
