<template>
  <div 
    ref="containerRef" 
    class="virtual-scroll-container"
    :style="{ height: containerHeight + 'px' }"
    @scroll="handleScroll"
  >
    <!-- 占位符：总高度 -->
    <div 
      class="virtual-scroll-spacer" 
      :style="{ height: totalHeight + 'px' }"
    ></div>
    
    <!-- 可视区域内容 -->
    <div 
      class="virtual-scroll-content"
      :style="{ 
        transform: `translateY(${offsetY}px)`,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0
      }"
    >
      <div
        v-for="(item, index) in visibleItems"
        :key="getItemKey(item, startIndex + index)"
        class="virtual-scroll-item"
        :style="{ height: itemHeight + 'px' }"
      >
        <slot 
          :item="item" 
          :index="startIndex + index"
          :isVisible="true"
        >
          {{ item }}
        </slot>
      </div>
    </div>
    
    <!-- 滚动指示器 -->
    <div v-if="showScrollIndicator" class="scroll-indicator">
      <div class="scroll-thumb" :style="scrollThumbStyle"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

interface Props {
  // 数据列表
  items: any[]
  // 每项高度
  itemHeight: number
  // 容器高度
  containerHeight: number
  // 缓冲区大小（额外渲染的项目数）
  bufferSize?: number
  // 获取项目唯一键的函数
  getItemKey?: (item: any, index: number) => string | number
  // 是否显示滚动指示器
  showScrollIndicator?: boolean
  // 是否启用平滑滚动
  smoothScroll?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  bufferSize: 5,
  getItemKey: (item: any, index: number) => index,
  showScrollIndicator: true,
  smoothScroll: true
})

const emit = defineEmits<{
  scroll: [{ scrollTop: number, startIndex: number, endIndex: number }]
  itemVisible: [{ item: any, index: number }]
  itemHidden: [{ item: any, index: number }]
}>()

const containerRef = ref<HTMLElement>()
const scrollTop = ref(0)

// 计算属性
const totalHeight = computed(() => props.items.length * props.itemHeight)

const visibleCount = computed(() => 
  Math.ceil(props.containerHeight / props.itemHeight) + props.bufferSize * 2
)

const startIndex = computed(() => 
  Math.max(0, Math.floor(scrollTop.value / props.itemHeight) - props.bufferSize)
)

const endIndex = computed(() => 
  Math.min(props.items.length - 1, startIndex.value + visibleCount.value - 1)
)

const visibleItems = computed(() => 
  props.items.slice(startIndex.value, endIndex.value + 1)
)

const offsetY = computed(() => startIndex.value * props.itemHeight)

// 滚动指示器样式
const scrollThumbStyle = computed(() => {
  const thumbHeight = Math.max(20, (props.containerHeight / totalHeight.value) * props.containerHeight)
  const thumbTop = (scrollTop.value / totalHeight.value) * props.containerHeight
  
  return {
    height: thumbHeight + 'px',
    transform: `translateY(${thumbTop}px)`
  }
})

// 滚动处理
const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement
  const newScrollTop = target.scrollTop
  
  // 防抖处理
  if (Math.abs(newScrollTop - scrollTop.value) < 1) {
    return
  }
  
  scrollTop.value = newScrollTop
  
  // 发出滚动事件
  emit('scroll', {
    scrollTop: newScrollTop,
    startIndex: startIndex.value,
    endIndex: endIndex.value
  })
}

// 滚动到指定索引
const scrollToIndex = (index: number, behavior: ScrollBehavior = 'smooth') => {
  if (!containerRef.value) return
  
  const targetScrollTop = index * props.itemHeight
  
  if (props.smoothScroll && behavior === 'smooth') {
    containerRef.value.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth'
    })
  } else {
    containerRef.value.scrollTop = targetScrollTop
  }
}

// 滚动到顶部
const scrollToTop = (behavior: ScrollBehavior = 'smooth') => {
  scrollToIndex(0, behavior)
}

// 滚动到底部
const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
  scrollToIndex(props.items.length - 1, behavior)
}

// 获取当前可见项目
const getVisibleItems = () => {
  return {
    startIndex: startIndex.value,
    endIndex: endIndex.value,
    items: visibleItems.value
  }
}

// 监听可见项目变化
let previousVisibleIndexes = new Set<number>()

watch([startIndex, endIndex], () => {
  const currentVisibleIndexes = new Set<number>()
  
  for (let i = startIndex.value; i <= endIndex.value; i++) {
    currentVisibleIndexes.add(i)
    
    // 新出现的项目
    if (!previousVisibleIndexes.has(i)) {
      emit('itemVisible', {
        item: props.items[i],
        index: i
      })
    }
  }
  
  // 消失的项目
  previousVisibleIndexes.forEach(index => {
    if (!currentVisibleIndexes.has(index)) {
      emit('itemHidden', {
        item: props.items[index],
        index
      })
    }
  })
  
  previousVisibleIndexes = currentVisibleIndexes
})

// 暴露方法给父组件
defineExpose({
  scrollToIndex,
  scrollToTop,
  scrollToBottom,
  getVisibleItems
})

onMounted(() => {
  // 初始化滚动位置
  nextTick(() => {
    if (containerRef.value) {
      scrollTop.value = containerRef.value.scrollTop
    }
  })
})

onUnmounted(() => {
  // 清理资源
  previousVisibleIndexes.clear()
})
</script>

<style scoped>
.virtual-scroll-container {
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
}

.virtual-scroll-spacer {
  width: 100%;
  pointer-events: none;
}

.virtual-scroll-content {
  width: 100%;
}

.virtual-scroll-item {
  width: 100%;
  box-sizing: border-box;
}

/* 滚动指示器 */
.scroll-indicator {
  position: absolute;
  top: 0;
  right: 0;
  width: 6px;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.virtual-scroll-container:hover .scroll-indicator {
  opacity: 1;
}

.scroll-thumb {
  width: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
  transition: transform 0.1s ease;
}

/* 自定义滚动条 */
.virtual-scroll-container::-webkit-scrollbar {
  width: 8px;
}

.virtual-scroll-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.virtual-scroll-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
  transition: background 0.3s ease;
}

.virtual-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* 暗色主题适配 */
@media (prefers-color-scheme: dark) {
  .scroll-indicator {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  .scroll-thumb {
    background-color: rgba(255, 255, 255, 0.3);
  }
  
  .virtual-scroll-container::-webkit-scrollbar-track {
    background: #2d2f36;
  }
  
  .virtual-scroll-container::-webkit-scrollbar-thumb {
    background: #4a4d57;
  }
  
  .virtual-scroll-container::-webkit-scrollbar-thumb:hover {
    background: #5a5d67;
  }
}

/* 平滑滚动 */
.virtual-scroll-container.smooth-scroll {
  scroll-behavior: smooth;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .scroll-indicator {
    width: 4px;
  }
  
  .virtual-scroll-container::-webkit-scrollbar {
    width: 6px;
  }
}
</style>