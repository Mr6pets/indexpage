<template>
  <div class="category-management">
    <!-- 操作栏 -->
    <div class="toolbar">
      <el-button type="primary" @click="showAddDialog">
        <el-icon><Plus /></el-icon>
        添加分类
      </el-button>
      
      <div class="toolbar-right">
        <el-input
          v-model="searchQuery"
          placeholder="搜索分类名称"
          style="width: 300px;"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
    </div>

    <!-- 分类列表 -->
    <el-card>
      <el-table
        v-loading="loading"
        :data="categories"
        style="width: 100%"
        row-key="id"
        height="600"
        :scrollbar-always-on="true"
      >
        <el-table-column prop="name" label="分类名称" min-width="200">
          <template #default="{ row }">
            <div class="category-info">
              <span v-if="row.icon" class="category-icon-emoji">{{ row.icon }}</span>
              <div>
                <div class="category-name">{{ row.name }}</div>
                <div class="category-description">{{ row.description }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="site_count" label="网站数量" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="info">{{ row.site_count || 0 }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="sort_order" label="排序" width="80" align="center" />
        
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="editCategory(row)">编辑</el-button>
            <el-button
              size="small"
              :type="row.status === 'active' ? 'warning' : 'success'"
              @click="toggleStatus(row)"
            >
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="deleteCategory(row)"
              :disabled="row.site_count > 0"
            >
              删除
            </el-button>
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
      :title="isEdit ? '编辑分类' : '添加分类'"
      width="500px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </el-form-item>
        
        <el-form-item label="分类描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入分类描述"
          />
        </el-form-item>
        
        <el-form-item label="分类图标" prop="icon">
          <el-input v-model="form.icon" placeholder="请输入图标名称（如：Link、Menu等）" />
          <div class="icon-hint">
            <small>常用图标：Link、Menu、Document、Setting、User、DataAnalysis</small>
          </div>
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

    <!-- 排序对话框 -->
    <el-dialog
      v-model="sortDialogVisible"
      title="分类排序"
      width="600px"
    >
      <div class="sort-container">
        <p class="sort-hint">拖拽下方分类项目来调整排序，排序越靠前的分类在前端显示越靠前</p>
        <VueDraggable
          v-model="sortList"
          :animation="200"
          ghost-class="ghost"
          chosen-class="chosen"
          drag-class="drag"
        >
          <div
            v-for="item in sortList"
            :key="item.id"
            class="sort-item"
          >
            <el-icon class="drag-handle"><Rank /></el-icon>
            <span class="category-name">{{ item.name }}</span>
            <el-tag size="small">{{ item.site_count || 0 }} 个网站</el-tag>
          </div>
        </VueDraggable>
      </div>
      
      <template #footer>
        <el-button @click="sortDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveSortOrder" :loading="sortSubmitting">
          保存排序
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { Plus, Search, Rank } from '@element-plus/icons-vue'
import { VueDraggable } from 'vue-draggable-plus'
import request from '@/utils/request'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const sortSubmitting = ref(false)
const dialogVisible = ref(false)
const sortDialogVisible = ref(false)
const isEdit = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const categories = ref([])
const sortList = ref([])
const formRef = ref<FormInstance>()

const form = reactive({
  id: null,
  name: '',
  description: '',
  icon: '',
  sort_order: 0,
  status: 'active'
})

const rules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
  ]
}

// 方法
const loadCategories = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      search: searchQuery.value
    }
    
    console.log('正在加载分类数据，参数:', params)
    const response = await request.get('/categories', { params })
    console.log('分类API响应:', response.data)
    
    // 处理统一的响应格式
    let categoriesData, totalData;
    
    if (response.success && response.data) {
      // 标准格式: {success: true, data: {items: [...], pagination: {...}}}
      categoriesData = response.data.items;
      totalData = response.data.pagination ? response.data.pagination.total : response.data.total;
    } else {
      console.error('分类API响应格式错误:', response);
      ElMessage.error('分类数据格式错误');
      return;
    }
    
    categories.value = categoriesData;
    total.value = totalData;
    console.log('分类数据加载成功:', categories.value.length, '个分类');
  } catch (error) {
    console.error('加载分类列表失败:', error)
    ElMessage.error('加载分类列表失败')
  } finally {
    loading.value = false
  }
}

const showAddDialog = () => {
  isEdit.value = false
  dialogVisible.value = true
  resetForm()
}

const editCategory = (category: any) => {
  isEdit.value = true
  dialogVisible.value = true
  Object.assign(form, category)
}

const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(form, {
    id: null,
    name: '',
    description: '',
    icon: '',
    sort_order: 0,
    status: 'active'
  })
}

const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    const url = isEdit.value ? `/categories/${form.id}` : '/categories'
    const method = isEdit.value ? 'put' : 'post'
    
    const response = await request[method](url, form)
    
    if (response.success) {
      ElMessage.success(response.message || (isEdit.value ? '更新成功' : '添加成功'))
      dialogVisible.value = false
      loadCategories()
    } else {
      ElMessage.error(response.message || (isEdit.value ? '更新失败' : '添加失败'))
    }
  } catch (error) {
    console.error('提交表单错误:', error)
    ElMessage.error(isEdit.value ? '更新失败' : '添加失败')
  } finally {
    submitting.value = false
  }
}

const toggleStatus = async (category: any) => {
  try {
    const newStatus = category.status === 'active' ? 'inactive' : 'active'
    const response = await request.put(`/categories/${category.id}`, {
      ...category,
      status: newStatus
    })
    
    if (response.success) {
      category.status = newStatus
      ElMessage.success(response.message || '状态更新成功')
    } else {
      ElMessage.error(response.message || '状态更新失败')
    }
  } catch (error) {
    console.error('状态更新错误:', error)
    ElMessage.error('状态更新失败')
  }
}

const deleteCategory = async (category: any) => {
  if (category.site_count > 0) {
    ElMessage.warning('该分类下还有网站，无法删除')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除分类"${category.name}"吗？`,
      '确认删除',
      { type: 'warning' }
    )
    
    const response = await request.delete(`/categories/${category.id}`)
    if (response.success) {
      ElMessage.success(response.message || '删除成功')
      loadCategories()
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除分类错误:', error)
      ElMessage.error('删除失败')
    }
  }
}

const showSortDialog = async () => {
  try {
    const response = await request.get('/categories/options/list')
    if (response.data.success) {
      sortList.value = [...response.data.data].sort((a, b) => b.sort_order - a.sort_order)
      sortDialogVisible.value = true
    }
  } catch (error) {
    ElMessage.error('加载分类数据失败')
  }
}

const saveSortOrder = async () => {
  try {
    sortSubmitting.value = true
    const sortData = sortList.value.map((item, index) => ({
      id: item.id,
      sort_order: sortList.value.length - index
    }))
    
    const response = await request.put('/categories/sort', { categories: sortData })
    if (response.data.success) {
      ElMessage.success('排序保存成功')
      sortDialogVisible.value = false
      loadCategories()
    }
  } catch (error) {
    ElMessage.error('保存排序失败')
  } finally {
    sortSubmitting.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadCategories()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  loadCategories()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadCategories()
}

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
.category-management {
  padding: 0;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px 0;
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.toolbar-right {
  display: flex;
  align-items: center;
}

.category-info {
  display: flex;
  align-items: center;
}

.category-icon {
  margin-right: 8px;
  font-size: 18px;
  color: #409EFF;
}

.category-icon-emoji {
  display: inline-block;
  margin-right: 12px;
  font-size: 18px;
  width: 20px;
  text-align: center;
}

.category-name {
  font-weight: 500;
  margin-bottom: 2px;
}

.category-description {
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

.icon-hint {
  margin-top: 4px;
}

.icon-hint small {
  color: #909399;
}

.sort-container {
  max-height: 400px;
  overflow-y: auto;
}

.sort-hint {
  margin-bottom: 16px;
  color: #606266;
  font-size: 14px;
}

.sort-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 8px;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: move;
  transition: all 0.3s;
}

.sort-item:hover {
  background: #ecf5ff;
  border-color: #b3d8ff;
}

.drag-handle {
  margin-right: 12px;
  color: #909399;
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}

.sort-item .category-name {
  flex: 1;
  font-weight: 500;
}

.ghost {
  opacity: 0.5;
}

.chosen {
  background: #ecf5ff !important;
  border-color: #409EFF !important;
}

.drag {
  background: #fff !important;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>