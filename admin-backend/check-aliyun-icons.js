const mysql = require('mysql2/promise');
require('dotenv').config();

const aliyunConfig = {
  host: process.env.ALIYUN_DB_HOST || '47.100.161.36',
  port: Number(process.env.ALIYUN_DB_PORT || 3306),
  user: process.env.ALIYUN_DB_USER || 'root',
  password: process.env.ALIYUN_DB_PASSWORD || '',
  database: process.env.ALIYUN_DB_NAME || 'navigation_admin',
  charset: 'utf8mb4',
  timezone: '+08:00'
};

async function checkIcons() {
  let connection;
  
  try {
    connection = await mysql.createConnection(aliyunConfig);
    console.log('🔍 检查阿里云数据库中的网站图标...');
    
    const [rows] = await connection.execute('SELECT id, name, icon FROM sites ORDER BY id LIMIT 10');
    
    console.log('📊 前10个网站的图标数据:');
    rows.forEach(row => {
      console.log(`   - ${row.name}: ${row.icon || '无图标'}`);
    });
    
    const [iconStats] = await connection.execute('SELECT COUNT(*) as total, COUNT(icon) as with_icon FROM sites');
    console.log(`\n📈 图标统计: ${iconStats[0].with_icon}/${iconStats[0].total} 个网站有图标`);
    
    // 检查所有网站的图标
    const [allSites] = await connection.execute(`
      SELECT name, icon FROM sites 
      ORDER BY id
    `);
    
    console.log('\n🎯 所有网站图标检查:');
    allSites.forEach(site => {
      console.log(`   - ${site.name}: ${site.icon || '无图标'}`);
    });
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 数据库连接已关闭');
    }
  }
}

checkIcons();