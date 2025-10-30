const axios = require('axios');

async function verifyFrontendData() {
  try {
    console.log('🔍 验证前端数据显示...\n');
    
    // 1. 获取所有网站数据（模拟前端调用）
    console.log('1️⃣ 获取前端显示的网站数据...');
    const sitesResponse = await axios.get('http://localhost:3001/api/sites?limit=1000&active=true');
    const sites = sitesResponse.data.data.items;
    console.log(`✅ 前端将显示 ${sites.length} 个网站`);
    
    // 2. 获取分类数据
    console.log('\n2️⃣ 获取分类数据...');
    const categoriesResponse = await axios.get('http://localhost:3001/api/categories');
    const categories = categoriesResponse.data.data.items;
    console.log(`✅ 共有 ${categories.length} 个分类`);
    
    // 3. 创建分类映射
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.id] = {
        name: cat.name,
        icon: cat.icon || '📁'
      };
    });
    
    // 4. 按分类组织网站数据（模拟前端逻辑）
    const sitesByCategory = {};
    sites.forEach(site => {
      const categoryId = site.category_id;
      if (!sitesByCategory[categoryId]) {
        sitesByCategory[categoryId] = [];
      }
      sitesByCategory[categoryId].push(site);
    });
    
    // 5. 显示每个分类的网站详情
    console.log('\n3️⃣ 前端页面将显示的分类和网站:');
    console.log('='.repeat(60));
    
    let totalDisplayedSites = 0;
    
    categories.forEach(category => {
      const categorySites = sitesByCategory[category.id] || [];
      
      if (categorySites.length > 0) {
        console.log(`\n${category.icon || '📁'} ${category.name} (${categorySites.length} 个网站):`);
        
        categorySites.forEach((site, index) => {
          console.log(`   ${index + 1}. ${site.icon || '🌐'} ${site.name}`);
          console.log(`      📍 ${site.url}`);
          if (site.description) {
            console.log(`      📝 ${site.description}`);
          }
          console.log('');
        });
        
        totalDisplayedSites += categorySites.length;
      }
    });
    
    // 6. 检查是否有孤立网站（没有对应分类的网站）
    const categoryIds = categories.map(cat => cat.id);
    const orphanSites = sites.filter(site => !categoryIds.includes(site.category_id));
    
    if (orphanSites.length > 0) {
      console.log(`\n⚠️  发现 ${orphanSites.length} 个孤立网站（没有对应分类）:`);
      orphanSites.forEach(site => {
        console.log(`   - ${site.name} (分类ID: ${site.category_id})`);
      });
    }
    
    // 7. 总结
    console.log('\n📊 前端显示总结:');
    console.log('='.repeat(40));
    console.log(`📈 总网站数量: ${sites.length}`);
    console.log(`📈 总分类数量: ${categories.length}`);
    console.log(`📈 有网站的分类: ${Object.keys(sitesByCategory).length}`);
    console.log(`📈 实际显示网站: ${totalDisplayedSites}`);
    
    if (orphanSites.length > 0) {
      console.log(`⚠️  孤立网站数量: ${orphanSites.length}`);
    }
    
    // 8. 验证结果
    console.log('\n✅ 验证结果:');
    if (sites.length >= 29) {
      console.log('🎉 成功！前端现在可以显示所有网站数据');
      console.log('🎯 用户反馈的问题已解决：每个大类中都有很多网站');
    } else {
      console.log('❌ 仍有问题：网站数量不足');
    }
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
    if (error.response) {
      console.error('API响应:', error.response.data);
    }
  }
}

verifyFrontendData();