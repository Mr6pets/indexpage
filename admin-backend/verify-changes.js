const database = require('./config/database');
const { pool } = database;

async function verifyChanges() {
  try {
    console.log('=== 验证网站更新结果 ===\n');
    
    // 1. 查看常用工具分类中的网站
    console.log('1. 常用工具分类中的网站：');
    const [toolSites] = await pool.execute(`
      SELECT s.name, s.url, s.status 
      FROM sites s 
      JOIN categories c ON s.category_id = c.id 
      WHERE c.name = "常用工具" AND s.status = "active"
      ORDER BY s.sort_order, s.id
    `);
    
    if (toolSites.length > 0) {
      toolSites.forEach((site, index) => {
        console.log(`   ${index + 1}. ${site.name} - ${site.url}`);
      });
    } else {
      console.log('   没有找到常用工具分类中的网站');
    }
    
    // 2. 查看搜索引擎分类中的网站
    console.log('\n2. 搜索引擎分类中的网站：');
    const [searchSites] = await pool.execute(`
      SELECT s.name, s.url, s.status 
      FROM sites s 
      JOIN categories c ON s.category_id = c.id 
      WHERE c.name = "搜索引擎" AND s.status = "active"
      ORDER BY s.sort_order, s.id
    `);
    
    if (searchSites.length > 0) {
      searchSites.forEach((site, index) => {
        console.log(`   ${index + 1}. ${site.name} - ${site.url}`);
      });
    } else {
      console.log('   没有找到搜索引擎分类中的网站');
    }
    
    // 3. 验证GuluWater网站是否都添加成功
    console.log('\n3. GuluWater网站验证：');
    const guluWaterUrls = [
      'http://vitepress.guluwater.com/',
      'http://generalmethodsutils.guluwater.com/',
      'http://officetools.guluwater.com/'
    ];
    
    for (const url of guluWaterUrls) {
      const [site] = await pool.execute('SELECT name, status FROM sites WHERE url = ?', [url]);
      if (site.length > 0) {
        console.log(`   ✅ ${site[0].name} (${url}) - 状态: ${site[0].status}`);
      } else {
        console.log(`   ❌ ${url} - 未找到`);
      }
    }
    
    console.log('\n验证完成！');
    process.exit(0);
  } catch (error) {
    console.error('验证失败:', error);
    process.exit(1);
  }
}

verifyChanges();