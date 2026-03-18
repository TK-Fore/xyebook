import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 生产环境移除 StrictMode 以提升性能
// 开发环境保留 StrictMode 用于检测问题
const isProduction = process.env.NODE_ENV === 'production'

createRoot(document.getElementById('root')).render(
  isProduction ? (
    <App />
  ) : (
    <StrictMode>
      <App />
    </StrictMode>
  ),
)
