import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // <--- 1. 引入 path

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // 2. 強制指定：當有人叫 @my-meta/ui 時，直接去隔壁房找 index.jsx
      '@my-meta/ui': path.resolve(__dirname, '../../packages/ui/index.jsx'),
    },
  },
  server: {
    port: 3004,
  },
})