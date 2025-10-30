<template>
  <div class="statistics">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-cards">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon websites">
              <el-icon><Link /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ overviewStats.totalSites || 0 }}</div>
              <div class="stat-label">网站总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon categories">
              <el-icon><Folder /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ overviewStats.totalCategories || 0 }}</div>
              <div class="stat-label">分类总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon users">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ overviewStats.totalUsers || 0 }}</div>
              <div class="stat-label">用户总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon visits">
              <el-icon><View /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ overviewStats.totalClicks || 0 }}</div>
              <div class="stat-label">总访问量</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-row">
      <!-- 访问趋势图 -->
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>访问趋势</span>
              <el-radio-group v-model="trendPeriod" @change="loadTrendData">
                <el-radio-button label="7">最近7天</el-radio-button>
                <el-radio-button label="30">最近30天</el-radio-button>
                <el-radio-button label="90">最近90天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-container">
            <v-chart
              :option="trendChartOption"
              :loading="trendLoading"
              style="height: 300px;"
            />
          </div>
        </el-card>
      </el-col>
      
      <!-- 分类访问分布 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>分类访问分布</span>
          </template>
          <div class="chart-container">
            <v-chart
              :option="categoryChartOption"
              :loading="categoryLoading"
              style="height: 300px;"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 热门网站和用户行为 -->
    <el-row :gutter="20" class="data-row">
      <!-- 热门网站排行 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>热门网站排行</span>
              <el-select v-model="rankingType" @change="loadRankingData" style="width: 120px;">
                <el-option label="点击量" value="clicks" />
                <el-option label="最近访问" value="recent" />
              </el-select>
            </div>
          </template>
          <div v-loading="rankingLoading">
            <div v-if="topSites.length === 0" class="empty-data">
              暂无数据
            </div>
            <div v-else class="ranking-list">
              <VirtualScroll
                :items="topSites"
                :item-height="60"
                :container-height="400"
                class="virtual-ranking-list"
              >
                <template #default="{ item: site, index }">
                  <div class="ranking-item">
                    <div class="ranking-number">{{ index + 1 }}</div>
                    <div class="site-info">
                      <div class="site-name">{{ site.name }}</div>
                      <div class="site-url">{{ site.url }}</div>
                    </div>
                    <div class="site-stats">
                      <div class="stat-value">{{ site.clicks || 0 }}</div>
                      <div class="stat-label">点击</div>
                    </div>
                  </div>
                </template>
              </VirtualScroll>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <!-- 用户行为分析 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>用户行为分析</span>
          </template>
          <div v-loading="behaviorLoading">
            <div class="behavior-stats">
              <div class="behavior-item">
                <div class="behavior-label">浏览器分布</div>
                <div class="behavior-chart">
                  <v-chart
                    :option="browserChartOption"
                    style="height: 120px;"
                  />
                </div>
              </div>
              
              <div class="behavior-metrics">
                <el-row :gutter="10">
                  <el-col :span="8">
                    <div class="metric-item">
                      <div class="metric-value">{{ behaviorStats.uniqueVisitors || 0 }}</div>
                      <div class="metric-label">独立访客</div>
                    </div>
                  </el-col>
                  <el-col :span="8">
                    <div class="metric-item">
                      <div class="metric-value">{{ behaviorStats.avgSessionTime || '0s' }}</div>
                      <div class="metric-label">平均会话</div>
                    </div>
                  </el-col>
                  <el-col :span="8">
                    <div class="metric-item">
                      <div class="metric-value">{{ behaviorStats.bounceRate || '0%' }}</div>
                      <div class="metric-label">跳出率</div>
                    </div>
                  </el-col>
                </el-row>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 实时数据 -->
    <el-row :gutter="20" class="realtime-row">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>实时数据</span>
              <el-button @click="loadRealtimeData" :loading="realtimeLoading">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>
          
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="realtime-metric">
                <div class="metric-title">最近5分钟访问</div>
                <div class="metric-number">{{ realtimeStats.last5MinVisits || 0 }}</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="realtime-metric">
                <div class="metric-title">在线用户</div>
                <div class="metric-number">{{ realtimeStats.onlineUsers || 0 }}</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="realtime-metric">
                <div class="metric-title">最近访问网站</div>
                <div class="recent-sites">
                  <div
                    v-for="site in realtimeStats.recentSites"
                    :key="site.id"
                    class="recent-site"
                  >
                    {{ site.name }}
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Link, Folder, User, View, Refresh } from '@element-plus/icons-vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import request from '@/utils/request'
import VirtualScroll from '@/components/VirtualScroll.vue'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  LineChart,
  PieChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

// 响应式数据
const trendLoading = ref(false)
const categoryLoading = ref(false)
const rankingLoading = ref(false)
const behaviorLoading = ref(false)
const realtimeLoading = ref(false)

const trendPeriod = ref('7')
const rankingType = ref('clicks')

const overviewStats = reactive({
  totalSites: 0,
  totalCategories: 0,
  totalUsers: 0,
  totalClicks: 0
})

const topSites = ref([])
const behaviorStats = reactive({
  uniqueVisitors: 0,
  avgSessionTime: '0s',
  bounceRate: '0%'
})

const realtimeStats = reactive({
  last5MinVisits: 0,
  onlineUsers: 0,
  recentSites: []
})

// 图表配置
const trendChartOption = ref({
  tooltip: {
    trigger: 'axis'
  },
  xAxis: {
    type: 'category',
    data: []
  },
  yAxis: {
    type: 'value'
  },
  series: [{
    name: '访问量',
    type: 'line',
    data: [],
    smooth: true,
    areaStyle: {
      opacity: 0.3
    }
  }]
})

const categoryChartOption = ref({
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: {c} ({d}%)'
  },
  legend: {
    orient: 'vertical',
    left: 'left'
  },
  series: [{
    name: '分类访问',
    type: 'pie',
    radius: '50%',
    data: []
  }]
})

const browserChartOption = ref({
  tooltip: {
    trigger: 'item'
  },
  series: [{
    type: 'pie',
    radius: ['40%', '70%'],
    data: [],
    label: {
      show: false
    }
  }]
})

let realtimeTimer: NodeJS.Timeout | null = null

// 方法
const loadOverviewStats = async () => {
  try {
    console.log('正在加载概览统计数据')
    const response = await request.get('/stats/overview')
    console.log('概览统计API响应:', response.data)
    
    // 处理不同的响应格式
    let overviewData;
    
    if (response.data.success && response.data.data) {
      // 标准格式: {success: true, data: {...}}
      overviewData = response.data.data;
    } else if (response.data.overview) {
      // 直接格式: {overview: {...}}
      overviewData = response.data.overview;
    } else {
      console.error('未知的概览统计API响应格式:', response.data);
      return;
    }
    
    Object.assign(overviewStats, overviewData);
    console.log('概览统计数据加载成功:', overviewStats);
  } catch (error) {
    console.error('加载概览统计失败:', error)
    ElMessage.error('加载概览统计失败')
  }
}

const loadTrendData = async () => {
  trendLoading.value = true
  try {
    console.log('正在加载访问趋势数据，周期:', trendPeriod.value)
    const response = await request.get('/stats/trends', {
      params: { days: trendPeriod.value }
    })
    console.log('访问趋势API响应:', response.data)
    
    // 处理不同的响应格式
    let trendData;
    
    if (response.data.success && response.data.data) {
      // 标准格式: {success: true, data: {...}}
      trendData = response.data.data;
    } else if (response.data.dates && response.data.visits) {
      // 直接格式: {dates: [...], visits: [...]}
      trendData = response.data;
    } else {
      console.error('未知的访问趋势API响应格式:', response.data);
      return;
    }
    
    trendChartOption.value.xAxis.data = trendData.dates;
    trendChartOption.value.series[0].data = trendData.visits;
    console.log('访问趋势数据加载成功');
  } catch (error) {
    console.error('加载访问趋势失败:', error)
    ElMessage.error('加载访问趋势失败')
  } finally {
    trendLoading.value = false
  }
}

const loadCategoryData = async () => {
  categoryLoading.value = true
  try {
    console.log('正在加载分类统计数据')
    const response = await request.get('/stats/categories')
    console.log('分类统计API响应:', response.data)
    
    // 处理不同的响应格式
    let categoryData;
    
    if (response.data.success && response.data.data) {
      // 标准格式: {success: true, data: [...]}
      categoryData = response.data.data;
    } else if (Array.isArray(response.data)) {
      // 直接格式: [...]
      categoryData = response.data;
    } else {
      console.error('未知的分类统计API响应格式:', response.data);
      return;
    }
    
    categoryChartOption.value.series[0].data = categoryData;
    console.log('分类统计数据加载成功');
  } catch (error) {
    console.error('加载分类统计失败:', error)
    ElMessage.error('加载分类统计失败')
  } finally {
    categoryLoading.value = false
  }
}

const loadRankingData = async () => {
  rankingLoading.value = true
  try {
    console.log('正在加载排行数据，类型:', rankingType.value)
    const response = await request.get('/stats/ranking', {
      params: { type: rankingType.value, limit: 10 }
    })
    console.log('排行数据API响应:', response.data)
    
    // 处理不同的响应格式
    let rankingData;
    
    if (response.data.success && response.data.data) {
      // 标准格式: {success: true, data: [...]}
      rankingData = response.data.data;
    } else if (Array.isArray(response.data)) {
      // 直接格式: [...]
      rankingData = response.data;
    } else {
      console.error('未知的排行数据API响应格式:', response.data);
      return;
    }
    
    topSites.value = rankingData;
    console.log('排行数据加载成功:', topSites.value.length, '个网站');
  } catch (error) {
    console.error('加载排行数据失败:', error)
    ElMessage.error('加载排行数据失败')
  } finally {
    rankingLoading.value = false
  }
}

const loadBehaviorData = async () => {
  behaviorLoading.value = true
  try {
    console.log('正在加载用户行为数据')
    const response = await request.get('/stats/behavior')
    console.log('用户行为API响应:', response.data)
    
    // 处理不同的响应格式
    let behaviorData;
    
    if (response.data.success && response.data.data) {
      // 标准格式: {success: true, data: {...}}
      behaviorData = response.data.data;
    } else if (response.data.uniqueVisitors !== undefined) {
      // 直接格式: {uniqueVisitors: ..., avgSessionTime: ..., ...}
      behaviorData = response.data;
    } else {
      console.error('未知的用户行为API响应格式:', response.data);
      return;
    }
    
    Object.assign(behaviorStats, {
      uniqueVisitors: behaviorData.uniqueVisitors,
      avgSessionTime: behaviorData.avgSessionTime,
      bounceRate: behaviorData.bounceRate
    });
    
    browserChartOption.value.series[0].data = behaviorData.browsers;
    console.log('用户行为数据加载成功');
  } catch (error) {
    console.error('加载用户行为数据失败:', error)
    ElMessage.error('加载用户行为数据失败')
  } finally {
    behaviorLoading.value = false
  }
}

const loadRealtimeData = async () => {
  realtimeLoading.value = true
  try {
    console.log('正在加载实时数据')
    const response = await request.get('/stats/realtime')
    console.log('实时数据API响应:', response.data)
    
    // 处理不同的响应格式
    let realtimeData;
    
    if (response.data.success && response.data.data) {
      // 标准格式: {success: true, data: {...}}
      realtimeData = response.data.data;
    } else if (response.data.last5MinVisits !== undefined) {
      // 直接格式: {last5MinVisits: ..., onlineUsers: ..., ...}
      realtimeData = response.data;
    } else {
      console.error('未知的实时数据API响应格式:', response.data);
      return;
    }
    
    Object.assign(realtimeStats, realtimeData);
    console.log('实时数据加载成功');
  } catch (error) {
    console.error('加载实时数据失败:', error)
    ElMessage.error('加载实时数据失败')
  } finally {
    realtimeLoading.value = false
  }
}

const startRealtimeUpdates = () => {
  realtimeTimer = setInterval(() => {
    loadRealtimeData()
  }, 30000) // 每30秒更新一次
}

const stopRealtimeUpdates = () => {
  if (realtimeTimer) {
    clearInterval(realtimeTimer)
    realtimeTimer = null
  }
}

// 生命周期
onMounted(() => {
  loadOverviewStats()
  loadTrendData()
  loadCategoryData()
  loadRankingData()
  loadBehaviorData()
  loadRealtimeData()
  startRealtimeUpdates()
})

onUnmounted(() => {
  stopRealtimeUpdates()
})
</script>

<style scoped>
.statistics {
  padding: 20px;
  background: #f5f5f5;
  min-height: calc(100vh - 60px);
  max-height: calc(100vh - 60px);
  overflow-y: auto;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  height: 100px;
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 24px;
  color: white;
}

.stat-icon.websites {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.categories {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.users {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.visits {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.charts-row,
.data-row,
.realtime-row {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  width: 100%;
}

.empty-data {
  text-align: center;
  color: #909399;
  padding: 40px 0;
}

.ranking-list {
  /* 移除max-height限制，让VirtualScroll组件控制高度 */
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.ranking-item:last-child {
  border-bottom: none;
}

.ranking-number {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 15px;
}

.site-info {
  flex: 1;
}

.site-name {
  font-weight: 500;
  color: #303133;
}

.site-url {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.site-stats {
  text-align: center;
}

.stat-value {
  font-size: 16px;
  font-weight: bold;
  color: #409eff;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.behavior-stats {
  padding: 10px 0;
}

.behavior-item {
  margin-bottom: 20px;
}

.behavior-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.behavior-chart {
  height: 120px;
}

.behavior-metrics {
  margin-top: 20px;
}

.metric-item {
  text-align: center;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
}

.metric-value {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.metric-label {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.realtime-metric {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.metric-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.metric-number {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

.recent-sites {
  max-height: 60px;
  overflow-y: auto;
}

.recent-site {
  font-size: 12px;
  color: #606266;
  padding: 2px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>