// 优化的加载状态组件
import './Loading.css';

export default function Loading({ type = 'spinner', text = '加载中...' }) {
  if (type === 'skeleton') {
    return (
      <div className="loading-skeleton">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-cover"></div>
            <div className="skeleton-content">
              <div className="skeleton-title"></div>
              <div className="skeleton-author"></div>
              <div className="skeleton-meta"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'page') {
    return (
      <div className="loading-page">
        <div className="loading-spinner"></div>
        <p>{text}</p>
      </div>
    );
  }

  // 默认骨架屏卡片（用于列表页）
  return (
    <div className="loading-container">
      <div className="loading-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <p>{text}</p>
    </div>
  );
}
