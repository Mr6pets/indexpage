const axios = require('axios');

async function checkAllSitesData() {
  try {
    console.log('🔍 检查数据库中所有网站数据...\n');
    
    // 1. 获取所有网站（包括非活跃状态）
    console.log('1️⃣ 获取所有网站数据（包括非活跃状态）...');
    const allSitesResponse = await axios.get('http://localhost:3001/api/sites?limit=1000');
    const allSites = allSitesResponse.data.data.items;
    console.log(`✅ 数据库中总共有 ${allSites.length} 个网站`);
    
    // 2. 获取只有活跃状态的网站
    console.log('\n2️⃣ 获取活跃状态的网站...');
    const activeSitesResponse = await axios.get('http://localhost:3001/api/sites?limit=1000&active=true');
    const activeSites = activeSitesResponse.data.data.items;
    console.log(`✅ 活跃状态的网站有 ${activeSites.length} 个`);
    
    // 3. 获取分类数据
    console.log('\n3️⃣ 获取分类数据...');
    const categoriesResponse = await axios.get('http://localhost:3001/api/categories');
    const categories = categoriesResponse.data.data.items;
    console.log(`✅ 分类数量: ${categories.length}`);
    
    // 4. 按状态分析网站
    console.log('\n4️⃣ 按状态分析网站...');
    const activeCount = allSites.filter(site => site.status === 'active').length;
    const inactiveCount = allSites.filter(site => site.status === 'inactive').length;
    const otherCount = allSites.filter(site => site.status !== 'active' && site.status !== 'inactive').length;
    
    console.log(`📊 网站状态统计:`);
    console.log(`   - 活跃 (active): ${activeCount} 个`);
    console.log(`   - 非活跃 (inactive): ${inactiveCount} 个`);
    console.log(`   - 其他状态: ${otherCount} 个`);
    
    // 5. 按分类详细分析所有网站
    console.log('\n5️⃣ 按分类详细分析所有网站...');
    categories.forEach(category => {
      const categorySites = allSites.filter(site => site.category_id === category.id);
      const activeCategorySites = categorySites.filter(site => site.status === 'active');
      const inactiveCategorySites = categorySites.filter(site => site.status === 'inactive');
      
      console.log(`\n${category.icon} ${category.name}:`);
      console.log(`   总网站数: ${categorySites.length}`);
      console.log(`   活跃网站: ${activeCategorySites.length}`);
      console.log(`   非活跃网站: ${inactiveCategorySites.length}`);
      
      if (categorySites.length > 0) {
        console.log(`   网站列表:`);
        categorySites.forEach((site, index) => {
          const statusIcon = site.status === 'active' ? '✅' : '❌';
          console.log(`     ${index + 1}. ${statusIcon} ${site.icon || '🌐'} ${site.name} - ${site.url} (${site.status})`);
        });
      }
    });
    
    // 6. 检查是否有孤立的网站（没有对应分类的）
    console.log('\n6️⃣ 检查孤立网站...');
    const categoryIds = categories.map(cat => cat.id);
    const orphanSites = allSites.filter(site => !categoryIds.includes(site.category_id));
    
    if (orphanSites.length > 0) {
      console.log(`⚠️  发现 ${orphanSites.length} 个孤立网站（没有对应分类）:`);
      orphanSites.forEach(site => {
        console.log(`   - ${site.name} (分类ID: ${site.category_id})`);
      });
    } else {
      console.log('✅ 没有发现孤立网站');
    }
    
    // 7. 总结
    console.log('\n📋 总结:');
    console.log(`   - 数据库总网站数: ${allSites.length}`);
    console.log(`   - 前端显示网站数: ${activeSites.length} (只显示活跃状态)`);
    console.log(`   - 隐藏网站数: ${allSites.length - activeSites.length}`);
    
    if (inactiveCount > 0) {
      console.log(`\n💡 建议: 有 ${inactiveCount} 个网站处于非活跃状态，这些网站不会在前端显示。`);
      console.log('   如果需要显示这些网站，可以在后台管理中将它们的状态改为"活跃"。');
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }
}

checkAllSitesData();