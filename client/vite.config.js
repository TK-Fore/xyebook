import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 启用资源内联（小于 4kb 的资源内联）
    assetsInlineLimit: 4096,
    // 生成 sourcemap（生产环境可关闭）
    sourcemap: false
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})
