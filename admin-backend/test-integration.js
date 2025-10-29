const http = require('http');

// 简单的HTTP请求函数
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function testIntegration() {
  console.log('🧪 开始测试前后端数据集成...\n');

  try {
    // 测试分类接口
    console.log('📂 测试分类接口...');
    const categoriesResult = await makeRequest('http://localhost:3001/api/categories');
    console.log(`状态码: ${categoriesResult.status}`);
    
    if (categoriesResult.status === 200 && categoriesResult.data.success) {
      const categories = categoriesResult.data.data.categories;
      console.log(`✅ 分类接口正常，共 ${categories.length} 个分类:`);
      categories.forEach(cat => {
        console.log(`   - ${cat.name} (${cat.icon})`);
      });
    } else {
      console.log('❌ 分类接口异常:', categoriesResult.data);
    }

    console.log('\n🌐 测试网站接口...');
    const sitesResult = await makeRequest('http://localhost:3001/api/sites');
    console.log(`状态码: ${sitesResult.status}`);
    
    if (sitesResult.status === 200 && sitesResult.data.success) {
      const sites = sitesResult.data.data.sites;
      console.log(`✅ 网站接口正常，共 ${sites.length} 个网站:`);
      
      // 按分类统计网站数量
      const sitesByCategory = {};
      sites.forEach(site => {
        if (!sitesByCategory[site.category_id]) {
          sitesByCategory[site.category_id] = 0;
        }
        sitesByCategory[site.category_id]++;
      });
      
      console.log('   按分类统计:');
      Object.entries(sitesByCategory).forEach(([categoryId, count]) => {
        console.log(`   - 分类 ${categoryId}: ${count} 个网站`);
      });
      
      // 显示前几个网站示例
      console.log('\n   网站示例:');
      sites.slice(0, 3).forEach(site => {
        console.log(`   - ${site.name} (${site.icon}) - ${site.url}`);
      });
    } else {
      console.log('❌ 网站接口异常:', sitesResult.data);
    }

    console.log('\n🔗 数据关联性检查...');
    if (categoriesResult.status === 200 && sitesResult.status === 200) {
      const categories = categoriesResult.data.data.categories;
      const sites = sitesResult.data.data.sites;
      
      // 检查每个分类是否有对应的网站
      categories.forEach(category => {
        const categorySites = sites.filter(site => site.category_id === category.id);
        console.log(`   ${category.name}: ${categorySites.length} 个网站`);
      });
      
      console.log('\n✅ 前后端数据集成测试完成！');
      console.log('💡 现在可以访问前端页面查看效果: http://localhost:5173');
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.log('💡 请确保后端服务器正在运行: npm start');
  }
}

testIntegration();