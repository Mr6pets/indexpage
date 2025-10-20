<template>
  <div class="navigation-container">
    <div class="header">
      <h1 class="title">
        <span class="icon">🧭</span>
        咕噜水（guluwater）导航页面
      </h1>
      <p class="subtitle">快速访问常用网站</p>
    </div>

    <div class="search-container">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="搜索网站..." 
        class="search-input"
      >
    </div>

    <div class="navigation-grid">
      <div 
        v-for="site in filteredSites" 
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

    <footer class="footer">
      <p>&copy; 2024 导航页面 - 使用 Vue 3 构建</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const searchQuery = ref('')

const sites = ref([
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
])

const filteredSites = computed(() => {
  if (!searchQuery.value) {
    return sites.value
  }
  return sites.value.filter(site => 
    site.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    site.description.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const openSite = (url) => {
  window.open(url, '_blank')
}
</script>

<style scoped>
.navigation-container {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 40px 20px;
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.title {
  font-size: 3rem;
  font-weight: 700;
  color: white;
  margin-bottom: 10px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.icon {
  margin-right: 15px;
}

.subtitle {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 300;
}

.search-container {
  margin-bottom: 40px;
  display: flex;
  justify-content: center;
}

.search-input {
  width: 100%;
  max-width: 500px;
  padding: 15px 20px;
  font-size: 1.1rem;
  border: none;
  border-radius: 50px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  outline: none;
  transition: all 0.3s ease;
}

.search-input:focus {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.navigation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
  margin-bottom: 60px;
}

.nav-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.nav-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  background: rgba(255, 255, 255, 1);
}

.nav-card:active {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
}

.card-icon {
  font-size: 3rem;
  margin-bottom: 15px;
}

.card-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.card-description {
  font-size: 1rem;
  color: #666;
  margin-bottom: 15px;
  line-height: 1.5;
}

.card-url {
  font-size: 0.9rem;
  color: #888;
  font-family: 'Courier New', monospace;
  background: #f5f5f5;
  padding: 8px 12px;
  border-radius: 8px;
  word-break: break-all;
}

.footer {
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .navigation-container {
    padding: 20px 15px;
  }
  
  .title {
    font-size: 2.2rem;
  }
  
  .navigation-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .nav-card {
    padding: 25px;
  }
}

@media (max-width: 480px) {
  .title {
    font-size: 1.8rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
  
  .nav-card {
    padding: 20px;
  }
}
</style>