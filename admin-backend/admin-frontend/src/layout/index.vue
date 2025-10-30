<template>
  <div class="layout-container" :class="{ 'mobile': isMobile }">
    <!-- 移动端遮罩层 -->
    <div 
      v-if="isMobile" 
      class="sidebar-overlay" 
      :class="{ 'show': !appStore.sidebarCollapsed }"
      @click="appStore.toggleSidebar"
    ></div>
    <!-- 侧边栏 -->
    <transition name="slide-left">
      <div 
        class="sidebar" 
        :class="{ 
          collapsed: appStore.sidebarCollapsed,
          show: !appStore.sidebarCollapsed && isMobile
        }"
      >
      <div class="logo">
        <img v-if="!appStore.sidebarCollapsed" src="/favicon.ico" alt="Logo" class="logo-img" />
        <span v-if="!appStore.sidebarCollapsed" class="logo-text">管理后台</span>
      </div>
      
      <el-menu
        :default-active="route.path"
        :collapse="appStore.sidebarCollapsed"
        background-color="#001529"
        text-color="#fff"
        active-text-color="#1890ff"
        :unique-opened="true"
        router
        @select="handleMenuSelect"
      >
        <el-menu-item index="/dashboard">
          <el-icon><Location /></el-icon>
          <template #title>仪表盘</template>
        </el-menu-item>
        
        <el-menu-item index="/sites">
          <el-icon><Document /></el-icon>
          <template #title>网站管理</template>
        </el-menu-item>
        
        <el-menu-item index="/categories">
          <el-icon><IconMenu /></el-icon>
          <template #title>分类管理</template>
        </el-menu-item>
        
        <el-menu-item index="/users" v-if="authStore.isAdmin">
          <el-icon><User /></el-icon>
          <template #title>用户管理</template>
        </el-menu-item>
        
        <el-menu-item index="/statistics">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>数据统计</template>
        </el-menu-item>
        
        <el-menu-item index="/settings" v-if="authStore.isAdmin">
          <el-icon><Setting /></el-icon>
          <template #title>系统设置</template>
        </el-menu-item>
      </el-menu>
      </div>
    </transition>

    <!-- 主内容区 -->
    <div class="main-container" :class="{ 'collapsed': appStore.sidebarCollapsed }">
      <!-- 顶部导航 -->
      <div class="header">
        <div class="header-left">
          <el-button 
            type="text" 
            @click="appStore.toggleSidebar"
            class="menu-toggle hover-lift"
          >
            <el-icon><IconMenu /></el-icon>
          </el-button>
          
          <!-- 面包屑导航 -->
          <el-breadcrumb separator="/" class="breadcrumb hidden-sm">
            <el-breadcrumb-item 
              v-for="item in appStore.breadcrumbs" 
              :key="item.name"
              :to="item.path"
            >
              {{ item.name }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="header-right">
          <!-- 主题切换 -->
          <el-button 
            type="text" 
            @click="toggleTheme" 
            class="theme-toggle hover-lift"
            :title="appStore.isDark ? '切换到亮色模式' : '切换到暗色模式'"
          >
            <el-icon>
              <Sunny v-if="appStore.isDark" />
              <Moon v-else />
            </el-icon>
          </el-button>
          
          <!-- 用户信息 -->
          <el-dropdown @command="handleCommand" class="user-dropdown">
            <span class="user-info hover-lift">
              <el-avatar :size="32" class="user-avatar">
                <el-icon><UserFilled /></el-icon>
              </el-avatar>
              <span class="username hidden-xs">{{ authStore.user?.username || '用户' }}</span>
              <el-icon class="dropdown-icon hidden-xs"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人资料
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon>
                  设置
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- 页面内容 -->
        <div class="content">
          <router-view v-slot="{ Component }">
            <transition name="fade-slide" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Menu as IconMenu,
  Location,
  Document,
  Setting,
  User,
  DataAnalysis,
  SwitchButton,
  Sunny,
  Moon,
  UserFilled,
  ArrowDown
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { addPassiveEventListener } from '@/utils/performance'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const appStore = useAppStore()

// 响应式检测
const isMobile = ref(false)
let cleanupResizeListener: (() => void) | null = null

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

const collapsed = computed(() => appStore.sidebarCollapsed)
const activeMenu = computed(() => route.path)
const userInfo = computed(() => authStore.user)
const breadcrumbs = computed(() => appStore.breadcrumbs)
const isDark = computed(() => appStore.theme === 'dark')

const toggleCollapse = () => {
  appStore.toggleSidebar()
}

const toggleTheme = () => {
  appStore.toggleTheme()
}

const handleCommand = (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      handleLogout()
      break
  }
}

const handleMenuSelect = (key: string) => {
  router.push(key)
}

const handleLogout = async () => {
  await authStore.logout()
  ElMessage.success('退出登录成功')
  router.push('/login')
}

// 监听路由变化，更新面包屑
watch(
  () => route.path,
  (newPath) => {
    appStore.generateBreadcrumbs(newPath)
    
    // 移动端路由跳转后自动收起侧边栏
    if (isMobile.value) {
      appStore.sidebarCollapsed = true
    }
  },
  { immediate: true }
)

onMounted(() => {
  checkMobile()
  cleanupResizeListener = addPassiveEventListener(window, 'resize', checkMobile)
  
  // 获取当前用户信息
  if (authStore.isAuthenticated) {
    authStore.getCurrentUser()
  }
})

onUnmounted(() => {
  if (cleanupResizeListener) {
    cleanupResizeListener()
    cleanupResizeListener = null
  }
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
  display: flex;
  overflow: hidden;
}

.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  width: 250px;
  height: 100vh;
  background-color: #001529;
  transition: width 0.3s;
  z-index: 1000;
  overflow-y: auto;
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: none;
}

.sidebar-overlay.show {
  display: block;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid #434a50;
  padding: 0 16px;
}

.logo-img {
  width: 32px;
  height: 32px;
  margin-right: 8px;
}

.logo-text {
  white-space: nowrap;
  overflow: hidden;
}

.main-container {
  flex: 1;
  margin-left: 250px;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s;
  min-height: 100vh;
}

.main-container.collapsed {
  margin-left: 64px;
}

.header {
  height: 60px;
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
}

.menu-toggle {
  margin-right: 20px;
  font-size: 18px;
  color: #666;
  border: none;
  background: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.3s;
}

.menu-toggle:hover {
  background-color: #f5f7fa;
  color: #409eff;
}

.breadcrumb {
  margin-left: 12px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.theme-toggle {
  padding: 8px;
  border-radius: 50%;
  border: none;
  background: none;
  cursor: pointer;
  color: #666;
  transition: all 0.3s;
}

.theme-toggle:hover {
  background-color: #f5f7fa;
  color: #409eff;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: 8px;
}

.username {
  margin: 0 8px;
  font-size: 14px;
  color: #333;
}

.main-content {
  flex: 1;
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .layout-container.mobile .sidebar {
    transform: translateX(-100%);
  }
  
  .layout-container.mobile .sidebar.show {
    transform: translateX(0);
  }
  
  .layout-container.mobile .main-container {
    margin-left: 0;
  }
  
  .layout-container.mobile .main-container.collapsed {
    margin-left: 0;
  }
  
  .breadcrumb.hidden-sm {
    display: none;
  }
}

/* 动画效果 */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.3s ease;
}

.slide-left-enter-from {
  transform: translateX(-100%);
}

.slide-left-leave-to {
  transform: translateX(-100%);
}

.hover-lift {
  transition: transform 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-1px);
}
</style>