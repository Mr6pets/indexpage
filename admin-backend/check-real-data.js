const mysql = require('mysql2/promise');

async function checkRealData() {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '8bR39mc9',
      database: 'navigation_admin'
    });

    console.log('🔍 检查MySQL数据库中的真实数据...\n');

    // 检查网站数量
    const [sites] = await conn.execute('SELECT COUNT(*) as count FROM sites');
    console.log(`📊 网站总数: ${sites[0].count}`);

    // 检查分类数量
    const [categories] = await conn.execute('SELECT COUNT(*) as count FROM categories');
    console.log(`📂 分类总数: ${categories[0].count}`);

    // 检查用户数量
    const [users] = await conn.execute('SELECT COUNT(*) as count FROM users');
    console.log(`👥 用户总数: ${users[0].count}`);

    // 显示前5个网站
    console.log('\n🌐 前5个网站:');
    const [siteList] = await conn.execute('SELECT name, url, click_count, category_id FROM sites LIMIT 5');
    siteList.forEach((site, index) => {
      console.log(`${index + 1}. ${site.name}`);
      console.log(`   URL: ${site.url}`);
      console.log(`   点击数: ${site.click_count}`);
      console.log(`   分类ID: ${site.category_id}\n`);
    });

    // 显示所有分类
    console.log('📂 所有分类:');
    const [categoryList] = await conn.execute('SELECT id, name, icon, sort_order FROM categories ORDER BY sort_order');
    categoryList.forEach(category => {
      console.log(`- ${category.name} (ID: ${category.id}, 图标: ${category.icon})`);
    });

    // 检查数据是否为模拟数据
    console.log('\n🔍 数据来源分析:');
    const [mockCheck] = await conn.execute('SELECT name FROM sites WHERE name LIKE "%测试%" OR name LIKE "%示例%" OR name LIKE "%Mock%"');
    if (mockCheck.length > 0) {
      console.log('⚠️  发现模拟数据标识:');
      mockCheck.forEach(site => console.log(`   - ${site.name}`));
    } else {
      console.log('✅ 未发现明显的模拟数据标识');
    }

    await conn.end();
  } catch (error) {
    console.error('❌ 检查数据失败:', error.message);
  }
}

checkRealData();