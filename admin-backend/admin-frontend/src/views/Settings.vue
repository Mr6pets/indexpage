<template>
  <div class="settings fade-in-up">
    <el-tabs v-model="activeTab" type="border-card" class="animated-tabs">
      <!-- 基本设置 -->
      <el-tab-pane label="基本设置" name="basic">
        <el-form
          ref="basicFormRef"
          :model="basicSettings"
          label-width="120px"
          class="settings-form animated-form"
        >
          <el-form-item label="网站标题" class="form-item-slide animation-delay-100">
            <el-input
              v-model="basicSettings.site_title"
              placeholder="请输入网站标题"
              style="width: 400px;"
              class="input-focus-glow"
            />
          </el-form-item>
          
          <el-form-item label="网站描述" class="form-item-slide animation-delay-200">
            <el-input
              v-model="basicSettings.site_description"
              type="textarea"
              :rows="3"
              placeholder="请输入网站描述"
              style="width: 400px;"
              class="input-focus-glow"
            />
          </el-form-item>
          
          <el-form-item label="网站关键词" class="form-item-slide animation-delay-300">
            <el-input
              v-model="basicSettings.site_keywords"
              placeholder="请输入网站关键词，用逗号分隔"
              style="width: 400px;"
              class="input-focus-glow"
            />
          </el-form-item>
          
          <el-form-item label="网站Logo" class="form-item-slide animation-delay-400">
            <div class="logo-upload">
              <el-upload
                class="avatar-uploader hover-lift"
                action="#"
                :show-file-list="false"
                :before-upload="beforeLogoUpload"
                :http-request="uploadLogo"
              >
                <img v-if="basicSettings.site_logo" :src="basicSettings.site_logo" class="avatar" />
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
              </el-upload>
              <div class="upload-tip">
                建议尺寸：200x60px，支持 JPG、PNG 格式
              </div>
            </div>
          </el-form-item>
          
          <el-form-item label="网站图标" class="form-item-slide animation-delay-500">
            <div class="favicon-upload">
              <el-upload
                class="favicon-uploader hover-lift"
                action="#"
                :show-file-list="false"
                :before-upload="beforeFaviconUpload"
                :http-request="uploadFavicon"
              >
                <img v-if="basicSettings.site_favicon" :src="basicSettings.site_favicon" class="favicon" />
                <el-icon v-else class="favicon-uploader-icon"><Plus /></el-icon>
              </el-upload>
              <div class="upload-tip">
                建议尺寸：32x32px，支持 ICO、PNG 格式
              </div>
            </div>
          </el-form-item>
          
          <el-form-item label="ICP备案号" class="form-item-slide animation-delay-600">
            <el-input
              v-model="basicSettings.icp_number"
              placeholder="请输入ICP备案号"
              style="width: 400px;"
              class="input-focus-glow"
            />
          </el-form-item>
          
          <el-form-item class="form-item-slide animation-delay-700">
            <el-button type="primary" @click="saveBasicSettings" :loading="basicSaving" class="btn-hover-scale">
              保存设置
            </el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 显示设置 -->
      <el-tab-pane label="显示设置" name="display">
        <el-form
          ref="displayFormRef"
          :model="displaySettings"
          label-width="120px"
          class="settings-form animated-form"
        >
          <el-form-item label="每页显示数量" class="form-item-slide animation-delay-100">
            <el-input-number
              v-model="displaySettings.items_per_page"
              :min="10"
              :max="100"
              :step="10"
              class="input-number-hover"
            />
            <span class="form-tip">设置前台每页显示的网站数量</span>
          </el-form-item>
          
          <el-form-item label="网站排序方式" class="form-item-slide animation-delay-200">
            <el-select v-model="displaySettings.default_sort" style="width: 200px;" class="select-hover">
              <el-option label="按添加时间" value="created_at" />
              <el-option label="按更新时间" value="updated_at" />
              <el-option label="按点击量" value="clicks" />
              <el-option label="按名称" value="name" />
              <el-option label="自定义排序" value="sort_order" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="排序顺序" class="form-item-slide animation-delay-300">
            <el-radio-group v-model="displaySettings.sort_direction" class="radio-group-animated">
              <el-radio label="asc" class="radio-hover">升序</el-radio>
              <el-radio label="desc" class="radio-hover">降序</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="显示网站图标" class="form-item-slide animation-delay-400">
            <el-switch v-model="displaySettings.show_site_icon" class="switch-animated" />
            <span class="form-tip">是否显示网站的favicon图标</span>
          </el-form-item>
          
          <el-form-item label="显示点击统计" class="form-item-slide animation-delay-500">
            <el-switch v-model="displaySettings.show_click_count" class="switch-animated" />
            <span class="form-tip">是否显示网站的点击次数</span>
          </el-form-item>
          
          <el-form-item label="显示网站描述" class="form-item-slide animation-delay-600">
            <el-switch v-model="displaySettings.show_description" class="switch-animated" />
            <span class="form-tip">是否显示网站的描述信息</span>
          </el-form-item>
          
          <el-form-item label="启用搜索功能" class="form-item-slide animation-delay-700">
            <el-switch v-model="displaySettings.enable_search" class="switch-animated" />
            <span class="form-tip">是否在前台显示搜索框</span>
          </el-form-item>
          
          <el-form-item class="form-item-slide animation-delay-800">
            <el-button type="primary" @click="saveDisplaySettings" :loading="displaySaving" class="btn-hover-scale">
              保存设置
            </el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 安全设置 -->
      <el-tab-pane label="安全设置" name="security">
        <el-form
          ref="securityFormRef"
          :model="securitySettings"
          label-width="120px"
          class="settings-form"
        >
          <el-form-item label="启用用户注册">
            <el-switch v-model="securitySettings.allow_registration" />
            <span class="form-tip">是否允许新用户注册</span>
          </el-form-item>
          
          <el-form-item label="注册需要审核">
            <el-switch v-model="securitySettings.registration_approval" />
            <span class="form-tip">新注册用户是否需要管理员审核</span>
          </el-form-item>
          
          <el-form-item label="JWT密钥">
            <el-input
              v-model="securitySettings.jwt_secret"
              type="password"
              placeholder="请输入JWT密钥"
              style="width: 400px;"
              show-password
            />
            <div class="form-tip">
              用于JWT token签名的密钥，修改后所有用户需要重新登录
            </div>
          </el-form-item>
          
          <el-form-item label="Token过期时间">
            <el-input-number
              v-model="securitySettings.token_expire_hours"
              :min="1"
              :max="720"
              :step="1"
            />
            <span class="form-tip">JWT token的有效期（小时）</span>
          </el-form-item>
          
          <el-form-item label="启用访问日志">
            <el-switch v-model="securitySettings.enable_access_log" />
            <span class="form-tip">是否记录用户访问日志</span>
          </el-form-item>
          
          <el-form-item label="IP访问限制">
            <el-input
              v-model="securitySettings.ip_whitelist"
              type="textarea"
              :rows="3"
              placeholder="每行一个IP地址或IP段，留空表示不限制"
              style="width: 400px;"
            />
            <div class="form-tip">
              限制只有指定IP可以访问管理后台，格式：192.168.1.1 或 192.168.1.0/24
            </div>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="saveSecuritySettings" :loading="securitySaving">
              保存设置
            </el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 邮件设置 -->
      <el-tab-pane label="邮件设置" name="email">
        <el-form
          ref="emailFormRef"
          :model="emailSettings"
          label-width="120px"
          class="settings-form"
        >
          <el-form-item label="启用邮件功能">
            <el-switch v-model="emailSettings.enable_email" />
            <span class="form-tip">是否启用邮件通知功能</span>
          </el-form-item>
          
          <el-form-item label="SMTP服务器">
            <el-input
              v-model="emailSettings.smtp_host"
              placeholder="请输入SMTP服务器地址"
              style="width: 400px;"
            />
          </el-form-item>
          
          <el-form-item label="SMTP端口">
            <el-input-number
              v-model="emailSettings.smtp_port"
              :min="1"
              :max="65535"
            />
          </el-form-item>
          
          <el-form-item label="加密方式">
            <el-select v-model="emailSettings.smtp_encryption" style="width: 200px;">
              <el-option label="无加密" value="none" />
              <el-option label="SSL" value="ssl" />
              <el-option label="TLS" value="tls" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="发件人邮箱">
            <el-input
              v-model="emailSettings.smtp_username"
              placeholder="请输入发件人邮箱"
              style="width: 400px;"
            />
          </el-form-item>
          
          <el-form-item label="邮箱密码">
            <el-input
              v-model="emailSettings.smtp_password"
              type="password"
              placeholder="请输入邮箱密码或授权码"
              style="width: 400px;"
              show-password
            />
          </el-form-item>
          
          <el-form-item label="发件人名称">
            <el-input
              v-model="emailSettings.from_name"
              placeholder="请输入发件人名称"
              style="width: 400px;"
            />
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="saveEmailSettings" :loading="emailSaving">
              保存设置
            </el-button>
            <el-button @click="testEmail" :loading="emailTesting">
              测试邮件
            </el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 备份恢复 -->
      <el-tab-pane label="备份恢复" name="backup">
        <div class="backup-section">
          <el-card class="backup-card">
            <template #header>
              <span>数据备份</span>
            </template>
            <div class="backup-content">
              <p>定期备份您的数据，确保数据安全。</p>
              <el-button type="primary" @click="createBackup" :loading="backupCreating">
                <el-icon><Download /></el-icon>
                创建备份
              </el-button>
            </div>
          </el-card>
          
          <el-card class="backup-card">
            <template #header>
              <span>备份列表</span>
            </template>
            <div v-loading="backupLoading">
              <div v-if="backupList.length === 0" class="empty-backup">
                暂无备份文件
              </div>
              <div v-else class="backup-list">
                <div
                  v-for="backup in backupList"
                  :key="backup.id"
                  class="backup-item"
                >
                  <div class="backup-info">
                    <div class="backup-name">{{ backup.filename }}</div>
                    <div class="backup-meta">
                      <span>{{ formatFileSize(backup.size) }}</span>
                      <span>{{ formatTime(backup.created_at) }}</span>
                    </div>
                  </div>
                  <div class="backup-actions">
                    <el-button size="small" @click="downloadBackup(backup)">
                      <el-icon><Download /></el-icon>
                      下载
                    </el-button>
                    <el-button size="small" type="danger" @click="deleteBackup(backup)">
                      <el-icon><Delete /></el-icon>
                      删除
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
          
          <el-card class="backup-card">
            <template #header>
              <span>数据恢复</span>
            </template>
            <div class="restore-content">
              <p>从备份文件恢复数据，<strong>此操作将覆盖当前所有数据</strong>。</p>
              <el-upload
                ref="uploadRef"
                action="#"
                :before-upload="beforeRestore"
                :http-request="restoreBackup"
                :show-file-list="false"
                accept=".sql,.zip"
              >
                <el-button type="warning">
                  <el-icon><Upload /></el-icon>
                  选择备份文件
                </el-button>
              </el-upload>
            </div>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type UploadProps } from 'element-plus'
import { Plus, Download, Delete, Upload } from '@element-plus/icons-vue'
import axios from 'axios'

// 响应式数据
const activeTab = ref('basic')
const basicSaving = ref(false)
const displaySaving = ref(false)
const securitySaving = ref(false)
const emailSaving = ref(false)
const emailTesting = ref(false)
const backupLoading = ref(false)
const backupCreating = ref(false)

const basicFormRef = ref<FormInstance>()
const displayFormRef = ref<FormInstance>()
const securityFormRef = ref<FormInstance>()
const emailFormRef = ref<FormInstance>()

const basicSettings = reactive({
  site_title: '',
  site_description: '',
  site_keywords: '',
  site_logo: '',
  site_favicon: '',
  icp_number: ''
})

const displaySettings = reactive({
  items_per_page: 20,
  default_sort: 'created_at',
  sort_direction: 'desc',
  show_site_icon: true,
  show_click_count: true,
  show_description: true,
  enable_search: true
})

const securitySettings = reactive({
  allow_registration: true,
  registration_approval: false,
  jwt_secret: '',
  token_expire_hours: 24,
  enable_access_log: true,
  ip_whitelist: ''
})

const emailSettings = reactive({
  enable_email: false,
  smtp_host: '',
  smtp_port: 587,
  smtp_encryption: 'tls',
  smtp_username: '',
  smtp_password: '',
  from_name: ''
})

const backupList = ref([])

// 方法
const loadSettings = async () => {
  try {
    const response = await axios.get('/settings')
    if (response.data.success) {
      const settings = response.data.data
      
      // 分组设置数据
      settings.forEach((setting: any) => {
        const { key, value } = setting
        
        if (key in basicSettings) {
          (basicSettings as any)[key] = value
        } else if (key in displaySettings) {
          (displaySettings as any)[key] = value
        } else if (key in securitySettings) {
          (securitySettings as any)[key] = value
        } else if (key in emailSettings) {
          (emailSettings as any)[key] = value
        }
      })
    }
  } catch (error) {
    ElMessage.error('加载设置失败')
  }
}

const saveBasicSettings = async () => {
  basicSaving.value = true
  try {
    const response = await axios.put('/settings/batch', basicSettings)
    if (response.data.success) {
      ElMessage.success('基本设置保存成功')
    }
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    basicSaving.value = false
  }
}

const saveDisplaySettings = async () => {
  displaySaving.value = true
  try {
    const response = await axios.put('/settings/batch', displaySettings)
    if (response.data.success) {
      ElMessage.success('显示设置保存成功')
    }
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    displaySaving.value = false
  }
}

const saveSecuritySettings = async () => {
  securitySaving.value = true
  try {
    const response = await axios.put('/settings/batch', securitySettings)
    if (response.data.success) {
      ElMessage.success('安全设置保存成功')
    }
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    securitySaving.value = false
  }
}

const saveEmailSettings = async () => {
  emailSaving.value = true
  try {
    const response = await axios.put('/settings/batch', emailSettings)
    if (response.data.success) {
      ElMessage.success('邮件设置保存成功')
    }
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    emailSaving.value = false
  }
}

const testEmail = async () => {
  emailTesting.value = true
  try {
    const response = await axios.post('/settings/test-email')
    if (response.data.success) {
      ElMessage.success('测试邮件发送成功')
    }
  } catch (error) {
    ElMessage.error('测试邮件发送失败')
  } finally {
    emailTesting.value = false
  }
}

const beforeLogoUpload: UploadProps['beforeUpload'] = (file) => {
  const isImage = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('Logo只能是 JPG/PNG 格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('Logo大小不能超过 2MB!')
    return false
  }
  return true
}

const uploadLogo = async (options: any) => {
  const formData = new FormData()
  formData.append('file', options.file)
  
  try {
    const response = await axios.post('/upload/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    
    if (response.data.success) {
      basicSettings.site_logo = response.data.data.url
      ElMessage.success('Logo上传成功')
    }
  } catch (error) {
    ElMessage.error('Logo上传失败')
  }
}

const beforeFaviconUpload: UploadProps['beforeUpload'] = (file) => {
  const isIcon = file.type === 'image/x-icon' || file.type === 'image/png'
  const isLt1M = file.size / 1024 / 1024 < 1

  if (!isIcon) {
    ElMessage.error('图标只能是 ICO/PNG 格式!')
    return false
  }
  if (!isLt1M) {
    ElMessage.error('图标大小不能超过 1MB!')
    return false
  }
  return true
}

const uploadFavicon = async (options: any) => {
  const formData = new FormData()
  formData.append('file', options.file)
  
  try {
    const response = await axios.post('/upload/favicon', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    
    if (response.data.success) {
      basicSettings.site_favicon = response.data.data.url
      ElMessage.success('图标上传成功')
    }
  } catch (error) {
    ElMessage.error('图标上传失败')
  }
}

const loadBackupList = async () => {
  backupLoading.value = true
  try {
    const response = await axios.get('/settings/backups')
    if (response.data.success) {
      backupList.value = response.data.data
    }
  } catch (error) {
    ElMessage.error('加载备份列表失败')
  } finally {
    backupLoading.value = false
  }
}

const createBackup = async () => {
  backupCreating.value = true
  try {
    const response = await axios.post('/settings/backup')
    if (response.data.success) {
      ElMessage.success('备份创建成功')
      loadBackupList()
    }
  } catch (error) {
    ElMessage.error('备份创建失败')
  } finally {
    backupCreating.value = false
  }
}

const downloadBackup = (backup: any) => {
  const link = document.createElement('a')
  link.href = `/api/settings/backup/${backup.id}/download`
  link.download = backup.filename
  link.click()
}

const deleteBackup = async (backup: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除备份文件 "${backup.filename}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await axios.delete(`/settings/backup/${backup.id}`)
    if (response.data.success) {
      ElMessage.success('删除成功')
      loadBackupList()
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const beforeRestore = (file: File) => {
  const isValidFile = file.name.endsWith('.sql') || file.name.endsWith('.zip')
  if (!isValidFile) {
    ElMessage.error('只支持 .sql 或 .zip 格式的备份文件!')
    return false
  }
  return true
}

const restoreBackup = async (options: any) => {
  try {
    await ElMessageBox.confirm(
      '恢复数据将覆盖当前所有数据，确定要继续吗？',
      '确认恢复',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const formData = new FormData()
    formData.append('file', options.file)
    
    const response = await axios.post('/settings/restore', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    
    if (response.data.success) {
      ElMessage.success('数据恢复成功')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('数据恢复失败')
    }
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  loadSettings()
  loadBackupList()
})
</script>

<style scoped>
.settings {
  padding: 0;
}

/* 页面进入动画 */
.fade-in-up {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 标签页动画 */
.animated-tabs {
  animation: slideInDown 0.5s ease-out;
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 表单动画 */
.animated-form {
  animation: fadeIn 0.8s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 表单项滑动动画 */
.form-item-slide {
  animation: slideInLeft 0.6s ease-out;
  animation-fill-mode: both;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 动画延迟 */
.animation-delay-100 { animation-delay: 0.1s; }
.animation-delay-200 { animation-delay: 0.2s; }
.animation-delay-300 { animation-delay: 0.3s; }
.animation-delay-400 { animation-delay: 0.4s; }
.animation-delay-500 { animation-delay: 0.5s; }
.animation-delay-600 { animation-delay: 0.6s; }
.animation-delay-700 { animation-delay: 0.7s; }
.animation-delay-800 { animation-delay: 0.8s; }

/* 输入框聚焦发光效果 */
.input-focus-glow :deep(.el-input__wrapper) {
  transition: all 0.3s ease;
}

.input-focus-glow :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.3);
}

.input-focus-glow :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 12px rgba(64, 158, 255, 0.5);
}

.input-focus-glow :deep(.el-textarea__inner) {
  transition: all 0.3s ease;
}

.input-focus-glow :deep(.el-textarea__inner:hover) {
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.3);
}

.input-focus-glow :deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 12px rgba(64, 158, 255, 0.5);
}

/* 数字输入框悬停效果 */
.input-number-hover :deep(.el-input-number) {
  transition: all 0.3s ease;
}

.input-number-hover :deep(.el-input-number:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 选择框悬停效果 */
.select-hover :deep(.el-select) {
  transition: all 0.3s ease;
}

.select-hover :deep(.el-select:hover .el-input__wrapper) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 单选按钮组动画 */
.radio-group-animated {
  transition: all 0.3s ease;
}

.radio-hover :deep(.el-radio) {
  transition: all 0.3s ease;
}

.radio-hover :deep(.el-radio:hover) {
  transform: scale(1.05);
}

.radio-hover :deep(.el-radio__input.is-checked + .el-radio__label) {
  animation: pulse 0.6s ease-in-out;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* 开关动画 */
.switch-animated :deep(.el-switch) {
  transition: all 0.3s ease;
}

.switch-animated :deep(.el-switch:hover) {
  transform: scale(1.1);
}

.switch-animated :deep(.el-switch__core) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 按钮悬停缩放效果 */
.btn-hover-scale {
  transition: all 0.3s ease;
}

.btn-hover-scale:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(64, 158, 255, 0.3);
}

/* 上传组件悬停效果 */
.hover-lift {
  transition: all 0.3s ease;
}

.hover-lift:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.settings-form {
  max-width: 800px;
  padding: 20px;
}

.form-tip {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
  transition: color 0.3s ease;
}

.form-tip:hover {
  color: #606266;
}

.logo-upload,
.favicon-upload {
  display: flex;
  align-items: center;
}

.avatar-uploader,
.favicon-uploader {
  margin-right: 15px;
}

.avatar-uploader .avatar {
  width: 120px;
  height: 40px;
  display: block;
  object-fit: contain;
  transition: all 0.3s ease;
}

.avatar-uploader .avatar:hover {
  transform: scale(1.05);
}

.favicon-uploader .favicon {
  width: 32px;
  height: 32px;
  display: block;
  transition: all 0.3s ease;
}

.favicon-uploader .favicon:hover {
  transform: scale(1.1);
}

.avatar-uploader .avatar-uploader-icon,
.favicon-uploader .favicon-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 120px;
  height: 40px;
  line-height: 40px;
  text-align: center;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.favicon-uploader .favicon-uploader-icon {
  width: 32px;
  height: 32px;
  line-height: 32px;
  font-size: 16px;
}

.avatar-uploader .avatar-uploader-icon:hover,
.favicon-uploader .favicon-uploader-icon:hover {
  border-color: #409eff;
  color: #409eff;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.upload-tip {
  color: #909399;
  font-size: 12px;
  transition: color 0.3s ease;
}

.upload-tip:hover {
  color: #606266;
}

.backup-section {
  padding: 20px;
  animation: fadeInUp 0.6s ease-out;
}

.backup-card {
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.backup-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.backup-content,
.restore-content {
  padding: 20px;
  text-align: center;
}

.empty-backup {
  text-align: center;
  color: #909399;
  padding: 40px 0;
  animation: fadeIn 0.8s ease-out;
}

.backup-list {
  max-height: 300px;
  overflow-y: auto;
}

.backup-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.3s ease;
  animation: slideInLeft 0.5s ease-out;
}

.backup-item:hover {
  background-color: #f8f9fa;
  transform: translateX(5px);
}

.backup-item:last-child {
  border-bottom: none;
}

.backup-info {
  flex: 1;
}

.backup-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 5px;
  transition: color 0.3s ease;
}

.backup-item:hover .backup-name {
  color: #409eff;
}

.backup-meta {
  font-size: 12px;
  color: #909399;
}

.backup-meta span {
  margin-right: 15px;
}

/* 暗色主题适配 */
@media (prefers-color-scheme: dark) {
  .form-tip {
    color: #a3a6ad;
  }
  
  .form-tip:hover {
    color: #c0c4cc;
  }
  
  .upload-tip {
    color: #a3a6ad;
  }
  
  .upload-tip:hover {
    color: #c0c4cc;
  }
  
  .backup-item:hover {
    background-color: #2d2f36;
  }
  
  .backup-name {
    color: #e5eaf3;
  }
  
  .backup-item:hover .backup-name {
    color: #409eff;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .settings-form {
    padding: 15px;
  }
  
  .form-item-slide {
    animation-duration: 0.4s;
  }
  
  .logo-upload,
  .favicon-upload {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .avatar-uploader,
  .favicon-uploader {
    margin-right: 0;
    margin-bottom: 10px;
  }
}
</style>