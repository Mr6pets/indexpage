<template>
  <div class="user-management fade-in-up">
    <!-- 操作栏 -->
    <div class="toolbar slide-in-left">
      <el-button type="primary" @click="showAddDialog" class="btn-hover-scale">
        <el-icon><Plus /></el-icon>
        添加用户
      </el-button>
      
      <div class="toolbar-right slide-in-right">
        <el-input
          v-model="searchQuery"
          placeholder="搜索用户名或邮箱"
          style="width: 300px; margin-right: 10px;"
          clearable
          @input="handleSearch"
          class="search-input"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-select
          v-model="selectedRole"
          placeholder="选择角色"
          style="width: 120px;"
          clearable
          @change="handleRoleFilter"
          class="role-select"
        >
          <el-option label="管理员" value="admin" />
          <el-option label="编辑者" value="editor" />
          <el-option label="查看者" value="viewer" />
        </el-select>
      </div>
    </div>

    <!-- 用户列表 -->
    <el-card class="table-card fade-in-up animation-delay-200">
      <el-table
        v-loading="loading"
        :data="users"
        style="width: 100%"
        class="animated-table"
        :row-class-name="getRowClassName"
      >
        <el-table-column prop="username" label="用户名" min-width="120" />
        
        <el-table-column prop="email" label="邮箱" min-width="200" />
        
        <el-table-column prop="role" label="角色" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.role)" class="role-tag">
              {{ getRoleText(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'" class="status-tag">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="last_login" label="最后登录" width="180">
          <template #default="{ row }">
            {{ row.last_login ? formatTime(row.last_login) : '从未登录' }}
          </template>
        </el-table-column>
        
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button size="small" @click="editUser(row)" class="btn-hover-lift">编辑</el-button>
              <el-button
                size="small"
                :type="row.status === 'active' ? 'warning' : 'success'"
                @click="toggleStatus(row)"
                class="btn-hover-lift"
              >
                {{ row.status === 'active' ? '禁用' : '启用' }}
              </el-button>
              <el-button size="small" type="info" @click="resetPassword(row)" class="btn-hover-lift">
                重置密码
              </el-button>
              <el-button 
                size="small" 
                type="danger" 
                @click="deleteUser(row)"
                :disabled="row.id === currentUserId"
                class="btn-hover-shake"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination fade-in-up animation-delay-400">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑用户' : '添加用户'"
      width="500px"
      @close="resetForm"
      class="animated-dialog"
      :class="{ 'dialog-enter': dialogVisible }"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
        class="animated-form"
      >
        <el-form-item label="用户名" prop="username" class="form-item-slide">
          <el-input 
            v-model="form.username" 
            placeholder="请输入用户名"
            :disabled="isEdit"
            class="input-focus-glow"
          />
        </el-form-item>
        
        <el-form-item label="邮箱" prop="email" class="form-item-slide animation-delay-100">
          <el-input v-model="form.email" placeholder="请输入邮箱" class="input-focus-glow" />
        </el-form-item>
        
        <el-form-item label="密码" prop="password" v-if="!isEdit" class="form-item-slide animation-delay-200">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
            class="input-focus-glow"
          />
        </el-form-item>
        
        <el-form-item label="角色" prop="role" class="form-item-slide animation-delay-300">
          <el-select v-model="form.role" placeholder="请选择角色" style="width: 100%" class="select-focus-glow">
            <el-option label="管理员" value="admin" />
            <el-option label="编辑者" value="editor" />
            <el-option label="查看者" value="viewer" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="状态" prop="status" class="form-item-slide animation-delay-400">
          <el-radio-group v-model="form.status" class="radio-group-animated">
            <el-radio label="active" class="radio-hover">启用</el-radio>
            <el-radio label="inactive" class="radio-hover">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer fade-in-up animation-delay-500">
          <el-button @click="dialogVisible = false" class="btn-hover-bounce">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting" class="btn-hover-pulse">
            {{ isEdit ? '更新' : '添加' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="重置密码"
      width="400px"
      class="animated-dialog password-dialog"
      :class="{ 'dialog-enter': passwordDialogVisible }"
    >
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="80px"
        class="animated-form"
      >
        <el-form-item label="新密码" prop="password" class="form-item-slide">
          <el-input
            v-model="passwordForm.password"
            type="password"
            placeholder="请输入新密码"
            show-password
            class="input-focus-glow"
          />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword" class="form-item-slide animation-delay-100">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
            class="input-focus-glow"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer fade-in-up animation-delay-200">
          <el-button @click="passwordDialogVisible = false" class="btn-hover-bounce">取消</el-button>
          <el-button type="primary" @click="submitPasswordReset" :loading="passwordSubmitting" class="btn-hover-pulse">
            重置密码
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import request from '@/utils/request'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const passwordSubmitting = ref(false)
const dialogVisible = ref(false)
const passwordDialogVisible = ref(false)
const isEdit = ref(false)
const searchQuery = ref('')
const selectedRole = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const currentUserId = ref(null)

const users = ref([])
const formRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()

const form = reactive({
  id: null,
  username: '',
  email: '',
  password: '',
  role: 'viewer',
  status: 'active'
})

const passwordForm = reactive({
  userId: null,
  password: '',
  confirmPassword: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

const passwordRules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: Function) => {
        if (value !== passwordForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 方法
const loadUsers = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      search: searchQuery.value,
      role: selectedRole.value
    }
    
    const response = await request.get('/users', { params })
    if (response.data.success) {
      users.value = response.data.data.users
      total.value = response.data.data.total
    }
  } catch (error) {
    ElMessage.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

const showAddDialog = () => {
  isEdit.value = false
  dialogVisible.value = true
  resetForm()
}

const editUser = (user: any) => {
  isEdit.value = true
  dialogVisible.value = true
  Object.assign(form, {
    ...user,
    password: '' // 编辑时不显示密码
  })
}

const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(form, {
    id: null,
    username: '',
    email: '',
    password: '',
    role: 'viewer',
    status: 'active'
  })
}

const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    const url = isEdit.value ? `/users/${form.id}` : '/users'
    const method = isEdit.value ? 'put' : 'post'
    
    const response = await axios[method](url, form)
    
    if (response.data.success) {
      ElMessage.success(isEdit.value ? '更新成功' : '添加成功')
      dialogVisible.value = false
      loadUsers()
    } else {
      ElMessage.error(response.data.message || '操作失败')
    }
  } catch (error: any) {
    if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message)
    } else {
      ElMessage.error('操作失败')
    }
  } finally {
    submitting.value = false
  }
}

const toggleStatus = async (user: any) => {
  try {
    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    const response = await request.put(`/users/${user.id}`, {
      ...user,
      status: newStatus
    })
    
    if (response.data.success) {
      user.status = newStatus
      ElMessage.success('状态更新成功')
    }
  } catch (error) {
    ElMessage.error('状态更新失败')
  }
}

const resetPassword = (user: any) => {
  passwordForm.userId = user.id
  passwordForm.password = ''
  passwordForm.confirmPassword = ''
  passwordDialogVisible.value = true
}

const submitPasswordReset = async () => {
  if (!passwordFormRef.value) return
  
  try {
    await passwordFormRef.value.validate()
    passwordSubmitting.value = true
    
    const response = await request.put(`/users/${passwordForm.userId}/password`, {
      password: passwordForm.password
    })
    
    if (response.data.success) {
      ElMessage.success('密码重置成功')
      passwordDialogVisible.value = false
    } else {
      ElMessage.error(response.data.message || '密码重置失败')
    }
  } catch (error: any) {
    if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message)
    } else {
      ElMessage.error('密码重置失败')
    }
  } finally {
    passwordSubmitting.value = false
  }
}

const deleteUser = async (user: any) => {
  if (user.id === currentUserId.value) {
    ElMessage.warning('不能删除当前登录用户')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${user.username}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await request.delete(`/users/${user.id}`)
    if (response.data.success) {
      ElMessage.success('删除成功')
      loadUsers()
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const getRoleTagType = (role: string) => {
  const types: Record<string, string> = {
    admin: 'danger',
    editor: 'warning',
    viewer: 'info'
  }
  return types[role] || 'info'
}

const getRoleText = (role: string) => {
  const texts: Record<string, string> = {
    admin: '管理员',
    editor: '编辑者',
    viewer: '查看者'
  }
  return texts[role] || role
}

const handleSearch = () => {
  currentPage.value = 1
  loadUsers()
}

const handleRoleFilter = () => {
  currentPage.value = 1
  loadUsers()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  loadUsers()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadUsers()
}

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 新增动画相关方法
const getRowClassName = ({ rowIndex }: { rowIndex: number }) => {
  return `table-row-${rowIndex % 2 === 0 ? 'even' : 'odd'} table-row-animate`
}

// 生命周期
onMounted(() => {
  // 获取当前用户ID
  const savedUser = localStorage.getItem('admin_user')
  if (savedUser) {
    const user = JSON.parse(savedUser)
    currentUserId.value = user.id
  }
  
  loadUsers()
})
</script>

<style scoped>
.user-management {
  padding: 0;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.toolbar-right {
  display: flex;
  align-items: center;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 动画样式 */
.table-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.table-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.animated-table {
  overflow: hidden;
}

.animated-table :deep(.el-table__row) {
  transition: all 0.3s ease;
}

.animated-table :deep(.el-table__row:hover) {
  background-color: var(--el-table-row-hover-bg-color);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.table-row-animate {
  animation: slideInFromLeft 0.5s ease-out;
}

.table-row-even {
  animation-delay: 0.1s;
}

.table-row-odd {
  animation-delay: 0.2s;
}

@keyframes slideInFromLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.action-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.btn-hover-lift {
  transition: all 0.3s ease;
}

.btn-hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-hover-scale {
  transition: all 0.3s ease;
}

.btn-hover-scale:hover {
  transform: scale(1.05);
}

.btn-hover-shake:hover {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

.btn-hover-bounce {
  transition: all 0.3s ease;
}

.btn-hover-bounce:hover {
  animation: bounce 0.6s ease;
}

@keyframes bounce {
  0%, 20%, 60%, 100% { transform: translateY(0); }
  40% { transform: translateY(-8px); }
  80% { transform: translateY(-4px); }
}

.btn-hover-pulse {
  transition: all 0.3s ease;
}

.btn-hover-pulse:hover {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(64, 158, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(64, 158, 255, 0); }
}

.role-tag, .status-tag {
  transition: all 0.3s ease;
}

.role-tag:hover, .status-tag:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.search-input, .role-select {
  transition: all 0.3s ease;
}

.search-input:hover, .role-select:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 对话框动画 */
.animated-dialog {
  transition: all 0.3s ease;
}

.dialog-enter {
  animation: dialogSlideIn 0.4s ease-out;
}

@keyframes dialogSlideIn {
  from {
    opacity: 0;
    transform: translateY(-50px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animated-form {
  overflow: hidden;
}

.form-item-slide {
  animation: slideInFromRight 0.5s ease-out;
  animation-fill-mode: both;
}

@keyframes slideInFromRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.input-focus-glow {
  transition: all 0.3s ease;
}

.input-focus-glow:focus-within {
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  transform: translateY(-1px);
}

.select-focus-glow {
  transition: all 0.3s ease;
}

.select-focus-glow:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.radio-group-animated {
  transition: all 0.3s ease;
}

.radio-hover {
  transition: all 0.3s ease;
}

.radio-hover:hover {
  transform: scale(1.05);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.password-dialog {
  animation: dialogBounceIn 0.5s ease-out;
}

@keyframes dialogBounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* 响应式动画 */
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .toolbar-right {
    justify-content: space-between;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 2px;
  }
  
  .btn-hover-lift:hover,
  .btn-hover-scale:hover {
    transform: none;
  }
}

/* 暗色主题适配 */
.dark .table-card {
  background-color: var(--el-bg-color-page);
  border-color: var(--el-border-color);
}

.dark .animated-table :deep(.el-table__row:hover) {
  background-color: var(--el-fill-color-light);
}

.dark .search-input:hover,
.dark .role-select:hover {
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
}

.dark .input-focus-glow:focus-within {
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.3);
}
</style>