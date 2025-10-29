<template>
  <div class="navigation-container">
    <div class="header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="title">
            <span class="icon">🧭</span>
            咕噜水（guluwater）导航页面
          </h1>
          <p class="subtitle">快速访问常用网站</p>
        </div>
        <div class="admin-section">
          <button class="admin-btn" @click="goToAdmin">
            <span class="admin-icon">⚙️</span>
            后台管理
          </button>
        </div>
      </div>
    </div>

    <div class="search-container">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="搜索网站..." 
        class="search-input"
      >
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">正在加载数据...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <p class="error-text">{{ error }}</p>
      <button class="retry-btn" @click="initializeData">重试</button>
    </div>

    <!-- 分类显示 -->
    <div v-else class="categories-container">
      <div v-for="category in filteredCategories" :key="category.name" class="category-section">
        <div class="category-header">
          <span class="category-icon">{{ category.icon }}</span>
          <h2 class="category-title">{{ category.name }}</h2>
          <div class="category-divider"></div>
        </div>
        
        <div class="sites-grid">
          <div 
            v-for="site in category.sites" 
            :key="site.id"
            class="nav-card"
            @click="openSite(site.url)"
          >
            <div class="card-icon">
              {{ site.icon }}
            </div>
            <h3 class="card-title">{{ site.name }}</h3>
            <p class="card-description">{{ site.description }}</p>
            <div class="card-url">{{ site.url }}</div>
          </div>
        </div>
      </div>
    </div>

    <footer class="footer">
      <p>&copy; 2024 导航页面 - 使用 Vue 3 构建</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const searchQuery = ref('')
const categories = ref([])
const loading = ref(true)
const error = ref(null)

// API 基础 URL
const API_BASE_URL = 'http://localhost:3001/api'

// 获取分类数据
const fetchCategories = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/categories`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data.success ? data.data.categories : []
  } catch (err) {
    console.error('获取分类数据失败:', err)
    throw err
  }
}

// 获取网站数据
const fetchSites = async () => {
  try {
    // 设置一个足够大的limit来获取所有网站，或者使用特殊参数
    const response = await fetch(`${API_BASE_URL}/sites?limit=1000`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data.success ? data.data.sites : []
  } catch (err) {
    console.error('获取网站数据失败:', err)
    throw err
  }
}

// 组织数据：将网站按分类分组
const organizeData = (categoriesData, sitesData) => {
  return categoriesData.map(category => ({
    name: category.name,
    icon: category.icon,
    sites: sitesData.filter(site => site.category_id === category.id)
  })).filter(category => category.sites.length > 0) // 只显示有网站的分类
}

// 初始化数据
const initializeData = async () => {
  try {
    loading.value = true
    error.value = null
    
    const [categoriesData, sitesData] = await Promise.all([
      fetchCategories(),
      fetchSites()
    ])
    
    categories.value = organizeData(categoriesData, sitesData)
  } catch (err) {
    error.value = '加载数据失败，请稍后重试'
    console.error('初始化数据失败:', err)
    
    // 如果API失败，使用备用数据
    categories.value = getFallbackData()
  } finally {
    loading.value = false
  }
}

// 备用数据（当API不可用时使用）
const getFallbackData = () => {
  return [
    {
      name: '我的服务',
      icon: '💧',
      sites: [
        {
          id: 1,
          name: 'VitePress 博客',
          description: '专业的 Vue 3 博客',
          url: 'http://vitepress.guluwater.com/',
          icon: '💧'
        },
        {
          id: 2,
          name: 'Office Tools',
          description: '办公工具集',
          url: 'http://officetools.guluwater.com/',
          icon: '🛠️'
        }
      ]
    }
  ]
}

// 搜索过滤逻辑
const filteredCategories = computed(() => {
  if (!searchQuery.value) {
    return categories.value
  }
  
  const query = searchQuery.value.toLowerCase()
  return categories.value.map(category => ({
    ...category,
    sites: category.sites.filter(site => 
      site.name.toLowerCase().includes(query) ||
      site.description.toLowerCase().includes(query)
    )
  })).filter(category => category.sites.length > 0)
})

const openSite = (url) => {
  window.open(url, '_blank')
}

const goToAdmin = () => {
  window.open('http://localhost:5173', '_blank')
}

// 组件挂载时初始化数据
onMounted(() => {
  initializeData()
})
</script>

<style scoped>
.navigation-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem 1rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  margin-bottom: 3rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.title-section {
  text-align: left;
}

.admin-section {
  display: flex;
  align-items: center;
}

.admin-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  backdrop-filter: blur(10px);
}

.admin-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.admin-icon {
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
  }
  
  .title-section {
    text-align: center;
  }
}

.title {
  font-size: 3rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.5rem;
  text-shadow: none;
}

.icon {
  margin-right: 1rem;
}

.subtitle {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  font-weight: 300;
}

.search-container {
  display: flex;
  justify-content: center;
  margin-bottom: 3rem;
}

.search-input {
  max-width: 500px;
  width: 100%;
  padding: 1rem 1.5rem;
  font-size: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  color: white;
  transition: all 0.3s ease;
  outline: none;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.search-input:focus {
  border-color: rgba(255, 255, 255, 0.4);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
  transform: translateY(-1px);
}

/* 分类容器样式 */
.categories-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.category-section {
  margin-bottom: 3rem;
}

.category-header {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 0;
}

.category-icon {
  font-size: 1.8rem;
  margin-right: 0.8rem;
}

.category-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
  text-shadow: none;
  margin: 0;
}

.category-divider {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.3) 100%);
  margin-left: 1rem;
  border-radius: 1px;
}

/* 网站卡片网格 */
.sites-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  padding: 0;
}

.nav-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
}

.nav-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(31, 38, 135, 0.5);
  border-color: rgba(255, 255, 255, 0.4);
}

.card-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  display: block;
}

.card-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.5rem;
}

.card-description {
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 1rem;
  line-height: 1.5;
  font-size: 0.95rem;
}

.card-url {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  word-break: break-all;
  font-family: 'Courier New', monospace;
}

.footer {
  text-align: center;
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.footer p {
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  font-size: 0.95rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .categories-container {
    padding: 0 0.8rem;
  }
  
  .sites-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }
  
  .title {
    font-size: 2.5rem;
  }
  
  .category-title {
    font-size: 1.3rem;
  }
}

@media (max-width: 768px) {
  .navigation-container {
    padding: 1.5rem 0.5rem;
  }
  
  .categories-container {
    padding: 0 0.5rem;
  }
  
  .sites-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.8rem;
  }
  
  .title {
    font-size: 2rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
  
  .search-input {
    max-width: 400px;
    padding: 0.8rem 1.2rem;
  }
  
  .nav-card {
    padding: 1rem;
  }
  
  .card-title {
    font-size: 1.1rem;
  }
  
  .card-description {
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .navigation-container {
    padding: 1rem 0.25rem;
  }
  
  .categories-container {
    padding: 0 0.25rem;
  }
  
  .sites-grid {
    grid-template-columns: 1fr 1fr;
    gap: 0.6rem;
  }
  
  .title {
    font-size: 1.8rem;
  }
  
  .subtitle {
    font-size: 0.9rem;
  }
  
  .search-input {
    max-width: 280px;
    font-size: 0.9rem;
    padding: 0.7rem 1rem;
  }
  
  .nav-card {
    padding: 0.8rem;
  }
  
  .card-title {
    font-size: 1rem;
  }
  
  .card-description {
    font-size: 0.8rem;
    line-height: 1.4;
  }
  
  .card-url {
    font-size: 0.75rem;
  }
  
  .category-title {
    font-size: 1.1rem;
  }
  
  .category-icon {
    font-size: 1.5rem;
  }
}

@media (max-width: 360px) {
  .navigation-container {
    padding: 0.8rem 0.2rem;
  }
  
  .categories-container {
    padding: 0 0.2rem;
  }
  
  .sites-grid {
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
  
  .title {
    font-size: 1.6rem;
  }
  
  .search-input {
    max-width: 250px;
    padding: 0.6rem 0.8rem;
  }
  
  .nav-card {
    padding: 0.6rem;
  }
  
  .card-title {
    font-size: 0.9rem;
  }
  
  .card-description {
    font-size: 0.75rem;
    line-height: 1.3;
  }
  
  .card-url {
    font-size: 0.7rem;
  }
}

@media (min-width: 1400px) {
  .sites-grid {
    grid-template-columns: repeat(5, 1fr);
    gap: 1.5rem;
  }
  
  .title {
    font-size: 3.5rem;
  }
}

/* 动画性能优化 */
@media (prefers-reduced-motion: reduce) {
  .title,
  .icon,
  .nav-card,
  .card-icon,
  .search-input {
    animation: none;
    transition: none;
  }
  
  .nav-card:hover {
    transform: none;
  }
}

/* 加载状态样式 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: white;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 1.1rem;
  font-weight: 500;
  opacity: 0.9;
}

/* 错误状态样式 */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: white;
  text-align: center;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-text {
  font-size: 1.1rem;
  font-weight: 500;
  margin-bottom: 1.5rem;
  opacity: 0.9;
}

.retry-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.retry-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}
</style>