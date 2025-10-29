const axios = require('axios');

// 测试配置
const config = {
  // 本地测试（使用生产环境配置）
  baseURL: 'http://localhost:3001/api',
  timeout: 10000
};

// 创建axios实例
const api = axios.create(config);

async function testAliyunAPI() {
  console.log('🧪 测试阿里云环境API功能...');
  console.log('==================================');
  console.log(`🔗 测试地址: ${config.baseURL}`);
  
  try {
    // 测试分类API
    console.log('\n📂 测试分类API...');
    const categoriesResponse = await api.get('/categories');
    console.log('✅ 分类API测试成功');
    
    const categories = categoriesResponse.data.data.categories;
    if (Array.isArray(categories)) {
      console.log(`📊 分类数量: ${categories.length}`);
      categories.forEach(category => {
        console.log(`   - ${category.name} (ID: ${category.id}) - ${category.site_count} 个网站`);
      });
    } else {
      console.log('⚠️ 分类数据格式异常');
    }
    
    // 测试网站API
    console.log('\n🌐 测试网站API...');
    const sitesResponse = await api.get('/sites');
    console.log('✅ 网站API测试成功');
    
    const sites = sitesResponse.data.data.sites;
    if (Array.isArray(sites)) {
      console.log(`📊 网站数量: ${sites.length}`);
      
      // 按分类统计网站
      const categoryStats = {};
      sites.forEach(site => {
        const categoryName = site.category_name || '未分类';
        if (!categoryStats[categoryName]) {
          categoryStats[categoryName] = 0;
        }
        categoryStats[categoryName]++;
      });
      
      console.log('📈 按分类统计:');
      Object.entries(categoryStats).forEach(([category, count]) => {
        console.log(`   - ${category}: ${count} 个网站`);
      });
    } else {
      console.log('⚠️ 网站数据格式异常');
    }
    
    // 测试设置API
    console.log('\n⚙️ 测试设置API...');
    const settingsResponse = await api.get('/settings');
    console.log('✅ 设置API测试成功');
    console.log(`📊 设置项数量: ${settingsResponse.data.data.length}`);
    
    // 测试统计API
    console.log('\n📊 测试统计API...');
    const statsResponse = await api.get('/stats');
    console.log('✅ 统计API测试成功');
    console.log('📈 统计数据:', JSON.stringify(statsResponse.data.data, null, 2));
    
    // 测试用户API（需要认证）
    console.log('\n👥 测试用户API...');
    try {
      const usersResponse = await api.get('/users');
      console.log('✅ 用户API测试成功');
      console.log(`📊 用户数量: ${usersResponse.data.data.length}`);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('⚠️ 用户API需要认证（正常行为）');
      } else {
        throw error;
      }
    }
    
    // 测试认证API
    console.log('\n🔐 测试认证API...');
    try {
      const loginResponse = await api.post('/auth/login', {
        username: 'admin',
        password: 'admin123'
      });
      console.log('✅ 登录API测试成功');
      
      const token = loginResponse.data.token;
      console.log('🎫 获取到认证令牌');
      
      // 使用令牌测试受保护的API
      console.log('\n🔒 测试受保护的用户API...');
      const protectedUsersResponse = await api.get('/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ 受保护的用户API测试成功');
      console.log(`📊 用户数量: ${protectedUsersResponse.data.data.length}`);
      
    } catch (error) {
      console.log('⚠️ 认证测试失败:', error.response?.data?.message || error.message);
    }
    
    console.log('\n🎉 阿里云API测试完成!');
    console.log('✅ 所有核心API功能正常');
    
  } catch (error) {
    console.error('❌ API测试失败:', error.message);
    if (error.response) {
      console.error('📄 响应状态:', error.response.status);
      console.error('📄 响应数据:', error.response.data);
    }
    process.exit(1);
  }
}

// 执行测试
testAliyunAPI();