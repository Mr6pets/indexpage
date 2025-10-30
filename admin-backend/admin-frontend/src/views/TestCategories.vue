<template>
  <div class="test-categories">
    <h2>分类加载测试</h2>
    
    <div class="test-section">
      <h3>1. 直接API测试</h3>
      <button @click="testDirectAPI" :disabled="loading">测试直接API调用</button>
      <div v-if="directResult" class="result">
        <h4>直接API结果:</h4>
        <pre>{{ JSON.stringify(directResult, null, 2) }}</pre>
      </div>
    </div>

    <div class="test-section">
      <h3>2. 使用request工具测试</h3>
      <button @click="testWithRequest" :disabled="loading">测试request工具</button>
      <div v-if="requestResult" class="result">
        <h4>Request工具结果:</h4>
        <pre>{{ JSON.stringify(requestResult, null, 2) }}</pre>
      </div>
    </div>

    <div class="test-section">
      <h3>3. 分类列表</h3>
      <div v-if="categories.length > 0">
        <p>找到 {{ categories.length }} 个分类:</p>
        <ul>
          <li v-for="category in categories" :key="category.id">
            {{ category.icon }} {{ category.name }} (ID: {{ category.id }})
          </li>
        </ul>
      </div>
      <div v-else>
        <p style="color: red;">❌ 没有找到分类数据</p>
      </div>
    </div>

    <div v-if="error" class="error">
      <h4>错误信息:</h4>
      <pre>{{ error }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { request } from '@/utils/request'

const loading = ref(false)
const categories = ref([])
const directResult = ref(null)
const requestResult = ref(null)
const error = ref('')

const testDirectAPI = async () => {
  loading.value = true
  error.value = ''
  try {
    console.log('🔍 测试直接API调用...')
    const response = await axios.get('http://localhost:3001/api/categories/options/list')
    directResult.value = response.data
    console.log('✅ 直接API调用成功:', response.data)
    
    // 处理统一的响应格式
    if (response.data.success && response.data.data) {
      categories.value = response.data.data
    } else {
      console.error('直接API响应格式错误:', response.data)
    }
  } catch (err) {
    console.error('❌ 直接API调用失败:', err)
    error.value = `直接API调用失败: ${err.message}`
  } finally {
    loading.value = false
  }
}

const testWithRequest = async () => {
  loading.value = true
  error.value = ''
  try {
    console.log('🔍 测试request工具调用...')
    const response = await request.get('/categories/options/list')
    requestResult.value = response
    console.log('✅ Request工具调用成功:', response)
    
    if (response.success && response.data) {
      categories.value = response.data
    }
  } catch (err) {
    console.error('❌ Request工具调用失败:', err)
    error.value = `Request工具调用失败: ${err.message}`
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  console.log('🚀 TestCategories 组件已挂载')
  testWithRequest()
})
</script>

<style scoped>
.test-categories {
  padding: 20px;
}

.test-section {
  margin: 20px 0;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.result {
  margin-top: 10px;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 3px;
}

.error {
  margin-top: 10px;
  padding: 10px;
  background-color: #fee;
  border: 1px solid #fcc;
  border-radius: 3px;
  color: #c00;
}

button {
  padding: 8px 16px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>