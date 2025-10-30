const database = require('./config/database');
const { pool } = database;

async function moveSearchEngines() {
  try {
    console.log('开始处理搜索引擎分类...');
    
    // 1. 创建搜索引擎分类
    console.log('1. 创建搜索引擎分类...');
    const [existingCategory] = await pool.execute('SELECT id FROM categories WHERE name = "搜索引擎"');
    
    let searchCategoryId;
    if (existingCategory.length > 0) {
      searchCategoryId = existingCategory[0].id;
      console.log(`搜索引擎分类已存在，ID: ${searchCategoryId}`);
    } else {
      const [result] = await pool.execute(
        'INSERT INTO categories (name, icon, description, sort_order, status) VALUES (?, ?, ?, ?, ?)',
        ['搜索引擎', '🔍', '各种搜索引擎和搜索工具', 0, 'active']
      );
      searchCategoryId = result.insertId;
      console.log(`✅ 成功创建搜索引擎分类，ID: ${searchCategoryId}`);
    }
    
    // 2. 移动百度和Google到搜索引擎分类
    console.log('2. 移动百度和Google到搜索引擎分类...');
    
    // 更新百度
    const [baiduResult] = await pool.execute(
      'UPDATE sites SET category_id = ?, sort_order = 1 WHERE name = "百度"',
      [searchCategoryId]
    );
    if (baiduResult.affectedRows > 0) {
      console.log('✅ 成功移动百度到搜索引擎分类');
    } else {
      console.log('⚠️ 未找到百度网站');
    }
    
    // 更新Google
    const [googleResult] = await pool.execute(
      'UPDATE sites SET category_id = ?, sort_order = 2 WHERE name = "Google"',
      [searchCategoryId]
    );
    if (googleResult.affectedRows > 0) {
      console.log('✅ 成功移动Google到搜索引擎分类');
    } else {
      console.log('⚠️ 未找到Google网站');
    }
    
    console.log('\n搜索引擎分类处理完成！');
    
    // 3. 显示更新后的结果
    console.log('\n=== 搜索引擎分类中的网站 ===');
    const [searchSites] = await pool.execute(
      'SELECT * FROM sites WHERE category_id = ? ORDER BY sort_order',
      [searchCategoryId]
    );
    searchSites.forEach(site => {
      console.log(`- ${site.name}: ${site.url}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('处理搜索引擎分类失败:', error);
    process.exit(1);
  }
}

moveSearchEngines();