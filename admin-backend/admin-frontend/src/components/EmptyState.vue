<template>
  <div class="empty-state" :class="{ 'compact': compact }">
    <div class="empty-icon">
      <slot name="icon">
        <el-icon :size="iconSize" :color="iconColor">
          <component :is="icon" />
        </el-icon>
      </slot>
    </div>
    
    <div class="empty-content">
      <h3 v-if="title" class="empty-title">{{ title }}</h3>
      <p v-if="description" class="empty-description">{{ description }}</p>
      
      <div v-if="$slots.action || showAction" class="empty-actions">
        <slot name="action">
          <el-button v-if="actionText" :type="actionType" @click="handleAction">
            <el-icon v-if="actionIcon"><component :is="actionIcon" /></el-icon>
            {{ actionText }}
          </el-button>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  DocumentRemove,
  FolderOpened,
  Search,
  Connection,
  Warning,
  Plus
} from '@element-plus/icons-vue'

interface Props {
  // 图标相关
  icon?: string | object
  iconSize?: number
  iconColor?: string
  
  // 内容相关
  title?: string
  description?: string
  
  // 操作相关
  actionText?: string
  actionType?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  actionIcon?: string | object
  showAction?: boolean
  
  // 样式相关
  compact?: boolean
  
  // 预设类型
  type?: 'default' | 'no-data' | 'no-search' | 'no-network' | 'error' | 'folder'
}

const props = withDefaults(defineProps<Props>(), {
  icon: DocumentRemove,
  iconSize: 64,
  iconColor: '#d9d9d9',
  title: '暂无数据',
  description: '',
  actionType: 'primary',
  showAction: false,
  compact: false,
  type: 'default'
})

const emit = defineEmits<{
  action: []
}>()

// 根据类型设置默认值
const computedIcon = computed(() => {
  if (props.icon !== DocumentRemove) return props.icon
  
  switch (props.type) {
    case 'no-data':
      return DocumentRemove
    case 'no-search':
      return Search
    case 'no-network':
      return Connection
    case 'error':
      return Warning
    case 'folder':
      return FolderOpened
    default:
      return DocumentRemove
  }
})

const computedTitle = computed(() => {
  if (props.title !== '暂无数据') return props.title
  
  switch (props.type) {
    case 'no-data':
      return '暂无数据'
    case 'no-search':
      return '无搜索结果'
    case 'no-network':
      return '网络连接失败'
    case 'error':
      return '加载失败'
    case 'folder':
      return '文件夹为空'
    default:
      return '暂无数据'
  }
})

const computedDescription = computed(() => {
  if (props.description) return props.description
  
  switch (props.type) {
    case 'no-data':
      return '当前没有任何数据，您可以添加一些内容'
    case 'no-search':
      return '试试其他关键词或调整筛选条件'
    case 'no-network':
      return '请检查网络连接后重试'
    case 'error':
      return '数据加载出现问题，请稍后重试'
    case 'folder':
      return '这个文件夹还没有任何文件'
    default:
      return ''
  }
})

const computedActionText = computed(() => {
  if (props.actionText) return props.actionText
  
  switch (props.type) {
    case 'no-data':
      return '添加数据'
    case 'no-search':
      return '清空筛选'
    case 'no-network':
      return '重新加载'
    case 'error':
      return '重试'
    case 'folder':
      return '上传文件'
    default:
      return '刷新'
  }
})

const computedActionIcon = computed(() => {
  if (props.actionIcon) return props.actionIcon
  
  switch (props.type) {
    case 'no-data':
    case 'folder':
      return Plus
    default:
      return undefined
  }
})

const handleAction = () => {
  emit('action')
}
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  min-height: 300px;
}

.empty-state.compact {
  padding: 40px 20px;
  min-height: 200px;
}

.empty-icon {
  margin-bottom: 24px;
  opacity: 0.6;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.empty-content {
  max-width: 400px;
}

.empty-title {
  font-size: 18px;
  font-weight: 500;
  color: #262626;
  margin: 0 0 8px 0;
}

.empty-description {
  font-size: 14px;
  color: #8c8c8c;
  margin: 0 0 24px 0;
  line-height: 1.5;
}

.empty-actions {
  margin-top: 24px;
}

/* 紧凑模式 */
.empty-state.compact .empty-icon {
  margin-bottom: 16px;
}

.empty-state.compact .empty-title {
  font-size: 16px;
  margin-bottom: 6px;
}

.empty-state.compact .empty-description {
  font-size: 13px;
  margin-bottom: 16px;
}

.empty-state.compact .empty-actions {
  margin-top: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .empty-state {
    padding: 40px 16px;
    min-height: 250px;
  }
  
  .empty-state.compact {
    padding: 30px 16px;
    min-height: 180px;
  }
  
  .empty-title {
    font-size: 16px;
  }
  
  .empty-description {
    font-size: 13px;
  }
}

/* 暗色主题适配 */
.dark .empty-title {
  color: #fff;
}

.dark .empty-description {
  color: #999;
}
</style>