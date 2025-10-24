// 通用响应类型
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data: T
  code?: number
}

// 分页响应类型
export interface PaginatedResponse<T = any> {
  success: boolean
  message: string
  data: {
    items: T[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

// 用户相关类型
export interface User {
  id: number
  username: string
  email: string
  nickname?: string
  avatar?: string
  role: 'admin' | 'editor' | 'user'
  status: 'active' | 'inactive' | 'banned'
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

export interface LoginForm {
  username: string
  password: string
  remember?: boolean
}

export interface LoginResponse {
  token: string
  user: User
  expiresIn: number
}

// 网站相关类型
export interface Website {
  id: number
  name: string
  url: string
  description?: string
  icon?: string
  categoryId: number
  category?: Category
  status: 'active' | 'inactive'
  sort: number
  clickCount: number
  isRecommended: boolean
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export interface WebsiteForm {
  name: string
  url: string
  description?: string
  icon?: string
  categoryId: number
  status: 'active' | 'inactive'
  sort?: number
  isRecommended?: boolean
  tags?: string[]
}

// 分类相关类型
export interface Category {
  id: number
  name: string
  description?: string
  icon?: string
  parentId?: number
  parent?: Category
  children?: Category[]
  status: 'active' | 'inactive'
  sort: number
  websiteCount: number
  createdAt: string
  updatedAt: string
}

export interface CategoryForm {
  name: string
  description?: string
  icon?: string
  parentId?: number
  status: 'active' | 'inactive'
  sort?: number
}

// 统计相关类型
export interface Statistics {
  totalWebsites: number
  totalCategories: number
  totalUsers: number
  totalViews: number
  todayViews: number
  yesterdayViews: number
  weekViews: number
  monthViews: number
}

export interface VisitTrend {
  date: string
  views: number
  uniqueVisitors: number
}

export interface CategoryStats {
  categoryId: number
  categoryName: string
  websiteCount: number
  viewCount: number
  percentage: number
}

export interface PopularWebsite {
  id: number
  name: string
  url: string
  clickCount: number
  categoryName: string
}

export interface RecentVisit {
  id: number
  websiteId: number
  websiteName: string
  websiteUrl: string
  userAgent: string
  ip: string
  visitedAt: string
}

export interface UserBehavior {
  browsers: { name: string; value: number }[]
  uniqueVisitors: number
  avgSession: number
  bounceRate: number
}

export interface RealTimeData {
  recentViews: number
  onlineUsers: number
  recentWebsites: {
    id: number
    name: string
    url: string
    visitedAt: string
  }[]
}

// 系统设置相关类型
export interface SystemSettings {
  // 基本设置
  siteTitle: string
  siteDescription: string
  siteKeywords: string
  siteLogo?: string
  siteFavicon?: string
  icpNumber?: string
  
  // 显示设置
  pageSize: number
  sortBy: 'name' | 'sort' | 'clickCount' | 'createdAt'
  sortOrder: 'asc' | 'desc'
  showIcon: boolean
  showClickCount: boolean
  showDescription: boolean
  enableSearch: boolean
  
  // 安全设置
  enableRegistration: boolean
  registrationApproval: boolean
  jwtSecret: string
  tokenExpiration: number
  enableAccessLog: boolean
  ipAccessLimit: number
  
  // 邮件设置
  enableEmail: boolean
  smtpHost: string
  smtpPort: number
  smtpSecure: boolean
  smtpUser: string
  smtpPassword: string
  emailFrom: string
  emailFromName: string
}

// 备份相关类型
export interface Backup {
  id: number
  filename: string
  size: number
  type: 'manual' | 'auto'
  status: 'completed' | 'failed' | 'processing'
  createdAt: string
}

// 表格查询参数类型
export interface QueryParams {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  categoryId?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  [key: string]: any
}

// 菜单项类型
export interface MenuItem {
  path: string
  name: string
  icon?: string
  children?: MenuItem[]
  meta?: {
    title: string
    requiresAuth?: boolean
    roles?: string[]
  }
}

// 面包屑类型
export interface Breadcrumb {
  name: string
  path?: string
}

// 主题类型
export type Theme = 'light' | 'dark'

// 语言类型
export type Locale = 'zh-CN' | 'en-US'

// 文件上传类型
export interface UploadFile {
  name: string
  url: string
  size: number
  type: string
}

// 表单验证规则类型
export interface FormRule {
  required?: boolean
  message?: string
  trigger?: string | string[]
  min?: number
  max?: number
  pattern?: RegExp
  validator?: (rule: any, value: any, callback: any) => void
}