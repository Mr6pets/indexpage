const database = require('./config/database');
const { pool } = database;

async function checkData() {
  try {
    console.log('=== 当前分类信息 ===');
    const [categories] = await pool.execute('SELECT * FROM categories ORDER BY sort_order, id');
    categories.forEach(cat => {
      console.log(`ID: ${cat.id}, 名称: ${cat.name}, 图标: ${cat.icon}, 状态: ${cat.status}`);
    });
    
    console.log('\n=== 当前网站信息 ===');
    const [sites] = await pool.execute('SELECT s.*, c.name as category_name FROM sites s LEFT JOIN categories c ON s.category_id = c.id ORDER BY s.category_id, s.sort_order, s.id');
    sites.forEach(site => {
      console.log(`ID: ${site.id}, 名称: ${site.name}, 分类: ${site.category_name}, URL: ${site.url}, 状态: ${site.status}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('查询失败:', error);
    process.exit(1);
  }
}

checkData();