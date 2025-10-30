const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkMySQLData() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'navigation_admin'
    });
    
    const [categories] = await connection.execute('SELECT * FROM categories ORDER BY sort_order');
    const [sites] = await connection.execute('SELECT * FROM sites ORDER BY category_id, sort_order');
    
    console.log('=== MySQL数据库中的数据 ===');
    console.log(`分类数量: ${categories.length}`);
    console.log(`网站数量: ${sites.length}`);
    
    console.log('\n=== 分类详情 ===');
    categories.forEach(cat => {
      const sitesInCategory = sites.filter(site => site.category_id === cat.id);
      console.log(`- ${cat.name} (${cat.icon}) - ${sitesInCategory.length}个网站`);
    });
    
    console.log('\n=== 网站详情 ===');
    categories.forEach(cat => {
      const sitesInCategory = sites.filter(site => site.category_id === cat.id);
      if (sitesInCategory.length > 0) {
        console.log(`\n${cat.name}分类下的网站:`);
        sitesInCategory.forEach(site => {
          console.log(`  - ${site.name}: ${site.url} (${site.icon || '无图标'})`);
        });
      }
    });
    
    await connection.end();
  } catch (error) {
    console.error('检查MySQL数据失败:', error.message);
    console.log('可能原因: MySQL数据库未启动或连接配置错误');
  }
}

checkMySQLData();