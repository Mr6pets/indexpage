// 在浏览器控制台中运行此脚本来调试仪表盘数据问题

console.log('🔍 开始调试仪表盘数据问题...');

// 1. 检查localStorage中的token
const token = localStorage.getItem('admin_token');
console.log('📝 Token状态:', token ? '存在' : '不存在');
if (token) {
  console.log('🔑 Token:', token.substring(0, 20) + '...');
}

// 2. 检查用户信息
const user = localStorage.getItem('admin_user');
console.log('👤 用户信息:', user ? JSON.parse(user) : '不存在');

// 3. 手动调用API
async function testAPI() {
  try {
    console.log('🌐 测试API调用...');
    
    const response = await fetch('http://localhost:3001/api/stats/overview', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('📊 API响应:', data);
    
    if (data.success && data.data && data.data.overview) {
      const overview = data.data.overview;
      console.log('📈 统计数据详情:');
      console.log('   - 网站总数:', overview.total_sites);
      console.log('   - 分类总数:', overview.total_categories);
      console.log('   - 用户总数:', overview.total_users);
      console.log('   - 总点击数:', overview.total_clicks);
    } else {
      console.error('❌ API响应格式异常');
    }
    
  } catch (error) {
    console.error('❌ API调用失败:', error);
  }
}

// 4. 检查Vue组件状态（如果可以访问）
if (window.__VUE_DEVTOOLS_GLOBAL_HOOK__) {
  console.log('🔧 Vue DevTools可用');
} else {
  console.log('⚠️ Vue DevTools不可用');
}

// 执行测试
if (token) {
  testAPI();
} else {
  console.log('❌ 无法测试API，因为没有token');
}

console.log('✅ 调试脚本执行完成');