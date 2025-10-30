const axios = require('axios');

async function testDashboardAPI() {
  try {
    console.log('🔍 测试仪表盘API...\n');
    
    // 1. 先登录获取token
    console.log('1. 登录获取token...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    if (!loginResponse.data.success) {
      console.error('❌ 登录失败:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功，获取到token');
    
    // 2. 测试stats/overview接口
    console.log('\n2. 测试 /api/stats/overview 接口...');
    const statsResponse = await axios.get('http://localhost:3001/api/stats/overview', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📊 API响应:', JSON.stringify(statsResponse.data, null, 2));
    
    if (statsResponse.data.success) {
      const overview = statsResponse.data.data.overview;
      console.log('\n📈 统计数据:');
      console.log(`   - 网站总数: ${overview.total_sites}`);
      console.log(`   - 分类总数: ${overview.total_categories}`);
      console.log(`   - 用户总数: ${overview.total_users}`);
      console.log(`   - 总点击数: ${overview.total_clicks}`);
      console.log(`   - 今日访问: ${overview.today_visits}`);
      console.log(`   - 本月访问: ${overview.month_visits}`);
      
      // 检查数据是否为0
      const allZero = overview.total_sites === 0 && 
                     overview.total_categories === 0 && 
                     overview.total_users === 0 && 
                     overview.total_clicks === 0;
      
      if (allZero) {
        console.log('\n⚠️ 警告: 所有统计数据都为0，可能存在数据问题');
        
        // 3. 直接查询数据库检查数据
        console.log('\n3. 直接检查数据库数据...');
        const database = require('./config/database');
        const { pool } = database;
        
        const [sites] = await pool.execute('SELECT COUNT(*) as count FROM sites WHERE status = "active"');
        const [categories] = await pool.execute('SELECT COUNT(*) as count FROM categories WHERE status = "active"');
        const [users] = await pool.execute('SELECT COUNT(*) as count FROM users');
        
        console.log('📊 数据库直查结果:');
        console.log(`   - 活跃网站数: ${sites[0].count}`);
        console.log(`   - 活跃分类数: ${categories[0].count}`);
        console.log(`   - 用户数: ${users[0].count}`);
        
        if (sites[0].count > 0 || categories[0].count > 0 || users[0].count > 0) {
          console.log('\n🔍 数据库中有数据，但API返回0，可能是API逻辑问题');
        } else {
          console.log('\n📝 数据库中确实没有数据，需要添加测试数据');
        }
      } else {
        console.log('\n✅ 统计数据正常');
      }
    } else {
      console.error('❌ API调用失败:', statsResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
  }
}

testDashboardAPI();