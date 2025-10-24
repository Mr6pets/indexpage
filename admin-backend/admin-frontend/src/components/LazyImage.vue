<template>
  <div class="lazy-image-wrapper" :class="{ 'loading': loading, 'error': error }">
    <!-- 占位符 -->
    <div v-if="loading" class="image-placeholder">
      <div class="placeholder-content">
        <el-icon class="placeholder-icon"><Picture /></el-icon>
        <span v-if="showLoadingText" class="placeholder-text">{{ loadingText }}</span>
      </div>
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="error" class="image-error">
      <div class="error-content">
        <el-icon class="error-icon"><Warning /></el-icon>
        <span v-if="showErrorText" class="error-text">{{ errorText }}</span>
        <el-button v-if="showRetry" @click="retry" size="small" type="text">重试</el-button>
      </div>
    </div>
    
    <!-- 图片 -->
    <img
      v-else
      :src="currentSrc"
      :alt="alt"
      :class="imageClass"
      @load="onLoad"
      @error="onError"
    />
    
    <!-- 渐入动画遮罩 -->
    <div v-if="loaded && fadeIn" class="fade-overlay" :class="{ 'fade-out': fadeComplete }"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { Picture, Warning } from '@element-plus/icons-vue'
import { lazyImageLoader } from '@/utils/performance'

interface Props {
  // 图片源地址
  src: string
  // 占位符图片
  placeholder?: string
  // 替代文本
  alt?: string
  // 图片类名
  imageClass?: string
  // 是否启用懒加载
  lazy?: boolean
  // 是否显示加载文本
  showLoadingText?: boolean
  // 加载文本
  loadingText?: string
  // 是否显示错误文本
  showErrorText?: boolean
  // 错误文本
  errorText?: string
  // 是否显示重试按钮
  showRetry?: boolean
  // 是否启用渐入动画
  fadeIn?: boolean
  // 渐入动画持续时间（毫秒）
  fadeDuration?: number
  // 图片质量（用于响应式图片）
  quality?: 'low' | 'medium' | 'high'
  // 响应式尺寸
  sizes?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  alt: '',
  imageClass: '',
  lazy: true,
  showLoadingText: false,
  loadingText: '加载中...',
  showErrorText: true,
  errorText: '加载失败',
  showRetry: true,
  fadeIn: true,
  fadeDuration: 300,
  quality: 'medium',
  sizes: ''
})

const loading = ref(true)
const error = ref(false)
const loaded = ref(false)
const fadeComplete = ref(false)
const imgRef = ref<HTMLImageElement>()

// 当前图片源
const currentSrc = computed(() => {
  if (props.placeholder && loading.value) {
    return props.placeholder
  }
  return props.src
})

// 预加载图片
const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

// 加载图片
const loadImage = async () => {
  try {
    loading.value = true
    error.value = false
    
    await preloadImage(props.src)
    
    loading.value = false
    loaded.value = true
    
    // 渐入动画
    if (props.fadeIn) {
      setTimeout(() => {
        fadeComplete.value = true
      }, props.fadeDuration)
    }
  } catch (err) {
    console.error('图片加载失败:', err)
    loading.value = false
    error.value = true
  }
}

// 图片加载成功
const onLoad = () => {
  loaded.value = true
  if (props.fadeIn) {
    setTimeout(() => {
      fadeComplete.value = true
    }, props.fadeDuration)
  }
}

// 图片加载失败
const onError = () => {
  error.value = true
  loading.value = false
}

// 重试加载
const retry = () => {
  error.value = false
  loaded.value = false
  fadeComplete.value = false
  loadImage()
}

// 监听 src 变化
watch(() => props.src, () => {
  if (props.src) {
    loaded.value = false
    fadeComplete.value = false
    if (props.lazy) {
      // 懒加载模式下重新观察
      if (imgRef.value) {
        imgRef.value.dataset.src = props.src
        lazyImageLoader.observe(imgRef.value)
      }
    } else {
      loadImage()
    }
  }
})

onMounted(() => {
  if (props.lazy && imgRef.value) {
    // 懒加载模式
    imgRef.value.dataset.src = props.src
    lazyImageLoader.observe(imgRef.value)
  } else {
    // 立即加载
    loadImage()
  }
})

onUnmounted(() => {
  // 清理资源
  if (imgRef.value) {
    lazyImageLoader.disconnect()
  }
})
</script>

<style scoped>
.lazy-image-wrapper {
  position: relative;
  display: inline-block;
  overflow: hidden;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 100px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #c0c4cc;
}

.placeholder-icon {
  font-size: 32px;
}

.placeholder-text {
  font-size: 12px;
}

.image-error {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 100px;
  background-color: #fef0f0;
  border: 1px dashed #f56c6c;
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  padding: 16px;
}

.error-icon {
  font-size: 24px;
  color: #f56c6c;
}

.error-text {
  font-size: 12px;
  color: #f56c6c;
}

img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease;
}

.fade-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #f5f7fa;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.fade-overlay.fade-out {
  opacity: 0;
}

/* 响应式图片 */
.lazy-image-wrapper.responsive {
  width: 100%;
  height: auto;
}

.lazy-image-wrapper.responsive img {
  width: 100%;
  height: auto;
}

/* 圆形图片 */
.lazy-image-wrapper.circle {
  border-radius: 50%;
}

.lazy-image-wrapper.circle img {
  border-radius: 50%;
}

/* 暗色主题适配 */
@media (prefers-color-scheme: dark) {
  .lazy-image-wrapper {
    background-color: #2d2f36;
  }
  
  .image-placeholder {
    background: linear-gradient(90deg, #3a3d47 25%, #4a4d57 50%, #3a3d47 75%);
  }
  
  .placeholder-content {
    color: #6c6e72;
  }
  
  .image-error {
    background-color: #3d2626;
    border-color: #f56c6c;
  }
  
  .fade-overlay {
    background-color: #2d2f36;
  }
}

/* 加载状态动画 */
.loading {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

/* 错误状态样式 */
.error {
  border: 1px solid #f56c6c;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .placeholder-icon {
    font-size: 24px;
  }
  
  .error-icon {
    font-size: 20px;
  }
  
  .placeholder-text,
  .error-text {
    font-size: 11px;
  }
}
</style>