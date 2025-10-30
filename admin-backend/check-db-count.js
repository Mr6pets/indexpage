const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDbCount() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'navigation_db'
    });
    
    const [totalRows] = await connection.execute('SELECT COUNT(*) as count FROM sites');
    console.log('数据库中网站总数:', totalRows[0].count);
    
    const [activeRows] = await connection.execute('SELECT COUNT(*) as count FROM sites WHERE status = "active"');
    console.log('活跃网站数:', activeRows[0].count);
    
    const [siteList] = await connection.execute('SELECT id, name, status FROM sites ORDER BY id');
    console.log('\n所有网站列表:');
    siteList.forEach(site => {
      console.log(`ID: ${site.id}, 名称: ${site.name}, 状态: ${site.status}`);
    });
    
  } catch (error) {
    console.error('查询失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkDbCount();