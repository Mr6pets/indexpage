import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { request } from '@/utils/request'
import type { User, LoginForm, LoginResponse, ApiResponse } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const token = ref<string>(localStorage.getItem('admin_token') || '')
  const user = ref<User | null>(
    localStorage.getItem('admin_user') 
      ? JSON.parse(localStorage.getItem('admin_user')!) 
      : null
  )
  const isLoading = ref(false)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isEditor = computed(() => user.value?.role === 'editor' || user.value?.role === 'admin')

  // 初始化用户信息
  const initUser = () => {
    const savedUser = localStorage.getItem('admin_user')
    if (savedUser && token.value) {
      try {
        user.value = JSON.parse(savedUser)
        // 设置 axios 默认 Authorization 头
        axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      } catch (error) {
        console.error('解析用户信息失败:', error)
        logout()
      }
    }
  }

  // 登录
  const login = async (credentials: LoginForm) => {
    isLoading.value = true
    try {
      const response = await request.post<ApiResponse<LoginResponse>>('/auth/login', credentials)
      
      if (response.success) {
        const { token: newToken, user: userData } = response.data
        
        // 保存 token 和用户信息
        token.value = newToken
        user.value = userData
        
        localStorage.setItem('admin_token', newToken)
        localStorage.setItem('admin_user', JSON.stringify(userData))
        
        return { success: true, message: '登录成功' }
      } else {
        return { success: false, message: response.message || '登录失败' }
      }
    } catch (error: any) {
      console.error('登录失败:', error)
      const message = error.response?.data?.message || '登录失败，请检查网络连接'
      return { success: false, message }
    } finally {
      isLoading.value = false
    }
  }

  // 退出登录
  const logout = async () => {
    try {
      // 调用后端退出接口
      if (token.value) {
        await axios.post('/auth/logout')
      }
    } catch (error) {
      console.error('退出登录请求失败:', error)
    } finally {
      // 清除本地数据
      token.value = null
      user.value = null
      
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      
      // 清除 axios 默认 Authorization 头
      delete axios.defaults.headers.common['Authorization']
    }
  }

  // 获取当前用户信息
  const getCurrentUser = async () => {
    if (!token.value) return { success: false, message: '未登录' }
    
    try {
      isLoading.value = true
      const response = await request.get<ApiResponse<User>>('/auth/me')
      
      if (response.success) {
        user.value = response.data
        localStorage.setItem('admin_user', JSON.stringify(response.data))
        return { success: true, data: response.data }
      } else {
        return { success: false, message: response.message }
      }
    } catch (error: any) {
      console.error('获取用户信息失败:', error)
      return { success: false, message: '获取用户信息失败' }
    } finally {
      isLoading.value = false
    }
  }

  // 更新用户信息
  const updateUser = async (userData: Partial<User>) => {
    try {
      isLoading.value = true
      const response = await request.put<ApiResponse<User>>('/auth/profile', userData)
      
      if (response.success) {
        user.value = response.data
        localStorage.setItem('admin_user', JSON.stringify(response.data))
        return { success: true, message: '更新成功' }
      } else {
        return { success: false, message: response.message }
      }
    } catch (error: any) {
      console.error('更新用户信息失败:', error)
      return { success: false, message: '更新失败' }
    } finally {
      isLoading.value = false
    }
  }

  // 修改密码
  const changePassword = async (passwordData: { oldPassword: string; newPassword: string }) => {
    try {
      isLoading.value = true
      const response = await request.put<ApiResponse<any>>('/auth/change-password', passwordData)
      
      if (response.success) {
        return { success: true, message: '密码修改成功' }
      } else {
        return { success: false, message: response.message }
      }
    } catch (error: any) {
      console.error('修改密码失败:', error)
      return { success: false, message: '修改密码失败' }
    } finally {
      isLoading.value = false
    }
  }

  // 刷新 token
  const refreshToken = async () => {
    try {
      const response = await request.post<ApiResponse<{ token: string }>>('/auth/refresh')
      
      if (response.success) {
        token.value = response.data.token
        localStorage.setItem('admin_token', response.data.token)
        return { success: true }
      } else {
        logout()
        return { success: false, message: response.message }
      }
    } catch (error: any) {
      console.error('刷新token失败:', error)
      logout()
      return { success: false, message: '刷新token失败' }
    }
  }

  // 检查权限
  const hasPermission = (permission: string) => {
    if (!user.value) return false
    
    // 管理员拥有所有权限
    if (user.value.role === 'admin') return true
    
    // 编辑者权限
    if (user.value.role === 'editor') {
      const editorPermissions = [
        'sites.view', 'sites.create', 'sites.update', 'sites.delete',
        'categories.view', 'categories.create', 'categories.update', 'categories.delete',
        'stats.view'
      ]
      return editorPermissions.includes(permission)
    }
    
    // 查看者权限
    if (user.value.role === 'viewer') {
      const viewerPermissions = ['sites.view', 'categories.view', 'stats.view']
      return viewerPermissions.includes(permission)
    }
    
    return false
  }

  // 初始化
  initUser()

  return {
    // 状态
    token,
    user,
    isLoading,
    
    // 计算属性
    isAuthenticated,
    isAdmin,
    isEditor,
    
    // 方法
    login,
    logout,
    getCurrentUser,
    updateUser,
    changePassword,
    refreshToken,
    hasPermission
  }
})