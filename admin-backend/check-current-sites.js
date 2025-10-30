const axios = require('axios');

async function checkCurrentSites() {
  try {
    console.log('🔍 检查当前网站数据...\n');
    
    // 获取所有网站数据
    const sitesResponse = await axios.get('http://localhost:3001/api/sites?limit=100');
    const sites = sitesResponse.data.data.items;
    
    // 获取分类数据
    const categoriesResponse = await axios.get('http://localhost:3001/api/categories');
    const categories = categoriesResponse.data.data.items;
    
    console.log(`📊 总网站数量: ${sites.length}`);
    console.log(`📊 总分类数量: ${categories.length}\n`);
    
    // 创建分类映射
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.id] = cat.name;
    });
    
    // 按分类统计网站
    const sitesByCategory = {};
    sites.forEach(site => {
      const categoryName = categoryMap[site.category_id] || '未知分类';
      if (!sitesByCategory[categoryName]) {
        sitesByCategory[categoryName] = [];
      }
      sitesByCategory[categoryName].push(site);
    });
    
    // 显示每个分类的网站
    console.log('📈 各分类网站详情:');
    console.log('='.repeat(50));
    
    Object.keys(sitesByCategory).forEach(categoryName => {
      const categorySites = sitesByCategory[categoryName];
      console.log(`\n🏷️  ${categoryName} (${categorySites.length} 个网站):`);
      
      categorySites.forEach((site, index) => {
        console.log(`   ${index + 1}. ${site.name} - ${site.url}`);
      });
    });
    
    // 检查活跃网站
    const activeSites = sites.filter(site => site.status === 'active');
    const inactiveSites = sites.filter(site => site.status !== 'active');
    
    console.log('\n📊 网站状态统计:');
    console.log(`   - 活跃网站: ${activeSites.length} 个`);
    console.log(`   - 非活跃网站: ${inactiveSites.length} 个`);
    
    if (inactiveSites.length > 0) {
      console.log('\n⚠️  非活跃网站列表:');
      inactiveSites.forEach(site => {
        console.log(`   - ${site.name} (状态: ${site.status})`);
      });
    }
    
  } catch (error) {
    console.error('❌ 检查网站数据失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

checkCurrentSites();