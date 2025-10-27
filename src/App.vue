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

    <!-- 分类显示 -->
    <div class="categories-container">
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
import { ref, computed } from 'vue'

const searchQuery = ref('')

// 按分类组织的网站数据
const categories = ref([
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
      },
      {
        id: 3,
        name: 'General Methods Utils',
        description: '通用方法工具集',
        url: 'http://generalmethodsutils.guluwater.com/',
        icon: '🧰'
      },
      {
        id: 4,
        name: 'Online Interface Lite',
        description: '在线接口（轻量版）',
        url: 'http://onlineinterfacelite.guluwater.com/',
        icon: '🔌'
      },
      {
        id: 5,
        name: 'Online Interface Full',
        description: '在线接口（完整版）',
        url: 'http://onlineinterfacefull.guluwater.com/',
        icon: '🧩'
      },
      {
        id: 6,
        name: 'Lite Image Previewer',
        description: '轻量图像预览器',
        url: 'http://liteimagepreviewer.guluwater.com/',
        icon: '🖼️'
      },
      {
        id: 7,
        name: 'Papercraft',
        description: '纸艺工具',
        url: 'http://papercraft.guluwater.com/',
        icon: '✂️'
      },
      {
        id: 8,
        name: 'Mock Data Generator',
        description: '智能数据模拟生成器',
        url: 'http://mockdatagenerator.guluwater.com/',
        icon: '🔄'
      }
    ]
  },
  {
    name: '前端框架',
    icon: '⚛️',
    sites: [
      {
        id: 9,
        name: 'Vue.js',
        description: '渐进式 JavaScript 框架',
        url: 'https://vuejs.org/',
        icon: '💚'
      },
      {
        id: 10,
        name: 'React',
        description: '用于构建用户界面的 JavaScript 库',
        url: 'https://react.dev/',
        icon: '⚛️'
      },
      {
        id: 11,
        name: 'Angular',
        description: '现代 Web 开发平台',
        url: 'https://angular.io/',
        icon: '🅰️'
      },
      {
        id: 12,
        name: 'Svelte',
        description: '编译时优化的前端框架',
        url: 'https://svelte.dev/',
        icon: '🔥'
      }
    ]
  },
  {
    name: '开发工具',
    icon: '🛠️',
    sites: [
      {
        id: 13,
        name: 'GitHub',
        description: '全球最大的代码托管平台',
        url: 'https://github.com/',
        icon: '🐙'
      },
      {
        id: 14,
        name: 'GitLab',
        description: 'DevOps 生命周期工具',
        url: 'https://gitlab.com/',
        icon: '🦊'
      },
      {
        id: 15,
        name: 'VS Code',
        description: '轻量级代码编辑器',
        url: 'https://code.visualstudio.com/',
        icon: '💙'
      },
      {
        id: 16,
        name: 'Vite',
        description: '下一代前端构建工具',
        url: 'https://vitejs.dev/',
        icon: '⚡'
      },
      {
        id: 17,
        name: 'Webpack',
        description: '模块打包工具',
        url: 'https://webpack.js.org/',
        icon: '📦'
      }
    ]
  },
  {
    name: '学习资源',
    icon: '📚',
    sites: [
      {
        id: 18,
        name: 'MDN Web Docs',
        description: 'Web 开发权威文档',
        url: 'https://developer.mozilla.org/',
        icon: '📚'
      },
      {
        id: 19,
        name: 'W3Schools',
        description: 'Web 技术教程网站',
        url: 'https://www.w3schools.com/',
        icon: '🎓'
      },
      {
        id: 20,
        name: '菜鸟教程',
        description: '编程入门教程网站',
        url: 'https://www.runoob.com/',
        icon: '🐣'
      },
      {
        id: 21,
        name: 'freeCodeCamp',
        description: '免费编程学习平台',
        url: 'https://www.freecodecamp.org/',
        icon: '🏕️'
      }
    ]
  },
  {
    name: '技术社区',
    icon: '💬',
    sites: [
      {
        id: 22,
        name: 'Stack Overflow',
        description: '程序员问答社区',
        url: 'https://stackoverflow.com/',
        icon: '📋'
      },
      {
        id: 23,
        name: '掘金',
        description: '中文技术社区',
        url: 'https://juejin.cn/',
        icon: '⛏️'
      },
      {
        id: 24,
        name: '博客园',
        description: '开发者技术博客平台',
        url: 'https://www.cnblogs.com/',
        icon: '📝'
      },
      {
        id: 25,
        name: 'CSDN',
        description: '中国软件开发者网络',
        url: 'https://www.csdn.net/',
        icon: '💻'
      }
    ]
  },
  {
    name: '实用工具',
    icon: '🔧',
    sites: [
      {
        id: 26,
        name: 'npm',
        description: 'Node.js 包管理器',
        url: 'https://www.npmjs.com/',
        icon: '📦'
      },
      {
        id: 27,
        name: 'Can I Use',
        description: '浏览器兼容性查询',
        url: 'https://caniuse.com/',
        icon: '🔍'
      },
      {
        id: 28,
        name: 'CodePen',
        description: '在线代码编辑器',
        url: 'https://codepen.io/',
        icon: '✏️'
      },
      {
        id: 29,
        name: 'Figma',
        description: '协作式设计工具',
        url: 'https://www.figma.com/',
        icon: '🎨'
      },
      {
        id: 30,
        name: 'Postman',
        description: 'API 开发测试工具',
        url: 'https://www.postman.com/',
        icon: '📮'
      }
    ]
  }
])

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
</style>