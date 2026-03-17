import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/api';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }

    if (formData.password.length < 6) {
      setError('密码长度至少6位');
      return;
    }

    setLoading(true);

    try {
      const data = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('favorites', '[]');
        navigate('/profile');
      } else {
        setError(data.message || '注册失败');
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
          <h1 className="auth-title">注册</h1>
          
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
              <label className="form-label">邮箱</label>
              <input
                type="email"
                className="form-input"
                placeholder="请输入邮箱"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">密码</label>
              <input
                type="password"
                className="form-input"
                placeholder="请输入密码（至少6位）"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">确认密码</label>
              <input
                type="password"
                className="form-input"
                placeholder="请再次输入密码"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>
            
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? '注册中...' : '注册'}
            </button>
          </form>
          
          <p className="auth-link">
            已有账号？ <Link to="/login">立即登录</Link>
          </p>
        </div>
      </main>
    </>
  );
}
