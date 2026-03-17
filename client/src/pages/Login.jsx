import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(formData);
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('favorites', JSON.stringify(data.user.favorites || []));
        navigate('/profile');
      } else {
        setError(data.message || '登录失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    }
    
    setLoading(false);
  }

  return (
    <>
      <header className="header">
        <div className="header-content">
          <Link to="/" className="logo">
            <span className="logo-icon">🐑</span>
            <span>小羊书吧</span>
          </Link>
        </div>
      </header>

      <main>
        <div className="auth-container">
          <h1 className="auth-title">登录</h1>
          
          {error && (
            <div style={{ 
              padding: '0.75rem', 
              background: '#FEE', 
              color: '#C00', 
              borderRadius: '8px',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">用户名</label>
              <input
                type="text"
                className="form-input"
                placeholder="请输入用户名"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">密码</label>
              <input
                type="password"
                className="form-input"
                placeholder="请输入密码"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
            
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
          
          <p className="auth-link">
            还没有账号？ <Link to="/register">立即注册</Link>
          </p>
        </div>
      </main>
    </>
  );
}
