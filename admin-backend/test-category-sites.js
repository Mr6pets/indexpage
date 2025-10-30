const axios = require('axios');

async function testCategorySitesDisplay() {
  try {
    console.log('🔍 测试分类和网站数据分布...\n');
    
    // 1. 获取分类数据
    console.log('1️⃣ 获取分类数据...');
    const categoriesResponse = await axios.get('http://localhost:3001/api/categories');
    const categories = categoriesResponse.data.data.items;
    console.log(`✅ 获取到 ${categories.length} 个分类`);
    
    // 2. 获取网站数据
    console.log('\n2️⃣ 获取网站数据...');
    const sitesResponse = await axios.get('http://localhost:3001/api/sites?limit=1000&active=true');
    const sites = sitesResponse.data.data.items;
    console.log(`✅ 获取到 ${sites.length} 个启用状态的网站`);
    
    // 3. 分析每个分类下的网站分布
    console.log('\n3️⃣ 分析分类网站分布...');
    const categoryStats = {};
    
    categories.forEach(category => {
      const categorySites = sites.filter(site => site.category_id === category.id);
      categoryStats[category.id] = {
        name: category.name,
        icon: category.icon,
        siteCount: categorySites.length,
        sites: categorySites
      };
    });
    
    // 4. 显示详细统计
    console.log('\n📊 分类网站统计:');
    Object.values(categoryStats).forEach(stat => {
      console.log(`\n${stat.icon} ${stat.name}:`);
      console.log(`   - 网站数量: ${stat.siteCount}`);
      if (stat.siteCount > 0) {
        stat.sites.forEach((site, index) => {
          console.log(`   ${index + 1}. ${site.icon} ${site.name} - ${site.url}`);
        });
      } else {
        console.log('   ❌ 该分类下没有网站');
      }
    });
    
    // 5. 模拟前端数据组织逻辑
    console.log('\n5️⃣ 模拟前端数据组织逻辑...');
    const organizedData = categories.map(category => {
      const categorySites = sites.filter(site => site.category_id === category.id);
      return {
        name: category.name,
        icon: category.icon || '📁',
        sites: categorySites
      };
    }).filter(category => category.sites.length > 0); // 只显示有网站的分类
    
    console.log(`\n📋 前端将显示 ${organizedData.length} 个有网站的分类:`);
    organizedData.forEach((category, index) => {
      console.log(`${index + 1}. ${category.icon} ${category.name} (${category.sites.length} 个网站)`);
    });
    
    // 6. 检查是否有分类被过滤掉
    const filteredOutCategories = categories.filter(category => {
      const categorySites = sites.filter(site => site.category_id === category.id);
      return categorySites.length === 0;
    });
    
    if (filteredOutCategories.length > 0) {
      console.log(`\n⚠️  以下 ${filteredOutCategories.length} 个分类因为没有网站而不会显示:`);
      filteredOutCategories.forEach(category => {
        console.log(`   - ${category.icon} ${category.name}`);
      });
    }
    
    console.log('\n✅ 测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testCategorySitesDisplay();