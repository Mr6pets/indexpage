const axios = require('axios');

async function testFrontendCategoriesFlow() {
  try {
    console.log('🔍 测试前端分类加载流程...');
    
    // 1. 测试后端API
    console.log('\n1️⃣ 测试后端分类API...');
    const backendResponse = await axios.get('http://localhost:3001/api/categories/options/list');
    console.log('✅ 后端API响应:', JSON.stringify(backendResponse.data, null, 2));
    
    // 2. 模拟前端request工具的处理
    console.log('\n2️⃣ 模拟前端request工具处理...');
    const processedResponse = backendResponse.data; // request工具会返回data部分
    
    console.log('📋 前端收到的响应结构:');
    console.log('  - response.success:', processedResponse.success);
    console.log('  - response.data:', processedResponse.data);
    console.log('  - response.data.length:', processedResponse.data ? processedResponse.data.length : 'undefined');
    
    // 3. 验证修复后的逻辑
    console.log('\n3️⃣ 验证修复后的逻辑...');
    if (processedResponse.success) {
      const categories = processedResponse.data;
      console.log('✅ 分类加载成功!');
      console.log(`📊 分类数量: ${categories.length}`);
      categories.forEach((category, index) => {
        console.log(`   ${index + 1}. ${category.icon} ${category.name} (ID: ${category.id})`);
      });
    } else {
      console.log('❌ 分类加载失败 - API返回错误');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testFrontendCategoriesFlow();