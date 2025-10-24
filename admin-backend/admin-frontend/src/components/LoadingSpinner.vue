<template>
  <div class="loading-container" :class="{ 'fullscreen': fullscreen, 'overlay': overlay }">
    <div class="loading-content">
      <div class="spinner" :class="size">
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
      </div>
      <p v-if="text" class="loading-text">{{ text }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  fullscreen?: boolean
  overlay?: boolean
  size?: 'small' | 'medium' | 'large'
  text?: string
}

withDefaults(defineProps<Props>(), {
  fullscreen: false,
  overlay: false,
  size: 'medium',
  text: '加载中...'
})
</script>

<style scoped>
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.loading-container.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  z-index: 9999;
}

.loading-container.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  z-index: 100;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.spinner {
  position: relative;
  display: inline-block;
}

.spinner.small {
  width: 24px;
  height: 24px;
}

.spinner.medium {
  width: 40px;
  height: 40px;
}

.spinner.large {
  width: 60px;
  height: 60px;
}

.spinner-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-top-color: #1890ff;
  border-radius: 50%;
  animation: spin 1.2s linear infinite;
}

.spinner-ring:nth-child(1) {
  animation-delay: 0s;
}

.spinner-ring:nth-child(2) {
  animation-delay: 0.1s;
  border-top-color: #52c41a;
}

.spinner-ring:nth-child(3) {
  animation-delay: 0.2s;
  border-top-color: #faad14;
}

.spinner-ring:nth-child(4) {
  animation-delay: 0.3s;
  border-top-color: #f5222d;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  margin: 0;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

/* 暗色主题适配 */
.dark .loading-container.fullscreen,
.dark .loading-container.overlay {
  background: rgba(0, 0, 0, 0.8);
}

.dark .loading-text {
  color: #ccc;
}
</style>