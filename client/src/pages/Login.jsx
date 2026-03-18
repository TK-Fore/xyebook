import { Link } from 'react-router-dom';

export default function Login() {
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
        <div className="auth-container" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🐑</div>
          <h1 className="auth-title">欢迎来到小羊书吧</h1>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            无需注册，随时随地开始阅读
          </p>
          <Link to="/" className="btn btn-primary" style={{ display: 'inline-block' }}>
            开始阅读
          </Link>
        </div>
      </main>
    </>
  );
}
