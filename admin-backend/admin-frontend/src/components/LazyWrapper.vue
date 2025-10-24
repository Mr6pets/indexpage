<template>
  <div class="lazy-wrapper">
    <!-- 加载状态 -->
    <div v-if="loading" class="lazy-loading">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p class="loading-text">{{ loadingText }}</p>
      </div>
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="error" class="lazy-error">
      <div class="error-content">
        <el-icon class="error-icon"><Warning /></el-icon>
        <p class="error-message">{{ errorMessage }}</p>
        <el-button @click="retry" type="primary" size="small">重试</el-button>
      </div>
    </div>
    
    <!-- 组件内容 -->
    <component v-else :is="component" v-bind="componentProps" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent } from 'vue'
import { Warning } from '@element-plus/icons-vue'

interface Props {
  // 组件导入函数
  importFn: () => Promise<any>
  // 组件属性
  componentProps?: Record<string, any>
  // 加载文本
  loadingText?: string
  // 错误消息
  errorMessage?: string
  // 延迟加载时间（毫秒）
  delay?: number
  // 超时时间（毫秒）
  timeout?: number
}

const props = withDefaults(defineProps<Props>(), {
  componentProps: () => ({}),
  loadingText: '正在加载...',
  errorMessage: '加载失败，请重试',
  delay: 200,
  timeout: 10000
})

const loading = ref(true)
const error = ref(false)
const component = ref<any>(null)

// 创建异步组件
const createAsyncComponent = () => {
  return defineAsyncComponent({
    loader: props.importFn,
    delay: props.delay,
    timeout: props.timeout,
    errorComponent: {
      template: '<div></div>' // 空组件，错误由父组件处理
    },
    loadingComponent: {
      template: '<div></div>' // 空组件，加载状态由父组件处理
    }
  })
}

// 加载组件
const loadComponent = async () => {
  try {
    loading.value = true
    error.value = false
    
    // 添加最小加载时间，避免闪烁
    const [comp] = await Promise.all([
      props.importFn(),
      new Promise(resolve => setTimeout(resolve, props.delay))
    ])
    
    component.value = comp.default || comp
    loading.value = false
  } catch (err) {
    console.error('组件加载失败:', err)
    error.value = true
    loading.value = false
  }
}

// 重试加载
const retry = () => {
  loadComponent()
}

onMounted(() => {
  loadComponent()
})
</script>

<style scoped>
.lazy-wrapper {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lazy-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.lazy-error {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.error-icon {
  font-size: 48px;
  color: #f56c6c;
}

.error-message {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

/* 暗色主题适配 */
@media (prefers-color-scheme: dark) {
  .spinner {
    border-color: #4c4d4f;
    border-top-color: #409eff;
  }
  
  .loading-text,
  .error-message {
    color: #a3a6ad;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .lazy-wrapper {
    min-height: 150px;
  }
  
  .lazy-loading,
  .lazy-error {
    padding: 20px;
  }
  
  .error-icon {
    font-size: 36px;
  }
}
</style>