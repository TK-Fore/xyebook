import { NavLink, useLocation } from 'react-router-dom';
import './BottomNav.css';

export default function BottomNav() {
  const location = useLocation();
  
  // 在阅读页面不显示底部导航
  if (location.pathname.startsWith('/read/')) {
    return null;
  }

  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <span className="bottom-nav-icon">🏠</span>
        <span className="bottom-nav-label">首页</span>
      </NavLink>
      
      <NavLink to="/profile" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <span className="bottom-nav-icon">👤</span>
        <span className="bottom-nav-label">我的</span>
      </NavLink>
    </nav>
  );
}
