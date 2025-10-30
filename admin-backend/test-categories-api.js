const axios = require('axios');

async function testCategoriesAPI() {
  try {
    console.log('🔍 测试分类选项列表接口...');
    
    const response = await axios.get('http://localhost:3001/api/categories/options/list');
    
    console.log('✅ 接口响应成功');
    console.log('📊 响应状态:', response.status);
    console.log('📋 响应数据:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data) {
      console.log(`📈 分类数量: ${response.data.data.length}`);
      response.data.data.forEach((category, index) => {
        console.log(`   ${index + 1}. ${category.name} (ID: ${category.id}) ${category.icon}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 接口测试失败:', error.message);
    if (error.response) {
      console.error('📊 错误状态:', error.response.status);
      console.error('📋 错误数据:', error.response.data);
    }
  }
}

testCategoriesAPI();