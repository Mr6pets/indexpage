import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface BreadcrumbItem {
  title: string
  path?: string
}

export const useAppStore = defineStore('app', () => {
  // 侧边栏状态
  const sidebarCollapsed = ref(false)
  
  // 面包屑导航
  const breadcrumbs = ref<BreadcrumbItem[]>([])
  
  // 页面加载状态
  const pageLoading = ref(false)
  
  // 主题设置
  const theme = ref<'light' | 'dark'>('light')
  
  // 语言设置
  const locale = ref('zh-CN')
  
  // 系统设置缓存
  const systemSettings = ref<Record<string, any>>({})

  // 切换侧边栏
  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
    // 保存到本地存储
    localStorage.setItem('sidebar_collapsed', String(sidebarCollapsed.value))
  }

  // 设置面包屑
  const setBreadcrumbs = (items: BreadcrumbItem[]) => {
    breadcrumbs.value = items
  }

  // 设置页面加载状态
  const setPageLoading = (loading: boolean) => {
    pageLoading.value = loading
  }

  // 切换主题
  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    // 保存到本地存储
    localStorage.setItem('theme', theme.value)
    // 应用主题到 document
    document.documentElement.setAttribute('data-theme', theme.value)
  }

  // 设置主题
  const setTheme = (newTheme: 'light' | 'dark') => {
    theme.value = newTheme
    localStorage.setItem('theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  // 设置语言
  const setLocale = (newLocale: string) => {
    locale.value = newLocale
    localStorage.setItem('locale', newLocale)
  }

  // 更新系统设置
  const updateSystemSettings = (settings: Record<string, any>) => {
    systemSettings.value = { ...systemSettings.value, ...settings }
  }

  // 获取系统设置
  const getSystemSetting = (key: string, defaultValue?: any) => {
    return systemSettings.value[key] ?? defaultValue
  }

  // 初始化应用状态
  const initApp = () => {
    // 恢复侧边栏状态
    const savedSidebarState = localStorage.getItem('sidebar_collapsed')
    if (savedSidebarState !== null) {
      sidebarCollapsed.value = savedSidebarState === 'true'
    }

    // 恢复主题设置
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark'
    if (savedTheme) {
      setTheme(savedTheme)
    }

    // 恢复语言设置
    const savedLocale = localStorage.getItem('locale')
    if (savedLocale) {
      locale.value = savedLocale
    }
  }

  // 重置应用状态
  const resetApp = () => {
    sidebarCollapsed.value = false
    breadcrumbs.value = []
    pageLoading.value = false
    systemSettings.value = {}
    
    // 清除本地存储
    localStorage.removeItem('sidebar_collapsed')
  }

  // 生成面包屑导航
  const generateBreadcrumbs = (routePath: string) => {
    const breadcrumbMap: Record<string, BreadcrumbItem[]> = {
      '/dashboard': [
        { title: '首页', path: '/dashboard' }
      ],
      '/sites': [
        { title: '首页', path: '/dashboard' },
        { title: '网站管理', path: '/sites' }
      ],
      '/categories': [
        { title: '首页', path: '/dashboard' },
        { title: '分类管理', path: '/categories' }
      ],
      '/users': [
        { title: '首页', path: '/dashboard' },
        { title: '用户管理', path: '/users' }
      ],
      '/statistics': [
        { title: '首页', path: '/dashboard' },
        { title: '数据统计', path: '/statistics' }
      ],
      '/settings': [
        { title: '首页', path: '/dashboard' },
        { title: '系统设置', path: '/settings' }
      ]
    }

    const items = breadcrumbMap[routePath] || [
      { title: '首页', path: '/dashboard' }
    ]
    
    setBreadcrumbs(items)
  }

  // 初始化
  initApp()

  return {
    // 状态
    sidebarCollapsed,
    breadcrumbs,
    pageLoading,
    theme,
    locale,
    systemSettings,

    // 方法
    toggleSidebar,
    setBreadcrumbs,
    setPageLoading,
    toggleTheme,
    setTheme,
    setLocale,
    updateSystemSettings,
    getSystemSetting,
    resetApp,
    generateBreadcrumbs
  }
})