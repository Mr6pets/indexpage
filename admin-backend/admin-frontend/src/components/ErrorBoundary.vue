<template>
  <div class="error-boundary">
    <div v-if="hasError" class="error-container">
      <div class="error-icon">
        <el-icon :size="64" color="#f5222d">
          <WarningFilled />
        </el-icon>
      </div>
      
      <div class="error-content">
        <h3 class="error-title">{{ title }}</h3>
        <p class="error-message">{{ message }}</p>
        
        <div v-if="showDetails && errorDetails" class="error-details">
          <el-collapse>
            <el-collapse-item title="错误详情" name="details">
              <pre class="error-stack">{{ errorDetails }}</pre>
            </el-collapse-item>
          </el-collapse>
        </div>
        
        <div class="error-actions">
          <el-button type="primary" @click="retry" v-if="showRetry">
            <el-icon><Refresh /></el-icon>
            重试
          </el-button>
          <el-button @click="goHome" v-if="showHome">
            <el-icon><HomeFilled /></el-icon>
            返回首页
          </el-button>
          <el-button @click="goBack" v-if="showBack">
            <el-icon><ArrowLeft /></el-icon>
            返回上页
          </el-button>
        </div>
      </div>
    </div>
    
    <slot v-else />
  </div>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'
import { useRouter } from 'vue-router'
import { 
  WarningFilled, 
  Refresh, 
  HomeFilled, 
  ArrowLeft 
} from '@element-plus/icons-vue'

interface Props {
  title?: string
  message?: string
  showDetails?: boolean
  showRetry?: boolean
  showHome?: boolean
  showBack?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '页面出现错误',
  message: '抱歉，页面遇到了一些问题，请稍后重试。',
  showDetails: false,
  showRetry: true,
  showHome: true,
  showBack: true
})

const emit = defineEmits<{
  error: [error: Error]
  retry: []
}>()

const router = useRouter()

const hasError = ref(false)
const errorDetails = ref('')

// 捕获子组件错误
onErrorCaptured((error: Error) => {
  hasError.value = true
  errorDetails.value = error.stack || error.message
  emit('error', error)
  
  // 在开发环境下打印错误
  if (import.meta.env.DEV) {
    console.error('ErrorBoundary caught an error:', error)
  }
  
  return false // 阻止错误继续传播
})

const retry = () => {
  hasError.value = false
  errorDetails.value = ''
  emit('retry')
}

const goHome = () => {
  router.push('/')
}

const goBack = () => {
  router.go(-1)
}

// 暴露方法供外部调用
defineExpose({
  setError: (error: Error) => {
    hasError.value = true
    errorDetails.value = error.stack || error.message
  },
  clearError: () => {
    hasError.value = false
    errorDetails.value = ''
  }
})
</script>

<style scoped>
.error-boundary {
  width: 100%;
  height: 100%;
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 40px 20px;
  text-align: center;
}

.error-icon {
  margin-bottom: 24px;
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.error-content {
  max-width: 600px;
  width: 100%;
}

.error-title {
  font-size: 24px;
  font-weight: 600;
  color: #262626;
  margin: 0 0 12px 0;
}

.error-message {
  font-size: 16px;
  color: #666;
  margin: 0 0 24px 0;
  line-height: 1.5;
}

.error-details {
  margin: 24px 0;
  text-align: left;
}

.error-stack {
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  padding: 12px;
  font-size: 12px;
  color: #666;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
}

.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .error-container {
    padding: 20px 16px;
    min-height: 300px;
  }
  
  .error-title {
    font-size: 20px;
  }
  
  .error-message {
    font-size: 14px;
  }
  
  .error-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .error-actions .el-button {
    width: 100%;
    max-width: 200px;
  }
}

/* 暗色主题适配 */
.dark .error-title {
  color: #fff;
}

.dark .error-message {
  color: #ccc;
}

.dark .error-stack {
  background: #1f1f1f;
  border-color: #434343;
  color: #ccc;
}
</style>