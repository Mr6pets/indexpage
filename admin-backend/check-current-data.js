const http = require('http');

console.log('🔍 检查当前后端数据内容...\n');

// 检查分类数据
function checkCategories() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/categories',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('=== 当前后端分类数据 ===');
          const categories = Array.isArray(result.data?.items) ? result.data.items : (result.data?.categories || []);
          console.log('分类数量:', categories.length);
          categories.forEach((cat, index) => {
            console.log(`${index + 1}. ${cat.name} (${cat.icon}) - ${cat.description}`);
          });
          console.log('');
          resolve(categories);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
}

// 检查网站数据
function checkSites() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/sites',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('=== 当前后端网站数据 ===');
          const sites = Array.isArray(result.data?.items) ? result.data.items : (result.data?.sites || []);
          console.log('网站总数:', sites.length);
          
          // 按分类统计
          const sitesByCategory = {};
          sites.forEach(site => {
            if (!sitesByCategory[site.category_id]) {
              sitesByCategory[site.category_id] = [];
            }
            sitesByCategory[site.category_id].push(site);
          });
          
          Object.entries(sitesByCategory).forEach(([categoryId, sites]) => {
            console.log(`分类 ${categoryId}: ${sites.length} 个网站`);
            sites.slice(0, 3).forEach(site => {
              console.log(`  - ${site.name} (${site.icon || '无图标'}) - ${site.url}`);
            });
            if (sites.length > 3) {
              console.log(`  ... 还有 ${sites.length - 3} 个网站`);
            }
          });
          console.log('');
          resolve(sites);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
}

// 执行检查
async function main() {
  try {
    const categories = await checkCategories();
    const sites = await checkSites();
    
    console.log('📊 数据统计:');
    console.log(`- 分类数量: ${categories.length}`);
    console.log(`- 网站数量: ${sites.length}`);
    console.log(`- 平均每个分类的网站数: ${Math.round(sites.length / categories.length)}`);
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }
}

main();