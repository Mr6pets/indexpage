import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { performanceMonitor } from '@/utils/performance'
import { initAccessibility } from '@/utils/accessibility'

// 性能监控：应用启动
performanceMonitor.mark('app-start')

const app = createApp(App)
const pinia = createPinia()

// 注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(pinia)
app.use(ElementPlus)
app.use(router)

// 性能监控：应用创建完成
performanceMonitor.mark('app-created')
performanceMonitor.measure('app-creation-time', 'app-start', 'app-created')

// 初始化无障碍访问功能
initAccessibility()

app.mount('#app')

// 性能监控：应用挂载完成
performanceMonitor.mark('app-mounted')
performanceMonitor.measure('app-mount-time', 'app-created', 'app-mounted')
performanceMonitor.measure('total-startup-time', 'app-start', 'app-mounted')

// 开发环境下输出性能信息
if (import.meta.env.DEV) {
  console.log('🚀 应用性能指标:')
  const measures = performanceMonitor.getAllMeasures()
  console.log(`📊 应用创建时间: ${measures['app-creation-time']?.toFixed(2) || 'N/A'}ms`)
  console.log(`📊 应用挂载时间: ${measures['app-mount-time']?.toFixed(2) || 'N/A'}ms`)
  console.log(`📊 总启动时间: ${measures['total-startup-time']?.toFixed(2) || 'N/A'}ms`)
}
