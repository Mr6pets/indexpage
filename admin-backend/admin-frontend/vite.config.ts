import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    // 性能优化配置
    minify: 'terser',
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        // 代码分割优化
        manualChunks: {
          // 将 Vue 相关库分离到单独的 chunk
          vue: ['vue', 'vue-router'],
          // 将 Element Plus 分离到单独的 chunk
          'element-plus': ['element-plus'],
          // 将工具库分离到单独的 chunk
          utils: ['axios', 'dayjs']
        }
      }
    },
    // 启用 gzip 压缩
    reportCompressedSize: true,
    // 设置 chunk 大小警告限制
    chunkSizeWarningLimit: 1000
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: ['vue', 'vue-router', 'element-plus', 'axios', 'dayjs'],
    exclude: []
  }
})
