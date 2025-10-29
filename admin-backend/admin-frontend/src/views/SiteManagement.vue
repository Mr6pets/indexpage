<template>
  <div class="site-management">
    <!-- 操作栏 -->
    <div class="toolbar">
      <el-button type="primary" @click="showAddDialog">
        <el-icon><Plus /></el-icon>
        添加网站
      </el-button>
      
      <div class="toolbar-right">
        <el-input
          v-model="searchQuery"
          placeholder="搜索网站名称或URL"
          style="width: 300px; margin-right: 10px;"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-select
          v-model="selectedCategory"
          placeholder="选择分类"
          style="width: 150px;"
          clearable
          @change="handleCategoryFilter"
        >
          <el-option
            v-for="category in categories"
            :key="category.id"
            :label="category.name"
            :value="category.id"
          />
        </el-select>
      </div>
    </div>

    <!-- 网站列表 -->
    <el-card>
      <el-table
        v-loading="loading"
        :data="sites"
        style="width: 100%"
        row-key="id"
      >
        <el-table-column prop="name" label="网站名称" min-width="150">
          <template #default="{ row }">
            <div class="site-info">
              <LazyImage 
                v-if="row.icon"
                :src="row.icon" 
                :alt="row.name" 
                class="site-icon"
                :lazy="true"
                :fade-in="true"
                :show-loading-text="false"
                :show-error-text="false"
                :show-retry="false"
              />
              <div>
                <div class="site-name">{{ row.name }}</div>
                <div class="site-description">{{ row.description }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="url" label="网址" min-width="200">
          <template #default="{ row }">
            <el-link :href="row.url" target="_blank" type="primary">
              {{ row.url }}
            </el-link>
          </template>
        </el-table-column>
        
        <el-table-column prop="category_name" label="分类" width="120" />
        
        <el-table-column prop="click_count" label="访问次数" width="100" align="right" />
        
        <el-table-column prop="sort_order" label="排序" width="80" align="center" />
        
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="editSite(row)">编辑</el-button>
            <el-button
              size="small"
              :type="row.status === 'active' ? 'warning' : 'success'"
              @click="toggleStatus(row)"
            >
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
            <el-button size="small" type="danger" @click="deleteSite(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
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
      :title="isEdit ? '编辑网站' : '添加网站'"
      width="600px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="网站名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入网站名称" />
        </el-form-item>
        
        <el-form-item label="网站URL" prop="url">
          <el-input v-model="form.url" placeholder="请输入网站URL" />
        </el-form-item>
        
        <el-form-item label="网站描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入网站描述"
          />
        </el-form-item>
        
        <el-form-item label="网站图标" prop="icon">
          <el-input v-model="form.icon" placeholder="请输入图标URL或留空自动获取" />
        </el-form-item>
        
        <el-form-item label="所属分类" prop="category_id">
          <el-select v-model="form.category_id" placeholder="请选择分类" style="width: 100%">
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="排序权重" prop="sort_order">
          <el-input-number
            v-model="form.sort_order"
            :min="0"
            :max="9999"
            placeholder="数字越大排序越靠前"
          />
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          {{ isEdit ? '更新' : '添加' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import request from '@/utils/request'
import LazyImage from '@/components/LazyImage.vue'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const searchQuery = ref('')
const selectedCategory = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const sites = ref([])
const categories = ref([])
const formRef = ref<FormInstance>()

const form = reactive({
  id: null,
  name: '',
  url: '',
  description: '',
  icon: '',
  category_id: null,
  sort_order: 0,
  status: 'active'
})

const rules = {
  name: [
    { required: true, message: '请输入网站名称', trigger: 'blur' },
    { min: 1, max: 100, message: '长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  url: [
    { required: true, message: '请输入网站URL', trigger: 'blur' },
    { type: 'url', message: '请输入有效的URL', trigger: 'blur' }
  ],
  category_id: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ]
}

// 方法
const loadSites = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      search: searchQuery.value,
      category_id: selectedCategory.value
    }
    
    console.log('正在加载网站数据，参数:', params)
    const response = await request.get('/sites', { params })
    console.log('API响应:', response.data)
    
    // 处理不同的响应格式
    let sitesData, totalData;
    
    if (response.data.success && response.data.data) {
      // 标准格式: {success: true, data: {sites: [...], pagination: {...}}}
      sitesData = response.data.data.sites;
      totalData = response.data.data.pagination.total;
    } else if (response.data.sites) {
      // 直接格式: {sites: [...], pagination: {...}}
      sitesData = response.data.sites;
      totalData = response.data.pagination.total;
    } else {
      console.error('未知的API响应格式:', response.data);
      return;
    }
    
    sites.value = sitesData;
    total.value = totalData;
    console.log('网站数据加载成功:', sites.value.length, '个网站');
  } catch (error) {
    console.error('加载网站列表失败:', error)
    ElMessage.error('加载网站列表失败')
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  try {
    const response = await request.get('/categories/options/list')
    if (response.data.success) {
      categories.value = response.data.data
    }
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

const showAddDialog = () => {
  isEdit.value = false
  dialogVisible.value = true
  resetForm()
}

const editSite = (site: any) => {
  isEdit.value = true
  dialogVisible.value = true
  Object.assign(form, site)
}

const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(form, {
    id: null,
    name: '',
    url: '',
    description: '',
    icon: '',
    category_id: null,
    sort_order: 0,
    status: 'active'
  })
}

const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    const url = isEdit.value ? `/sites/${form.id}` : '/sites'
    const method = isEdit.value ? 'put' : 'post'
    
    const response = await request[method](url, form)
    
    if (response.data.success) {
      ElMessage.success(isEdit.value ? '更新成功' : '添加成功')
      dialogVisible.value = false
      loadSites()
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

const toggleStatus = async (site: any) => {
  try {
    const newStatus = site.status === 'active' ? 'inactive' : 'active'
    const response = await request.put(`/sites/${site.id}`, {
      ...site,
      status: newStatus
    })
    
    if (response.data.success) {
      site.status = newStatus
      ElMessage.success('状态更新成功')
    }
  } catch (error) {
    ElMessage.error('状态更新失败')
  }
}

const deleteSite = async (site: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除网站 "${site.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await request.delete(`/sites/${site.id}`)
    if (response.data.success) {
      ElMessage.success('删除成功')
      loadSites()
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadSites()
}

const handleCategoryFilter = () => {
  currentPage.value = 1
  loadSites()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  loadSites()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadSites()
}

// 生命周期
onMounted(() => {
  loadCategories()
  loadSites()
})
</script>

<style scoped>
.site-management {
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

.site-info {
  display: flex;
  align-items: center;
}

.site-icon {
  width: 24px;
  height: 24px;
  margin-right: 8px;
  border-radius: 4px;
}

.site-name {
  font-weight: 500;
  margin-bottom: 2px;
}

.site-description {
  font-size: 12px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>