<template>
  <div class="dashboard">
    <!-- 加载状态 -->
    <LoadingSpinner v-if="loading" :text="'正在加载仪表板数据...'" />
    
    <!-- 错误状态 -->
    <ErrorBoundary v-else-if="error" 
      :title="'仪表板加载失败'"
      :message="error"
      @retry="loadDashboardData"
    />
    
    <!-- 正常内容 -->
    <div v-else class="dashboard-content">
      <!-- 统计卡片 -->
      <div class="stats-grid">
        <div 
          v-for="(stat, index) in statsData" 
          :key="stat.title"
          class="stat-card hover-lift"
          :class="`stat-card-${index + 1}`"
          :style="{ animationDelay: `${index * 0.1}s` }"
        >
          <div class="stat-icon" :style="{ backgroundColor: stat.color }">
            <el-icon :size="24">
              <component :is="stat.icon" />
            </el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatNumber(stat.value) }}</div>
            <div class="stat-title">{{ stat.title }}</div>
            <div class="stat-change" :class="{ 'positive': stat.change > 0, 'negative': stat.change < 0 }">
              <el-icon :size="12">
                <ArrowUp v-if="stat.change > 0" />
                <ArrowDown v-else />
              </el-icon>
              {{ Math.abs(stat.change) }}%
            </div>
          </div>
        </div>
      </div>

      <!-- 图表区域 -->
      <div class="charts-grid">
        <div class="chart-card fade-in-up" style="animation-delay: 0.4s">
          <div class="card-header">
            <h3>访问趋势</h3>
            <el-button-group>
              <el-button 
                v-for="period in ['7天', '30天', '90天']" 
                :key="period"
                :type="selectedPeriod === period ? 'primary' : 'default'"
                size="small"
                @click="selectedPeriod = period"
              >
                {{ period }}
              </el-button>
            </el-button-group>
          </div>
          <div class="chart-container">
            <v-chart :option="trendChartOption" style="height: 300px;" />
          </div>
        </div>

        <div class="chart-card fade-in-up" style="animation-delay: 0.5s">
          <div class="card-header">
            <h3>分类分布</h3>
          </div>
          <div class="chart-container">
            <v-chart :option="categoryChartOption" style="height: 300px;" />
          </div>
        </div>
      </div>

      <!-- 最近活动 -->
      <div class="activity-section fade-in-up" style="animation-delay: 0.6s">
        <div class="section-header">
          <h3>最近活动</h3>
          <el-button type="text" @click="refreshActivities">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
        
        <div class="activity-list">
          <div 
            v-for="(activity, index) in activities" 
            :key="activity.id"
            class="activity-item slide-in-right"
            :style="{ animationDelay: `${0.7 + index * 0.1}s` }"
          >
            <div class="activity-icon" :style="{ backgroundColor: activity.color }">
              <el-icon>
                <component :is="activity.icon" />
              </el-icon>
            </div>
            <div class="activity-content">
              <div class="activity-title">{{ activity.title }}</div>
              <div class="activity-desc">{{ activity.description }}</div>
            </div>
            <div class="activity-time">{{ getRelativeTime(activity.time) }}</div>
          </div>
          
          <!-- 空状态 -->
          <EmptyState 
            v-if="activities.length === 0"
            type="no-data"
            :compact="true"
            title="暂无活动记录"
            description="最近没有任何活动"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Link,
  Collection,
  User,
  DataAnalysis,
  Refresh,
  Plus,
  Edit,
  Delete
} from '@element-plus/icons-vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ErrorBoundary from '@/components/ErrorBoundary.vue'
import EmptyState from '@/components/EmptyState.vue'
import { formatNumber, getRelativeTime } from '@/utils'
import request from '@/utils/request'

// 响应式数据
const loading = ref(true)
const error = ref('')
const selectedPeriod = ref('7天')

// 统计数据
const statsData = ref([
  {
    title: '网站总数',
    value: 0,
    change: 0,
    color: '#1890ff',
    icon: Link
  },
  {
    title: '分类数量',
    value: 0,
    change: 0,
    color: '#52c41a',
    icon: Collection
  },
  {
    title: '用户数量',
    value: 0,
    change: 0,
    color: '#faad14',
    icon: User
  },
  {
    title: '总访问量',
    value: 0,
    change: 0,
    color: '#f5222d',
    icon: DataAnalysis
  }
])

// 活动数据
const activities = ref([
  {
    id: 1,
    title: '新增网站',
    description: '添加了 "Vue.js 官网" 到前端开发分类',
    time: new Date(Date.now() - 5 * 60 * 1000),
    icon: Plus,
    color: '#52c41a'
  },
  {
    id: 2,
    title: '编辑分类',
    description: '更新了 "设计工具" 分类的描述信息',
    time: new Date(Date.now() - 15 * 60 * 1000),
    icon: Edit,
    color: '#1890ff'
  },
  {
    id: 3,
    title: '删除网站',
    description: '从数据库分类中删除了过期的网站链接',
    time: new Date(Date.now() - 30 * 60 * 1000),
    icon: Delete,
    color: '#f5222d'
  }
])

// 图表配置
const trendChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis'
  },
  xAxis: {
    type: 'category',
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  },
  yAxis: {
    type: 'value'
  },
  series: [{
    data: [120, 200, 150, 80, 70, 110, 130],
    type: 'line',
    smooth: true,
    itemStyle: {
      color: '#409EFF'
    }
  }]
}))

const categoryChartOption = computed(() => ({
  tooltip: {
    trigger: 'item'
  },
  legend: {
    orient: 'vertical',
    left: 'left'
  },
  series: [{
    type: 'pie',
    radius: '50%',
    data: [
      { value: 1048, name: '前端开发' },
      { value: 735, name: '后端开发' },
      { value: 580, name: '设计工具' },
      { value: 484, name: '开发工具' },
      { value: 300, name: '其他' }
    ],
    emphasis: {
      itemStyle: {
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowColor: 'rgba(0, 0, 0, 0.5)'
      }
    }
  }]
}))

// 加载仪表板数据
const loadDashboardData = async () => {
  try {
    loading.value = true
    error.value = ''
    
    // 获取统计数据
    const response = await request.get('/stats/overview')
    console.log('仪表盘API响应:', response.data)
    
    // 处理不同的响应格式
    let overviewData;
    
    if (response.data.success && response.data.data) {
      // 标准格式: {success: true, data: {overview: {...}}}
      overviewData = response.data.data.overview;
    } else if (response.data.overview) {
      // 直接格式: {overview: {...}}
      overviewData = response.data.overview;
    } else {
      console.error('未知的API响应格式:', response.data);
      return;
    }
    
    // 更新统计数据
    statsData.value[0].value = overviewData.total_sites || 0
    statsData.value[1].value = overviewData.total_categories || 0
    statsData.value[2].value = overviewData.total_users || 0
    statsData.value[3].value = overviewData.total_clicks || 0
    
    console.log('仪表盘数据更新成功:', {
      sites: statsData.value[0].value,
      categories: statsData.value[1].value,
      users: statsData.value[2].value,
      clicks: statsData.value[3].value
    })
    
    // 可以根据需要计算变化百分比
    // 这里暂时设为0，后续可以添加历史数据对比
    statsData.value.forEach(stat => {
      stat.change = 0
    })
    
    loading.value = false
  } catch (err) {
    loading.value = false
    error.value = err instanceof Error ? err.message : '加载数据失败'
    ElMessage.error('仪表板数据加载失败')
    console.error('Dashboard data loading error:', err)
  }
}

// 刷新活动
const refreshActivities = async () => {
  try {
    // 模拟刷新
    ElMessage.success('活动数据已刷新')
  } catch (err) {
    ElMessage.error('刷新失败')
  }
}

// 生命周期
onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
  background: #f5f5f5;
  min-height: calc(100vh - 60px);
}

.dashboard-content {
  max-width: 1200px;
  margin: 0 auto;
}

/* 统计卡片网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
  animation: fade-in-up 0.6s ease forwards;
  opacity: 0;
  transform: translateY(20px);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.stat-card-1 { animation-delay: 0s; }
.stat-card-2 { animation-delay: 0.1s; }
.stat-card-3 { animation-delay: 0.2s; }
.stat-card-4 { animation-delay: 0.3s; }

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #262626;
  margin-bottom: 4px;
}

.stat-title {
  font-size: 14px;
  color: #8c8c8c;
  margin-bottom: 8px;
}

.stat-change {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
}

.stat-change.positive {
  color: #52c41a;
}

.stat-change.negative {
  color: #f5222d;
}

/* 图表网格 */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.chart-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  animation: fade-in-up 0.6s ease forwards;
  opacity: 0;
  transform: translateY(20px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #262626;
}

.chart-container {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  text-align: center;
  color: #8c8c8c;
}

.chart-placeholder p {
  margin: 12px 0 0 0;
  font-size: 14px;
}

/* 活动区域 */
.activity-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  animation: fade-in-up 0.6s ease forwards;
  opacity: 0;
  transform: translateY(20px);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #262626;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.3s ease;
  animation: slide-in-right 0.6s ease forwards;
  opacity: 0;
  transform: translateX(20px);
}

.activity-item:hover {
  background: #f0f0f0;
  transform: translateX(-2px);
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
  margin-bottom: 4px;
}

.activity-desc {
  font-size: 12px;
  color: #8c8c8c;
}

.activity-time {
  font-size: 12px;
  color: #bfbfbf;
  white-space: nowrap;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dashboard {
    padding: 16px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .charts-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .stat-card {
    padding: 20px;
  }
  
  .chart-card,
  .activity-section {
    padding: 20px;
  }
  
  .card-header,
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .activity-item {
    padding: 12px;
  }
  
  .activity-time {
    display: none;
  }
}

@media (max-width: 480px) {
  .dashboard {
    padding: 12px;
  }
  
  .stat-card {
    flex-direction: column;
    text-align: center;
    padding: 16px;
  }
  
  .stat-icon {
    width: 48px;
    height: 48px;
  }
  
  .stat-value {
    font-size: 24px;
  }
}

/* 暗色主题适配 */
.dark .dashboard {
  background: #141414;
}

.dark .stat-card,
.dark .chart-card,
.dark .activity-section {
  background: #1f1f1f;
  border: 1px solid #434343;
}

.dark .stat-value,
.dark .card-header h3,
.dark .section-header h3,
.dark .activity-title {
  color: #fff;
}

.dark .stat-title,
.dark .activity-desc {
  color: #bfbfbf;
}

.dark .activity-item {
  background: #262626;
}

.dark .activity-item:hover {
  background: #303030;
}

.dark .chart-placeholder {
  color: #8c8c8c;
}

/* 动画定义 */
@keyframes fade-in-up {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-in-right {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>